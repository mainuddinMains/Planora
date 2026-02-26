# Bug: Cannot Add Microsoft (Outlook/University) Email for Dashboard Assignments/Announcements

## Summary
Users cannot successfully add a Microsoft email account (Outlook/University account). Because the account is not linked/synced correctly, assignment and announcement items are not shown on the dashboard.

## Problem Statement
The Microsoft email integration flow appears to fail or not persist correctly, and dashboard data that depends on email sync remains empty.

## Steps To Reproduce
1. Sign in to Planora.
2. Go to the email sync/integration page.
3. Try to connect a Microsoft (Outlook/University) account.
4. Return to the dashboard after completing the flow.
5. Check assignments/announcements widgets.

## Expected Behavior
- Microsoft email source is added successfully.
- Sync runs and extracts assignment/announcement content.
- Dashboard displays the synced assignments and announcements.

## Actual Behavior
- Microsoft account is not added reliably (or appears connected but does not sync).
- Dashboard does not show assignment/announcement data from Microsoft email.

## Impact
- Users with university Outlook accounts cannot use a core Planora feature.
- Assignment and announcement visibility on the dashboard is incomplete.

## Suggested Investigation Areas
- OAuth callback and token persistence for Microsoft flow.
- Refresh token handling and expiry edge cases.
- Source creation in email source routes/services.
- Email sync runner/job execution after source connection.
- Dashboard query path for synced announcements/assignments.

## Acceptance Criteria
- User can connect a Microsoft/Outlook account without errors.
- Connected source is saved and visible in email sources.
- Sync runs and ingests assignment/announcement emails.
- Dashboard shows newly synced assignment and announcement items.

## Proposed Labels
- `bug`
- `microsoft-oauth`
- `email-sync`
- `dashboard`
- `high-priority`

