# Trading Knowledge Base — Strategy V2 Insights

Generated: 2026-03-05
Source: Owner wallet (sh36vHUDHcXqVD8aZJR8GF3Z3PdaU69XG8wJeB1e1xb) + Bot wallet (74QXtqTiM9w1D9WM8ArPEggHPRVUWggeQn3KxvR4ku5x)

---

## Executive Summary

Analysis of **88,593 transactions** across owner and bot wallets reveals clear patterns in trading behavior, timing, and failure modes. This knowledge base informs Strategy V2 parameter tuning.

---

## 1. Transaction Overview

| Wallet | Total Txs | Token Trades | Failed Txs | Failure Rate |
|--------|-----------|--------------|------------|--------------|
| Owner  | 73,660    | 12,793      | 4,369      | 5.9%         |
| Bot    | 933       | 70          | 47         | 5.0%         |

---

## 2. Trade Size Distribution (Owner Wallet)

| Metric | Amount |
|--------|--------|
| Minimum | $10 |
| 25th percentile | $566 |
| Median | $4,156 |
| 75th percentile | $33,476 |
| Maximum | $3.06B |

**Average trade sizes:**
- **BUY**: $6,083,376
- **SELL**: $10,192,926

**Insight:** Sells are ~68% larger than buys on average — possible profit-taking pattern.

---

## 3. Temporal Patterns

### By Day of Week (Owner Wallet)

| Day | Trades | Notes |
|-----|--------|-------|
| Thursday | 2,264 | **Highest activity** |
| Friday | 1,982 | |
| Tuesday | 1,930 | |
| Wednesday | 1,904 | |
| Saturday | 1,891 | |
| Monday | 1,498 | |
| Sunday | 1,324 | **Lowest activity** |

### By Hour (UTC) — Owner Wallet

**Peak trading hours:**
- 14:00 UTC — 847 trades (peak)
- 13:00 UTC — 809 trades
- 11:00 UTC — 725 trades
- 16:00 UTC — 700 trades

**Lowest activity:**
- 05:00 UTC — 240 trades
- 02:00 UTC — 273 trades

**Chicago time (UTC-6):**
- Peak: 07:00-10:00 CT (morning session)
- Peak: 10:00 CT (midday)
- Low: 23:00-05:00 CT (overnight)

### Trade Size by Hour

Largest average trades:
- 01:00 UTC — $36.8M (but only 386 trades)
- 02:00 UTC — $13.2M
- 12:00 UTC — $14.6M
- 18:00 UTC — $15.2M

Smallest average trades (safer times?):
- 07:00 UTC — $50K
- 19:00 UTC — $62K
- 21:00 UTC — $62K
- 22:00 UTC — $109K

---

## 4. Failure Analysis

### Failure Rate: 5.9% (Owner), 5.0% (Bot)

### Error Types (Owner Wallet)

| Error | Count | Likely Cause |
|-------|-------|---------------|
| `InstructionError [0, Custom: 1]` | 1,349 | Swap execution failure |
| `InvalidAccountData` | 801 | Invalid token/account state |
| `InstructionError [4, Custom: 8]` | 664 | Slippage or price impact |
| `InsufficientFundsForRent` | 528 | Wallet too low on SOL |

### Failure Timing

**Highest failure rates** (likely congestion/slippage):
- 16:00 UTC — 403 failures
- 23:00 UTC — 359 failures
- 17:00 UTC — 299 failures
- 11:00 UTC — 278 failures
- 13:00 UTC — 278 failures

**Lowest failure rates:**
- 06:00 UTC — 97 failures
- 10:00 UTC — 93 failures
- 03:00 UTC — 100 failures

**Insight:** Peak trading hours = higher failure rates. Consider reducing position sizes during 11:00-17:00 UTC.

---

## 5. Token Performance (Round Trips)

### Top Tokens by Volume (Real Tokens)

| Token | Volume | Trades |
|-------|--------|--------|
| FbmmdcCYHL7W | $80.5M | 31 |
| 2oCxjpWWEmCu | $67M | 245 |
| a4WcyMS183n6 | $43.6M | 236 |
| 4KdRXLTk5A1P | $33.5M | 79 |
| BkSbFrDMkfko | $25.5M | 78 |
| 132STreShuLR | $19.5M | 165 |
| FgySDg8mpKPJ | $18.1M | 150 |
| HdvZF538Terj | $18M | 101 |
| FtPqJ2YTKmPy | $17.2M | 129 |

### Tokens with Complete Round Trips

- **Owner wallet**: 293 tokens with both buys and sells
- **Bot wallet**: 11 tokens with round trips

---

## 6. Recommendations for Strategy V2

### Position Sizing
- **Reduce size** during peak hours (11:00-17:00 UTC) — higher failure/slippage risk
- **Increase size** during low-activity hours (05:00-07:00 UTC, 19:00-22:00 UTC) — better execution
- Average successful trade size: ~$4,156 median — consider this as baseline

### Timing
- **Best day**: Thursday (highest volume, good liquidity)
- **Avoid**: Sunday (lowest activity)
- **Peak hours**: 13:00-16:00 UTC (highest volume but also highest failures)
- **Safest hours**: 06:00-07:00 UTC, 10:00 UTC (low failure rates)

### Risk Management
- **SOL balance**: Keep >0.5 SOL for rent — `InsufficientFundsForRent` is a common failure mode
- **Slippage buffer**: Set higher slippage during peak hours (16:00, 23:00 UTC)
- **Failure budget**: Plan for ~5-6% transaction failure rate

### Trade Direction
- Sells average 68% larger than buys — consider taking partial profits earlier rather than full position

---

## 7. Bot Wallet Specific Insights

- 933 total transactions
- 70 token trades extracted
- 123 transactions with token balance changes
- 11 tokens with complete round trips
- Failure rate: 5.0%

**Top Bot Tokens:**
- 4FkNq8Rc — 14 trades (~$50K volume)
- BXebtR4k — 4 trades (~$131K volume)
- FasH397C — 2 trades (~$111K volume)

---

## 8. Open Questions

1. **P&L calculation**: Current analysis is volume-based. Need historical price data to calculate actual profit/loss per trade.
2. **Token hold times**: How long does the bot typically hold positions? (Requires price data)
3. **Slippage analysis**: What percentage of expected value is lost to slippage?
4. **Gas optimization**: Can failure rate be reduced by batching or timing adjustments?

---

*End of Knowledge Base*
