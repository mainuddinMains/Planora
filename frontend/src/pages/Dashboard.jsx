import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTaskWorkspace } from '../hooks/useTaskWorkspace';
import {
  DashboardHeader,
  DashboardStats,
  FocusTasks,
  TaskWorkspaceView,
} from '../components/dashboard';

function Dashboard() {
  const { user } = useAuth();
  const workspace = useTaskWorkspace();

  return (
    <div className="page dashboard">
      <DashboardHeader user={user} />

      <DashboardStats tasks={workspace.insightTasks || []} />

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
