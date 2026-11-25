# UI review checklist (React + TypeScript)

Apply these in priority order. Project rules in `.kiro/mr-review.md` override anything here. Each item says what to look for; the *why* is in brackets where it isn't obvious.

---

## 1. Behaviour and correctness

**UI states.** Every async or data-driven view handles all of these:
- [ ] Loading: no layout jump when data arrives; skeleton or reserved space.
- [ ] Empty: zero results, a new user, a filtered-to-nothing list.
- [ ] Error: a message the user can act on, plus retry where it makes sense. No blank screen, and no `console.error` as the only handling.
- [ ] Partial or stale: refetching while showing old data, pagination edges.
- [ ] Extreme content: very long text or numbers, missing optional fields, 1 item vs 1,000.

**Effects and async.**
- [ ] `useEffect` dependency arrays are complete. No `eslint-disable` for `exhaustive-deps` without a comment explaining why.
- [ ] Effects aren't used for derived data or event handling. [Compute in render, or do it in the handler; see "You Might Not Need an Effect".]
- [ ] Async work in effects is cancelled or ignored on unmount and on dependency change (`AbortController`, an `ignore` flag). [Prevents stale responses overwriting fresh ones.]
- [ ] Subscriptions, timers, observers and listeners are cleaned up.
- [ ] Server state goes through the project's data layer (TanStack Query, RTK Query, SWR, etc.), not hand-rolled `useState` + `useEffect` + `fetch`.

**State.**
- [ ] No duplicated or synced state that could be derived from props or other state.
- [ ] State lives as low as possible. It's lifted only when siblings need it.
- [ ] No switching between controlled and uncontrolled inputs (`value` flipping between a value and `undefined`).
- [ ] List `key`s are stable IDs, not the array index, for lists that reorder, filter or insert.
- [ ] Objects and arrays in state are updated immutably.
- [ ] URL-worthy state (filters, tabs, pagination, selected item) is in the URL if users would expect to share or refresh it.

**Interaction.**
- [ ] Double submit is prevented (button disabled or pending, or the request is idempotent).
- [ ] Destructive actions are confirmed or undoable.
- [ ] Optimistic updates roll back on failure.
- [ ] Debounced or throttled inputs flush or cancel correctly on unmount.

## 2. Accessibility (WCAG 2.2 AA)

- [ ] **Semantic elements first.** `<button>` for actions, `<a href>` for navigation. A `div`/`span` with `onClick` is a blocking issue unless it has a role, `tabIndex` and key handlers, and even then, prefer the native element.
- [ ] **Accessible names.** Every interactive control has one. Icon-only buttons have `aria-label`. Inputs have an associated `<label>` (a placeholder is not a label).
- [ ] **Keyboard.** Everything works with Tab, Shift+Tab, Enter, Space, Escape and arrow keys where the pattern expects them. Tab order is logical. No positive `tabIndex`.
- [ ] **Focus.** Focus is always visible (no `outline: none` without a replacement). Modals, drawers and popovers trap focus, close on Escape, and **return focus** to the trigger. After route changes and deletions, focus lands somewhere sensible.
- [ ] **ARIA.** Used only when native semantics can't do the job. Roles match the WAI-ARIA Authoring Practices patterns (combobox, tabs, menu, grid). No `aria-hidden` on focusable content.
- [ ] **Forms.** Errors are tied to fields (`aria-describedby`, `aria-invalid`), announced, and not shown only in colour. Required fields are marked. `autocomplete` and the right `type`/`inputMode` are set.
- [ ] **Dynamic updates.** Toasts, async results and validation summaries use a live region where they need announcing.
- [ ] **Colour and contrast.** Text is at least 4.5:1 (3:1 for large text and UI components). Information isn't conveyed by colour alone; for red/green P&L-style values, add a sign, icon or text.
- [ ] **Motion.** Non-essential animation respects `prefers-reduced-motion`.
- [ ] **Targets.** Pointer targets are at least 24×24 CSS px, or have enough spacing (WCAG 2.2 SC 2.5.8).
- [ ] **Images.** Meaningful images have descriptive `alt`. Decorative images use `alt=""`.
- [ ] **Structure.** Heading levels don't skip. Landmarks (`main`, `nav`) are present on new pages. The page `<title>` updates on route change.

