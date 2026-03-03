import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { TaskForm, TaskList, AIAssistant } from '../components';

function Dashboard() {
  const { tasks, loading, error, addTask, editTask, removeTask, toggleComplete } = useTasks();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [message, setMessage] = useState('');
  const [showAI, setShowAI] = useState(false);

  const handleAddTask = async (taskData) => {
    try {
      await addTask(taskData);
      setShowForm(false);
      setMessage('Task added successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to add task: ' + err.message);
    }
  };

  const handleEditTask = async (taskData) => {
    try {
      await editTask(editingTask.id, taskData);
      setEditingTask(null);
      setMessage('Task updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update task: ' + err.message);
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await removeTask(id);
        setMessage('Task deleted successfully!');
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        setMessage('Failed to delete task: ' + err.message);
      }
    }
  };

  const handleToggleComplete = async (id, isCompleted) => {
    try {
      await toggleComplete(id, isCompleted);
    } catch (err) {
      setMessage('Failed to update task: ' + err.message);
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
    return <div className="page">Loading tasks...</div>;
  }

  return (
    <div className="page dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Manage your tasks and stay organized</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingTask(null); }} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('Failed') ? 'error-message' : 'success-message'}`}>
          {message}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {(showForm || editingTask) && (
        <div className="form-card">
          <h2>{editingTask ? 'Edit Task' : 'Add New Task'}</h2>
          <TaskForm
            onSubmit={editingTask ? handleEditTask : handleAddTask}
            initialData={editingTask}
            onCancel={cancelEdit}
          />
        </div>
      )}

      <div className="tasks-section">
        <h2>Your Tasks</h2>
        <TaskList
          tasks={tasks}
          onToggle={handleToggleComplete}
          onEdit={startEdit}
          onDelete={handleDeleteTask}
        />
      </div>

      <button className="ai-toggle" onClick={() => setShowAI(true)} title="AI Assistant">
        🤖
      </button>
      <AIAssistant isOpen={showAI} onClose={() => setShowAI(false)} />
    </div>
  );
}

export default Dashboard;
