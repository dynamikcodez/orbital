import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendInterview } from '../lib/claude.js';
import './InterviewView.css';

export default function InterviewView() {
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const [messages, setMessages] = useState([]);   // { role: 'ai'|'user', text }
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [design, setDesign] = useState(null);

  // On mount: kick off interview with mission description from sessionStorage
  useEffect(() => {
    const missionDescription = sessionStorage.getItem('missionDescription') || '';
    const archetypeId = sessionStorage.getItem('selectedArchetype') || '';
    if (!missionDescription) { navigate('/mission'); return; }
    startInterview(missionDescription, archetypeId);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // When design is complete, store and navigate
  useEffect(() => {
    if (design) {
      sessionStorage.setItem('satelliteDesign', JSON.stringify(design));
      setTimeout(() => navigate('/design'), 800);
    }
  }, [design]);

  const startInterview = async (missionDescription, archetypeId) => {
    setLoading(true);
    setError('');
    try {
      const result = await sendInterview({ missionDescription, archetypeId, history: [] });
      handleResult(result, [{ role: 'user', content: missionDescription }]);
    } catch (e) {
      setError('Could not reach AI service. Is the Express server running? (' + e.message + ')');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async () => {
    if (!answer.trim() || loading) return;
    const userText = answer.trim();
    setAnswer('');

    // Build updated message list for display
    const newDisplayMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newDisplayMessages);
    setLoading(true);
    setError('');

    // Build conversation history for Claude (convert display format to API format)
    const history = buildHistory(newDisplayMessages);

    try {
      const result = await sendInterview({
        missionDescription: sessionStorage.getItem('missionDescription') || '',
        archetypeId: sessionStorage.getItem('selectedArchetype') || '',
        history,
      });
      handleResult(result, history);
    } catch (e) {
      setError('AI service error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResult = (result, history) => {
    if (result.interviewStatus === 'COMPLETE') {
      // Show a brief completion message then redirect
      setMessages((prev) => [...prev, { role: 'ai', text: '✓ All parameters confirmed. Generating your engineering design…', complete: true }]);
      setDesign(result);
    } else if (result.pendingQuestions?.length) {
      // Show next question
      const q = result.pendingQuestions[0];
      setMessages((prev) => [...prev, { role: 'ai', text: q }]);
    } else if (result.error) {
      setError(result.error);
    }
  };

  const buildHistory = (displayMessages) => {
    return displayMessages.map((m) => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.text,
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnswer();
    }
  };

  return (
    <div className="interview-root">
      <nav className="interview-nav">
        <button className="nav-back" onClick={() => navigate('/mission')}>
          ← Back
        </button>
        <span className="nav-wordmark">◉ Orbital</span>
        <span className="nav-badge">REQUIREMENTS INTERVIEW</span>
      </nav>

      <div className="interview-body">
        {/* Step indicator */}
        <div className="step-bar">
          <span className="step done">1 Gallery</span>
          <span className="step-arrow">→</span>
          <span className="step done">2 Intake</span>
          <span className="step-arrow">→</span>
          <span className="step active">3 Interview</span>
          <span className="step-arrow">→</span>
          <span className="step">4 Design</span>
        </div>

        {/* Thread */}
        <div className="thread">
          {messages.length === 0 && loading && (
            <div className="ai-bubble loading-bubble">
              <span className="bubble-label">ORBITAL AI</span>
              <div className="typing-dots">
                <span /><span /><span />
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={'bubble-wrap ' + (msg.role === 'ai' ? 'ai-wrap' : 'user-wrap')}>
              <div className={msg.role === 'ai' ? ('ai-bubble' + (msg.complete ? ' complete-bubble' : '')) : 'user-bubble'}>
                {msg.role === 'ai' && <span className="bubble-label">ORBITAL AI</span>}
                <p>{msg.text}</p>
              </div>
            </div>
          ))}

          {loading && messages.length > 0 && (
            <div className="ai-bubble loading-bubble">
              <span className="bubble-label">ORBITAL AI</span>
              <div className="typing-dots"><span /><span /><span /></div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="interview-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Input */}
        {!design && (
          <div className="answer-row">
            <textarea
              className="answer-input"
              rows={2}
              placeholder="Type your answer… (Enter to send, Shift+Enter for new line)"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="btn-send"
              onClick={handleAnswer}
              disabled={loading || !answer.trim()}
            >
              {loading ? <span className="spinner" /> : '↑'}
            </button>
          </div>
        )}

        {design && (
          <div className="redirect-notice">
            <span className="spinner" /> Loading design workspace…
          </div>
        )}
      </div>
    </div>
  );
}
