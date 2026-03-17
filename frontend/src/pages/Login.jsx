import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';

function Login() {
const { t, language, setLanguage } = useLanguage();
const { checkAuth } = useAuth();
const navigate = useNavigate();

const [isLogin, setIsLogin] = useState(true);
const [formData, setFormData] = useState({
email: 'mains.k.r21@gmail.com',
password: 'test123',
name: ''
});
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

const handleChange = (e) => {
setFormData({ ...formData, [e.target.name]: e.target.value });
setError('');
};

const handleLanguageChange = (e) => {
setLanguage(e.target.value);
};

const handleSubmit = async (e) => {
e.preventDefault();
setError('');
setLoading(true);

try {
if (isLogin) {
await login(formData.email, formData.password);
} else {
if (!formData.name.trim()) {
setError('Name is required');
setLoading(false);
return;
}
await register(formData.email, formData.password, formData.name);
}

if (checkAuth) await checkAuth();
navigate('/');
} catch (err) {
setError(err.message || 'An error occurred');
} finally {
setLoading(false);
}
};

return (
<div className="page auth-page" style={{ position: 'relative', minHeight: '100vh' }}>

{/* Top Right Language Dropdown */}
<div style={{
position: 'absolute',
top: '20px',
right: '20px',
zIndex: 1000
}}>
<select
value={language}
onChange={handleLanguageChange}
style={{
padding: '8px 12px',
borderRadius: '6px',
border: '1px solid #ccc',
backgroundColor: '#fff',
cursor: 'pointer',
fontSize: '14px',
outline: 'none',
boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
}}
>
<option value="en">English</option>
<option value="es">Español</option>
<option value="fr">Français</option>
<option value="ar">العربية</option>
<option value="de">Deutsch</option>
<option value="hi">हिन्दी</option>
<option value="zh">中文</option>
</select>
</div>

<div className="auth-container">
<h1>Planora</h1>
<h2>{isLogin ? t('welcomeBack') : t('createAccount')}</h2>

{error && <div className="error-message" style={{ color: '#ff4d4d', marginBottom: '15px' }}>{error}</div>}

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
placeholder="your@email.com"
required
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
placeholder="••••••••"
required
/>
</div>

<button type="submit" className="btn-primary" disabled={loading}>
{loading ? '...' : isLogin ? t('signIn') : t('signUp')}
</button>
</form>

<p className="auth-switch">
{isLogin ? t('dontHaveAccount') : t('alreadyHaveAccount')}
<button type="button" className="btn-link" onClick={() => {
setIsLogin(!isLogin);
setError('');
setFormData({ ...formData, password: '', name: '' });
}}>
{isLogin ? t('signUp') : t('signIn')}
</button>
</p>
</div>
</div>
);
}

export default Login;