## 3. TypeScript

- [ ] No new `any`. Use `unknown` and narrow it. No `as` casts that lie: casting API responses without validation, or `as unknown as X`.
- [ ] No non-null `!` assertions unless the invariant is obvious from adjacent code.
- [ ] No `@ts-ignore`. A `@ts-expect-error` needs a reason comment.
- [ ] Discriminated unions for UI state (`{ status: 'loading' } | { status: 'error'; error } | { status: 'success'; data }`) instead of several booleans that can contradict each other.
- [ ] Exhaustive `switch`/`if` over unions (a `never` check).
- [ ] Props types are precise: optional means really optional, no boolean prop explosion (use a variant union), and children are typed when they're constrained.
- [ ] API types come from the schema or codegen, or are validated at the boundary (zod/valibot), not hand-written and assumed.
- [ ] Exported types and props of shared components are stable. Breaking changes are called out.

## 4. React patterns and architecture

- [ ] Components have one responsibility. A component of more than about 250 lines, or with mixed data fetching, business logic and markup, should be split, or its logic pulled into a hook.
- [ ] Reusable logic lives in custom hooks named `useX`. Hooks are called unconditionally.
- [ ] No prop drilling through more than about 3 layers. Context isn't used for frequently-changing values that many consumers read (re-render storm); split the context or use a store with selectors.
- [ ] Components aren't defined inside other components. [They remount on every render and lose state.]
- [ ] **Memoisation is justified.** If the React Compiler is on, manual `useMemo`/`useCallback`/`memo` is usually unnecessary; flag new ones. If it's off, memoise only where it's measured, or where referential stability matters (deps of effects, props to `memo` children, context values).
- [ ] An error boundary protects new routes and widgets that can fail independently.
- [ ] Lazy loading (`React.lazy` + `Suspense`) is used for heavy, rarely-used routes and components, with a sensible fallback.
- [ ] New code follows the folder and naming conventions of the surrounding code, not a new pattern introduced silently.

## 5. Performance

