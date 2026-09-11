# Sportsbook Profit-Boost Arbitrage Calculator

## 1. Goal

Build a static web application that helps a user calculate whether two opposing sportsbook bets, potentially using profit boosts, can be combined to create a guaranteed profit.

The application should answer four questions:

1. Does an arbitrage opportunity exist?
2. How much should the user wager on each side?
3. What is the guaranteed profit under either outcome?
4. Are there any constraints or rule differences that could invalidate the apparent arbitrage?

The first version should require no backend, accounts, database, or sportsbook integration.

---

## 2. Scope

### In scope for v1

The app supports:

- Two sportsbooks.
- Two mutually exclusive outcomes.
- American and decimal odds.
- Profit boosts on either or both bets.
- Maximum boosted wager amounts.
- Maximum total stake.
- Stake rounding, such as nearest $0.01, $0.10, or $1.
- Calculation of:
  - effective boosted odds,
  - optimal stake allocation,
  - payout for each outcome,
  - guaranteed profit,
  - ROI,
  - arbitrage percentage.
- Warnings for common rule mismatches.

Examples:

- Team A moneyline vs Team B moneyline.
- Over vs Under.
- Yes vs No.
- Player to achieve X vs player not to achieve X, assuming settlement rules are identical.

### Out of scope for v1

Do not initially support:

- Automatic sportsbook login.
- Automatic wager placement.
- Scraping sportsbooks.
- Live odds feeds.
- User accounts.
- Persistent server-side storage.
- Parlays.
- Three-way markets such as soccer Win/Draw/Loss.
- Complex free-bet conversion.
- Insurance promotions.
- Bet credits where the stake is not returned.

Those can be separate future modules.

---

# 3. High-Level Architecture

The system can be implemented as a fully static client-side application.

```text
+---------------------------------------+
|              Browser                  |
|                                       |
|  +---------------------------------+  |
|  | UI / Form Layer                 |  |
|  |                                 |  |
|  | Book A inputs                   |  |
|  | Book B inputs                   |  |
|  | Boost settings                  |  |
|  | Stake constraints               |  |
|  +---------------+-----------------+  |
|                  |                    |
|                  v                    |
|  +---------------------------------+  |
|  | Calculation Engine              |  |
|  |                                 |  |
|  | Odds conversion                 |  |
|  | Boost conversion                |  |
|  | Arbitrage detection             |  |
|  | Stake optimization              |  |
|  | Profit calculation              |  |
|  +---------------+-----------------+  |
|                  |                    |
|                  v                    |
|  +---------------------------------+  |
|  | Validation / Risk Engine        |  |
|  |                                 |  |
|  | Rule mismatch warnings          |  |
|  | Stake-limit warnings            |  |
|  | Rounding verification           |  |
|  +---------------+-----------------+  |
|                  |                    |
|                  v                    |
|  +---------------------------------+  |
|  | Results UI                      |  |
|  |                                 |  |
|  | Bet A stake                     |  |
|  | Bet B stake                     |  |
|  | Guaranteed profit               |  |
|  | ROI                             |  |
|  | Outcome payout table            |  |
|  +---------------------------------+  |
+---------------------------------------+
```

Recommended deployment:

```text
GitHub Repository
        |
        v
Vercel / Netlify / GitHub Pages
        |
        v
Static HTML/CSS/JavaScript application
```

---

# 4. Suggested Technology Stack

A simple implementation can use:

- TypeScript
- React
- Vite
- CSS or Tailwind CSS
- Vitest for calculation-engine tests

React is not technically necessary, but it makes the UI and form state easy to maintain.

An even simpler implementation could use plain HTML, CSS, and JavaScript.

Recommended project structure:

```text
src/
├── components/
│   ├── BetInput.tsx
│   ├── BoostInput.tsx
│   ├── ResultsCard.tsx
│   ├── OutcomeTable.tsx
│   └── WarningPanel.tsx
│
├── calculator/
│   ├── odds.ts
│   ├── boosts.ts
│   ├── arbitrage.ts
│   ├── optimizer.ts
│   └── profit.ts
│
├── validation/
│   ├── inputValidation.ts
│   └── marketRules.ts
│
├── types/
│   └── betting.ts
│
├── App.tsx
└── main.tsx

tests/
├── odds.test.ts
├── boosts.test.ts
├── arbitrage.test.ts
└── optimizer.test.ts
```

The calculation code should be kept separate from the React components.

That makes the math easy to test and allows it to be reused later in a mobile app or backend service.

---

# 5. Core Data Model

A bet can be represented as:

