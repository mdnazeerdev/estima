import { useState, FormEvent } from 'react';
import { Play, Square, Eye, RotateCcw, BarChart3, Timer, CheckCircle2, UserCheck } from 'lucide-react';
import { RoomState, Participant, VoteSummary } from '../types';

interface SidebarOptionsProps {
  room: RoomState;
  summary: VoteSummary;
  currentUser: Participant | null;
  onRevealVotes: () => void;
  onResetVotes: () => void;
  onClearVote: () => void;
  onStartTimer: (duration: number) => void;
  onStopTimer: () => void;
}

export default function SidebarOptions({
  room,
  summary,
  currentUser,
  onRevealVotes,
  onResetVotes,
  onClearVote,
  onStartTimer,
  onStopTimer
}: SidebarOptionsProps) {
  const [customTime, setCustomTime] = useState<string>('30');
  const isHost = true; // All team members have equal access to controls

  // Format time left (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = (duration: number) => {
    if (duration > 0) {
      onStartTimer(duration);
    }
  };

  const handleCustomTimerSubmit = (e: FormEvent) => {
    e.preventDefault();
    const duration = parseInt(customTime);
    if (!isNaN(duration) && duration > 0) {
      handleStartTimer(duration);
    }
  };

  // Timer presets: [label, seconds]
  const PRESETS: [string, number][] = [
    ['10s', 10],
    ['30s', 30],
    ['1m', 60],
    ['2m', 120],
    ['5m', 300]
  ];

  const votedPercentage = summary.totalParticipants > 0 
    ? Math.round((summary.totalVoted / summary.totalParticipants) * 100) 
    : 0;

  return (
    <div className="sidebar-panel glass-panel animate-fade-in">
      {/* 1. TIMER SECTION */}
      <div>
        <h3 className="sidebar-title">
          <Timer size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-top' }} />
          Timer
        </h3>
        
        <div className="timer-container" style={{ marginTop: '1rem' }}>
          <div className="timer-display-box">
            <div className={`timer-digits ${room.timer.timeLeft <= 5 && room.timer.isRunning ? 'warning' : ''}`}>
              {formatTime(room.timer.timeLeft)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {room.timer.isRunning ? 'Estimating in progress...' : 'Timer paused'}
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="timer-presets">
            {PRESETS.map(([label, secs]) => (
              <button
                key={label}
                className={`timer-preset-btn ${room.timer.duration === secs ? 'active' : ''}`}
                onClick={() => handleStartTimer(secs)}
                disabled={!isHost || room.showVotes}
                title={!isHost ? 'Only host can start timer' : ''}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Custom Time Input */}
          {isHost && !room.showVotes && (
            <form onSubmit={handleCustomTimerSubmit} className="custom-timer-input-wrapper">
              <input
                type="number"
                min="1"
                max="3600"
                className="custom-timer-input"
                placeholder="Secs"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
              />
              <button type="submit" className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', flex: 1 }}>
                Set & Start
              </button>
            </form>
          )}

          {/* Controls */}
          {isHost && (
            <div className="timer-controls">
              {room.timer.isRunning ? (
                <button className="btn btn-danger" style={{ flex: 1, padding: '0.5rem' }} onClick={onStopTimer}>
                  <Square size={14} /> Stop
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.5rem' }}
                  onClick={() => handleStartTimer(room.timer.timeLeft || room.timer.duration)}
                  disabled={room.showVotes || room.timer.timeLeft === 0}
                >
                  <Play size={14} /> Start
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. ACTIONS SECTION */}
      <div>
        <h3 className="sidebar-title">Actions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          
          <button 
            className="btn btn-outline" 
            style={{ justifyContent: 'flex-start' }}
            onClick={onClearVote}
            disabled={currentUser?.vote === null || room.showVotes}
          >
            <RotateCcw size={14} />
            Clear My Vote
          </button>

          <button 
            className="btn btn-primary" 
            style={{ justifyContent: 'flex-start' }}
            onClick={onRevealVotes}
            disabled={!isHost || room.showVotes || summary.totalVoted === 0}
            title={!isHost ? 'Only host can reveal cards' : summary.totalVoted === 0 ? 'Nobody has voted yet' : ''}
          >
            <Eye size={14} />
            Reveal Votes
          </button>

          <button 
            className="btn btn-secondary" 
            style={{ justifyContent: 'flex-start' }}
            onClick={onResetVotes}
            disabled={!isHost}
            title={!isHost ? 'Only host can reset cards' : ''}
          >
            <RotateCcw size={14} />
            Reset Round
          </button>
        </div>
      </div>

      {/* 3. METRICS SECTION */}
      <div>
        <h3 className="sidebar-title">
          <BarChart3 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-top' }} />
          Estimation Stats
        </h3>

        <div className="stats-container" style={{ marginTop: '1rem' }}>
          <div className="stat-row">
            <span className="stat-label">Joined Players</span>
            <span className="stat-value">{summary.totalParticipants}</span>
          </div>

          <div className="stat-row" style={{ marginTop: '0.5rem' }}>
            <span className="stat-label">Voted Status</span>
            <span className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <UserCheck size={14} style={{ color: 'var(--accent-cyan)' }} />
              {summary.totalVoted} / {summary.totalParticipants} ({votedPercentage}%)
            </span>
          </div>

          <div className="lobby-divider" style={{ margin: '0.75rem 0' }}></div>

          {room.showVotes ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="stat-row">
                <span className="stat-label">Majority Estimate</span>
                <span className="stat-value highlight">
                  {summary.majorityValue || '-'}
                  {summary.majorityValue && ` (${summary.majorityCount} ${summary.majorityCount === 1 ? 'vote' : 'votes'})`}
                </span>
              </div>

              {summary.distribution && summary.distribution.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.35rem', 
                  marginTop: '0.25rem', 
                  padding: '0.5rem 0.75rem', 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  borderRadius: '8px', 
                  border: '1px solid var(--glass-border)' 
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Vote Breakdown
                  </span>
                  {summary.distribution.map(item => (
                    <div key={item.value} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {item.count} {item.count === 1 ? 'person' : 'people'}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--primary-hover)' }}>
                        Estimate: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {summary.averageVote !== null && (
                <div className="stat-row">
                  <span className="stat-label">Average Estimate</span>
                  <span className="stat-value" style={{ color: 'var(--primary-hover)' }}>{summary.averageVote}</span>
                </div>
              )}

              {summary.allVotedSame && summary.totalVoted > 1 && (
                <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
                  <div className="consensus-badge">
                    <CheckCircle2 size={12} />
                    Unanimous Consensus!
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              Waiting for host to reveal votes...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