- [ ] **Re-renders in hot paths.** Typing, scrolling, hover and real-time ticks don't re-render large subtrees. Watch for inline objects and functions passed to memoised children, and context values recreated every render.
- [ ] **Lists and tables.** More than about 100 rows, or unbounded data, is virtualised (or uses the grid's own virtualisation). Row components are cheap.
- [ ] **Expensive work** (sort, filter, aggregate, format thousands of cells) isn't redone every render.
- [ ] **Real-time and high-frequency data.** Updates are batched (rAF or throttle), not a `setState` per message. Charts at high frequency should consider canvas over SVG/DOM.
- [ ] **Bundle.** New dependencies are justified. Check their size and whether something in the repo already does the job. Imports are tree-shakeable (no `import _ from 'lodash'`, no whole icon packs). Heavy libraries are lazy-loaded.
- [ ] **Layout.** No layout thrashing (reading layout then writing styles in a loop). Images and media have dimensions or an aspect ratio. [Avoids CLS.]
- [ ] **Network.** No request waterfalls that could run in parallel. Polling intervals are sane and stop when the view is hidden or unmounted. Caching and stale times are deliberate.
- [ ] **Core Web Vitals impact.** Consider LCP for above-the-fold changes, INP for handlers with heavy synchronous work, and CLS for late-arriving content.

## 6. Styling and design system

- [ ] Uses existing design-system components and tokens (colour, spacing, typography, radius, z-index, breakpoints) rather than hard-coded hex values, px or ad-hoc components that duplicate DS ones.
- [ ] No `!important` and no specificity wars. No global CSS leaking from a component. Styles follow the project's approach (modules, utility classes, CSS-in-JS); don't mix.
- [ ] Responsive at the project's breakpoints. Nothing overflows at 320px width or at 200% zoom.
- [ ] Text truncation and wrapping are handled (ellipsis plus tooltip or title for truncated values in dense UIs).
- [ ] Theming (dark mode, high contrast) still works if the project supports it.
- [ ] Logical properties (`margin-inline-start`) are used if the project supports RTL.
- [ ] Inline `style` is only for truly dynamic values.
- [ ] Focus, hover, active and disabled states exist for new interactive elements.

## 7. Content, i18n and formatting

- [ ] No hard-coded user-facing strings if the project uses i18n. Pluralisation is handled by the i18n library, not by `count === 1 ? … : …`.
- [ ] Numbers, currency, percentages and dates use `Intl` or the project's formatters, with the right locale, precision and timezone. Don't format money with float arithmetic or `toFixed` on values that matter.
- [ ] Copy is clear and consistent with existing terminology, and error messages say what to do next.

## 8. Security and privacy

- [ ] No `dangerouslySetInnerHTML` with unsanitised input. User-supplied URLs are validated (no `javascript:` hrefs).
- [ ] No secrets, tokens or internal URLs in client code, env vars exposed to the bundle, or logs.
- [ ] No PII in analytics events, logs, error reports or URLs.
- [ ] Auth tokens aren't put in `localStorage` unless that's the project's deliberate pattern.
- [ ] Authorisation isn't enforced only in the UI. Hiding a button is not access control; flag it if the server-side check isn't evident.

## 9. Tests

- [ ] New logic and new UI states (error, empty, edge cases) have tests. Bug fixes include a regression test.
- [ ] Testing Library queries by **role/label/text** (`getByRole('button', { name: /save/i })`), not by test IDs or class names unless there's no accessible handle.
- [ ] `user-event` is used over `fireEvent`. Async UI uses `findBy*`/`waitFor`, never arbitrary `setTimeout` sleeps.
- [ ] Network is mocked at the boundary (MSW) rather than by mocking internal hooks.
- [ ] Tests assert behaviour the user sees, not implementation details (internal state, call counts on private functions).
- [ ] No large snapshot tests as the only coverage. Snapshot updates in the diff were intended.
- [ ] Storybook stories (if used) are added or updated for new components and states. Visual regression baselines were changed on purpose.
- [ ] Critical user flows touched by the change have e2e coverage (Playwright/Cypress) if the project has it.

## 10. Hygiene and MR quality

- [ ] No `console.log`/`debugger`, no commented-out code, and no unrelated changes or drive-by refactors mixed in (suggest a separate MR).
- [ ] TODOs reference a ticket.
- [ ] Feature flags are used for risky or partial features, and a removal plan exists for old flags.
- [ ] Dependency changes are intentional: lockfile changes match `package.json`, there are no duplicate versions of React or the design system, and licences are acceptable.
- [ ] Names say what things are (`isPriceStale`, not `flag2`). Comments explain *why*, not *what*.
- [ ] The MR description explains the why, includes screenshots or recordings for visual changes, notes testing done, and mentions breaking changes or migration steps.

---

## Domain add-on: data-dense and financial UIs

Apply when the change touches grids, blotters, pricing, charts or real-time data:
- [ ] Numeric columns are right-aligned with tabular figures (`font-variant-numeric: tabular-nums`), and decimal precision is consistent per instrument or field.
- [ ] Positive and negative values aren't shown by colour alone. Stale or ticking values are visually distinguishable and accessible.
- [ ] Grid configs (column defs, `getRowId`, value getters and formatters) are memoised or stable. Row identity is by ID so updates don't remount rows.
- [ ] Transaction or delta updates are used instead of replacing the full row data on every tick.
- [ ] Sorting and filtering on formatted values uses the raw value, not the display string.
- [ ] Keyboard navigation inside the grid still works with custom cell renderers and editors.