```ts
type Bet = {
  sportsbook: string;
  outcomeName: string;

  oddsFormat: "american" | "decimal";
  odds: number;

  boostPercent: number;

  maxBoostedStake?: number;
  maxStake?: number;
};
```

The calculation request:

```ts
type ArbitrageRequest = {
  betA: Bet;
  betB: Bet;

  totalBankroll?: number;

  roundingIncrement: number;
};
```

The calculation result:

```ts
type ArbitrageResult = {
  effectiveOddsA: number;
  effectiveOddsB: number;

  stakeA: number;
  stakeB: number;

  totalStake: number;

  payoutIfA: number;
  payoutIfB: number;

  profitIfA: number;
  profitIfB: number;

  guaranteedProfit: number;

  roiPercent: number;

  arbitrageExists: boolean;

  warnings: string[];
};
```

---

# 6. Odds Conversion

Internally, all calculations should use decimal odds.

American odds should be converted immediately after input.

For positive American odds:

```text
decimal = 1 + american / 100
```

Example:

```text
+200

1 + 200 / 100
= 3.00
```

For negative American odds:

```text
decimal = 1 + 100 / abs(american)
```

Example:

```text
-150

1 + 100 / 150
= 1.6667
```

---

# 7. Profit Boost Logic

This is an important implementation detail.

A sportsbook's profit boost generally applies to the profit portion of the wager rather than the returned stake.

Let:

```text
D = decimal odds
B = boost percentage as decimal
```

Original profit multiplier:

```text
D - 1
```

Boosted profit multiplier:

```text
(D - 1) × (1 + B)
```

Effective boosted decimal odds:

```text
effectiveOdds =
1 + (D - 1) × (1 + B)
```

Example:

```text
Original odds: +200
Decimal odds: 3.00

Profit multiplier:
3.00 - 1 = 2.00

20% boost:
2.00 × 1.20 = 2.40

Effective decimal odds:
1 + 2.40 = 3.40
```

The calculation engine should operate entirely on effective decimal odds after this step.

---

# 8. Arbitrage Detection

For a two-outcome market with decimal odds:

```text
Oa = effective odds for outcome A
Ob = effective odds for outcome B
```

Calculate:

```text
arbScore =
1 / Oa +
1 / Ob
```

An arbitrage exists when:

```text
arbScore < 1
```

Example:

```text
Book A: 2.20
Book B: 2.10

1 / 2.20 = 0.4545
1 / 2.10 = 0.4762

Total = 0.9307
```

Because:

```text
0.9307 < 1
```

an arbitrage exists.

Approximate arbitrage margin:

```text
1 - arbScore
```

In this example:

```text
1 - 0.9307
= 6.93%
```

---

# 9. Basic Stake Allocation

Assume a total stake:

```text
T
```

The goal is to make the payout approximately equal regardless of which bet wins.

Stake A:

```text
stakeA =
T × (1 / Oa)
──────────────
(1 / Oa) + (1 / Ob)
```

Stake B:

```text
stakeB =
T × (1 / Ob)
──────────────
(1 / Oa) + (1 / Ob)
```

These amounts produce approximately equal gross payouts.

---

# 10. Better Approach: Constrained Optimization

The simple formula is not sufficient once profit-boost limits are introduced.

Example:

```text
Book A:
+200
50% boost
maximum boosted stake = $25

Book B:
-180
20% boost
maximum boosted stake = $100
```

The mathematically ideal allocation might require:

```text
$70 on Book A
```

but only:

```text
$25
```

is eligible for the boost.

Therefore the calculation engine should treat stake allocation as an optimization problem.

The objective should be:

```text
maximize:

min(profitIfA, profitIfB)
```

subject to:

```text
stakeA >= 0
stakeB >= 0

stakeA <= maxStakeA
stakeB <= maxStakeB

stakeA <= maxBoostedStakeA
stakeB <= maxBoostedStakeB

stakeA + stakeB <= bankroll
```

For a two-variable static calculator, a full optimization library is unnecessary.

A simple deterministic algorithm is enough.

---

# 11. Recommended Optimization Algorithm

### Step 1

Calculate effective boosted odds.

### Step 2

Determine the maximum usable stake for each side.

```text
maxA = min(
  sportsbook maximum,
  boost maximum,
  bankroll
)

maxB = min(
  sportsbook maximum,
  boost maximum,
  bankroll
)
```

### Step 3

Determine which stake constraint binds first.

For each possible maximum stake on one side, compute the hedge required on the other side.

If:

```text
stakeA = maxA
```

then equal payout requires:

```text
stakeB =
stakeA × Oa / Ob
```

Likewise, if:

```text
stakeB = maxB
```

then:

```text
stakeA =
stakeB × Ob / Oa
```

Evaluate both feasible candidates.

