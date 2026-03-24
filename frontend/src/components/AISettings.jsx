import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import './AISettings.css';

function AISettings({ isOpen, onClose, connectedAccounts, onConnect, onDisconnect, onSelectAI }) {
  const { t } = useLanguage();
  const [apiKeys, setApiKeys] = useState(() => {
    const saved = localStorage.getItem('aiApiKeys');
    return saved ? JSON.parse(saved) : {};
  });
  const [showKeyInput, setShowKeyInput] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const aiProviders = [
    {
      id: 'openrouter',
      name: 'OpenRouter',
      icon: '🔀',
      description: 'Access 100+ AI models (GPT-4, Claude, Gemini, etc.) with one API key from openrouter.ai',
      color: '#6366f1',
      hasApiKey: true,
    },
    {
      id: 'openai',
      name: 'ChatGPT',
      icon: '🤖',
      description: 'Enter your OpenAI API key (from platform.openai.com/api-keys)',
      color: '#10a37f',
      hasApiKey: true,
    },
    {
      id: 'anthropic',
      name: 'Claude',
      icon: '🧠',
      description: 'Connect your Anthropic account for Claude',
      color: '#d97757',
      hasApiKey: true,
    },
    {
      id: 'google',
      name: 'Gemini',
      icon: '✨',
      description: 'Connect your Google account for Gemini',
      color: '#4285f4',
      hasApiKey: true,
    },
    {
      id: 'github',
      name: 'GitHub Models',
      icon: '🐙',
      description: 'Connect GitHub to access various AI models',
      color: '#333',
    },
    {
      id: 'microsoft',
      name: 'Azure OpenAI',
      icon: '🔷',
      description: 'Use your Microsoft account for Azure AI',
      color: '#00a4ef',
    },
  ];

  const handleSaveApiKey = (providerId) => {
    if (apiKeyInput.trim()) {
      const updated = { ...apiKeys, [providerId]: apiKeyInput.trim() };
      setApiKeys(updated);
      localStorage.setItem('aiApiKeys', JSON.stringify(updated));
      onConnect(providerId);
      setApiKeyInput('');
      setShowKeyInput(null);
    }
  };

  const handleRemoveApiKey = (providerId) => {
    const updated = { ...apiKeys };
    delete updated[providerId];
    setApiKeys(updated);
    localStorage.setItem('aiApiKeys', JSON.stringify(updated));
    onDisconnect(providerId);
  };

  if (!isOpen) return null;

  const isConnected = (providerId) => {
    return connectedAccounts[providerId] || apiKeys[providerId];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ai-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="ai-settings-header">
          <h2>🤖 {t('aiAccounts')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="ai-settings-desc">
          <p>{t('aiSettingsDesc')}</p>
          <p className="api-key-note">
            💡 <strong>Quick Start:</strong> If you have ChatGPT Plus, get your free API key from{' '}
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
              platform.openai.com/api-keys
            </a>
          </p>
        </div>

        <div className="ai-providers-list">
          {aiProviders.map(provider => {
            const isLinked = isConnected(provider.id);
            return (
              <div key={provider.id} className={`ai-provider-card ${isLinked ? 'connected' : ''}`}>
                <div className="provider-info">
                  <div className="provider-icon" style={{ backgroundColor: provider.color }}>
                    {provider.icon}
                  </div>
                  <div className="provider-details">
                    <h3>{provider.name}</h3>
                    <p>{provider.description}</p>
                  </div>
                </div>
                <div className="provider-actions">
                  {isLinked ? (
                    <>
                      <span className="connected-badge">✓ {t('connected')}</span>
                      <button 
                        className="btn-disconnect"
                        onClick={() => provider.hasApiKey ? handleRemoveApiKey(provider.id) : onDisconnect(provider.id)}
                      >
                        {t('disconnect')}
                      </button>
                    </>
                  ) : showKeyInput === provider.id ? (
                    <div className="api-key-input">
                      <input
                        type="password"
                        placeholder="sk-..."
                        value={apiKeyInput}
                        onChange={e => setApiKeyInput(e.target.value)}
                        autoFocus
                      />
                      <button className="btn-save" onClick={() => handleSaveApiKey(provider.id)}>
                        Save
                      </button>
                      <button className="btn-cancel" onClick={() => { setShowKeyInput(null); setApiKeyInput(''); }}>
                        Cancel
                      </button>
                    </div>
                  ) : provider.hasApiKey ? (
                    <button 
                      className="btn-connect"
                      style={{ backgroundColor: provider.color }}
                      onClick={() => setShowKeyInput(provider.id)}
                    >
                      {t('enterApiKey')}
                    </button>
                  ) : (
                    <button 
                      className="btn-connect"
                      style={{ backgroundColor: provider.color }}
                      onClick={() => onConnect(provider.id)}
                    >
                      {t('connect')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="ai-settings-footer">
          <p className="privacy-note">
            🔒 {t('aiPrivacyNote')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AISettings;
