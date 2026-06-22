# PaperRisk

PaperRisk is a mobile-first fake trading and casino simulation for personal use. It uses virtual money only.

## Tech Stack

- Expo SDK 55
- React Native
- TypeScript
- AsyncStorage for future local saves
- lucide-react-native for icons

## Development

```bash
npm install
npm run start
npm run web
npm run typecheck
```

## APK build (GitHub Actions)

Direct APK download:

[Download PaperRisk-latest.apk](https://github.com/svobodamatyass-hub/New-project-2/releases/download/android-latest/PaperRisk-latest.apk)

If the download is not ready yet:

1. Open repository: [New-project-2](https://github.com/svobodamatyass-hub/New-project-2)
2. Go to the `Actions` tab.
3. Run workflow `Build Android APK` (button `Run workflow`).
4. After the run finishes, open `Releases`.
5. Download `PaperRisk-latest.apk` from `PaperRisk Android APK`.
6. Install it on your phone.

You can still build locally with EAS if you want, but GitHub Actions is the easiest download path from git.

### Update the `android-latest` release asset after a new build

When you have a fresh APK and want the direct download link below to always serve the newest build, run:

```bash
./scripts/publish-android-latest.sh <path-to-apk>
```

Example:

```bash
./scripts/publish-android-latest.sh PaperRisk-release.apk
```

This replaces `PaperRisk-latest.apk` on release tag `android-latest` (uses `gh release upload --clobber`), so this URL always points to the latest file:

- https://github.com/svobodamatyass-hub/New-project-2/releases/download/android-latest/PaperRisk-latest.apk

## Product Direction

- Matte black minimalist UI
- Soft gray readable text
- Green for gains
- Red for losses and debt
- Muted gold for casino actions
- Local-first simulation with no real money

## Phases

1. Foundation: project setup, theme, app shell, primary screens, reusable UI components.
2. Economy: player state, cash, net worth, portfolio, debt, transaction history, local save.
3. Trading: buy/sell flow, positions, market simulation, asset details.
4. Loans: borrow/repay flow, increasing interest, risk states.
5. Casino MVP: slots connected to the player economy.
6. Casino Expansion: blackjack and roulette.
7. Polish: charts, animations, haptics, settings, import/export.

## Phase 1 Status

Done:

- App shell with bottom tabs
- Home, Market, Casino, and Wallet screens
- Centered mobile frame for web preview
- Dark matte theme tokens
- Reusable action buttons, badges, panels, stat tiles, asset rows, and mini trend visuals
- Initial fake assets and player seed state
- Expo config in dark mode
- TypeScript validation

## Phase 2 Status

In progress:

- Central game provider and reducer
- Local save and hydrate flow through AsyncStorage
- Borrow and repay state transitions
- Transaction history model
- Computed invested value and net worth selectors
- Amount selector, debt meter, save status UI, and safer reset flow

## Phase 3 Status

Started:

- Market trade panel
- Asset selection
- Share stepper
- Quick share presets and Max sell shortcut
- Order readiness status
- Price history chart in asset detail
- Automatic market ticks every 15 seconds
- Manual Move market action
- Portfolio panel inside Market
- Buy and sell reducer actions
- Portfolio positions with average cost
- Trade transaction history

## Phase 4 Status

Done:

- Interest charge calculation
- Manual interest step for time simulation
- Loan pressure labels
- Loan pressure panel
- Interest transactions in the activity feed
- Credit limit and remaining credit
- Time-to-next-interest label
- Overdue interest catch-up on game load

## Phase 5 Status

Started:

- Slots token wallet
- Token shop
- Low base win chance
- Pity chance bonus at +0.1% per losing spin
- Slots spin reducer action
- Casino transactions in the activity feed
