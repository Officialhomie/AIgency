# X402 Foundation Extension - Quick Start Guide

## What Was Built

A production-grade extension to the existing X402 payment system with:

1. **Cross-Chain Aggregation** - Intelligent routing across Ethereum, Base, Abstract, and Unichain
2. **Multi-Token Support** - Accept USDC, WETH, DAI, and other ERC-20 tokens with safety guarantees
3. **100% Backward Compatible** - All existing USDC flows work unchanged

## 📁 New Files Created

### Core System

- **`server/payment-system.ts`** - Unified entry point with automatic mode selection
- **`server/multi-token-engine.ts`** - Extends X402PaymentEngine with token support
- **`server/cross-chain-aggregator.ts`** - Cross-chain orchestration and routing

### Foundation Services

- **`server/token-registry.ts`** - Token allowlist with risk classifications
- **`server/price-oracle.ts`** - Multi-source price aggregation (Chainlink, DEX, APIs)
- **`server/token-risk-engine.ts`** - Risk assessment (liquidity, volatility, audits)
- **`server/chain-selector.ts`** - Intelligent chain selection algorithm

### Documentation & Testing

- **`X402_FOUNDATION_EXTENSION.md`** - Complete technical documentation
- **`X402_QUICK_START.md`** - This guide
- **`server/__tests__/payment-system.test.ts`** - Comprehensive test suite

## 🚀 Quick Start (3 Minutes)

### Option 1: Use Existing System (No Changes Required)

```typescript
import { paymentEngine } from './server/x402-engine';

// All existing code continues to work!
const result = await paymentEngine.settle({
  resourceUrl: '/api/prompts/123/content',
  method: 'GET',
  chainKey: 'base-sepolia',
  price: '$0.10',
  description: 'Unlock prompt',
  payToAddress: process.env.SERVER_WALLET_ADDRESS!,
});
```

### Option 2: Enable Cross-Chain Auto-Routing

```typescript
import { createPaymentSystem } from './server/payment-system';

const system = createPaymentSystem({
  enableCrossChain: true,
  enableAutoChainSelection: true,
});

// Automatically routes to optimal chain
const result = await system.processPayment({
  resourceUrl: '/api/prompts/123/content',
  method: 'GET',
  price: '$0.10',
  description: 'Unlock prompt',
  payToAddress: serverWallet,
  userAddress: '0x...', // For smart routing
  prioritizeSpeed: true, // Or optimize for cost
});
```

### Option 3: Enable Multi-Token Payments

```typescript
import { createPaymentSystem } from './server/payment-system';

const system = createPaymentSystem({
  enableMultiToken: true,
  enableCrossChain: true,
});

// Accept WETH payment
const result = await system.processPayment({
  resourceUrl: '/api/generate-image',
  method: 'POST',
  chainKey: 'base',
  price: '$5.00',
  description: 'Generate image',
  payToAddress: serverWallet,
  tokenSymbol: 'WETH',
  tokenAddress: '0x4200000000000000000000000000000000000006',
  maxSlippagePercent: 1.0,
});
```

## 🎯 Key Features

### 1. Intelligent Chain Selection

Automatically scores and selects optimal chain based on:
- **Gas cost** (35% weight) - Lower gas = higher score
- **Latency** (25% weight) - Faster = higher score
- **Congestion** (20% weight) - Less congestion = higher score
- **Success rate** (15% weight) - Historical reliability
- **User affinity** (5% weight) - User's preferred chains

```typescript
import { chainSelector } from './server/chain-selector';

const selection = await chainSelector.selectChain({
  amountUsd: 0.10,
  tokenSymbol: 'USDC',
  prioritizeSpeed: true, // Or false for cost optimization
});

console.log(selection.optimal); // "base-sepolia"
console.log(selection.reasoning); // "Excellent cost efficiency: ~$0.0015 gas..."
```

### 2. Token Registry with Risk Classification

Only registered tokens are accepted. Each token has:
- Risk level (LOW/MEDIUM/HIGH)
- Payment bounds (min/max USD)
- Slippage parameters
- Audit status
- Price feed configuration

```typescript
import { tokenRegistry } from './server/token-registry';

// Check if token is supported
if (!tokenRegistry.isSupported('SCAM')) {
  throw new Error('Token not registered');
}

// Get token on specific chain
const wethAddress = tokenRegistry.getTokenAddress('WETH', 'base');

// Validate payment amount
const validation = tokenRegistry.validatePaymentAmount('USDC', 5.0);
```

**Registered Tokens:**
- ✅ USDC (native) - LOW risk, 6 decimals
- ✅ USDC.e (bridged) - LOW risk, 6 decimals
- ✅ WETH - MEDIUM risk, 18 decimals
- ✅ DAI - LOW risk, 18 decimals

### 3. Multi-Source Price Oracle

Aggregates prices from multiple sources with safety guarantees:
- **Primary:** Chainlink (on-chain oracle)
- **Fallback 1:** Uniswap V3 TWAP
- **Fallback 2:** CoinGecko API
- **Fallback 3:** Manual (stablecoins)

