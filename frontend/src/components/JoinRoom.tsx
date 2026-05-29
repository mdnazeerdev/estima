import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, User, Hash, Brain, Target, Zap } from 'lucide-react';
import LogoIcon from './LogoIcon';

interface JoinRoomProps {
  onJoin: (name: string, roomId: string) => void;
  onCreate: (name: string) => void;
  initialRoomId?: string;
  error?: string | null;
}

export default function JoinRoom({ onJoin, onCreate, initialRoomId = '', error: propError }: JoinRoomProps) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState(initialRoomId);
  const [mode, setMode] = useState<'create' | 'join'>(initialRoomId ? 'join' : 'create');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRoomId) {
      setRoomId(initialRoomId);
      setMode('join');
    }
  }, [initialRoomId]);

  useEffect(() => {
    if (propError) {
      setError(propError);
    } else {
      setError(null);
    }
  }, [propError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (mode === 'join') {
      if (!roomId.trim()) {
        setError('Please enter a room ID.');
        return;
      }
      onJoin(name.trim(), roomId.trim().toLowerCase());
    } else {
      onCreate(name.trim());
    }
  };

  return (
    <div className="lobby-layout">
      <div className="lobby-card glass-panel animate-fade-in split-layout">
        
        {/* Left Side: Magical Agile Words & Info Banner */}
        <div className="lobby-info-side">
          <div className="logo-badge">
            <span className="logo-badge-icon" style={{ padding: '4px' }}>
              <LogoIcon />
            </span>
            <span className="logo-badge-text">Estima</span>
          </div>

          <div className="lobby-quotes-container">
            <h2 className="quotes-title">Consensus Sizing</h2>
            <p className="quotes-subtitle">Unlocking precise planning with collaborative intelligence.</p>

            <div className="magical-word-item">
              <Brain size={18} className="magical-icon" />
              <div>
                <h4>Consensus Alignment</h4>
                <p>Reveal collective logic and bridge cognitive distances instantly.</p>
              </div>
            </div>

            <div className="magical-word-item">
              <Target size={18} className="magical-icon" />
              <div>
                <h4>No Assumptions</h4>
                <p>Discuss divergence, resolve ambiguity, and estimate with total clarity.</p>
              </div>
            </div>

            <div className="magical-word-item">
              <Zap size={18} className="magical-icon" />
              <div>
                <h4>Ignite Velocity</h4>
                <p>Empower your sprints with high-fidelity, consensus-based sizing.</p>
              </div>
            </div>
          </div>

          <div className="lobby-footer-words">
            "Align minds, plan sprints, achieve outcomes."
          </div>
        </div>

        {/* Right Side: Form Controls */}
        <div className="lobby-form-side">
          <h2 className="lobby-title">Let's Point</h2>
          <p className="lobby-subtitle">Enter your details to access the estimation deck</p>

          {error && (
            <div style={{
              color: 'var(--error)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '0.75rem',
              width: '100%',
              marginBottom: '1.25rem',
              fontSize: '0.9rem',
              textAlign: 'left'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="username">
                <User size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
                Your Name
              </label>
              <input
                type="text"
                id="username"
                className="input-field"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                required
              />
            </div>

            {mode === 'join' && (
              <div className="input-group animate-fade-in">
                <label className="input-label" htmlFor="room-id">
                  <Hash size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
                  Room ID
                </label>
                <input
                  type="text"
                  className="input-field"
                  id="room-id"
                  placeholder="e.g. 3x9p1a"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  maxLength={10}
                  required
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              {mode === 'create' ? (
                <>
                  Create New Room
                  <Sparkles size={16} />
                </>
              ) : (
                <>
                  Join Room
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="lobby-divider"></div>

          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <button
              className={`btn ${mode === 'create' ? 'btn-secondary' : 'btn-outline'}`}
              style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
              onClick={() => {
                setMode('create');
                setError(null);
              }}
            >
              I want to host
            </button>
            <button
              className={`btn ${mode === 'join' ? 'btn-secondary' : 'btn-outline'}`}
              style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
              onClick={() => {
                setMode('join');
                setError(null);
              }}
            >
              I have a link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