### Step 4

Choose the candidate producing the highest minimum profit.

Conceptually:

```ts
score = Math.min(
  profitIfA,
  profitIfB
);
```

Select the allocation with the greatest score.

---

# 12. Rounding

Sportsbooks generally require monetary stakes to be rounded.

For example:

```text
$18.437
```

might become:

```text
$18.44
```

Rounding can destroy small arbitrage opportunities.

Therefore:

1. Calculate theoretical stakes.
2. Round them.
3. Recalculate both outcomes.
4. Verify that both remain profitable.

Never display the theoretical profit after rounding.

Always display the actual rounded result.

For very small margins, test nearby values:

```text
stake
stake + increment
stake - increment
```

and choose the combination producing the best guaranteed outcome.

---

# 13. Profit Calculation

For decimal odds:

```text
payout = stake × decimalOdds
```

If A wins:

```text
payoutIfA =
stakeA × Oa

profitIfA =
payoutIfA - stakeA - stakeB
```

If B wins:

```text
payoutIfB =
stakeB × Ob

profitIfB =
payoutIfB - stakeA - stakeB
```

Guaranteed profit:

```text
guaranteedProfit =
min(profitIfA, profitIfB)
```

ROI:

```text
ROI =
guaranteedProfit
────────────────
stakeA + stakeB
```

---

# 14. Example User Flow

The user sees:

```text
SPORTSBOOK A

Odds:
+180

Profit Boost:
30%

Max Boosted Bet:
$25


SPORTSBOOK B

Odds:
-145

Profit Boost:
20%

Max Boosted Bet:
$100
```

Then clicks:

```text
Calculate
```

The system returns:

```text
BET A

Sportsbook A
Stake: $25.00


BET B

Sportsbook B
Stake: $XX.XX


TOTAL STAKED
$XX.XX


GUARANTEED PROFIT
+$X.XX


ROI
X.XX%
```

Then show:

| Outcome | Gross Payout | Net Profit |
|---|---:|---:|
| A wins | $XX.XX | +$X.XX |
| B wins | $XX.XX | +$X.XX |

The minimum of those two profits should be prominently displayed.

---

# 15. Risk / Validation Layer

The software should not equate mathematical arbitrage with guaranteed real-world settlement.

Before showing a result as valid, display a short checklist.

Possible warnings include:

```text
Verify both wagers refer to exactly the same event.

Verify the two outcomes are mutually exclusive and exhaustive.

Verify overtime rules are identical.

Verify push rules are identical.

Verify cancellation/postponement rules are identical.

Verify player participation requirements are identical.

Verify profit boosts apply to the selected market.

Verify both boosted wagers remain eligible at the displayed stake.
```

For player props, especially warn about:

```text
DNP rules
minimum participation
stat corrections
void rules
```

The UI could distinguish:

```text
Mathematical arbitrage: YES

Settlement compatibility: USER MUST VERIFY
```

---

# 16. Input Validation

Inputs should reject:

```text
decimal odds <= 1
American odds between -100 and +100
negative boost percentages
negative stakes
NaN
infinite values
```

Also warn when:

```text
boost > 500%
```

or other implausible entries occur.

Do not silently correct suspicious data.

---

# 17. UI Layout

Recommended desktop layout:

```text
+--------------------------------------------------+
| Profit Boost Arbitrage Calculator                |
+--------------------------------------------------+

+----------------------+  +------------------------+
| BOOK A               |  | BOOK B                 |
|                      |  |                        |
| Sportsbook            |  | Sportsbook             |
| Odds                  |  | Odds                   |
| Boost                 |  | Boost                  |
| Max Boost Stake       |  | Max Boost Stake        |
+----------------------+  +------------------------+

             [ Calculate Opportunity ]

+--------------------------------------------------+
| GUARANTEED PROFIT                                |
|                                                  |
|                     $4.17                        |
|                     6.42% ROI                    |
+--------------------------------------------------+

+----------------------+  +------------------------+
| BET A                |  | BET B                  |
| $25.00               |  | $39.93                 |
+----------------------+  +------------------------+

+--------------------------------------------------+
| Outcome Analysis                                 |
+--------------------------------------------------+

+--------------------------------------------------+
| Settlement Warnings                              |
+--------------------------------------------------+
```

On mobile, stack everything vertically.

---

# 18. State Management

For v1, React local state is sufficient.

No Redux or external state library is necessary.

Example state:

```ts
const [betA, setBetA] = useState<Bet>(...);
const [betB, setBetB] = useState<Bet>(...);
const [result, setResult] = useState<ArbitrageResult | null>(null);
```

Optionally persist the user's last inputs using:

```text
localStorage
```

