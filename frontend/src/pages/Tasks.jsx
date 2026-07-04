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
      <TaskWorkspaceView workspace={workspace} titleKey="taskLibrary" />
    </div>
  );
}

export default Tasks;
