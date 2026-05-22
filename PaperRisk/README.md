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

## APK build

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

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
