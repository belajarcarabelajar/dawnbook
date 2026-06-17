# Admin Dashboard Audit

## Files Inspected

- `apps/admin/package.json`
- `apps/admin/vite.config.ts`
- `apps/admin/index.html`
- `apps/admin/src/main.tsx`
- `apps/admin/src/App.tsx`
- `apps/admin/src/App.css`
- `apps/admin/src/index.css`
- `apps/admin/src/services/bookService.ts`

## Findings

| File | Line / Symbol | Category | Severity | Description | Recommended Fix |
|---|---|---|---|---|---|
| `apps/admin/src/App.tsx` | Line 2 | Authentication Correctness | Major | Application imports authentication components from the deprecated `@clerk/clerk-react` package. | Migrate imports to `@clerk/react`. |
| `apps/admin/src/App.tsx` | Line 7, `PUBLISHABLE_KEY` | Security | Major | Clerk publishable key is hardcoded directly in the source file using a placeholder. | Remove hardcoded constant. Set `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local` so it is automatically consumed by the SDK. |
| `apps/admin/src/App.tsx` | Lines 19-25, 134-149 | Authentication Correctness | Major | Usage of deprecated `<SignedIn>` and `<SignedOut>` components for conditional rendering. | Replace `<SignedIn>` / `<SignedOut>` with `<Show when="signed-in">` / `<Show when="signed-out">`. |
| `apps/admin/src/App.tsx` | Line 127 | Authentication Correctness | Major | `<ClerkProvider>` is wrapped around `BrowserRouter` inside `App`, preventing global context access across the whole tree before routing. | Move `<ClerkProvider>` to `main.tsx` wrapping the `<App />` component. |
| `apps/admin/src/services/bookService.ts` | `BookService` | Stubbed Code | Minor | The entire `BookService` relies on stubbed data, `console.log`, and simulated timeouts. | Implement backend endpoints or filesystem access to replace the mock implementations. |
| `apps/admin/src/App.tsx` | Line 1 | Code Quality | Minor | `useNavigate` is imported from `react-router-dom` but never used. | Remove the unused `useNavigate` import to prevent linter warnings. |
| `apps/admin/src/App.tsx` | Line 4 | Type Safety | Minor | `Book` is imported without `type` modifier causing TS1484 errors under `verbatimModuleSyntax`. | Add `type` modifier to the `Book` import. |

## Clerk Changes Applied

- **Step 3**: Installed `@clerk/react@latest` and removed the deprecated `@clerk/clerk-react` dependency in `apps/admin/package.json`.
- **Step 4**: Created `apps/admin/.env.local` containing `VITE_CLERK_PUBLISHABLE_KEY=pk_test_placeholder_key_here` so the key is safely managed in the environment.
- **Step 5**: Moved `<ClerkProvider afterSignOutUrl="/">` to `apps/admin/src/main.tsx` to wrap the entire app correctly without manually passing the `publishableKey` prop.
- **Step 6**: Removed the hardcoded `PUBLISHABLE_KEY` constant and manual `publishableKey` prop wiring in `apps/admin/src/App.tsx`.
- **Step 7**: Replaced deprecated `<SignedIn>` and `<SignedOut>` wrappers in `apps/admin/src/App.tsx` with `<Show when="signed-in">` and `<Show when="signed-out">`. Added `<SignUpButton>` next to the sign-in button.
- **Step 8**: Updated all Clerk imports in `apps/admin/src/App.tsx` to exclusively originate from `@clerk/react`.
