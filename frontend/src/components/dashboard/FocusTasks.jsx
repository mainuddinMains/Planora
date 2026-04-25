import React from 'react';
import MiniTaskList from '../MiniTaskList';
import { useLanguage } from '../../hooks/useLanguage';

function FocusTasks({ tasks = [], onToggle, onEdit, onDelete, onReschedule, limit = 5 }) {
  const { t } = useLanguage();

  return (
    <section className="focus-panel" aria-labelledby="focus-panel-title">
      <h2 id="focus-panel-title" className="focus-panel-title">
        {t('focusNextTasks')}
      </h2>
      <p className="focus-panel-hint">{t('focusNextTasksHint')}</p>
      <div className="focus-panel-list">
        <MiniTaskList
          tasks={tasks}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onReschedule={onReschedule}
          limit={limit}
          prioritize
          density="compact"
          className="focus-panel-inner-list"
          emptyMessageKey="focusEmpty"
          emptyClassName="focus-panel-empty"
        />
      </div>
    </section>
  );
}

export default FocusTasks;