**Safety Features:**
- Minimum 70% confidence required
- Maximum 2% deviation across sources
- 5-minute maximum data age
- Outlier rejection (2σ threshold)
- Median aggregation for 3+ sources

```typescript
import { priceOracle } from './server/price-oracle';

const price = await priceOracle.getPrice('WETH', 'base');

if (!price.isSafe) {
  throw new Error(price.unsafeReason);
}

console.log(`WETH: $${price.priceUsd}`);
console.log(`Confidence: ${price.confidence * 100}%`);
```

### 4. Token Risk Assessment

Assesses risk before every payment:

**Risk Factors:**
- **Liquidity** (40% weight) - Requires 10x payment amount
- **Volatility** (35% weight) - Price stability
- **Audit Status** (25% weight) - Contract security

**Risk Scoring:**
- 0-40: LOW - Approved
- 41-60: MEDIUM - Approved with warnings
- 61-80: HIGH - Requires higher slippage
- 81-100: CRITICAL - Blocked

```typescript
import { tokenRiskEngine } from './server/token-risk-engine';

const assessment = await tokenRiskEngine.assessPayment('WETH', 'base', 10.0);

if (!assessment.allowed) {
  throw new Error(assessment.rejectionReason);
}

console.log(`Risk score: ${assessment.riskScore}/100`);
console.log(`Recommendations:`, assessment.recommendations);
```

### 5. Automatic Fallback

If payment fails on primary chain, automatically tries fallback chains:

```typescript
// Payment flow:
// 1. Route to Base (optimal)
// 2. Attempt payment on Base
// 3. If fails → try Unichain (fallback #1)
// 4. If fails → try Abstract (fallback #2)
// 5. Return result or error

const result = await crossChainAggregator.executePayment(request);
// Handles fallback automatically
```

## 📊 Architecture Diagram

```
User Request
     │
     ▼
PaymentSystem
     │
     ├─→ Legacy Mode ────→ X402PaymentEngine (USDC only)
     │
     ├─→ Multi-Token ────→ MultiTokenPaymentEngine
     │                         │
     │                         ├─→ TokenRegistry (validate)
     │                         ├─→ PriceOracle (get price)
     │                         ├─→ RiskEngine (assess)
     │                         └─→ X402PaymentEngine (settle)
     │
     └─→ Cross-Chain ────→ CrossChainAggregator
                               │
                               ├─→ ChainSelector (optimal chain)
                               ├─→ MultiTokenPaymentEngine (settle)
                               └─→ Fallback (if primary fails)
```

## ✅ Safety Guarantees

### Deterministic Settlement
- No silent price drift
- All conversions logged
- Slippage bounds enforced

### Clear Error Messages
```
❌ Unsupported token: XYZ. Only registered tokens are accepted.
❌ Payment rejected: Estimated liquidity $50K (required: $100K)
❌ Risk score 75 exceeds maximum 60
❌ Price oracle error: Low confidence 65% < 70%
❌ Price oracle error: High deviation 3.5% > 2.0%
```

### Fail-Safe Design
- Payments with insufficient confidence → FAIL
- High-risk tokens → REJECTED
- Outlier prices → REMOVED
- Stale data → REJECTED

## 🧪 Testing

Run comprehensive test suite:

```bash
npm test server/__tests__/payment-system.test.ts
```

**Test Coverage:**
- ✅ Backward compatibility with legacy USDC
- ✅ Token registry validation
- ✅ Price oracle safety checks
- ✅ Risk assessment algorithms
- ✅ Chain selection scoring
- ✅ Multi-token payment flows
- ✅ Cross-chain aggregation
- ✅ Error handling

## 📈 Usage Examples

### Example 1: Get Optimal Chain

```typescript
import { chainSelector } from './server/chain-selector';

const selection = await chainSelector.selectChain({
  amountUsd: 0.10,
  tokenSymbol: 'USDC',
  userAddress: '0x...',
  prioritizeSpeed: false, // Optimize for cost
});

console.log('Selected:', selection.optimal);
console.log('Gas cost:', selection.rankings[0].estimatedGasCostUsd);
console.log('Confirmation:', selection.rankings[0].estimatedConfirmationSeconds, 's');
```

### Example 2: Multi-Token Quote

```typescript
import { multiTokenEngine } from './server/multi-token-engine';

const quote = await multiTokenEngine.getTokenQuote('$5.00', 'base', 'WETH');

console.log(`Pay ${quote.tokenAmount} WETH for $${quote.priceUsd}`);
console.log(`Confidence: ${quote.priceConfidence * 100}%`);
console.log(`Risk level: ${quote.riskLevel}`);
```

### Example 3: Risk Assessment

```typescript
import { tokenRiskEngine } from './server/token-risk-engine';

const assessment = await tokenRiskEngine.assessPayment('WETH', 'base', 100);

console.log('Allowed:', assessment.allowed);
console.log('Risk score:', assessment.riskScore);
console.log('Liquidity:', assessment.factors.liquidity.details);
console.log('Volatility:', assessment.factors.volatility.details);
console.log('Recommendations:', assessment.recommendations);
```

