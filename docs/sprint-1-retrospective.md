# Sprint 1 Retrospective

## Sprint Focus
Sprint 1 was mainly about getting Planora off the ground and turning it into something we could actually use, not just describe. The team focused on setting up the project structure, wiring the frontend and backend together, and delivering the first real planning flow for students.

By the end of the sprint, we had the core app moving in the right direction. Task and course management were connected across the stack, the dashboard started to feel like a real product, and the weekly planning and notification work gave the project more than just CRUD value.

## What Went Well
- We made real progress on the product foundation instead of spending the whole sprint only on setup. The basic structure, task flow, dashboard work, weekly planning, and notifications all moved forward in a connected way.
- The team got the frontend and backend integrated early, which helped us turn ideas into working flows instead of isolated screens or isolated APIs.
- We were able to surface problems quickly and document them in the issue tracker. GitHub issue [#1](https://github.com/mainuddinMains/Planora/issues/1) clearly captured the Microsoft email sync problem, the user impact, and the expected behavior, which gave the team a concrete bug to work against instead of vague feedback.
- The sprint showed that the team could ship meaningful features and then reflect on them. Even when something was not fully stable, we were at least working with a real system that exposed real user-facing issues.
- Communication improved once the work was visible in commits, docs, and issues. That made it easier to understand what had been built and what still needed attention.

## What Did Not Go Well
- A major problem is that one of the features delivered during the sprint was still not dependable by the end. GitHub issue [#1](https://github.com/mainuddinMains/Planora/issues/1) shows that users could not reliably connect a Microsoft account, and as a result assignments and announcements were not appearing on the dashboard.
- Integration work created more friction than expected. Features looked close to done, but route behavior, API wiring, OAuth flow, and persistence problems meant some items needed extra cleanup after they were already considered mostly complete.
- We did not always define acceptance criteria strongly enough before building. Issue `#1` is a good example: the expected result is very clear in hindsight, but that level of clarity should have existed earlier during implementation.
- Testing was mostly manual and reactive. We found problems after trying the full flow instead of preventing them with a small repeatable smoke test for login, sync, and dashboard behavior.
- Some documentation existed, but it was still catching up to development. That made troubleshooting slower than it needed to be when bugs crossed multiple parts of the system.

## Main Lessons
The biggest lesson from Sprint 1 is that getting a full path working end-to-end is more valuable than polishing one isolated feature too early. Once the basic flow exists, the team has something concrete to improve.

We also learned that integration points need more attention than they usually get in planning. Authentication, API contracts, and route behavior can slow a sprint down if they are treated like small details.

Another takeaway is that documentation should be updated as the sprint moves, not pushed to the end. Even short notes save time when multiple people are touching the same system.

## Things To Improve Next Sprint
- Define acceptance criteria before coding begins, especially for cross-system features like Microsoft OAuth, email sync, and dashboard data display. Issue `#1` should have been impossible to miss if those checks had been written earlier.
- Create a short smoke-test checklist for every important user flow: login, task creation, email connection, sync completion, and dashboard updates.
- Break work into smaller issue-sized tasks so progress is easier to track and unfinished integration work does not hide behind a feature that looks complete on the surface.
- Use GitHub issues earlier and more consistently for bugs, blockers, and follow-up work. The issue tracker helped once the problem was written down, so we should lean on it sooner in the sprint.
- Reserve time specifically for integration validation and bug fixing instead of assuming feature work ends when the code is merged.

## Overall Reflection
Sprint 1 was a good start. It was not perfect, and there was some predictable first-sprint messiness, but the team finished with a real foundation instead of a partially assembled prototype. That gives Sprint 2 a much better starting point because we are improving a working system, not building from zero again.
