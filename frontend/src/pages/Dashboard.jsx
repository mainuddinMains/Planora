import React, { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTaskWorkspace } from '../hooks/useTaskWorkspace';
import {
  DashboardHeader,
  DashboardStats,
  DashboardWorkload,
  FocusTasks,
  TaskWorkspaceView,
} from '../components/dashboard';

function Dashboard() {
  const { user } = useAuth();
  const workspace = useTaskWorkspace();

  const weekTaskStats = useMemo(() => {
    const tasks = workspace.insightTasks || [];
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    const weekTasks = tasks.filter((t) => {
      if (!t.due_date) return false;
      const due = new Date(t.due_date);
      return due >= start && due <= end;
    });
    return {
      completed: weekTasks.filter((t) => t.is_completed).length,
      total: weekTasks.length,
    };
  }, [workspace.insightTasks]);

  return (
    <div className="page dashboard">
      <DashboardHeader user={user} />

      <DashboardStats tasks={workspace.insightTasks || []} />

      <div className="dashboard-main-row">
        <DashboardWorkload weekCompleted={weekTaskStats.completed} weekTotal={weekTaskStats.total} />
      </div>

      <div className="dashboard-grid">
        <aside className="dashboard-focus-column">
          <FocusTasks
            tasks={workspace.insightTasks || []}
            onToggle={workspace.handleToggleComplete}
            onEdit={workspace.startEdit}
            onDelete={workspace.handleDeleteTask}
            onReschedule={workspace.handleReschedule}
          />
        </aside>
        <div className="dashboard-workspace-column">
          <TaskWorkspaceView workspace={workspace} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
