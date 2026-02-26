# Email Sync Issue - February 25, 2026

## Problem
When clicking "Email Sync" in the navigation, the app redirected to the Dashboard instead of displaying the Email Sync page.

## Root Cause
React Router was matching `/email-sync` against the root path `/` first (since `/email-sync` starts with `/`), causing it to render the Dashboard component instead.

## Solution
Reordered the routes in `frontend/src/App.jsx` to place `/email-sync` before `/`:

```jsx
// Before (broken)
<Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
...
<Route path="/email-sync" element={<PrivateRoute><EmailSync /></PrivateRoute>} />

// After (fixed)
<Route path="/email-sync" element={<PrivateRoute><EmailSync /></PrivateRoute>} />
<Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
```

## Feature Status
- OAuth2 authentication flow implemented
- Azure AD app registered with credentials in `.env`
- Frontend and backend routes configured
- Route ordering fixed

## Next Steps
1. Test OAuth flow at http://localhost:3000/email-sync
2. Connect Microsoft account
3. Run "Sync Now" to import assignments
4. Verify tasks appear on dashboard
