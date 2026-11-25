# MR review rules: <project name>

<!--
Copy this file to `.kiro/mr-review.md` at the root of each repo and fill it in.
/mr-review reads it before every review, and these rules override the generic checklist.
Delete any section you don't need. Keep it short: rules, not essays.
-->

## Stack
- React <version>, TypeScript <version>, React Compiler: on/off
- Data layer: <TanStack Query / RTK Query / …>
- Styling: <CSS Modules / Tailwind / styled-components / …>
- Design system: <package name>. Always use its components for <buttons, inputs, modals, …>
- Grid/charts: <ag-Grid vX / Highcharts / custom canvas / …>
- Tests: <Vitest + RTL / Jest>, e2e: <Playwright / Cypress / none>, Storybook: yes/no
- Base branch: master (change if different)

## Commands
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Related tests: `pnpm vitest related <files> --run`

## House rules (always flag)
- <e.g. no direct imports from `@company/ds/internal/*`>
- <e.g. all money formatted via `formatCurrency()` from `src/lib/format`>
- <e.g. new routes must be lazy-loaded>

## Known exceptions (never flag)
- <e.g. `src/legacy/**` is frozen; only review for bugs>
- <e.g. generated files: `src/api/generated/**`>
- <e.g. index keys are fine in `StaticList` (never reorders)>

## Severity overrides
- <e.g. missing Storybook story = should fix, not nit>
- <e.g. any a11y issue in `src/components/ds/**` = blocking>

## Review etiquette for this team
- <e.g. team uses Conventional Comments; keep nits to 3; tag @owner on design-system changes>

