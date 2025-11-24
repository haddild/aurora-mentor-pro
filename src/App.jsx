import React, { useState, useEffect, useRef } from 'react';

const NAV_ITEMS = [
  { mode: 'chat', label: 'Chat', icon: '\uD83D\uDCAC' },
  { mode: 'study', label: 'Study', icon: '\uD83D\uDCD6' },
  { mode: 'learn', label: 'Learn', icon: '\uD83E\uDDE0' },
  { mode: 'motivation', label: 'Motivation', icon: '\uD83D\uDCAA' },
  { mode: 'notes', label: 'Notes', icon: '\uD83D\uDCDD' }
];

const THEMES = {
  blue: {
    accent: '#00aaff',
    userBubble: 'rgba(0, 150, 255, 0.25)',
    assistantBubble: 'rgba(0, 200, 255, 0.25)'
  },
  pink: {
    accent: '#e91e63',
    userBubble: 'rgba(233, 30, 99, 0.25)',
    assistantBubble: 'rgba(244, 143, 177, 0.25)'
  },
  purple: {
    accent: '#9c27b0',
    userBubble: 'rgba(156, 39, 176, 0.25)',
    assistantBubble: 'rgba(206, 147, 216, 0.25)'
  },
  green: {
    accent: '#4caf50',
    userBubble: 'rgba(76, 175, 80, 0.25)',
    assistantBubble: 'rgba(165, 214, 167, 0.25)'
  },
  yellow: {
    accent: '#ffc107',
    userBubble: 'rgba(255, 179, 0, 0.25)',
    assistantBubble: 'rgba(255, 213, 79, 0.25)'
  }
};

const App = () => {
  const [mode, setMode] = useState('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('aurora-theme') || 'blue');
  const [showBirthday, setShowBirthday] = useState(false);
  const notesRef = useRef(null);

  useEffect(() => {
    // load notes from localStorage
    const stored = localStorage.getItem('aurora-notes');
    if (stored) {
      setNotes(stored);
    }
    // check birthday message for Nov 26-27 (Asia/Karachi)
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', month: '2-digit', day: '2-digit' });
    const parts = formatter.format(new Date()).split('/');
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    setShowBirthday(month === 11 && (day === 26 || day === 27));
  }, []);

  useEffect(() => {
    // apply theme variables
    const t = THEMES[theme] || THEMES.blue;
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.style.setProperty('--bubble-user', t.userBubble);
    document.documentElement.style.setProperty('--bubble-assistant', t.assistantBubble);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aurora-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (mode === 'notes') {
      localStorage.setItem('aurora-notes', notes);
      localStorage.setItem('aurora-notes-saved', new Date().toISOString());
    }
  }, [notes, mode]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading || mode === 'notes') return;
    const newMessages = [...messages, { role: 'user', text: trimmed, mode }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          messages: newMessages.map((m) => ({ role: m.role, content: m.text }))
        })
      });
      const data = await res.json();
      if (data && typeof data.text === 'string' && data.text.trim() !== '') {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.text.trim(), mode }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: 'Sorry, I ran into an error. Please try again later.',
            mode
          }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Sorry, I ran into an error.', mode }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const lastSaved = localStorage.getItem('aurora-notes-saved');

  const handleThemeClick = (t) => {
    setTheme(t);
  };

  return (
    <div className="app">
      <nav className="navbar">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.mode}
            className={mode === item.mode ? 'nav-button active' : 'nav-button'}
            onClick={() => setMode(item.mode)}
          >
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <div className="theme-picker">
          {Object.keys(THEMES).map((t) => (
            <button
              key={t}
              className={`theme-btn ${theme === t ? 'selected' : ''}`}
              style={{ backgroundColor: THEMES[t].accent }}
              onClick={() => handleThemeClick(t)}
            />
          ))}
        </div>
      </nav>
      {mode === 'notes' ? (
        <div className="notes-container">
          {showBirthday && (
            <div className="birthday-banner">
              \uD83C\uDF82 Happy Birthday my angel! \u2728
            </div>
          )}
          <textarea
            ref={notesRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write your notes here..."
          />
          <div className="notes-info">
            {lastSaved
              ? `Last saved: ${new Date(lastSaved).toLocaleString()}`
              : 'Not yet saved'}
          </div>
        </div>
      ) : (
        <div className="chat-container">
          {showBirthday && (
            <div className="birthday-banner">
              \uD83C\uDF82 Happy Birthday my angel! \u2728
            </div>
          )}
          <div className="messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`message ${m.role}`}>
                <span className="mode-tag">{m.mode.toUpperCase()}</span>
                <span className="text">{m.text}</span>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <span className="mode-tag">{mode.toUpperCase()}</span>
                <span className="text">Aurora is thinking...</span>
              </div>
            )}
          </div>
          <div className="input-area">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
