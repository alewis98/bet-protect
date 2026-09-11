# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

static HTML/CSS/JavaScript

## Users

The primary user is someone who uses multiple sportsbook and/or prediction-market apps and wants to compare opposing bets across them.

## Product Purpose

The product is a static client-side calculator for discovering and sizing two-outcome arbitrage opportunities, including opportunities created or improved by profit boosts. It should answer whether a mathematical arbitrage exists, how much to stake on each side, the guaranteed profit under either outcome, the ROI, and which rule differences could invalidate the apparent opportunity.

## Positioning

The product combines opposing odds, profit-boost mechanics, stake limits, bankroll limits, rounding, and settlement-risk checks in one transparent calculation. It distinguishes mathematical arbitrage from real-world settlement compatibility instead of treating every positive calculation as automatically risk-free.

## Operating Context

Users manually enter information from two sportsbooks or prediction-market apps, calculate an opportunity in the browser, and use the resulting stakes and warnings to decide whether to place bets. The first version has no accounts, backend, database, sportsbook login, scraping, live odds feed, or automatic wager placement. Inputs may optionally persist locally in the browser.

## Capabilities and Constraints

- Support two sportsbooks, two mutually exclusive outcomes, American and decimal odds, profit boosts on either or both bets, maximum boosted wager amounts, maximum total stake, and stake rounding increments.
- Calculate effective boosted odds, arbitrage percentage, optimal constrained stake allocation, outcome payouts, guaranteed profit, and ROI.
- Recalculate results after rounding and never display theoretical profit when the rounded stakes change the outcome.
- Show warnings for mismatched event or market rules, overtime, push, cancellation/postponement, player participation, boost eligibility, and other settlement differences.
- Validate invalid or suspicious odds, boost, and stake inputs without silently correcting them.
- Version one excludes automatic sportsbook integration, accounts, persistent server-side storage, parlays, three-way markets, complex free-bet conversion, insurance promotions, and non-returned-stake bet credits.
- Keep the calculation engine pure and independent from the interface so it can be tested and reused later.

## Evidence on Hand

The primary product specification is [Sportsbook Profit-Boost Arbitrage Calculator — System Design.md](Sportsbook%20Profit-Boost%20Arbitrage%20Calculator%20%E2%80%94%20System%20Design.md). It defines the first-version scope, formulas, constrained optimization approach, validation warnings, example flow, security posture, and testing strategy. There is currently no implemented UI, brand asset set, user research, testimonial, or live sportsbook data source; future work must not fabricate any of these.

## Product Principles

- Make the math transparent and inspectable.
- Treat constraints and rounding as part of the result, not an afterthought.
- Separate mathematical opportunity from real-world settlement risk.
- Keep the first version private-by-default and free of credentials or server-side dependencies.
- Prefer deterministic, testable calculations over opaque automation.

## Accessibility & Inclusion

No product-specific accessibility standard has been confirmed yet. The interface should remain usable on desktop and mobile, with the mobile layout stacking sections vertically as specified in the system design.
