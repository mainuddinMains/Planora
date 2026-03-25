import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGoogleLoginAuthUrl, login, register } from '../api';

import { useLanguage } from '../hooks/useLanguage';

import { useAuth } from '../hooks/useAuth';


function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { checkAuth } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleError = params.get('google_error');

    if (googleError) {
      setError(googleError);
      window.history.replaceState({}, document.title, '/login');
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Submitting login form...');

    try {
      if (isLogin) {
        console.log('Attempting login with:', formData.email);
        const result = await login(formData.email, formData.password);
        console.log('Login result:', result);
        alert('Login successful! Redirecting...');
      } else {
        if (!formData.name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        const result = await register(formData.email, formData.password, formData.name);
        console.log('Register result:', result);
        alert('Registration successful! Redirecting...');
      }
      await checkAuth();
      navigate('/');
    } catch (err) {
      console.error('Auth error:', err);
      alert('Error: ' + (err.message || 'An error occurred'));
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const { authUrl } = await getGoogleLoginAuthUrl();
      localStorage.setItem('google_auth_pending', 'true');
      window.location.assign(authUrl);
    } catch (err) {
      setError(err.message || 'Failed to start Google sign-in.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-container">
        <h1>Planora</h1>
        <h2>{isLogin ? t('welcomeBack') : t('createAccount')}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">{t('name')}</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('name')}
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">{t('email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('enterYourEmail')}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('enterPassword')}
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading || googleLoading}>
            {loading ? '...' : isLogin ? t('signIn') : t('signUp')}
          </button>
        </form>

        <div className="auth-divider">
          <span>{t('orContinueWith')}</span>
        </div>

        <button
          type="button"
          className="btn-google"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
        >
          <span className="btn-google-icon">G</span>
          {googleLoading ? t('loading') : t('continueWithGoogle')}
        </button>

        <p className="auth-switch">
          {isLogin ? t('dontHaveAccount') : t('alreadyHaveAccount')}
          <button type="button" className="btn-link" onClick={() => {
            setIsLogin(!isLogin);
            setError('');
            setFormData({ email: formData.email, password: '', name: '' });
          }}>
            {isLogin ? t('signUp') : t('signIn')}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
