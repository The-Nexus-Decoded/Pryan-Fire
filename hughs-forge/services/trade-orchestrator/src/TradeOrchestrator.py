#!/usr/bin/env python3
"""
Patryn Trading Launcher — starts EventLoop, scanners, and monitors.
This is the main entry point for the patryn-trader service.
"""

import os
import sys
import asyncio
import threading
import time
import logging
import json
from typing import Dict, Any

# ----------------------------------------------------------------------
# PATH SETUP — ensure imports resolve from monorepo
# ----------------------------------------------------------------------
REPO_ROOT = "/data/repos/The-Nexus/Pryan-Fire"
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

SRC_PATH = os.path.join(REPO_ROOT, "src")
if SRC_PATH not in sys.path:
    sys.path.insert(0, SRC_PATH)

# ----------------------------------------------------------------------
# IMPORTS
# ----------------------------------------------------------------------
from core.orchestrator import TradeOrchestrator as CoreOrchestrator
from core.event_loop import EventLoop
from signals.pump_fun_stream import PumpFunSignal
from signals.meteora_dlmm_scanner import MeteoraDLMMScanner
from signals.dex_screener import MomentumScanner
from telemetry.logger import setup_telemetry_logger
from health_server import start_orchestrator_health_server
from risk_manager.RiskManager import RiskManager
from audit_logger.AuditLogger import AuditLogger

# ----------------------------------------------------------------------
# CONFIG LOADING
# ----------------------------------------------------------------------
def load_config(config_path: str = None) -> Dict[str, Any]:
    default_config = {
        "reinvest_enabled": True,
        "strategy_type": "SPOT_WIDE",
        "risk_gate_active": True,
        "pump_trade_amount_mode": "fixed",
        "pump_trade_amount_base": 0.1,
        "pump_liquidity_threshold_sol": 100000.0
    }
    target = config_path or os.path.join(os.path.dirname(__file__), "orchestrator_config.json")
    try:
        if os.path.exists(target):
            with open(target) as f:
                user_cfg = json.load(f)
                return {**default_config, **user_cfg}
    except Exception as e:
        logging.error(f"Config load failed: {e}")
    return default_config

config = load_config()

# ----------------------------------------------------------------------
# GLOBAL COMPONENTS
# ----------------------------------------------------------------------
g_event_loop = None
g_orchestrator = None
momentum_scanner = None

def compute_trade_amount(mint: str, liquidity: float = 0) -> float:
    """Compute trade amount based on config mode and liquidity."""
    # Minimum trade amount in SOL (~$5 at $100/SOL) - Jupiter requires ~$5 minimum
    MIN_TRADE_SOL = 0.05
    
    base = float(config.get("pump_trade_amount_base", 0.1))
    mode = config.get("pump_trade_amount_mode", "fixed")
    if mode == "fixed":
        amount = base
    else:
        # flexible: scale with liquidity, clamped 0.1–1.0×
        threshold = float(config.get("pump_liquidity_threshold_sol", 100000.0))
        factor = max(0.1, min(1.0, liquidity / threshold))
        amount = base * factor
        cap = 1.0  # hard cap in SOL
        amount = min(amount, cap)
    
    # Enforce minimum to avoid below-Jupiter-min trades
    return max(amount, MIN_TRADE_SOL)

# ----------------------------------------------------------------------
# SIGNAL CALLBACK
# ----------------------------------------------------------------------
async def on_token_discovered(mint: str, metadata: dict):
    """Pump.fun callback: validate momentum then enqueue."""
    symbol = metadata.get("symbol", "UNKNOWN")
    logging.info(f"[PUMP] Token discovered: {symbol} ({mint})")
    try:
        intel = await momentum_scanner.validate_momentum(mint)
        if not intel.get("passed"):
            logging.warning(f"[PUMP] {symbol} failed momentum: {intel.get('reason')}")
            return
        logging.info(f"[PUMP] {symbol} passed momentum")
    except Exception as e:
        logging.error(f"[PUMP] Momentum error: {e}")
        return

    # compute amount
    amount = compute_trade_amount(mint, liquidity=metadata.get("liquidity", 0))
    signal = {
        "token_address": mint,
        "amount": amount,
        "symbol": symbol,
        "metadata": metadata,
        "intel": intel
    }
    try:
        g_event_loop.enqueue_signal(signal)
        logging.info(f"[PUMP] Enqueued signal: {amount} SOL")
    except Exception as e:
        logging.error(f"[PUMP] Enqueue failed: {e}")

# ----------------------------------------------------------------------
# MAIN
# ----------------------------------------------------------------------
def main():
    global g_event_loop, g_orchestrator, momentum_scanner

    # Logging
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
    logger = logging.getLogger("PatrynTrader")

    # Load config (already in config dict)
    logger.info(f"Config loaded: strategy={config['strategy_type']}, mode={config['pump_trade_amount_mode']}")

    # Initialize core components
    audit_logger = AuditLogger()
    discord_token = os.getenv("DISCORD_TOKEN")
    channel_id_str = os.getenv("DISCORD_CHANNEL_ID")
    if discord_token and channel_id_str:
        try:
            risk_manager = RiskManager(discord_token, int(channel_id_str))
            logger.info("RiskManager: real Discord mode")
        except ValueError:
            risk_manager = RiskManager()
            logger.warning("RiskManager: MOCK mode (invalid channel ID)")
    else:
        risk_manager = RiskManager()
        logger.warning("RiskManager: MOCK mode (no Discord creds)")

    orchestrator = CoreOrchestrator(risk_manager, audit_logger)
    event_loop = EventLoop(orchestrator)
    g_orchestrator = orchestrator
    g_event_loop = event_loop

    # Start EventLoop thread
    loop_thread = threading.Thread(target=event_loop.run, daemon=True, name="EventLoop")
    loop_thread.start()
    logger.info("EventLoop started")

    # Start health server
    health_thread = threading.Thread(target=start_orchestrator_health_server, args=(8002,), daemon=True, name="Health")
    health_thread.start()
    logger.info("Health server on :8002")

    # Initialize scanners
    momentum_scanner = MomentumScanner()
    pump_scanner = PumpFunSignal(on_token_received=on_token_discovered)

    def run_pump():
        try:
            asyncio.run(pump_scanner.run())
        except Exception as e:
            logger.error(f"Pump scanner crashed: {e}", exc_info=True)

    pump_thread = threading.Thread(target=run_pump, daemon=True, name="PumpScanner")
    pump_thread.start()
    logger.info("Pump.fun scanner started")

    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        pump_scanner.stop()
        event_loop.stop()

if __name__ == "__main__":
    main()
