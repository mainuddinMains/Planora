# Dashboard workload widget

The home dashboard includes a **This week (scheduled)** card that calls:

`GET /api/recommendations/workload?startDate=<ISO>&endDate=<ISO>`

The backend returns an array of rows from `getWorkloadDistribution` (`backend/services/recommendationService.js`):

- `date` — calendar day
- `task_count` — open tasks due that day
- `total_duration` — sum of `duration` (minutes) for those tasks
- `tasks` — aggregated task metadata (not shown in the widget UI)

The widget sums `task_count` and `total_duration` across the week and shows day coverage for open, due tasks in range.