This allows sportsbook names and typical limits to survive refreshes without creating accounts.

---

# 19. Security

Because v1 is fully static:

```text
No passwords
No sportsbook credentials
No payment information
No private API keys
No server
No database
```

This substantially reduces security risk.

Avoid placing sportsbook API keys in frontend JavaScript if APIs are added later.

Any future private API integration should introduce a backend.

---

# 20. Testing Strategy

The calculation engine should receive significantly more testing than the UI.

Tests should cover:

### Odds conversion

```text
+100
+200
-110
-150
decimal odds
```

### Boost calculation

```text
0% boost
10% boost
20% boost
50% boost
100% boost
```

### Arbitrage detection

Test:

```text
clear arbitrage
exactly break-even
no arbitrage
```

### Constraints

Test:

```text
Book A max binds
Book B max binds
both maxes bind
bankroll binds
```

### Rounding

Test opportunities where:

```text
theoretical arb exists
```

but:

```text
rounded arb does not
```

### Numerical invariants

Useful automated checks include:

```text
stakeA >= 0
stakeB >= 0

stakeA <= allowedMaxA
stakeB <= allowedMaxB

totalStake = stakeA + stakeB

guaranteedProfit =
min(profitIfA, profitIfB)
```

---

# 21. Example Calculation API

The core engine should expose a single pure function:

```ts
calculateArbitrage(
  request: ArbitrageRequest
): ArbitrageResult
```

Internally:

```text
calculateArbitrage()

    ↓

normalizeOdds()

    ↓

applyProfitBoost()

    ↓

checkArbitrage()

    ↓

calculateStakeConstraints()

    ↓

optimizeStakeAllocation()

    ↓

roundStakes()

    ↓

recalculatePayouts()

    ↓

validateResult()

    ↓

return ArbitrageResult
```

Keeping this function pure makes testing straightforward.

---

# 22. Future Architecture

If the product later automatically searches for opportunities, the architecture changes.

```text
Sportsbook / Odds APIs
        |
        v
+-----------------------+
| Data ingestion        |
+-----------------------+
        |
        v
+-----------------------+
| Market normalization  |
+-----------------------+
        |
        v
+-----------------------+
| Market matcher        |
+-----------------------+
        |
        v
+-----------------------+
| Arbitrage scanner     |
+-----------------------+
        |
        v
+-----------------------+
| Opportunity database  |
+-----------------------+
        |
        v
+-----------------------+
| Web frontend          |
+-----------------------+
```

The difficult component would not actually be the arbitrage calculation.

It would be:

```text
market normalization + market matching
```

For example, these must be recognized as representing the same market:

```text
Los Angeles Lakers
LA Lakers
L.A. Lakers
Lakers
```

Similarly:

```text
LeBron James Over 27.5 Points
```

must only be compared against:

```text
LeBron James Under 27.5 Points
```

—not 26.5 or 28.5.

---

# 23. Potential v2 Features

Once the core calculator is reliable, useful additions would be:

- Save sportsbook presets.
- Save common boost types.
- Calculate multiple possible stake sizes.
- Show profit versus stake graph.
- Compare boosted versus unboosted arbitrage.
- Support three-way markets.
- Support free bets.
- Support bet credits.
- Support partial hedges.
- Optimize based on bankroll.
- Generate a bet-placement checklist.
- Accept copied sportsbook odds text.
- Detect opportunities automatically through an odds API.

---

# 24. Recommended Implementation Order

A developer could implement the project in this order:

1. Build odds conversion functions.
2. Build profit-boost calculation.
3. Build basic two-way arbitrage detection.
4. Build equal-payout stake calculation.
5. Add stake limits.
6. Add constrained optimization.
7. Add monetary rounding and revalidation.
8. Build unit tests.
9. Build input form.
10. Build results interface.
11. Add settlement-risk warnings.
12. Add localStorage.
13. Deploy as a static site.

The most important architectural principle is to keep:

```text
betting math
```

completely separate from:

```text
UI code
```

The calculation engine should work independently of React, HTML, or any sportsbook-specific implementation.

---

# 25. MVP Acceptance Criteria

The MVP is complete when a user can enter:

```text
Book A odds
Book A boost
Book A maximum boosted stake

Book B odds
Book B boost
Book B maximum boosted stake
```

and reliably receive:

```text
whether an arbitrage exists

exact stake at Book A

exact stake at Book B

total amount wagered

profit if A wins

profit if B wins

minimum guaranteed profit

ROI

relevant settlement warnings
```

The returned numbers must remain correct after sportsbook-valid monetary rounding.

That is enough to make the initial product genuinely useful while keeping the entire application small, testable, and deployable as a static website.