# Individual Deliverables - Mainuddin

This document is based on the Git history and GitHub PR activity visible in the `Planora` repository as of March 31, 2026.

## 1. Personal Code Contribution

My main contributions were in frontend features, authentication/integration work, and development support.

### Main areas of contribution

1. Google sign-in and authentication
   - I added Google sign-in with OAuth state validation, account linking/creation, and cookie-based session handling.
   - Evidence: commit `919ea34` (`Add Google sign-in flow`)
   - Key files: [backend/routes/auth.js](/Users/mainuddinsarker/Documents/Saint_Louis_University/Software Engineering/Planora/backend/routes/auth.js), [backend/services/googleOAuth.js](/Users/mainuddinsarker/Documents/Saint_Louis_University/Software Engineering/Planora/backend/services/googleOAuth.js), [frontend/src/pages/Login.jsx](/Users/mainuddinsarker/Documents/Saint_Louis_University/Software Engineering/Planora/frontend/src/pages/Login.jsx)

2. Google Calendar integration
   - I added the Google Calendar page and the backend/frontend flow for account connection, event loading, and event CRUD.
   - Evidence: commits `ff38e1f` and `e2837e2`
   - Key file: [frontend/src/pages/GoogleCalendar.jsx](/Users/mainuddinsarker/Documents/Saint_Louis_University/Software Engineering/Planora/frontend/src/pages/GoogleCalendar.jsx)

3. Productivity and AI features
   - I implemented the focus timer, AI provider settings, AI assistant updates, and notification sound behavior.
   - Evidence: commits `d91a4a6`, `803e8b9`, and `b52fb9b`
   - Key files: [frontend/src/components/FocusTimer.jsx](/Users/mainuddinsarker/Documents/Saint_Louis_University/Software Engineering/Planora/frontend/src/components/FocusTimer.jsx), [frontend/src/components/AISettings.jsx](/Users/mainuddinsarker/Documents/Saint_Louis_University/Software Engineering/Planora/frontend/src/components/AISettings.jsx)

4. Internationalization and UI/navigation improvements
   - I expanded the language system, added a searchable language selector, and refactored translations into separate modules.
   - Evidence: commits `798f132` and `4b7a8f5`
   - Key file: [frontend/src/hooks/useLanguage.js](/Users/mainuddinsarker/Documents/Saint_Louis_University/Software Engineering/Planora/frontend/src/hooks/useLanguage.js)

5. Calendar views and local development support
   - I added the monthly calendar view, weekly drag-and-drop support, Docker setup files, and local auth/container config fixes.
   - Evidence: commits `ff48890`, `1a61576`, `27b5865`, and `73ec737`

### Screenshot evidence to attach

- `git log --author="mains.k.r21@gmail.com" --oneline`
- `git show --stat 919ea34`
- `git show --stat ff38e1f`
- PR: <https://github.com/mainuddinMains/Planora/pull/22>
- PR: <https://github.com/mainuddinMains/Planora/pull/9>

## 2. Test Cases

The repository history does not show a full Jest/PyTest-style automated test suite under my authorship during this sprint. The main test-related artifact I committed was a Node-based IMAP smoke-test script for Outlook email integration.

- Evidence: commit `72547b6` (`Improve Outlook email sync handling and setup guidance`)
- File: [backend/test-email.js](/Users/mainuddinsarker/Documents/Saint_Louis_University/Software Engineering/Planora/backend/test-email.js)

### Example

```js
const client = new ImapFlow({
  host: 'outlook.office365.com',
  port: 993,
  secure: true,
  auth: { user, pass },
});

await client.connect();
await client.openBox('INBOX');
const messages = await client.search(['ALL'], { envelope: true });
await client.logout();
```

### Test cases I covered through implementation and validation

1. Outlook email sync smoke test
   - Verify valid IMAP credentials can connect, open `INBOX`, and fetch message metadata.

2. Google sign-in flow
   - Verify auth URL generation, state validation, account linking/creation, and session cookie creation.

3. Google Calendar integration
   - Verify connect/disconnect, monthly event loading, and create/edit/delete event flows.

4. Focus timer interaction
   - Verify start, pause, resume, reset, notification permission, and session completion behavior.

### Limitation

If the course requires framework-based automated tests, I should state clearly that this sprint did not yet include a consistent Jest/PyTest/Supertest suite for my work.

## 3. Code Review Summary

My review activity is visible more through GitHub approval events than through long written inline comments.

- Verified evidence found: PR `#28` (`Improve dashboard resilience and prevent blank page on widget failure`)
- Link: <https://github.com/mainuddinMains/Planora/pull/28>
- My role: reviewed teammate work and approved it before integration into `main`

The written review bodies under my account are minimal in the GitHub history I inspected, so I cannot claim detailed written comments that are not preserved. What I can verify is that I participated in review and approval using GitHub’s PR workflow.

## 4. Individual Reflection

This sprint taught me the most about integration-heavy development. The hardest parts of my work were the places where frontend and backend had to coordinate closely, especially Google sign-in, Google Calendar, Outlook/IMAP email sync, and local environment setup. I also learned that usability matters as much as functionality, which is why many of my commits focused on navigation, language support, focus tools, and notifications.

I contributed by taking on features that connected multiple parts of the stack and by helping reduce development friction for the team. I also learned that the project needs stronger automated testing in the future. My `backend/test-email.js` smoke test helped validate one risky area, but a broader test framework would improve confidence in auth, calendar, and UI flows.
