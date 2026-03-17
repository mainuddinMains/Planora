import React, { useState, useEffect } from 'react';
import { useCourses } from '../hooks';
import { useLanguage } from '../hooks/useLanguage';

function TaskForm({ onSubmit, initialData = null, onCancel }) {
  const { t } = useLanguage();
  const { courses } = useCourses();
  const [formData, setFormData] = useState({
    title: '',
    course_id: '',
    description: '',
    due_date: '',
    duration: 60,
    priority: 'medium'
  });
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: '', code: '', color: '#4a90a4' });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        course_id: initialData.course_id || '',
        description: initialData.description || '',
        due_date: initialData.due_date ? initialData.due_date.slice(0, 16) : '',
        duration: initialData.duration || 60,
        priority: initialData.priority || 'medium'
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      course_id: formData.course_id || null,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
      duration: parseInt(formData.duration) || 60
    };
    onSubmit(submitData);
    if (!initialData) {
      setFormData({
        title: '',
        course_id: '',
        description: '',
        due_date: '',
        duration: 60,
        priority: 'medium'
      });
    }
  };

  const handleNewCourseChange = (e) => {
    const { name, value } = e.target;
    setNewCourse(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <div className="form-group">
        <label htmlFor="title">{t('title')} *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder={t('title') + '...'}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="course_id">{t('course')}</label>
          <select
            id="course_id"
            name="course_id"
            value={formData.course_id}
            onChange={handleChange}
          >
            <option value="">{t('select')}...</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.name} {course.code ? `(${course.code})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priority">{t('priority')}</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="low">{t('low')}</option>
            <option value="medium">{t('medium')}</option>
            <option value="high">{t('high')}</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="due_date">{t('dueDate')}</label>
          <input
            type="datetime-local"
            id="due_date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="duration">{t('duration')} ({t('minutes')})</label>
          <input
            type="number"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            min="1"
            placeholder={t('defaultDuration')}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description">{t('description')}</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder={t('noDescription')}
          rows="3"
        />
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            {t('cancel')}
          </button>
        )}
        <button type="submit" className="btn-primary">
          {initialData ? t('update') : t('addNewTask')}
        </button>
      </div>
    </form>
  );
}

export default TaskForm;
