import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useTasks } from '../hooks/useTasks';
import { TaskForm, TaskList, AIAssistant } from '../components';

function Dashboard() {
  const { t } = useLanguage();
  const { tasks, loading, error, addTask, editTask, removeTask, toggleComplete } = useTasks();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [message, setMessage] = useState('');
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    const handleOpenAddTask = () => {
      setShowForm(true);
      setEditingTask(null);
    };
    const handleOpenChatbot = () => {
      setShowAI(true);
    };
    window.addEventListener('openAddTask', handleOpenAddTask);
    window.addEventListener('openChatbot', handleOpenChatbot);
    return () => {
      window.removeEventListener('openAddTask', handleOpenAddTask);
      window.removeEventListener('openChatbot', handleOpenChatbot);
    };
  }, []);

  const handleAddTask = async (taskData) => {
    try {
      await addTask(taskData);
      setShowForm(false);
      setMessage(t('taskAdded'));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(t('failedToAdd') + err.message);
    }
  };

  const handleEditTask = async (taskData) => {
    try {
      await editTask(editingTask.id, taskData);
      setEditingTask(null);
      setMessage(t('taskUpdated'));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(t('failedToUpdate') + err.message);
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm(t('deleteConfirm'))) {
      try {
        await removeTask(id);
        setMessage(t('taskDeleted'));
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        setMessage(t('failedToDelete') + err.message);
      }
    }
  };

  const handleToggleComplete = async (id, isCompleted) => {
    try {
      await toggleComplete(id, isCompleted);
    } catch (err) {
      setMessage(t('failedToUpdateTask') + err.message);
    }
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="page">{t('loadingTasks')}</div>;
  }

  return (
    <div className="page dashboard">

      {message && (
        <div className={`message ${message.includes('Failed') ? 'error-message' : 'success-message'}`}>
          {message}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {(showForm || editingTask) && (
        <div className="form-card">
          <h2>{editingTask ? t('editTask') : t('addNewTask')}</h2>
          <TaskForm
            onSubmit={editingTask ? handleEditTask : handleAddTask}
            initialData={editingTask}
            onCancel={cancelEdit}
          />
        </div>
      )}

      <div className="tasks-section">
        <h2>{t('yourTasks')}</h2>
        <TaskList
          tasks={tasks}
          onToggle={handleToggleComplete}
          onEdit={startEdit}
          onDelete={handleDeleteTask}
        />
      </div>

      <AIAssistant isOpen={showAI} onClose={() => setShowAI(false)} />
    </div>
  );
}

export default Dashboard;
