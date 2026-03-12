import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import './FocusTimer.css';

function FocusTimer({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [focusSessions, setFocusSessions] = useState(0);
  const [showNotificationPermission, setShowNotificationPermission] = useState(false);
  const timerRef = useRef(null);
  const wasRunningRef = useRef(false);

  useEffect(() => {
    if (Notification.permission === 'default') {
      setShowNotificationPermission(true);
    }
  }, []);

  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, isPaused, timeLeft]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning && !isPaused) {
        wasRunningRef.current = true;
      } else if (!document.hidden && wasRunningRef.current) {
        wasRunningRef.current = false;
        if (Notification.permission === 'granted') {
          new Notification('Planora - Focus Mode', {
            body: t('backToWork'),
            icon: '/favicon.ico'
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, isPaused, t]);

  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    setShowNotificationPermission(permission !== 'default');
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    setIsPaused(false);
    setFocusSessions(prev => prev + 1);
    
    if (Notification.permission === 'granted') {
      new Notification('Planora - Focus Session Complete! 🎉', {
        body: t('focusComplete'),
        icon: '/favicon.ico'
      });
    }
    
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(duration * 60);
  };

  const handleSetCustomTime = () => {
    const mins = parseInt(customTime);
    if (mins > 0 && mins <= 180) {
      setDuration(mins);
      setTimeLeft(mins * 60);
      setShowCustomInput(false);
      setCustomTime('');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const presetTimes = [15, 25, 45, 60];

  if (!isOpen) return null;

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="focus-timer-modal" onClick={e => e.stopPropagation()}>
        <div className="focus-timer-header">
          <h2>🎯 {t('focusMode')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {showNotificationPermission && (
          <div className="notification-prompt">
            <p>{t('enableNotifications')}</p>
            <button onClick={requestNotificationPermission}>{t('enable')}</button>
          </div>
        )}

        <div className="timer-display">
          <div className="timer-circle">
            <svg viewBox="0 0 100 100">
              <circle className="timer-bg" cx="50" cy="50" r="45" />
              <circle 
                className="timer-progress" 
                cx="50" 
                cy="50" 
                r="45"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              />
            </svg>
            <div className="timer-text">
              <span className="time">{formatTime(timeLeft)}</span>
              <span className="status">
                {!isRunning ? t('ready') : isPaused ? t('paused') : t('focusing')}
              </span>
            </div>
          </div>
        </div>

        {!isRunning && (
          <div className="duration-selector">
            <label>{t('selectDuration')}:</label>
            <div className="preset-buttons">
              {presetTimes.map(time => (
                <button
                  key={time}
                  className={duration === time ? 'active' : ''}
                  onClick={() => {
                    setDuration(time);
                    setTimeLeft(time * 60);
                  }}
                >
                  {time} {t('min')}
                </button>
              ))}
              <button onClick={() => setShowCustomInput(true)}>⚙️</button>
            </div>
            
            {showCustomInput && (
              <div className="custom-time-input">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customTime}
                  onChange={e => setCustomTime(e.target.value)}
                  placeholder={t('minutes')}
                />
                <button onClick={handleSetCustomTime}>{t('set')}</button>
                <button onClick={() => setShowCustomInput(false)}>{t('cancel')}</button>
              </div>
            )}
          </div>
        )}

        <div className="timer-controls">
          {!isRunning ? (
            <button className="btn-start" onClick={handleStart}>
              ▶ {t('startFocus')}
            </button>
          ) : (
            <>
              {isPaused ? (
                <button className="btn-resume" onClick={handleResume}>
                  ▶ {t('resume')}
                </button>
              ) : (
                <button className="btn-pause" onClick={handlePause}>
                  ⏸ {t('pause')}
                </button>
              )}
              <button className="btn-reset" onClick={handleReset}>
                ⏹ {t('reset')}
              </button>
            </>
          )}
        </div>

        <div className="focus-stats">
          <span>📊 {t('sessionsToday')}: {focusSessions}</span>
        </div>
      </div>
    </div>
  );
}

export default FocusTimer;
