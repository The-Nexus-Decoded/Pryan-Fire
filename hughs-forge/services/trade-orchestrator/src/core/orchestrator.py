import logging
from .state_machine import TradeState
from ..state.state_manager import TradeStateManager
import uuid
from typing import Dict, Any

class TradeOrchestrator:
    def __init__(self, db_path: str = "trades.db"):
        self.logger = logging.getLogger("TradeOrchestrator")
        self.state_manager = TradeStateManager(db_path)
        self.MAX_AUTO_TRADE_USD = 250.0

    def process_signal(self, signal_data: Dict[str, Any]):
        trade_id = signal_data.get("trade_id", str(uuid.uuid4()))
        token_address = signal_data.get("token_address")
        amount = signal_data.get("amount", 0.0)
        
        self.logger.info(f"[{trade_id}] Processing signal for {token_address}, amount: ${amount}")
        
        # Initial State
        current_state = TradeState.SIGNAL_RECEIVED.value
        self.state_manager.save_trade(trade_id, current_state, token_address, amount, signal_data)
        
        # Validating Phase
        current_state = TradeState.VALIDATING.value
        self.state_manager.save_trade(trade_id, current_state, token_address, amount, signal_data)
        
        # Failsafe check
        if amount > self.MAX_AUTO_TRADE_USD:
            self.logger.warning(f"[{trade_id}] Amount ${amount} exceeds ${self.MAX_AUTO_TRADE_USD} limit. Halting for manual approval.")
            current_state = TradeState.AWAITING_APPROVAL.value
            self.state_manager.save_trade(trade_id, current_state, token_address, amount, signal_data)
            return current_state
            
        # Routing Phase (Placeholder for Jupiter/Meteora)
        self.logger.info(f"[{trade_id}] Proceeding to ROUTING phase.")
        current_state = TradeState.ROUTING.value
        self.state_manager.save_trade(trade_id, current_state, token_address, amount, signal_data)
        
        return current_state
