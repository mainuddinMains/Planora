import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, register } from '../api';
import { useAuth } from '../hooks/useAuth';

function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: 'mains.k.r21@gmail.com',
    password: 'test123',
    name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { checkAuth } = useAuth();

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

  return (
    <div className="page auth-page">
      <div className="auth-container">
        <h1>Planora</h1>
        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" className="btn-link" onClick={() => {
            setIsLogin(!isLogin);
            setError('');
            setFormData({ email: formData.email, password: '', name: '' });
          }}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