### Example 4: Cross-Chain Routing

```typescript
import { crossChainAggregator } from './server/cross-chain-aggregator';

const route = await crossChainAggregator.routePayment({
  resourceUrl: '/api/prompts/123/content',
  method: 'GET',
  price: '$0.10',
  description: 'Unlock prompt',
  payToAddress: serverWallet,
  userAddress: '0x...',
  prioritizeSpeed: true,
  useTestnet: true,
});

console.log('Chain:', route.chain);
console.log('Token:', route.tokenSymbol);
console.log('Reasoning:', route.reasoning);
console.log('Alternatives:', route.alternatives.map(a => a.chain));
```

## 🔧 Configuration

### Default Configuration (Backward Compatible)

```typescript
{
  defaultMode: 'legacy',           // USDC only, single chain
  enableMultiToken: false,         // Only USDC
  enableCrossChain: false,         // Manual chain selection
  enableAutoChainSelection: false, // User specifies chain
  defaultToken: 'USDC',
  defaultChain: 'base-sepolia',
}
```

### Advanced Configuration

```typescript
import { createPaymentSystem } from './server/payment-system';

const system = createPaymentSystem({
  defaultMode: 'cross-chain',
  enableMultiToken: true,
  enableCrossChain: true,
  enableAutoChainSelection: true,
  defaultToken: 'USDC',
  defaultChain: 'base',
});
```

## 📚 Documentation

- **[X402_FOUNDATION_EXTENSION.md](X402_FOUNDATION_EXTENSION.md)** - Complete technical documentation
- **[server/payment-system.ts](server/payment-system.ts)** - Main entry point with inline docs
- **[server/token-registry.ts](server/token-registry.ts)** - Token allowlist documentation
- **[server/price-oracle.ts](server/price-oracle.ts)** - Oracle aggregation details
- **[server/chain-selector.ts](server/chain-selector.ts)** - Scoring algorithm documentation

## ⚠️ Important Notes

### What's Production-Ready

✅ **Backward compatible USDC payments** - Works exactly as before
✅ **Foundation architecture** - All components in place
✅ **Token registry** - 4 tokens registered with risk profiles
✅ **Risk assessment** - Comprehensive scoring system
✅ **Chain selection** - Intelligent routing algorithm
✅ **Error handling** - Clear, safe error messages

### What Needs Implementation

⚠️ **Chainlink integration** - Placeholder (returns null, falls back to manual)
⚠️ **Uniswap V3 TWAP** - Placeholder (not yet implemented)
⚠️ **CoinGecko API** - Placeholder (not yet implemented)
⚠️ **Balance fetching** - Placeholder (returns empty)
⚠️ **Liquidity queries** - Simplified (assumes sufficient)
⚠️ **Non-stablecoin settlement** - Framework in place, needs X402 integration

### Current Behavior

**Stablecoins (USDC, DAI):**
- ✅ Full support
- ✅ Manual price feeds (1:1 USD)
- ✅ Risk assessment
- ✅ Settlement via X402

**Other tokens (WETH):**
- ✅ Registry entry
- ✅ Risk assessment
- ✅ Price oracle framework
- ⚠️ Settlement returns "not yet implemented" error

## 🎯 Next Steps

### Phase 1: Oracle Integration (High Priority)

1. Implement Chainlink price feed reading
2. Add Uniswap V3 TWAP calculation
3. Integrate CoinGecko API
4. Test multi-source aggregation

### Phase 2: Feature Completion

1. Implement real balance queries
2. Add DEX liquidity checks
3. Complete non-stablecoin settlement
4. Add comprehensive integration tests

### Phase 3: Production Hardening

1. Load testing
2. Security audit
3. Monitoring & alerts
4. Documentation review

## 💡 Key Insights

### Design Principles

1. **Safety First** - Fail safely rather than process risky payments
2. **Explicit Over Implicit** - Clear error messages, no silent failures
3. **Backward Compatible** - Existing code works unchanged
4. **Extensible** - Easy to add tokens, chains, oracle sources
5. **Auditable** - Full reasoning and metadata for every decision

### Why This Architecture?

- **Composability** - Each component can be used independently
- **Progressive Enhancement** - Enable features as needed
- **Separation of Concerns** - Registry, oracle, risk, routing are independent
- **Type Safety** - Full TypeScript throughout
- **Testability** - Each component can be tested in isolation

## 🤝 Support

For questions or issues:

1. Check [X402_FOUNDATION_EXTENSION.md](X402_FOUNDATION_EXTENSION.md) for detailed docs
2. Review inline code documentation
3. Run test suite for examples
4. Check Thirdweb X402 docs: https://portal.thirdweb.com/x402

---

**Status:** ✅ Foundation Complete | ⚠️ Oracle Integration Needed
**Backward Compatible:** ✅ 100%
**Production Ready (USDC):** ✅ Yes
**Production Ready (Multi-Token):** ⚠️ Framework complete, integration pending
