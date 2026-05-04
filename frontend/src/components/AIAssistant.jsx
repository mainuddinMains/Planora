import React, { useState, useRef, useEffect } from 'react';
import { getTasks, getAiStatus, postAiChat } from '../api';
import AISettings from './AISettings';
import { useLanguage } from '../hooks/useLanguage';
import './AIAssistant.css';

function AIAssistant({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [tasks, setTasksLocal] = useState([]);
  const [messages, setMessages] = useState([
    { type: 'ai', text: "Hi! I'm your AI study assistant. I can help you with:\n• Scheduling & time management\n• Task organization tips\n• Productivity advice\n• Answer questions about your tasks\n\nWhat would you like help with?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 380, height: 500 });
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [showAISettings, setShowAISettings] = useState(false);
  const [selectedAI, setSelectedAI] = useState('local');
  const [connectedAccounts, setConnectedAccounts] = useState(() => {
    const saved = localStorage.getItem('aiConnectedAccounts');
    return saved ? JSON.parse(saved) : {};
  });
  const [serverAiAvailable, setServerAiAvailable] = useState(false);
  const messagesEndRef = useRef(null);
  const resizeRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      getTasks({})
        .then((data) => setTasksLocal(data || []))
        .catch(() => setTasksLocal([]));
      getAiStatus()
        .then((s) => setServerAiAvailable(Boolean(s?.configured)))
        .catch(() => setServerAiAvailable(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!serverAiAvailable && selectedAI === 'server') {
      setSelectedAI('local');
    }
  }, [serverAiAvailable, selectedAI]);

  const aiOptions = [
    { id: 'local', name: 'Planora AI', icon: '🤖', desc: 'Built-in assistant' },
    ...(serverAiAvailable
      ? [{ id: 'server', name: t('serverAi'), icon: '☁️', desc: t('serverAiDesc') }]
      : []),
    { id: 'openrouter', name: 'OpenRouter', icon: '🔀', desc: '100+ AI models' },
    { id: 'openai', name: 'ChatGPT', icon: '🤖', desc: 'OpenAI account' },
    { id: 'anthropic', name: 'Claude', icon: '🧠', desc: 'Anthropic account' },
    { id: 'google', name: 'Gemini', icon: '✨', desc: 'Google account' },
    { id: 'github', name: 'GitHub Models', icon: '🐙', desc: 'GitHub account' },
    { id: 'microsoft', name: 'Azure', icon: '🔷', desc: 'Microsoft account' },
  ];

  useEffect(() => {
    localStorage.setItem('aiConnectedAccounts', JSON.stringify(connectedAccounts));
  }, [connectedAccounts]);

  const handleConnectAI = (providerId) => {
    if (providerId === 'microsoft' && connectedAccounts.microsoft) {
      return;
    }
    setConnectedAccounts(prev => ({ ...prev, [providerId]: true }));
  };

  const handleDisconnectAI = (providerId) => {
    setConnectedAccounts(prev => {
      const updated = { ...prev };
      delete updated[providerId];
      return updated;
    });
    if (selectedAI === providerId) {
      setSelectedAI('local');
    }
  };

  useEffect(() => {
    if (isOpen && messages.length === 1) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          type: 'ai', 
          text: getQuickInsights(tasks) 
        }]);
      }, 500);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || isMaximized) return;
      const newWidth = Math.max(320, Math.min(800, dragStart.width + (e.clientX - dragStart.x)));
      const newHeight = Math.max(400, Math.min(800, dragStart.height + (e.clientY - dragStart.y)));
      setDimensions({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isMaximized, dragStart]);

  const startResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      width: dimensions.width,
      height: dimensions.height
    });
    setIsResizing(true);
  };

  const getQuickInsights = (tasks) => {
    const incomplete = tasks.filter(t => !t.is_completed);
    const overdue = incomplete.filter(t => new Date(t.due_date) < new Date());
    const today = incomplete.filter(t => {
      const due = new Date(t.due_date);
      const now = new Date();
      return due.toDateString() === now.toDateString();
    });

    let insight = "📊 Here's your current overview:\n";
    if (incomplete.length > 0) {
      insight += `• ${incomplete.length} incomplete task${incomplete.length > 1 ? 's' : ''}\n`;
    }
    if (overdue.length > 0) {
      insight += `• ⚠️ ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''} - prioritize these!\n`;
    }
    if (today.length > 0) {
      insight += `• 📅 ${today.length} due today\n`;
    }
    if (incomplete.length === 0) {
      insight = "🎉 Great job! You have no pending tasks. Great time to plan ahead or take a break!";
    }
    return insight;
  };

  const findOptimalSlots = () => {
    const incomplete = tasks.filter(t => !t.is_completed && t.due_date);
    if (incomplete.length === 0) return "No tasks with deadlines to analyze.";

    const sorted = [...incomplete].sort((a, b) => 
      new Date(a.due_date) - new Date(b.due_date)
    );

    let response = "🗓️ Recommended task order (by due date):\n\n";
    sorted.slice(0, 5).forEach((task, i) => {
      const due = new Date(task.due_date);
      const now = new Date();
      const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      response += `${i + 1}. ${task.title}\n   Due: ${due.toLocaleDateString()} (${daysLeft <= 0 ? 'overdue!' : daysLeft + ' days left'})\n\n`;
    });
    return response;
  };

  const getProductivityTips = () => {
    const tips = [
      "🍅 Try the Pomodoro Technique: 25 minutes of focused work, then a 5-minute break.",
      "📝 Break large tasks into smaller sub-tasks to make progress more manageable.",
      "⏰ Schedule your most important tasks for when you're most alert.",
      "✅ Complete your hardest task first thing in the morning.",
      "🔄 Review and plan your tasks the night before for a productive next day.",
      "🎯 Set specific, measurable goals for each study session.",
      "📱 Minimize distractions - put your phone on silent or use focus mode.",
      "💪 Take regular breaks to maintain peak productivity."
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  const processMessage = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('schedule') || input.includes('when') || input.includes('deadline') || input.includes('due')) {
      return findOptimalSlots();
    }
    
    if (input.includes('tip') || input.includes('advice') || input.includes('productive') || input.includes('help')) {
      return getProductivityTips();
    }
    
    if (input.includes('overdue') || input.includes('late')) {
      const overdue = tasks.filter(t => !t.is_completed && new Date(t.due_date) < new Date());
      if (overdue.length === 0) return "✅ No overdue tasks! Great job staying on track.";
      return `⚠️ You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}:\n${overdue.map(t => `• ${t.title}`).join('\n')}\n\nI recommend completing these first!`;
    }
    
    if (input.includes('today')) {
      const today = tasks.filter(t => !t.is_completed && new Date(t.due_date).toDateString() === new Date().toDateString());
      if (today.length === 0) return "✅ No tasks due today! You have some breathing room.";
      return `📅 You have ${today.length} task${today.length > 1 ? 's' : ''} due today:\n${today.map(t => `• ${t.title}`).join('\n')}`;
    }
    
    if (input.includes('summary') || input.includes('overview') || input.includes('how') || input.includes('doing')) {
      return getQuickInsights(tasks);
    }
    
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return "Hey there! 👋 How can I help you with your tasks today?";
    }
    
    if (input.includes('thank')) {
      return "You're welcome! 😊 Let me know if you need anything else!";
    }

    return "I'm here to help! Try asking me about:\n• Your schedule/deadlines\n• Productivity tips\n• Overdue tasks\n• What you have due today\n• General advice";
  };

  const callOpenRouter = async (userMessage, history) => {
    const apiKeys = JSON.parse(localStorage.getItem('aiApiKeys') || '{}');
    const apiKey = apiKeys['openrouter'];
    if (!apiKey) throw new Error('OpenRouter API key not set. Click ⚙️ to add your key from openrouter.ai');

    const incomplete = tasks.filter(t => !t.is_completed);
    const overdue = incomplete.filter(t => t.due_date && new Date(t.due_date) < new Date());
    const systemPrompt = `You are a helpful AI study assistant inside Planora, a student task management app.
The student currently has ${incomplete.length} incomplete task(s)${overdue.length > 0 ? `, ${overdue.length} of which are overdue` : ''}.
${incomplete.length > 0 ? `Tasks: ${incomplete.slice(0, 10).map(t => `"${t.title}" (due: ${t.due_date ? new Date(t.due_date).toLocaleDateString() : 'no date'}, priority: ${t.priority})`).join(', ')}` : ''}
Be concise, encouraging, and helpful with scheduling, productivity, and academic advice.`;

    const chatHistory = history
      .filter(m => m.text)
      .map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.text }));

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Planora Study Assistant',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...chatHistory,
          { role: 'user', content: userMessage },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'OpenRouter request failed');
    return data.choices[0].message.content;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const updatedMessages = [...messages, { type: 'user', text: userMessage }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      if (selectedAI === 'server') {
        const incomplete = tasks.filter((x) => !x.is_completed);
        const taskSummary =
          incomplete.length === 0
            ? 'No open tasks.'
            : incomplete
                .slice(0, 12)
                .map(
                  (x) =>
                    `- ${x.title} (due: ${x.due_date ? new Date(x.due_date).toLocaleDateString() : 'none'}, priority: ${x.priority || 'n/a'})`
                )
                .join('\n');
        const messagesForApi = updatedMessages
          .slice(0, -1)
          .filter((m) => m.text)
          .map((m) => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.text,
          }));
        const { reply } = await postAiChat({
          message: userMessage,
          taskSummary,
          messages: messagesForApi,
        });
        setMessages((prev) => [...prev, { type: 'ai', text: reply }]);
      } else if (selectedAI === 'openrouter') {
        const response = await callOpenRouter(userMessage, updatedMessages);
        setMessages(prev => [...prev, { type: 'ai', text: response }]);
      } else {
        await new Promise(resolve => setTimeout(resolve, 300));
        const response = processMessage(userMessage);
        setMessages(prev => [...prev, { type: 'ai', text: response }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { type: 'ai', text: `⚠️ Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsMaximized(false);
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    setIsMinimized(false);
  };

  if (isMinimized) {
    return (
      <button className="ai-toggle" onClick={() => setIsMinimized(false)} title="Open AI Assistant">
        🤖
      </button>
    );
  }

  return (
    <div 
      className={`ai-assistant ${isMaximized ? 'maximized' : ''}`}
      style={!isMaximized ? { width: dimensions.width, height: dimensions.height } : {}}
    >
      <div className="ai-header">
        <span className="ai-icon">🤖</span>
        <div className="ai-title-select">
          <span>AI Study Assistant</span>
          <select 
            className="ai-select"
            value={selectedAI}
            onChange={(e) => setSelectedAI(e.target.value)}
            title="Select AI Model"
          >
            {aiOptions.map(ai => (
              <option 
                key={ai.id} 
                value={ai.id}
                disabled={
                  ai.id !== 'local' &&
                  ai.id !== 'server' &&
                  !connectedAccounts[ai.id]
                }
              >
                {ai.icon} {ai.name}{' '}
                {!connectedAccounts[ai.id] && ai.id !== 'local' && ai.id !== 'server'
                  ? '(Not connected)'
                  : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="ai-controls">
          <button className="ai-btn ai-settings-btn" onClick={() => setShowAISettings(true)} title="AI Settings">⚙️</button>
          <button className="ai-btn" onClick={handleMinimize} title="Minimize">−</button>
          <button className="ai-btn" onClick={handleMaximize} title={isMaximized ? "Restore" : "Maximize"}>
            {isMaximized ? '❐' : '□'}
          </button>
          <button className="ai-close" onClick={onClose}>×</button>
        </div>
      </div>
      
      <div className="ai-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`ai-message ${msg.type}`}>
            <div className="message-content">
              {msg.text.split('\n').map((line, j) => (
                <p key={j}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="ai-message ai typing">
            <div className="message-content">
              <p>Thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="ai-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('askMeAnything') || 'Ask me anything...'}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>{t('send') || 'Send'}</button>
      </form>
      
      {!isMaximized && (
        <div 
          className="ai-resize-handle" 
          onMouseDown={startResize}
          title="Drag to resize"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M14 14H10L14 10V14ZM14 10L10 14V10L14 10Z"/>
            <path d="M6 14H2L6 10V14ZM6 10L2 14V10L6 10Z"/>
            <path d="M14 6V2L10 6H14ZM10 6L14 2V6H10Z"/>
          </svg>
        </div>
      )}

      <AISettings 
        isOpen={showAISettings} 
        onClose={() => setShowAISettings(false)}
        connectedAccounts={connectedAccounts}
        onConnect={handleConnectAI}
        onDisconnect={handleDisconnectAI}
        onSelectAI={setSelectedAI}
      />
    </div>
  );
}

export default AIAssistant;
