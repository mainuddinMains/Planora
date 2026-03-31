# Dashboard weekly workload card

The home dashboard includes a **This week (scheduled)** summary backed by:

- **Endpoint**: `GET /api/recommendations/workload?startDate=<ISO>&endDate=<ISO>` (auth required)
- **Response**: JSON array of rows from `getWorkloadDistribution`: each row has `date`, `task_count`, `total_duration` (minutes, open tasks only), and `tasks`.

The frontend component `frontend/src/components/dashboard/DashboardWorkload.jsx` aggregates:

- number of days in range that have at least one open task,
- total open tasks due in the range,
- sum of `total_duration` as estimated time for those open tasks.

This matches the backend query, which only includes **incomplete** tasks with `due_date` between the bounds.
