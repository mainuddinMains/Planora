import React, { useState, useEffect, useRef } from 'react';
import { useCourses } from '../hooks';
import { useLanguage } from '../hooks/useLanguage';

function TaskForm({ onSubmit, initialData = null, onCancel }) {
  const { t } = useLanguage();
  const { courses } = useCourses();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    course_id: '',
    description: '',
    due_date: '',
    duration: 60,
    priority: 'medium',
    attachment_data: null,
    attachment_name: null
  });

  const [showAttachmentArea, setShowAttachmentArea] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        course_id: initialData.course_id || '',
        description: initialData.description || '',
        due_date: initialData.due_date ? initialData.due_date.slice(0, 16) : '',
        duration: initialData.duration || 60,
        priority: initialData.priority || 'medium',
        attachment_data: initialData.attachment_data || null,
        attachment_name: initialData.attachment_name || null
      });
    }
  }, [initialData]);

  // Helper to process files to Base64
  const handleFileProcessing = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        attachment_data: reader.result,
        attachment_name: file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileProcessing(file);
  };

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
        priority: 'medium',
        attachment_data: null,
        attachment_name: null
      });
      setShowAttachmentArea(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      {/* TITLE */}
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

      {/* COURSE & PRIORITY */}
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

      {/* DATE & DURATION (Put back in!) */}
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

      {/* DESCRIPTION WITH 3-DOTS MENU */}
      <div className="form-group" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label htmlFor="description">{t('description')}</label>
          {/* THREE DOTS MENU BUTTON */}
          <button 
            type="button" 
            className="btn-icon" 
            onClick={() => setShowAttachmentArea(!showAttachmentArea)}
            title="Attach File"
            style={{ fontSize: '20px', padding: '0 5px', cursor: 'pointer', border: 'none', background: 'none' }}
          >
            ⋮
          </button>
        </div>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder={t('noDescription')}
          rows="3"
        />

        {/* ATTACHMENT / DRAG & DROP AREA */}
        {showAttachmentArea && (
          <div 
            className={`attachment-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current.click()}
            style={{
              border: '2px dashed #ccc',
              padding: '15px',
              marginTop: '8px',
              textAlign: 'center',
              borderRadius: '8px',
              cursor: 'pointer',
              background: isDragging ? '#eef6ff' : '#f9f9f9',
              transition: 'background 0.2s ease'
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={(e) => handleFileProcessing(e.target.files[0])} 
            />
            <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>
              {formData.attachment_name 
                ? `📎 Attached: ${formData.attachment_name}` 
                : "Drag a document here or click to upload"}
            </p>
          </div>
        )}
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