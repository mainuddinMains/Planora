import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useTaskWorkspace } from '../hooks/useTaskWorkspace';
import { TaskWorkspaceView } from '../components/dashboard';

function Tasks() {
  const { t } = useLanguage();
  const workspace = useTaskWorkspace();

  if (workspace.loading) {
    return <div className="page">{t('loadingTasks')}</div>;
  }

  return (
    <div className="page tasks-page">
      <header className="tasks-page-header">
        <div>
          <h1>{t('tasks')}</h1>
          <p className="tasks-page-subtitle">{t('tasksPageSubtitle')}</p>
        </div>
        <button type="button" className="btn-primary" onClick={workspace.openAddForm}>
          {t('addTask')}
        </button>
      </header>

      <TaskWorkspaceView workspace={workspace} titleKey="taskLibrary" />
    </div>
  );
}

export default Tasks;
