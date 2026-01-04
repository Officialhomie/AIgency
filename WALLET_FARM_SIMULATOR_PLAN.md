# 🎯 Wallet Farm Visual Simulator - Complete Frontend Plan

> **Status**: 📋 Planning Phase
> **Last Updated**: 2026-01-02
> **Project Type**: Developer-facing simulation dashboard for Web3 wallet farm testing

---

## 📑 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Feature Breakdown](#feature-breakdown)
4. [Component Structure](#component-structure)
5. [State Management Model](#state-management-model)
6. [API Contract Specification](#api-contract-specification)
7. [UI/UX Flow Walkthrough](#uiux-flow-walkthrough)
8. [Data Models](#data-models)
9. [Implementation Phases](#implementation-phases)
10. [Technical Decisions](#technical-decisions)
11. [Testing Strategy](#testing-strategy)
12. [Progress Tracking](#progress-tracking)

---

## 📋 Executive Summary

### What We're Building

A **developer console** for testing smart contracts using simulated wallet behavior. The backend already exists with full wallet farm infrastructure, behavioral simulation engine, and transaction execution. The frontend's job is to:

- **Configure** simulation parameters
- **Trigger** simulations via backend API
- **Visualize** real-time execution
- **Inspect** detailed per-wallet results
- **Debug** transaction failures and timing issues

### Core Principles

1. **Observability First** - Everything happening must be visible
2. **Determinism** - Same inputs = same outputs (reproducible)
3. **Debuggability** - Easy to trace what went wrong and why
4. **Developer UX** - Built for engineers, not consumers

### Success Criteria

- ✅ Can configure and run a simulation in < 2 minutes
- ✅ Can identify failing wallets/txs in < 10 seconds
- ✅ Can reproduce any simulation run deterministically
- ✅ Can export all data for external analysis
- ✅ Zero backend logic re-implementation

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │              │  │              │  │              │    │
│  │ Config Panel │  │ Live Monitor │  │ Metrics Panel│    │
│  │              │  │              │  │              │    │
│  │ - Contract   │  │ - Wallet Grid│  │ - TPS        │    │
│  │ - ABI Upload │  │ - Timeline   │  │ - Success %  │    │
│  │ - Archetypes │  │ - Status     │  │ - Gas Stats  │    │
│  │              │  │              │  │              │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                  │             │
│         └─────────────────┼──────────────────┘             │
│                           │                                │
│                    ┌──────▼───────┐                        │
│                    │  State Store │                        │
│                    │  (Zustand)   │                        │
│                    └──────┬───────┘                        │
│                           │                                │
└───────────────────────────┼────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   API Layer    │
                    │ REST + WebSocket│
                    └───────┬────────┘
                            │
┌───────────────────────────▼────────────────────────────────┐
│                  BACKEND (Existing System)                 │
│                                                            │
│  Wallet Farm │ Behavior Engine │ Timing Engine │ Executor │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Communication Flow

```
User Action → Frontend State → API Request → Backend Processing
                                                     │
Frontend State ← WebSocket Update ← Backend Event ←──┘
       │
       └→ UI Re-render
```

### Three-Panel Layout

```
┌────────────────────────────────────────────────────────────┐
│                     Top Bar (Status)                       │
├──────────┬────────────────────────────┬────────────────────┤
│          │                            │                    │
│  Config  │    Live Simulation         │   Metrics & Logs   │
│  Panel   │    Visualization           │                    │
│          │                            │                    │
│  - Input │    - Wallet Grid           │   - TPS Graph      │
│  - ABI   │    - Timeline              │   - Success Rate   │
│  - Setup │    - Status Badges         │   - Event Log      │
│          │                            │   - Warnings       │
│          │                            │                    │
│  [START] │    [Live Updates]          │   [Export]         │
│          │                            │                    │
└──────────┴────────────────────────────┴────────────────────┘
```

---

## 🎯 Feature Breakdown

### Feature 1: Contract & ABI Management

**Purpose**: Allow developers to specify which smart contract to test

**Components**:
- `ContractAddressInput` - Text input with ENS support
- `ABIUploader` - Drag-drop + paste + file upload
- `ABIValidator` - Real-time ABI validation
- `FunctionSelector` - List of callable functions from ABI

**User Flow**:
1. Paste contract address (e.g., `0x123...abc`)
2. Upload ABI JSON file OR paste ABI text
3. System validates ABI structure
4. Auto-detect all public/external functions
5. Display function signatures with parameter types
6. User selects which function(s) to test

**State Requirements**:
```typescript
{
  contractAddress: string;
  abiText: string;
  abiParsed: ABI | null;
  selectedFunctions: string[];
  validationStatus: 'idle' | 'validating' | 'valid' | 'invalid';
  validationErrors: string[];
}
```

**API Calls**:
- `POST /api/contracts/validate` - Validate contract + ABI
- `GET /api/contracts/{address}/metadata` - Fetch contract info

---

### Feature 2: Simulation Configuration Panel

**Purpose**: Configure all simulation parameters before execution

**Components**:
- `NetworkSelector` - Dropdown of supported networks
- `WalletGroupSelector` - Choose wallet source
- `ArchetypeConfig` - Single or mixed archetype selection
- `SimulationDuration` - Time or interaction count
- `ParameterBuilder` - Build function call parameters

**Configuration Options**:

```typescript
interface SimulationConfig {
  // Network
  network: 'ethereum' | 'base' | 'polygon' | 'arbitrum';
  rpcUrl?: string;

  // Wallets
  walletCount: number; // 1-100
  walletSource: 'farm' | 'import';

  // Behavior
  archetypeMode: 'single' | 'mixed';
  singleArchetype?: 'whale' | 'trader' | 'casual' | 'lurker' | 'researcher' | 'bot';
  mixedDistribution?: {
    whale: number;
    trader: number;
    casual: number;
    lurker: number;
    researcher: number;
    bot: number;
  };

  // Execution
  durationType: 'time' | 'interactions';
  durationValue: number;
  targetFunctions: string[];

  // Transaction Params
  ethValue?: string;
  tokenValue?: string;
  gasLimit?: number;
  maxFeePerGas?: string;

  // Advanced
  seed?: string; // For determinism
  enableRateLimiting: boolean;
  enableRetries: boolean;
}
```

**UI Components**:

1. **Network Selector**
   ```
   ┌─────────────────────────┐
   │ Network: [Ethereum ▼]   │
   │ RPC: auto               │
   └─────────────────────────┘
   ```

2. **Archetype Selector**
   ```
   ┌─────────────────────────┐
   │ ○ Single Archetype      │
   │   [Whale ▼]             │
   │                         │
   │ ● Mixed Distribution    │
   │   Whale:      20% ████  │
   │   Trader:     30% ██████│
   │   Casual:     50% ██████│
   └─────────────────────────┘
   ```

3. **Duration Config**
   ```
   ┌─────────────────────────┐
   │ ● Run for: [60] seconds │
   │ ○ Until: [100] txs      │
   └─────────────────────────┘
   ```

**Validation Rules**:
- Contract address must be valid Ethereum address
- ABI must be valid JSON
- Wallet count: 1-100
- At least one function selected
- If mixed archetypes, sum must equal 100%
- Seed must be alphanumeric if provided

**State Flow**:
```
User Input → Validation → State Update → Preview → Ready to Start
```

---

### Feature 3: Execution Controls

**Purpose**: Start, pause, resume, stop, and replay simulations

**Components**:
- `SimulationControlBar` - Main control buttons
- `RunStatusIndicator` - Visual status of current run
- `ReplayManager` - Deterministic replay functionality

**Control States**:

```typescript
type SimulationStatus =
  | 'idle'        // Not started
  | 'starting'    // Initialization
  | 'running'     // Active simulation
  | 'paused'      // Temporarily stopped
  | 'stopping'    // Graceful shutdown
  | 'stopped'     // Completed/stopped
  | 'error';      // Fatal error

interface ExecutionState {
  status: SimulationStatus;
  runId: string | null;
  startedAt: number | null;
  stoppedAt: number | null;
  elapsedTime: number;
  canPause: boolean;
  canResume: boolean;
  canStop: boolean;
  canReplay: boolean;
}
```

**Control Bar UI**:

```
┌──────────────────────────────────────────────────────┐
│ Status: ● Running | Elapsed: 00:45 | Run ID: abc123  │
│                                                      │
│ [▶ Start] [⏸ Pause] [⏹ Stop] [🔄 Replay] [⚙ Config]│
└──────────────────────────────────────────────────────┘
```

**Button States**:
- **Start**: Enabled when `status === 'idle'`
- **Pause**: Enabled when `status === 'running'`
- **Resume**: Enabled when `status === 'paused'`
- **Stop**: Enabled when `status === 'running' || status === 'paused'`
- **Replay**: Enabled when `status === 'stopped' && runId !== null`

**Actions**:
```typescript
// Start simulation
POST /api/simulations/start
Body: SimulationConfig
Response: { runId, seed, configHash }

// Pause (backend queues remaining txs)
POST /api/simulations/{runId}/pause

// Resume (backend continues)
POST /api/simulations/{runId}/resume

// Stop (backend cancels pending txs)
POST /api/simulations/{runId}/stop

// Replay (use same seed + config)
POST /api/simulations/replay
Body: { runId, seed, config }
```

---

### Feature 4: Live Visualization

**Purpose**: Real-time visual feedback of simulation execution

**Sub-Components**:

#### 4A: Wallet Grid

Visual representation of all wallets in the simulation.

**Layout**:
```
┌──────────────────────────────────────────────────────┐
│ Wallet Address    Archetype  Status    Nonce  Last Tx│
├──────────────────────────────────────────────────────┤
│ 0x1234...abcd     🐋 Whale   ✅ Confirmed  5   0xabc..│
│ 0x5678...efgh     📊 Trader  ⏳ Pending    3   0xdef..│
│ 0x9abc...ijkl     👤 Casual  ❌ Reverted   2   0xghi..│
│ 0xdef0...mnop     💤 Lurker  ⏸ Idle       0   -      │
└──────────────────────────────────────────────────────┘
```

**Wallet Row Component**:
```typescript
interface WalletRowData {
  address: string;
  archetype: 'whale' | 'trader' | 'casual' | 'lurker' | 'researcher' | 'bot';
  status: 'idle' | 'waiting' | 'sending' | 'confirmed' | 'reverted';
  nonce: number;
  lastTxHash: string | null;
  lastActionTimestamp: number | null;
  txCount: number;
  successCount: number;
  revertCount: number;
}
```

**Status Colors**:
- 🟢 Green: `confirmed`
- 🟡 Yellow: `sending` / `waiting`
- 🔴 Red: `reverted`
- 🟣 Purple: `rate-limited`
- ⚪ Gray: `idle`

**Interactions**:
- Click wallet address → Copy to clipboard
- Click tx hash → Open in block explorer
- Expand row → Show full transaction history
- Right-click → Export wallet data

#### 4B: Timeline View

Visual timeline showing when transactions occur.

**Layout**:
```
Time →
0s    10s    20s    30s    40s    50s    60s
│─────┼──────┼──────┼──────┼──────┼──────┤
│
│ 🟢●  🟢●●●              🟢●●  🔴●       Whale
│ 🟢●     🟢●    🟢●    🟢●     🟢●       Trader
│     🟢●●●●●●●●●●●●                     Casual (burst)
│                                  🟢●●●  Bot
```

**Timeline Features**:
- X-axis: Time (seconds)
- Y-axis: Wallets (grouped by archetype)
- Dots: Individual transactions
- Color: Status (green = success, red = revert)
- Vertical lines: Timing engine delays
- Hover: Show tx details

**Implementation**:
```typescript
interface TimelineEvent {
  walletAddress: string;
  timestamp: number;
  txHash: string;
  status: 'confirmed' | 'reverted';
  gasUsed: number;
}
```

#### 4C: Metrics Panel

Real-time statistics and KPIs.

**Metrics Display**:
```
┌─────────────────────────────────────┐
│ PERFORMANCE                         │
│ TPS:          12.5 tx/s             │
│ Success Rate: 94.2% (95/101)        │
│ Revert Rate:  5.8% (6/101)          │
│ Avg Delay:    850ms                 │
│ Avg Gas:      45,231                │
│                                     │
│ SYSTEM STATUS                       │
│ Active Wallets: 25/50               │
│ Rate Limited:   2                   │
│ Nonce Gaps:     0                   │
│ Circuit Breaks: 0                   │
│                                     │
│ COST ESTIMATION                     │
│ Total Gas:      4,523,100           │
│ Est. Cost:      $12.34 (@ 27 gwei) │
└─────────────────────────────────────┘
```

**Metrics Data Model**:
```typescript
interface SimulationMetrics {
  // Performance
  tps: number;
  successRate: number;
  revertRate: number;
  avgDelay: number;
  avgGasUsed: number;

  // Counts
  totalTxs: number;
  successfulTxs: number;
  revertedTxs: number;
  pendingTxs: number;

  // Wallets
  activeWallets: number;
  idleWallets: number;
  rateLimitedWallets: number;

  // System Events
  nonceGaps: number;
  circuitBreaks: number;
  retryAttempts: number;

  // Cost
  totalGasUsed: number;
  estimatedCostUSD: number;
  gasPrice: string;
}
```

**Update Frequency**: Every 500ms via WebSocket

---

### Feature 5: Result Inspection

**Purpose**: Deep dive into individual wallet results and transaction details

**Components**:
- `WalletDetailModal` - Expanded wallet view
- `TransactionHistoryTable` - All txs for a wallet
- `TransactionDetailView` - Single tx breakdown
- `ErrorStackViewer` - Revert reason + stack trace

**Wallet Detail Modal**:

```
┌──────────────────────────────────────────────────────────┐
│ Wallet Details: 0x1234...abcd                      [X]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Archetype: 🐋 Whale                                      │
│ Total Txs: 15 (14 success, 1 reverted)                  │
│ Total Gas: 672,450                                       │
│ Nonce: 15                                                │
│                                                          │
│ TRANSACTION HISTORY                                      │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Tx Hash          Function     Status   Gas    Time │  │
│ ├────────────────────────────────────────────────────┤  │
│ │ 0xabc...123      mint()       ✅       45k    12:01│  │
│ │ 0xdef...456      transfer()   ✅       21k    12:03│  │
│ │ 0xghi...789      burn()       ❌       18k    12:05│  │
│ │ 0xjkl...012      approve()    ✅       44k    12:08│  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ [Export JSON] [Export CSV] [Copy All Hashes]            │
└──────────────────────────────────────────────────────────┘
```

**Transaction Detail View**:

```
┌──────────────────────────────────────────────────────────┐
│ Transaction: 0xabc...123                           [X]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Status: ❌ Reverted                                      │
│ Function: transfer(address to, uint256 amount)          │
│                                                          │
│ PARAMETERS                                               │
│ to:      0x5678...efgh                                   │
│ amount:  1000000000000000000 (1 ETH)                    │
│                                                          │
│ TIMING                                                   │
│ Queued:     12:05:00                                     │
│ Sent:       12:05:02 (+2s delay)                        │
│ Confirmed:  12:05:05 (+3s block time)                   │
│ Total:      5 seconds                                    │
│                                                          │
│ GAS                                                      │
│ Gas Limit:  100,000                                      │
│ Gas Used:   21,450                                       │
│ Gas Price:  27 gwei                                      │
│ Cost:       $1.23                                        │
│                                                          │
│ ERROR                                                    │
│ Revert Reason: "Insufficient balance"                   │
│                                                          │
│ Stack Trace:                                             │
│   at ERC20.transfer (ERC20.sol:45)                      │
│   at SafeMath.sub (SafeMath.sol:23)                     │
│   require(balance >= amount, "Insufficient balance")    │
│                                                          │
│ RETRY ATTEMPTS                                           │
│ 1. Failed (same error)                                   │
│ 2. Failed (same error)                                   │
│ 3. Aborted (max retries reached)                        │
│                                                          │
│ [Copy Tx Hash] [View on Explorer] [Copy Error]         │
└──────────────────────────────────────────────────────────┘
```

**Data Model**:
```typescript
interface TransactionResult {
  txHash: string;
  walletAddress: string;
  function: string;
  parameters: Record<string, any>;

  // Timing
  queuedAt: number;
  sentAt: number;
  confirmedAt: number;
  totalDuration: number;
  timingDelay: number;

  // Gas
  gasLimit: number;
  gasUsed: number;
  gasPrice: string;
  costUSD: number;

  // Status
  status: 'confirmed' | 'reverted';
  blockNumber: number;

  // Error (if reverted)
  revertReason?: string;
  errorStack?: string[];

  // Retries
  retryAttempts: number;
  retryResults: Array<{
    attempt: number;
    error: string;
  }>;
}
```

**Export Formats**:

1. **JSON Export**:
```json
{
  "walletAddress": "0x1234...abcd",
  "archetype": "whale",
  "transactions": [
    {
      "txHash": "0xabc...123",
      "function": "transfer",
      "status": "reverted",
      "gasUsed": 21450,
      "error": "Insufficient balance"
    }
  ]
}
```

2. **CSV Export**:
```csv
TxHash,Wallet,Function,Status,GasUsed,Error
0xabc...123,0x1234...abcd,transfer,reverted,21450,Insufficient balance
```

---

### Feature 6: Determinism & Hashing

**Purpose**: Ensure every simulation can be reproduced exactly

**Components**:
- `SimulationHashGenerator` - Generate unique hash for each run
- `ReplayManager` - Re-run simulation with same parameters
- `ConfigSnapshot` - Save exact configuration

**Hash Generation**:

```typescript
interface SimulationHash {
  runId: string;
  configHash: string;
  seed: string;
  timestamp: number;

  inputs: {
    contractAddress: string;
    abiHash: string;
    network: string;
    walletCount: number;
    archetypeConfig: any;
    targetFunctions: string[];
  };
}

function generateSimulationHash(config: SimulationConfig): string {
  const hashInput = {
    seed: config.seed,
    contract: config.contractAddress,
    abiHash: sha256(config.abiText),
    network: config.network,
    wallets: config.walletCount,
    archetypes: config.archetypeMode === 'single'
      ? config.singleArchetype
      : config.mixedDistribution,
    functions: config.targetFunctions.sort(),
  };

  return sha256(JSON.stringify(hashInput));
}
```

**Replay UI**:

```
┌──────────────────────────────────────────────────────────┐
│ REPLAY SIMULATION                                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Original Run ID: abc123                                  │
│ Config Hash:     0xdef456                                │
│ Seed:            my-deterministic-seed                   │
│ Run Date:        2026-01-02 14:30:45                    │
│                                                          │
│ This will reproduce the exact same simulation using     │
│ the same seed and configuration.                        │
│                                                          │
│ Expected Results:                                        │
│ • Same transaction order                                │
│ • Same timing delays                                     │
│ • Same gas usage                                         │
│ • Same success/revert outcomes                          │
│                                                          │
│ [Cancel] [Replay Simulation]                            │
└──────────────────────────────────────────────────────────┘
```

**State Storage**:
```typescript
interface SimulationSnapshot {
  runId: string;
  config: SimulationConfig;
  configHash: string;
  seed: string;
  results: {
    totalTxs: number;
    successRate: number;
    totalGas: number;
    duration: number;
  };
  createdAt: number;
}

// Store in localStorage for history
localStorage.setItem(`simulation_${runId}`, JSON.stringify(snapshot));
```

**Replay Flow**:
1. User clicks "Replay" on a completed simulation
2. System fetches original config + seed
3. Backend uses SAME seed to initialize SeededRandom
4. Simulation runs with identical timing/behavior
5. Results should match original run exactly

---

## 🧩 Component Structure

### Component Hierarchy

```
App (Layout)
├── TopBar
│   ├── SimulationStatus
│   ├── RunIdDisplay
│   └── ElapsedTimer
│
├── MainLayout (3 columns)
│   ├── LeftPanel (Config)
│   │   ├── ContractSection
│   │   │   ├── ContractAddressInput
│   │   │   ├── ABIUploader
│   │   │   ├── ABIValidator
│   │   │   └── FunctionSelector
│   │   │
│   │   ├── SimulationConfigSection
│   │   │   ├── NetworkSelector
│   │   │   ├── WalletGroupSelector
│   │   │   ├── ArchetypeConfig
│   │   │   │   ├── SingleArchetypeSelector
│   │   │   │   └── MixedArchetypeSliders
│   │   │   ├── DurationConfig
│   │   │   └── ParameterBuilder
│   │   │
│   │   └── ExecutionControls
│   │       ├── StartButton
│   │       ├── PauseButton
│   │       ├── StopButton
│   │       └── ReplayButton
│   │
│   ├── CenterPanel (Live Visualization)
│   │   ├── WalletGrid
│   │   │   └── WalletRow[]
│   │   │       ├── WalletAddress
│   │   │       ├── ArchetypeBadge
│   │   │       ├── StatusIndicator
│   │   │       ├── NonceDisplay
│   │   │       └── LastTxLink
│   │   │
│   │   └── TimelineView
│   │       ├── TimeAxis
│   │       ├── WalletLanes[]
│   │       └── TransactionDots[]
│   │
│   └── RightPanel (Metrics & Logs)
│       ├── MetricsPanel
│       │   ├── PerformanceMetrics
│       │   ├── SystemStatus
│       │   └── CostEstimation
│       │
│       └── EventLog
│           └── LogEntry[]
│
└── Modals
    ├── WalletDetailModal
    │   ├── WalletSummary
    │   ├── TransactionHistoryTable
    │   └── ExportButtons
    │
    ├── TransactionDetailModal
    │   ├── TransactionSummary
    │   ├── ParametersView
    │   ├── TimingBreakdown
    │   ├── GasAnalysis
    │   ├── ErrorStackViewer
    │   └── RetryHistory
    │
    └── ReplayModal
        ├── OriginalRunInfo
        ├── DeterminismExplanation
        └── ReplayButton
```

### Component File Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (main dashboard)
│   └── globals.css
│
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx
│   │   ├── LeftPanel.tsx
│   │   ├── CenterPanel.tsx
│   │   ├── RightPanel.tsx
│   │   └── MainLayout.tsx
│   │
│   ├── contract/
│   │   ├── ContractAddressInput.tsx
│   │   ├── ABIUploader.tsx
│   │   ├── ABIValidator.tsx
│   │   └── FunctionSelector.tsx
│   │
│   ├── config/
│   │   ├── NetworkSelector.tsx
│   │   ├── WalletGroupSelector.tsx
│   │   ├── ArchetypeConfig.tsx
│   │   ├── DurationConfig.tsx
│   │   └── ParameterBuilder.tsx
│   │
│   ├── controls/
│   │   ├── ExecutionControls.tsx
│   │   ├── StartButton.tsx
│   │   ├── PauseButton.tsx
│   │   ├── StopButton.tsx
│   │   └── ReplayButton.tsx
│   │
│   ├── visualization/
│   │   ├── WalletGrid.tsx
│   │   ├── WalletRow.tsx
│   │   ├── TimelineView.tsx
│   │   └── StatusIndicator.tsx
│   │
│   ├── metrics/
│   │   ├── MetricsPanel.tsx
│   │   ├── PerformanceMetrics.tsx
│   │   ├── SystemStatus.tsx
│   │   └── CostEstimation.tsx
│   │
│   ├── inspection/
│   │   ├── WalletDetailModal.tsx
│   │   ├── TransactionDetailModal.tsx
│   │   ├── TransactionHistoryTable.tsx
│   │   ├── ErrorStackViewer.tsx
│   │   └── ExportButtons.tsx
│   │
│   └── replay/
│       ├── ReplayModal.tsx
│       └── SimulationHashDisplay.tsx
│
├── store/
│   ├── simulationStore.ts (Zustand)
│   ├── configStore.ts
│   └── metricsStore.ts
│
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   ├── contracts.ts
│   │   ├── simulations.ts
│   │   └── websocket.ts
│   │
│   ├── utils/
│   │   ├── hash.ts
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── exporters.ts
│   │
│   └── hooks/
│       ├── useSimulation.ts
│       ├── useMetrics.ts
│       ├── useWebSocket.ts
│       └── useWalletData.ts
│
└── types/
    ├── simulation.ts
    ├── wallet.ts
    ├── transaction.ts
    ├── metrics.ts
    └── api.ts
```

---

## 🔄 State Management Model

### State Architecture

We'll use **Zustand** for global state management due to:
- Minimal boilerplate
- TypeScript-first
- Easy debugging
- No provider hell

### State Stores

#### 1. Configuration Store (`configStore.ts`)

```typescript
interface ConfigState {
  // Contract
  contractAddress: string;
  abiText: string;
  abiParsed: ABI | null;
  selectedFunctions: string[];

  // Network
  network: string;
  rpcUrl: string;

  // Wallets
  walletCount: number;
  walletSource: 'farm' | 'import';

  // Archetypes
  archetypeMode: 'single' | 'mixed';
  singleArchetype: string | null;
  mixedDistribution: Record<string, number>;

  // Execution
  durationType: 'time' | 'interactions';
  durationValue: number;

  // Advanced
  seed: string;
  enableRateLimiting: boolean;
  enableRetries: boolean;

  // Actions
  setContractAddress: (address: string) => void;
  setABI: (abi: string) => void;
  parseABI: () => void;
  selectFunction: (fn: string) => void;
  setArchetype: (type: string, value: any) => void;
  resetConfig: () => void;
  loadSnapshot: (snapshot: any) => void;
}

const useConfigStore = create<ConfigState>((set, get) => ({
  // Initial state
  contractAddress: '',
  abiText: '',
  abiParsed: null,
  selectedFunctions: [],
  network: 'ethereum',
  rpcUrl: '',
  walletCount: 10,
  walletSource: 'farm',
  archetypeMode: 'single',
  singleArchetype: null,
  mixedDistribution: {},
  durationType: 'time',
  durationValue: 60,
  seed: '',
  enableRateLimiting: true,
  enableRetries: true,

  // Actions
  setContractAddress: (address) => set({ contractAddress: address }),
  setABI: (abi) => set({ abiText: abi }),
  parseABI: () => {
    const { abiText } = get();
    try {
      const parsed = JSON.parse(abiText);
      set({ abiParsed: parsed });
    } catch (e) {
      console.error('Invalid ABI', e);
    }
  },
  selectFunction: (fn) => {
    const { selectedFunctions } = get();
    const updated = selectedFunctions.includes(fn)
      ? selectedFunctions.filter(f => f !== fn)
      : [...selectedFunctions, fn];
    set({ selectedFunctions: updated });
  },
  setArchetype: (type, value) => {
    if (type === 'mode') {
      set({ archetypeMode: value });
    } else if (type === 'single') {
      set({ singleArchetype: value });
    } else {
      set({ mixedDistribution: value });
    }
  },
  resetConfig: () => set({
    contractAddress: '',
    abiText: '',
    abiParsed: null,
    selectedFunctions: [],
  }),
  loadSnapshot: (snapshot) => set(snapshot),
}));
```

#### 2. Simulation Store (`simulationStore.ts`)

```typescript
interface SimulationState {
  // Status
  status: 'idle' | 'starting' | 'running' | 'paused' | 'stopping' | 'stopped' | 'error';
  runId: string | null;
  configHash: string | null;
  seed: string | null;

  // Timing
  startedAt: number | null;
  stoppedAt: number | null;
  elapsedTime: number;

  // Wallets
  wallets: Map<string, WalletState>;

  // Transactions
  transactions: Map<string, TransactionResult>;

  // Events
  events: SimulationEvent[];

  // Actions
  startSimulation: (config: SimulationConfig) => Promise<void>;
  pauseSimulation: () => Promise<void>;
  resumeSimulation: () => Promise<void>;
  stopSimulation: () => Promise<void>;
  updateWallet: (address: string, data: Partial<WalletState>) => void;
  addTransaction: (tx: TransactionResult) => void;
  addEvent: (event: SimulationEvent) => void;
  reset: () => void;
}

interface WalletState {
  address: string;
  archetype: string;
  status: 'idle' | 'waiting' | 'sending' | 'confirmed' | 'reverted';
  nonce: number;
  lastTxHash: string | null;
  lastActionTimestamp: number | null;
  txCount: number;
  successCount: number;
  revertCount: number;
}

const useSimulationStore = create<SimulationState>((set, get) => ({
  status: 'idle',
  runId: null,
  configHash: null,
  seed: null,
  startedAt: null,
  stoppedAt: null,
  elapsedTime: 0,
  wallets: new Map(),
  transactions: new Map(),
  events: [],

  startSimulation: async (config) => {
    set({ status: 'starting' });
    try {
      const response = await api.startSimulation(config);
      set({
        status: 'running',
        runId: response.runId,
        configHash: response.configHash,
        seed: response.seed,
        startedAt: Date.now(),
      });
    } catch (error) {
      set({ status: 'error' });
      throw error;
    }
  },

  pauseSimulation: async () => {
    const { runId } = get();
    if (!runId) return;
    await api.pauseSimulation(runId);
    set({ status: 'paused' });
  },

  resumeSimulation: async () => {
    const { runId } = get();
    if (!runId) return;
    await api.resumeSimulation(runId);
    set({ status: 'running' });
  },

  stopSimulation: async () => {
    const { runId } = get();
    if (!runId) return;
    set({ status: 'stopping' });
    await api.stopSimulation(runId);
    set({
      status: 'stopped',
      stoppedAt: Date.now(),
    });
  },

  updateWallet: (address, data) => {
    const { wallets } = get();
    const wallet = wallets.get(address);
    if (wallet) {
      wallets.set(address, { ...wallet, ...data });
      set({ wallets: new Map(wallets) });
    }
  },

  addTransaction: (tx) => {
    const { transactions } = get();
    transactions.set(tx.txHash, tx);
    set({ transactions: new Map(transactions) });
  },

  addEvent: (event) => {
    const { events } = get();
    set({ events: [...events, event] });
  },

  reset: () => set({
    status: 'idle',
    runId: null,
    configHash: null,
    seed: null,
    startedAt: null,
    stoppedAt: null,
    elapsedTime: 0,
    wallets: new Map(),
    transactions: new Map(),
    events: [],
  }),
}));
```

#### 3. Metrics Store (`metricsStore.ts`)

```typescript
interface MetricsState {
  tps: number;
  successRate: number;
  revertRate: number;
  avgDelay: number;
  avgGasUsed: number;
  totalTxs: number;
  successfulTxs: number;
  revertedTxs: number;
  pendingTxs: number;
  activeWallets: number;
  idleWallets: number;
  rateLimitedWallets: number;
  nonceGaps: number;
  circuitBreaks: number;
  retryAttempts: number;
  totalGasUsed: number;
  estimatedCostUSD: number;
  gasPrice: string;

  // Historical data for charts
  tpsHistory: Array<{ timestamp: number; value: number }>;
  successRateHistory: Array<{ timestamp: number; value: number }>;

  // Actions
  updateMetrics: (metrics: Partial<MetricsState>) => void;
  addDataPoint: (metric: string, value: number) => void;
  reset: () => void;
}

const useMetricsStore = create<MetricsState>((set, get) => ({
  tps: 0,
  successRate: 0,
  revertRate: 0,
  avgDelay: 0,
  avgGasUsed: 0,
  totalTxs: 0,
  successfulTxs: 0,
  revertedTxs: 0,
  pendingTxs: 0,
  activeWallets: 0,
  idleWallets: 0,
  rateLimitedWallets: 0,
  nonceGaps: 0,
  circuitBreaks: 0,
  retryAttempts: 0,
  totalGasUsed: 0,
  estimatedCostUSD: 0,
  gasPrice: '0',
  tpsHistory: [],
  successRateHistory: [],

  updateMetrics: (metrics) => set(metrics),

  addDataPoint: (metric, value) => {
    const key = `${metric}History` as keyof MetricsState;
    const history = get()[key] as Array<any>;
    const updated = [
      ...history,
      { timestamp: Date.now(), value }
    ].slice(-100); // Keep last 100 points
    set({ [key]: updated } as any);
  },

  reset: () => set({
    tps: 0,
    successRate: 0,
    revertRate: 0,
    totalTxs: 0,
    tpsHistory: [],
    successRateHistory: [],
  }),
}));
```

### State Flow Diagram

```
User Action
    │
    ├─→ Config Change
    │       └─→ useConfigStore.update()
    │               └─→ UI Re-render
    │
    ├─→ Start Simulation
    │       └─→ useSimulationStore.startSimulation()
    │               ├─→ API POST /simulations/start
    │               └─→ WebSocket connection
    │                       ├─→ Wallet updates
    │                       ├─→ Transaction events
    │                       └─→ Metrics updates
    │
    └─→ View Details
            └─→ Open modal with transaction data
                    └─→ Fetch from useSimulationStore
```

---

## 🌐 API Contract Specification

### REST API Endpoints

#### Contract Management

```typescript
// Validate contract and ABI
POST /api/contracts/validate
Request: {
  address: string;
  abi: string;
}
Response: {
  valid: boolean;
  functions: Array<{
    name: string;
    signature: string;
    inputs: Array<{ name: string; type: string }>;
  }>;
  errors?: string[];
}

// Get contract metadata
GET /api/contracts/{address}/metadata
Response: {
  address: string;
  name: string;
  verified: boolean;
  network: string;
}
```

#### Simulation Control

```typescript
// Start simulation
POST /api/simulations/start
Request: {
  config: SimulationConfig;
}
Response: {
  runId: string;
  seed: string;
  configHash: string;
  estimatedDuration: number;
}

// Pause simulation
POST /api/simulations/{runId}/pause
Response: {
  success: boolean;
  queuedTxs: number;
}

// Resume simulation
POST /api/simulations/{runId}/resume
Response: {
  success: boolean;
}

// Stop simulation
POST /api/simulations/{runId}/stop
Response: {
  success: boolean;
  finalMetrics: SimulationMetrics;
}

// Get simulation status
GET /api/simulations/{runId}/status
Response: {
  runId: string;
  status: SimulationStatus;
  elapsedTime: number;
  metrics: SimulationMetrics;
}

// Replay simulation
POST /api/simulations/replay
Request: {
  runId: string;
  seed: string;
  config: SimulationConfig;
}
Response: {
  newRunId: string;
  originalRunId: string;
}

// Get simulation history
GET /api/simulations/history
Response: {
  simulations: Array<{
    runId: string;
    configHash: string;
    startedAt: number;
    stoppedAt: number;
    metrics: SimulationMetrics;
  }>;
}
```

#### Wallet & Transaction Data

```typescript
// Get wallet details
GET /api/simulations/{runId}/wallets/{address}
Response: {
  address: string;
  archetype: string;
  transactions: TransactionResult[];
  metrics: {
    totalTxs: number;
    successRate: number;
    totalGas: number;
  };
}

// Get transaction details
GET /api/simulations/{runId}/transactions/{txHash}
Response: TransactionResult;

// Export simulation data
GET /api/simulations/{runId}/export?format=json|csv
Response: File download
```

### WebSocket Events

```typescript
// Connection
ws://localhost:3000/ws/simulations/{runId}

// Event Types
type WebSocketEvent =
  | WalletUpdateEvent
  | TransactionEvent
  | MetricsUpdateEvent
  | SystemEvent;

// Wallet Update
{
  type: 'wallet_update';
  data: {
    address: string;
    status: WalletStatus;
    nonce: number;
    lastTxHash: string;
  };
}

// Transaction Event
{
  type: 'transaction';
  data: {
    txHash: string;
    walletAddress: string;
    function: string;
    status: 'sent' | 'confirmed' | 'reverted';
    gasUsed?: number;
    error?: string;
  };
}

// Metrics Update
{
  type: 'metrics_update';
  data: SimulationMetrics;
}

// System Event
{
  type: 'system_event';
  data: {
    level: 'info' | 'warning' | 'error';
    message: string;
    details?: any;
  };
}
```

### API Client Implementation

```typescript
// lib/api/client.ts
class SimulationAPIClient {
  private baseUrl: string;
  private ws: WebSocket | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // REST methods
  async validateContract(address: string, abi: string) {
    const response = await fetch(`${this.baseUrl}/contracts/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, abi }),
    });
    return response.json();
  }

  async startSimulation(config: SimulationConfig) {
    const response = await fetch(`${this.baseUrl}/simulations/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
    return response.json();
  }

  // WebSocket methods
  connectWebSocket(runId: string, onEvent: (event: WebSocketEvent) => void) {
    this.ws = new WebSocket(`ws://localhost:3000/ws/simulations/${runId}`);

    this.ws.onmessage = (message) => {
      const event = JSON.parse(message.data);
      onEvent(event);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return this.ws;
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const apiClient = new SimulationAPIClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
);
```

---

## 🎨 UI/UX Flow Walkthrough

### Complete User Journey

#### Step 1: Initial Load

**Screen**: Empty dashboard

```
┌──────────────────────────────────────────────────────────┐
│ 🧪 Wallet Farm Simulator                            v1.0 │
├──────────┬───────────────────────────┬───────────────────┤
│          │                           │                   │
│  Config  │   No Simulation Running   │   Ready           │
│          │                           │                   │
│  Start   │   Configure your first    │   Status: Idle    │
│  by:     │   simulation to begin     │                   │
│          │                           │   Simulations: 0  │
│  1. Add  │         [Icon]            │                   │
│  contract│                           │                   │
│          │   Need help?              │                   │
│  2. Upload│   Check docs →           │                   │
│  ABI     │                           │                   │
│          │                           │                   │
└──────────┴───────────────────────────┴───────────────────┘
```

**User Action**: User pastes contract address

#### Step 2: Contract Setup

**Screen**: Contract configuration

```
┌──────────────────────────────────────────────────────────┐
│ CONTRACT CONFIGURATION                                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Contract Address                                         │
│ [0x1234567890abcdef1234567890abcdef12345678]            │
│ ✅ Valid Ethereum address                               │
│                                                          │
│ ABI                                                      │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Drag & drop ABI file or click to browse          │   │
│ │                                                   │   │
│ │           [📄 Upload Icon]                        │   │
│ │                                                   │   │
│ │           or paste ABI JSON below                │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ [Paste ABI JSON]                                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**User Action**: User uploads ABI JSON file

#### Step 3: ABI Validation

**Screen**: Functions detected

```
┌──────────────────────────────────────────────────────────┐
│ ABI VALIDATION                                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ✅ ABI Valid                                            │
│ 🔍 12 functions detected                                │
│                                                          │
│ SELECT FUNCTIONS TO TEST                                │
│                                                          │
│ ☑ mint(address to, uint256 amount)                     │
│ ☑ transfer(address to, uint256 amount)                 │
│ ☐ approve(address spender, uint256 amount)             │
│ ☐ burn(uint256 amount)                                 │
│ ☐ transferFrom(address from, address to, uint256)      │
│ ☑ balanceOf(address account) view                      │
│                                                          │
│ [Select All] [Deselect All]                            │
│                                                          │
│ Selected: 3 functions                                   │
│                                                          │
│ [Continue]                                              │
└──────────────────────────────────────────────────────────┘
```

**User Action**: User selects functions and clicks Continue

#### Step 4: Simulation Configuration

**Screen**: Full configuration panel

```
┌──────────────────────────────────────────────────────────┐
│ SIMULATION CONFIGURATION                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ NETWORK                                                  │
│ [Ethereum Mainnet ▼]                                    │
│ RPC: https://eth-mainnet.alchemyapi.io/...             │
│                                                          │
│ WALLETS                                                  │
│ Count: [25] wallets (1-100)                             │
│ Source: ● Wallet Farm  ○ Import                         │
│                                                          │
│ BEHAVIOR ARCHETYPES                                      │
│ ○ Single Archetype: [Select ▼]                         │
│ ● Mixed Distribution:                                   │
│                                                          │
│   🐋 Whale      [20%] ████                              │
│   📊 Trader     [30%] ██████                            │
│   👤 Casual     [40%] ████████                          │
│   💤 Lurker     [10%] ██                                │
│   🔬 Researcher [0%]  -                                 │
│   🤖 Bot        [0%]  -                                 │
│                        ────                              │
│                        100%                              │
│                                                          │
│ EXECUTION                                                │
│ ● Run for [60] seconds                                  │
│ ○ Until [100] interactions                              │
│                                                          │
│ ADVANCED OPTIONS                                         │
│ [▼ Show Advanced]                                       │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Ready to start simulation                          │ │
│ │                                                    │ │
│ │ • Contract: 0x1234...5678                         │ │
│ │ • Functions: 3 selected                           │ │
│ │ • Wallets: 25 (mixed archetypes)                  │ │
│ │ • Duration: 60 seconds                            │ │
│ │                                                    │ │
│ │ [Start Simulation]                                │ │
│ └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**User Action**: User clicks "Start Simulation"

#### Step 5: Simulation Starting

**Screen**: Initialization

```
┌──────────────────────────────────────────────────────────┐
│ Status: 🔄 Starting | Run ID: abc123 | Elapsed: 00:00   │
├──────────┬───────────────────────────┬───────────────────┤
│          │                           │                   │
│  Config  │   Initializing...         │   Preparing       │
│  ✅      │                           │                   │
│          │   ⏳ Setting up wallets   │   Status: Starting│
│  [View]  │   ⏳ Connecting to RPC    │                   │
│  [Edit]  │   ⏳ Validating config    │   Wallets: 0/25   │
│          │                           │   Active          │
│          │   Please wait...          │                   │
│          │                           │   Txs Sent: 0     │
│          │                           │                   │
└──────────┴───────────────────────────┴───────────────────┘
```

#### Step 6: Simulation Running

**Screen**: Live execution (main view)

```
┌──────────────────────────────────────────────────────────┐
│ Status: ● Running | Run ID: abc123 | Elapsed: 00:23     │
│ [⏸ Pause] [⏹ Stop]                                      │
├──────────┬───────────────────────────┬───────────────────┤
│  Config  │   WALLET GRID             │   METRICS         │
│  ─────   │   ─────────────           │   ─────────       │
│          │                           │                   │
│ Contract │ Addr      Type  Status Tx │ TPS: 12.5 tx/s   │
│ 0x1234.. │ ────────────────────────  │ Success: 94.2%   │
│          │ 0x11..ab 🐋  ✅ Done  15  │ Revert: 5.8%     │
│ Functions│ 0x22..cd 📊  ⏳ Pend  8   │                   │
│ • mint   │ 0x33..ef 👤  ✅ Done  12  │ Active: 18/25    │
│ • transfer│ 0x44..gh 💤  ⏸ Idle  0   │ Rate Limited: 2  │
│ • balanceOf│ 0x55..ij 🐋  ❌ Rev  3   │                   │
│          │ 0x66..kl 📊  ✅ Done  9   │ Total Gas:       │
│ Network  │ 0x77..mn 👤  ✅ Done  6   │ 1,234,567       │
│ Ethereum │ ...                       │                   │
│          │ [Scroll for 18 more]      │ Est. Cost:       │
│ Wallets  │                           │ $3.21           │
│ 25 mixed │   TIMELINE                │                   │
│          │   ────────                │ EVENT LOG        │
│ Duration │ Time (seconds) →          │ ─────────        │
│ 60s      │ 0s  10s  20s  30s  40s    │                   │
│          │ │───┼───┼───┼───┼───     │ ✅ Tx confirmed  │
│ [View    │ 🐋 ●● ●  ●●●              │    0xabc...      │
│  Details]│ 📊  ● ●● ●   ●  ●         │ ⚠️ Rate limit    │
│          │ 👤 ●●●●●●●●               │    wallet 0x55.. │
│          │ 💤          ●             │ ✅ Tx confirmed  │
│          │                           │    0xdef...      │
└──────────┴───────────────────────────┴───────────────────┘
```

**Interactions Available**:
- Click wallet → Open detail modal
- Click tx hash → View transaction details
- Hover timeline dot → Show tx info
- Click pause → Pause execution
- Click stop → Stop and finalize

#### Step 7: Wallet Detail View

**User Action**: User clicks on wallet `0x55..ij` (which has reverted txs)

**Screen**: Wallet detail modal

```
┌──────────────────────────────────────────────────────────┐
│ Wallet Details: 0x5555...ijkl                      [X]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Archetype: 🐋 Whale                                      │
│ Total Txs: 3 (0 success, 3 reverted) ❌                 │
│ Total Gas Used: 64,350                                   │
│ Current Nonce: 3                                         │
│ Status: Reverted                                         │
│                                                          │
│ TRANSACTION HISTORY                                      │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Tx Hash      Function    Status   Gas     Time    │  │
│ ├────────────────────────────────────────────────────┤  │
│ │ 0xabc..123  mint()      ❌ Rev   21,450  00:05   │  │
│ │ 0xdef..456  transfer()  ❌ Rev   21,450  00:12   │  │
│ │ 0xghi..789  mint()      ❌ Rev   21,450  00:18   │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ⚠️ All transactions reverted with same error:           │
│    "Insufficient balance"                                │
│                                                          │
│ [Export JSON] [Export CSV] [Copy Hashes]                │
└──────────────────────────────────────────────────────────┘
```

**User Action**: User clicks on tx `0xabc..123`

#### Step 8: Transaction Detail View

**Screen**: Transaction detail modal

```
┌──────────────────────────────────────────────────────────┐
│ Transaction: 0xabc...123                           [X]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Status: ❌ Reverted                                      │
│ Function: mint(address to, uint256 amount)              │
│                                                          │
│ PARAMETERS                                               │
│ to:      0x5555...ijkl (this wallet)                    │
│ amount:  1000000000000000000 (1 token)                  │
│                                                          │
│ TIMING                                                   │
│ Queued:     00:04:58                                     │
│ Sent:       00:05:00 (+2s delay from TimingEngine)      │
│ Confirmed:  00:05:03 (+3s block time)                   │
│ Total:      5 seconds                                    │
│                                                          │
│ GAS                                                      │
│ Gas Limit:  100,000                                      │
│ Gas Used:   21,450                                       │
│ Gas Price:  27 gwei                                      │
│ Cost:       $0.58                                        │
│                                                          │
│ ERROR DETAILS                                            │
│ Revert Reason: "Insufficient balance"                   │
│                                                          │
│ Stack Trace:                                             │
│   at ERC20.mint (ERC20.sol:89)                          │
│   at SafeMath.add (SafeMath.sol:31)                     │
│   require(hasRole(MINTER_ROLE, msg.sender),            │
│           "Caller is not a minter")                     │
│                                                          │
│ 💡 Diagnosis:                                           │
│ This wallet does not have MINTER_ROLE permission.       │
│ Consider using transfer() or request minter access.     │
│                                                          │
│ RETRY ATTEMPTS (3 total)                                │
│ 1. 00:05:05 - Failed: "Insufficient balance"           │
│ 2. 00:05:08 - Failed: "Insufficient balance"           │
│ 3. Aborted (max retries reached)                        │
│                                                          │
│ [Copy Tx Hash] [View on Etherscan] [Copy Error]        │
└──────────────────────────────────────────────────────────┘
```

**User realizes the issue**: Wallet needs minter role or should use different function

#### Step 9: Simulation Complete

**Screen**: Final results

```
┌──────────────────────────────────────────────────────────┐
│ Status: ⏹ Stopped | Run ID: abc123 | Total: 01:00       │
│ [🔄 Replay] [📊 Export Results] [🆕 New Simulation]     │
├──────────┬───────────────────────────┬───────────────────┤
│  Config  │   FINAL RESULTS           │   SUMMARY         │
│  ─────   │   ─────────────           │   ─────────       │
│          │                           │                   │
│ Simulation│ Total Transactions: 287  │ Success: 94.2%   │
│ Hash:    │ ✅ Successful: 270        │ (270/287)        │
│ 0xconfig │ ❌ Reverted: 17           │                   │
│          │                           │ Failed Wallets:  │
│ Seed:    │ Total Gas: 12,456,789    │ • 0x55..ij (3tx) │
│ "abc123" │ Est. Cost: $337.93       │ • 0x88..op (2tx) │
│          │                           │                   │
│ [Replay  │ Top Performers:           │ Avg TPS: 4.8    │
│  This]   │ 🐋 Whales: 15 avg txs     │ Peak TPS: 12.5  │
│          │ 📊 Traders: 12 avg txs    │                   │
│ Contract │ 👤 Casual: 10 avg txs     │ Total Time:      │
│ 0x1234.. │                           │ 60.00 seconds   │
│          │ Common Errors:            │                   │
│ Download │ • "Insufficient balance"  │ [View Full       │
│ [JSON]   │   (15 occurrences)        │  Report]         │
│ [CSV]    │ • "Not a minter"          │                   │
│          │   (2 occurrences)         │                   │
└──────────┴───────────────────────────┴───────────────────┘
```

**Available Actions**:
- **Replay**: Re-run with same seed (deterministic)
- **Export**: Download JSON/CSV
- **New Simulation**: Start fresh with different config
- **View Report**: Detailed analysis

#### Step 10: Replay Confirmation

**User Action**: User clicks "Replay"

**Screen**: Replay modal

```
┌──────────────────────────────────────────────────────────┐
│ REPLAY SIMULATION                                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ You are about to replay simulation:                     │
│                                                          │
│ Original Run ID:  abc123                                │
│ Config Hash:      0xdef456...                           │
│ Seed:             "abc123"                              │
│ Date:             2026-01-02 14:30:45                   │
│                                                          │
│ This will reproduce the EXACT same simulation:          │
│ ✅ Same transaction order                               │
│ ✅ Same timing delays                                   │
│ ✅ Same gas usage                                       │
│ ✅ Same success/revert outcomes                         │
│                                                          │
│ Expected Results:                                        │
│ • Total Txs: 287                                        │
│ • Success Rate: 94.2%                                   │
│ • Total Gas: 12,456,789                                 │
│ • Duration: ~60 seconds                                 │
│                                                          │
│ Note: Results may differ slightly if on-chain state    │
│ has changed (e.g., contract upgraded, balance changed).│
│                                                          │
│ [Cancel] [Replay Simulation]                            │
└──────────────────────────────────────────────────────────┘
```

### Error Handling Flows

#### Error Flow 1: Invalid Contract Address

```
User pastes: "0xinvalid"
    ↓
System validates
    ↓
❌ Error: "Invalid Ethereum address format"
    ↓
Show error message below input
    ↓
Input border turns red
    ↓
User corrects input
```

#### Error Flow 2: Invalid ABI

```
User pastes: "{broken json"
    ↓
System parses ABI
    ↓
❌ Parse error
    ↓
Show error: "Invalid JSON format"
Show line number if possible
    ↓
User fixes ABI
```

#### Error Flow 3: Simulation Failed to Start

```
User clicks Start
    ↓
API call to backend
    ↓
❌ Backend error: "RPC connection failed"
    ↓
Show toast notification
Change status to "error"
Display error details in event log
    ↓
User fixes RPC URL
Retry start
```

#### Error Flow 4: WebSocket Disconnected

```
Simulation running
    ↓
WebSocket connection lost
    ↓
⚠️ Warning banner appears: "Connection lost. Reconnecting..."
    ↓
Auto-reconnect attempts (3 retries)
    ↓
If success: Resume updates
If failed: Show manual reconnect button
```

---

## 📊 Data Models

### Complete TypeScript Definitions

```typescript
// types/simulation.ts

export type SimulationStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'error';

export type ArchetypeType =
  | 'whale'
  | 'trader'
  | 'casual'
  | 'lurker'
  | 'researcher'
  | 'bot';

export type WalletStatus =
  | 'idle'
  | 'waiting'
  | 'sending'
  | 'confirmed'
  | 'reverted'
  | 'rate-limited';

export type TransactionStatus =
  | 'queued'
  | 'sent'
  | 'pending'
  | 'confirmed'
  | 'reverted';

export interface SimulationConfig {
  // Contract
  contractAddress: string;
  abiText: string;
  abiParsed: ABI;
  selectedFunctions: string[];

  // Network
  network: string;
  rpcUrl?: string;

  // Wallets
  walletCount: number;
  walletSource: 'farm' | 'import';

  // Behavior
  archetypeMode: 'single' | 'mixed';
  singleArchetype?: ArchetypeType;
  mixedDistribution?: Record<ArchetypeType, number>;

  // Execution
  durationType: 'time' | 'interactions';
  durationValue: number;
  targetFunctions: string[];

  // Transaction Parameters
  ethValue?: string;
  tokenValue?: string;
  gasLimit?: number;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;

  // Advanced
  seed?: string;
  enableRateLimiting: boolean;
  enableRetries: boolean;
  maxRetriesPerTx: number;
}

export interface WalletState {
  address: string;
  archetype: ArchetypeType;
  status: WalletStatus;
  nonce: number;
  lastTxHash: string | null;
  lastActionTimestamp: number | null;
  txCount: number;
  successCount: number;
  revertCount: number;
  totalGasUsed: number;
}

export interface TransactionResult {
  txHash: string;
  walletAddress: string;
  function: string;
  functionSignature: string;
  parameters: Record<string, any>;

  // Timing
  queuedAt: number;
  sentAt: number;
  confirmedAt: number | null;
  totalDuration: number;
  timingDelay: number;
  blockTime: number;

  // Gas
  gasLimit: number;
  gasUsed: number;
  gasPrice: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  costETH: string;
  costUSD: number;

  // Status
  status: TransactionStatus;
  blockNumber: number | null;
  blockHash: string | null;

  // Error (if reverted)
  revertReason?: string;
  errorMessage?: string;
  errorStack?: string[];

  // Retries
  retryAttempts: number;
  retryResults: Array<{
    attempt: number;
    timestamp: number;
    error: string;
  }>;

  // Metadata
  archetype: ArchetypeType;
  simulationRunId: string;
}

export interface SimulationMetrics {
  // Performance
  tps: number;
  currentTPS: number;
  peakTPS: number;
  avgTPS: number;

  // Success Rates
  successRate: number;
  revertRate: number;

  // Timing
  avgDelay: number;
  avgBlockTime: number;
  avgTotalDuration: number;

  // Gas
  avgGasUsed: number;
  totalGasUsed: number;
  avgGasPrice: string;
  totalCostETH: string;
  totalCostUSD: number;

  // Transaction Counts
  totalTxs: number;
  successfulTxs: number;
  revertedTxs: number;
  pendingTxs: number;
  queuedTxs: number;

  // Wallet Stats
  totalWallets: number;
  activeWallets: number;
  idleWallets: number;
  rateLimitedWallets: number;

  // System Events
  nonceGaps: number;
  nonceGapsResolved: number;
  circuitBreaks: number;
  circuitBreaksRecovered: number;
  retryAttempts: number;
  retrySuccesses: number;

  // By Archetype
  metricsByArchetype: Record<ArchetypeType, {
    txCount: number;
    successRate: number;
    avgGasUsed: number;
  }>;

  // Historical Data
  tpsHistory: Array<{ timestamp: number; value: number }>;
  successRateHistory: Array<{ timestamp: number; value: number }>;
  gasUsedHistory: Array<{ timestamp: number; value: number }>;
}

export interface SimulationEvent {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error';
  type: string;
  message: string;
  details?: any;
  walletAddress?: string;
  txHash?: string;
}

export interface SimulationRun {
  runId: string;
  configHash: string;
  seed: string;
  config: SimulationConfig;
  status: SimulationStatus;
  startedAt: number;
  stoppedAt: number | null;
  elapsedTime: number;
  metrics: SimulationMetrics;
  wallets: Map<string, WalletState>;
  transactions: Map<string, TransactionResult>;
  events: SimulationEvent[];
}

export interface SimulationSnapshot {
  runId: string;
  config: SimulationConfig;
  configHash: string;
  seed: string;
  results: {
    totalTxs: number;
    successRate: number;
    totalGas: number;
    duration: number;
    finalMetrics: SimulationMetrics;
  };
  createdAt: number;
  exportedAt: number;
}
```

---

## 🎯 Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal**: Basic app structure and static UI

**Tasks**:
- [ ] Set up Next.js project with TypeScript
- [ ] Configure TailwindCSS
- [ ] Create folder structure
- [ ] Build 3-panel layout (static)
- [ ] Implement basic routing
- [ ] Set up Zustand stores (empty)
- [ ] Create placeholder components

**Deliverables**:
- Working Next.js app
- Layout renders correctly
- All components exist (empty)
- TypeScript types defined

**Success Criteria**:
- `npm run dev` works
- All pages load without errors
- Layout is responsive

---

### Phase 2: Configuration UI (Week 2)

**Goal**: Build all configuration inputs

**Tasks**:
- [ ] ContractAddressInput component
- [ ] ABIUploader component (drag-drop + paste)
- [ ] ABI validation logic
- [ ] FunctionSelector component
- [ ] NetworkSelector component
- [ ] WalletGroupSelector component
- [ ] ArchetypeConfig component
  - [ ] Single archetype selector
  - [ ] Mixed distribution sliders
- [ ] DurationConfig component
- [ ] Wire all inputs to configStore

**Deliverables**:
- All config inputs functional
- State updates correctly
- Validation works
- Config can be saved/loaded

**Success Criteria**:
- Can configure a complete simulation
- Config state persists in store
- Validation errors show correctly

---

### Phase 3: API Integration (Week 3)

**Goal**: Connect to backend API

**Tasks**:
- [ ] Create API client module
- [ ] Implement REST endpoints
  - [ ] `/contracts/validate`
  - [ ] `/simulations/start`
  - [ ] `/simulations/{id}/pause`
  - [ ] `/simulations/{id}/resume`
  - [ ] `/simulations/{id}/stop`
- [ ] Implement WebSocket client
- [ ] Create custom hooks
  - [ ] `useSimulation`
  - [ ] `useMetrics`
  - [ ] `useWebSocket`
- [ ] Handle API errors
- [ ] Add loading states

**Deliverables**:
- API client fully functional
- WebSocket connection works
- Hooks return real data
- Error handling complete

**Success Criteria**:
- Can start a simulation via API
- Receives WebSocket events
- Errors are handled gracefully

---

### Phase 4: Live Visualization (Week 4)

**Goal**: Build real-time dashboard

**Tasks**:
- [ ] WalletGrid component
  - [ ] WalletRow with all fields
  - [ ] Status badges
  - [ ] Click handlers
- [ ] TimelineView component
  - [ ] Timeline rendering
  - [ ] Transaction dots
  - [ ] Archetype lanes
  - [ ] Hover tooltips
- [ ] MetricsPanel component
  - [ ] Real-time metrics display
  - [ ] Historical charts (simple)
  - [ ] Update on WebSocket events
- [ ] EventLog component
- [ ] Wire WebSocket events to UI updates

**Deliverables**:
- Live wallet grid updates
- Timeline shows transactions
- Metrics update in real-time
- Event log scrolls

**Success Criteria**:
- UI updates within 500ms of event
- No UI lag with 100+ wallets
- Timeline is readable
- Metrics are accurate

---

### Phase 5: Execution Controls (Week 5)

**Goal**: Implement start/pause/stop/replay

**Tasks**:
- [ ] ExecutionControls component
- [ ] Start button logic
- [ ] Pause/Resume logic
- [ ] Stop button with confirmation
- [ ] ReplayManager component
- [ ] Simulation hash generation
- [ ] Config snapshot save/load
- [ ] Status indicator component
- [ ] Elapsed timer component

**Deliverables**:
- All control buttons work
- Pause/resume is smooth
- Stop finalizes properly
- Replay uses same seed

**Success Criteria**:
- Can control simulation lifecycle
- Replay produces identical results
- Status always shows correctly

---

### Phase 6: Result Inspection (Week 6)

**Goal**: Build detail views and export

**Tasks**:
- [ ] WalletDetailModal component
- [ ] TransactionHistoryTable component
- [ ] TransactionDetailModal component
- [ ] ErrorStackViewer component
- [ ] ExportButtons component
  - [ ] JSON export
  - [ ] CSV export
- [ ] Copy-to-clipboard utilities
- [ ] Block explorer link generator
- [ ] Search/filter in transaction history

**Deliverables**:
- Can view any wallet's full history
- Can inspect individual transactions
- Can export data in multiple formats
- Errors are clearly displayed

**Success Criteria**:
- Modal opens < 100ms
- Export generates valid files
- Error stacks are readable
- Links open correct explorer page

---

### Phase 7: Polish & UX (Week 7)

**Goal**: Improve usability and aesthetics

**Tasks**:
- [ ] Dark mode refinement
- [ ] Color scheme polish
- [ ] Loading skeletons
- [ ] Empty states
- [ ] Toast notifications
- [ ] Keyboard shortcuts
- [ ] Accessibility (ARIA labels)
- [ ] Responsive design fixes
- [ ] Performance optimization
  - [ ] Virtual scrolling for wallet grid
  - [ ] Debounce updates
  - [ ] Memoization

**Deliverables**:
- UI is polished
- No visual bugs
- Smooth animations
- Fast performance

**Success Criteria**:
- UI feels professional
- 60fps scrolling
- Works on mobile (responsive)
- Passes basic a11y checks

---

### Phase 8: Testing & Documentation (Week 8)

**Goal**: Ensure quality and maintainability

**Tasks**:
- [ ] Unit tests for utilities
- [ ] Integration tests for API
- [ ] E2E tests for user flows
- [ ] Component documentation
- [ ] API documentation
- [ ] User guide (README)
- [ ] Developer setup guide
- [ ] Deployment guide

**Deliverables**:
- 80%+ test coverage
- All critical paths tested
- Documentation complete
- Deployment works

**Success Criteria**:
- Tests pass in CI
- Docs are clear
- New devs can onboard easily

---

## 🔧 Technical Decisions

### Why These Choices?

#### Next.js App Router
- **Pro**: Modern, fast, great DX
- **Pro**: Built-in routing
- **Pro**: SSR if needed later
- **Con**: Learning curve for new users
- **Decision**: ✅ Use it (aligns with modern stack)

#### Zustand for State
- **Pro**: Minimal boilerplate
- **Pro**: TypeScript-first
- **Pro**: Easy debugging
- **Con**: Less popular than Redux
- **Decision**: ✅ Use it (simplicity wins)

#### WebSockets for Updates
- **Pro**: Real-time, low latency
- **Pro**: Server can push updates
- **Con**: Connection management
- **Alternative**: Server-Sent Events (SSE)
- **Decision**: ✅ WebSockets (backend already has this)

#### TailwindCSS
- **Pro**: Fast styling
- **Pro**: Consistent design
- **Pro**: Dark mode built-in
- **Con**: Verbose class names
- **Decision**: ✅ Use it (industry standard)

#### No Heavy Chart Libraries
- **Pro**: Smaller bundle
- **Pro**: Faster load
- **Con**: Limited chart types
- **Alternative**: Use simple SVG/Canvas
- **Decision**: ✅ Keep it lightweight

#### React Query / TanStack Query
- **Pro**: Caching, retries, devtools
- **Pro**: Great for REST APIs
- **Con**: Another dependency
- **Decision**: ✅ Use for REST, not WebSocket

---

## 🧪 Testing Strategy

### Test Pyramid

```
        E2E Tests (5%)
      /              \
     /  Integration   \
    /    Tests (15%)   \
   /                    \
  /   Unit Tests (80%)   \
 ──────────────────────────
```

### Unit Tests (80%)

**What to Test**:
- Utility functions (hash, formatters, validators)
- Store actions (config changes, state updates)
- Component logic (not UI rendering)

**Tools**:
- Jest
- React Testing Library (for hooks)

**Example**:
```typescript
// __tests__/utils/hash.test.ts
import { generateSimulationHash } from '@/lib/utils/hash';

describe('generateSimulationHash', () => {
  it('produces same hash for same config', () => {
    const config = { seed: 'test', contractAddress: '0x123' };
    const hash1 = generateSimulationHash(config);
    const hash2 = generateSimulationHash(config);
    expect(hash1).toBe(hash2);
  });

  it('produces different hash for different config', () => {
    const config1 = { seed: 'test1', contractAddress: '0x123' };
    const config2 = { seed: 'test2', contractAddress: '0x123' };
    const hash1 = generateSimulationHash(config1);
    const hash2 = generateSimulationHash(config2);
    expect(hash1).not.toBe(hash2);
  });
});
```

### Integration Tests (15%)

**What to Test**:
- API client with mocked backend
- WebSocket connection handling
- Store + API interactions

**Tools**:
- MSW (Mock Service Worker)
- Jest

**Example**:
```typescript
// __tests__/api/simulations.test.ts
import { apiClient } from '@/lib/api/client';
import { server } from '../mocks/server';

describe('Simulation API', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('starts simulation successfully', async () => {
    const config = { /* valid config */ };
    const response = await apiClient.startSimulation(config);
    expect(response.runId).toBeDefined();
    expect(response.seed).toBeDefined();
  });

  it('handles start errors', async () => {
    const config = { /* invalid config */ };
    await expect(
      apiClient.startSimulation(config)
    ).rejects.toThrow('Invalid configuration');
  });
});
```

### E2E Tests (5%)

**What to Test**:
- Critical user flows end-to-end
- Full simulation lifecycle

**Tools**:
- Playwright

**Example**:
```typescript
// e2e/simulation-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete simulation flow', async ({ page }) => {
  // 1. Load app
  await page.goto('http://localhost:3000');

  // 2. Enter contract
  await page.fill('[data-testid="contract-input"]', '0x123...');

  // 3. Upload ABI
  await page.setInputFiles('[data-testid="abi-upload"]', 'test-abi.json');

  // 4. Configure simulation
  await page.click('[data-testid="archetype-whale"]');
  await page.fill('[data-testid="wallet-count"]', '10');

  // 5. Start
  await page.click('[data-testid="start-button"]');

  // 6. Wait for running status
  await expect(page.locator('[data-testid="status"]')).toHaveText('Running');

  // 7. Verify wallet grid appears
  await expect(page.locator('[data-testid="wallet-grid"]')).toBeVisible();

  // 8. Stop
  await page.click('[data-testid="stop-button"]');

  // 9. Verify stopped
  await expect(page.locator('[data-testid="status"]')).toHaveText('Stopped');
});
```

---

## 📈 Progress Tracking

### Checklist Format

Use this section to track progress as implementation proceeds.

#### Phase 1: Foundation ⏳

- [ ] Next.js project setup
- [ ] TailwindCSS configuration
- [ ] Folder structure created
- [ ] Layout components (empty)
- [ ] TypeScript types defined
- [ ] Zustand stores initialized
- [ ] Dev server running

**Status**: Not Started
**Estimated Time**: 1 week
**Blocked By**: None

---

#### Phase 2: Configuration UI ⏳

- [ ] ContractAddressInput
- [ ] ABIUploader
- [ ] ABIValidator
- [ ] FunctionSelector
- [ ] NetworkSelector
- [ ] WalletGroupSelector
- [ ] ArchetypeConfig
- [ ] DurationConfig
- [ ] Wire to configStore

**Status**: Not Started
**Estimated Time**: 1 week
**Blocked By**: Phase 1

---

#### Phase 3: API Integration ⏳

- [ ] API client module
- [ ] REST endpoints
- [ ] WebSocket client
- [ ] Custom hooks
- [ ] Error handling
- [ ] Loading states

**Status**: Not Started
**Estimated Time**: 1 week
**Blocked By**: Phase 2

---

#### Phase 4: Live Visualization ⏳

- [ ] WalletGrid
- [ ] TimelineView
- [ ] MetricsPanel
- [ ] EventLog
- [ ] WebSocket updates

**Status**: Not Started
**Estimated Time**: 1 week
**Blocked By**: Phase 3

---

#### Phase 5: Execution Controls ⏳

- [ ] Start/Pause/Stop buttons
- [ ] Replay functionality
- [ ] Hash generation
- [ ] Config snapshots

**Status**: Not Started
**Estimated Time**: 1 week
**Blocked By**: Phase 4

---

#### Phase 6: Result Inspection ⏳

- [ ] WalletDetailModal
- [ ] TransactionDetailModal
- [ ] Export functionality
- [ ] Error viewer

**Status**: Not Started
**Estimated Time**: 1 week
**Blocked By**: Phase 5

---

#### Phase 7: Polish & UX ⏳

- [ ] Dark mode
- [ ] Loading states
- [ ] Animations
- [ ] Performance optimization

**Status**: Not Started
**Estimated Time**: 1 week
**Blocked By**: Phase 6

---

#### Phase 8: Testing & Docs ⏳

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Documentation

**Status**: Not Started
**Estimated Time**: 1 week
**Blocked By**: Phase 7

---

## 🎯 Success Metrics

### How We'll Know It's Done

#### Functional Metrics

- [ ] Can configure a simulation in < 2 minutes
- [ ] Can start a simulation with 1 click
- [ ] Receives real-time updates < 500ms latency
- [ ] Can identify failing wallets in < 10 seconds
- [ ] Can replay any simulation deterministically
- [ ] Can export data in JSON + CSV
- [ ] Works with 100 wallets without lag

#### Technical Metrics

- [ ] Test coverage > 80%
- [ ] Build time < 30 seconds
- [ ] Page load < 2 seconds
- [ ] WebSocket reconnects automatically
- [ ] No memory leaks after 1 hour
- [ ] Bundle size < 500kb (gzipped)

#### User Experience Metrics

- [ ] New developer can set up in < 10 minutes
- [ ] UI is intuitive (no docs needed for basic flow)
- [ ] Dark mode is readable
- [ ] Responsive on tablet/desktop
- [ ] Keyboard shortcuts work
- [ ] Accessibility score > 90

---

## 📚 References & Resources

### Documentation Links

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [WebSocket API MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

### Design Inspiration

- [Grafana](https://grafana.com/) - Monitoring dashboards
- [Tenderly](https://tenderly.co/) - Smart contract debugging
- [Alchemy](https://www.alchemy.com/) - Developer tools
- [Etherscan](https://etherscan.io/) - Block explorer

### Libraries to Consider

- [recharts](https://recharts.org/) - If we need simple charts
- [react-virtualized](https://github.com/bvaughn/react-virtualized) - Virtual scrolling
- [react-hot-toast](https://react-hot-toast.com/) - Notifications
- [cmdk](https://cmdk.paco.me/) - Command palette (for keyboard shortcuts)

---

## 🚀 Getting Started (When Ready to Code)

### Prerequisites

```bash
node >= 18.0.0
npm >= 9.0.0
```

### Installation

```bash
# Clone repo (or create new Next.js app)
npx create-next-app@latest wallet-farm-simulator --typescript --tailwind --app

# Install dependencies
cd wallet-farm-simulator
npm install zustand @tanstack/react-query

# Start dev server
npm run dev
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

### First Commit

```bash
git add .
git commit -m "feat: Initialize Wallet Farm Simulator frontend"
```

---

## 📞 Questions & Decisions Log

### Open Questions

1. **Q**: Should we support importing wallet private keys?
   **A**: TBD - discuss security implications

2. **Q**: How many historical simulations should we store?
   **A**: TBD - consider localStorage limits

3. **Q**: Should we add CSV upload for bulk config?
   **A**: TBD - depends on user feedback

### Decisions Made

1. **✅ DECIDED**: Use Zustand over Redux
   - Reason: Simpler, less boilerplate, great TypeScript support

2. **✅ DECIDED**: Use WebSockets over polling
   - Reason: Real-time updates are critical, backend already supports it

3. **✅ DECIDED**: No authentication for MVP
   - Reason: Internal tool, add auth in v2 if needed

---

## 🏁 Conclusion

This document provides a **complete blueprint** for building the Wallet Farm Visual Simulator frontend. It includes:

✅ Full feature breakdown
✅ Component architecture
✅ State management model
✅ API contracts
✅ UI/UX flows
✅ Data models
✅ Implementation phases
✅ Testing strategy
✅ Progress tracking

**Next Steps**:
1. Review this document with the team
2. Get approval on technical decisions
3. Set up the Next.js project
4. Start Phase 1 implementation

**Expected Timeline**: 8 weeks to MVP

**Ready to build!** 🚀
