import { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import JoinRoom from './components/JoinRoom';
import PokerBoard from './components/PokerBoard';
import SidebarOptions from './components/SidebarOptions';
import { RoomState, Participant, VoteSummary } from './types';
import { Palette, Copy, Check, LogOut } from 'lucide-react';
import LogoIcon from './components/LogoIcon';

// Connect to backend port 5000 in local dev, or the same origin/host in production (defaulting to https://estima.io)
const BACKEND_URL = 
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : (window.location.origin.includes('estima.io') ? window.location.origin : 'https://estima.io');

type ThemeType = 'default' | 'light' | 'cyberpunk' | 'sunset';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [summary, setSummary] = useState<VoteSummary | null>(null);
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialRoomId, setInitialRoomId] = useState<string>('');

  // Theme state
  const [theme, setTheme] = useState<ThemeType>('light');
  const [copied, setCopied] = useState(false);

  // Sync theme with body element for full viewport backgrounds
  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  // Extract Room ID from query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setInitialRoomId(roomParam.trim());
    }
  }, []);

  // Initialize Socket.io Connection
  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      autoConnect: true,
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server, socket ID:', newSocket.id);
      
      // Auto-rejoin room on page refresh / reconnection
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      const savedName = sessionStorage.getItem('estima_user_name');

      if (roomParam && savedName) {
        const roomId = roomParam.trim().toLowerCase();
        console.log(`Auto-rejoining room: ${roomId} as ${savedName}`);
        
        newSocket.emit('join-room', { roomId, name: savedName }, (response: any) => {
          if (response.success) {
            setRoom(response.room);
          } else {
            console.warn('Auto-rejoin failed:', response.message);
            // Clear expired or invalid session data
            sessionStorage.removeItem('estima_user_name');
            const newUrl = window.location.origin;
            window.history.pushState({ path: newUrl }, '', newUrl);
          }
        });
      }
    });

    newSocket.on('connect_error', () => {
      setError('Could not connect to the real-time server. Please make sure the backend is running.');
    });

    // Listen for room updates from server
    newSocket.on('room-update', ({ room: updatedRoom, summary: updatedSummary }: { room: RoomState; summary: VoteSummary }) => {
      setRoom(updatedRoom);
      setSummary(updatedSummary);

      // Update current user state based on socket ID
      const user = updatedRoom.participants.find(p => p.id === newSocket.id);
      if (user) {
        setCurrentUser(user);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Actions
  const handleCreateRoom = (name: string) => {
    if (!socket) return;
    setError(null);

    socket.emit('create-room', { name }, (response: any) => {
      if (response.success) {
        setRoom(response.room);
        sessionStorage.setItem('estima_user_name', name);

        // Update URL query parameters without reloading
        const newUrl = `${window.location.origin}?room=${response.roomId}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
      } else {
        setError(response.message || 'Failed to create room.');
      }
    });
  };

  const handleJoinRoom = (name: string, roomId: string) => {
    if (!socket) return;
    setError(null);

    socket.emit('join-room', { roomId, name }, (response: any) => {
      if (response.success) {
        setRoom(response.room);
        sessionStorage.setItem('estima_user_name', name);

        // Update URL query parameters without reloading
        const newUrl = `${window.location.origin}?room=${roomId}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
      } else {
        setError(response.message || 'Failed to join room.');
      }
    });
  };

  const handleSelectCard = (vote: string | null) => {
    if (!socket || !room) return;
    socket.emit('submit-vote', { roomId: room.roomId, vote });
  };

  const handleClearVote = () => {
    if (!socket || !room) return;
    socket.emit('clear-vote', { roomId: room.roomId });
  };

  const handleResetVotes = () => {
    if (!socket || !room) return;
    socket.emit('reset-votes', { roomId: room.roomId });
  };

  const handleRevealVotes = () => {
    if (!socket || !room) return;
    socket.emit('reveal-votes', { roomId: room.roomId });
  };

  const handleStartTimer = (duration: number) => {
    if (!socket || !room) return;
    socket.emit('start-timer', { roomId: room.roomId, duration });
  };

  const handleStopTimer = () => {
    if (!socket || !room) return;
    socket.emit('stop-timer', { roomId: room.roomId });
  };

  const handleLeaveRoom = () => {
    sessionStorage.removeItem('estima_user_name');
    // Reset browser address and reload to clean state
    window.location.href = window.location.origin;
  };

  const handleCopyLink = () => {
    if (!room) return;
    const inviteLink = `${window.location.origin}?room=${room.roomId}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleTheme = () => {
    const themes: ThemeType[] = ['light', 'default', 'cyberpunk', 'sunset'];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <div className={`app-container theme-${theme}`}>
      {/* Header Bar - only shown inside a room */}
      {room !== null && (
        <header className="app-header glass-panel animate-fade-in">
          <div className="logo-container">
            <div className="logo-icon" style={{ padding: '4px' }}>
              <LogoIcon />
            </div>
            <h1 className="logo-text">Estima</h1>
          </div>

          {/* Room Info / Invite Banner Actions (Center Header) */}
          <div className="header-actions-center">
            <div className="header-room-title">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Room ID:</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--primary-hover)', fontWeight: 'bold' }}>{room.roomId}</span>
            </div>

            <div className="invite-panel">
              <span className="invite-text">Invite Link</span>
              <button className="copy-btn" onClick={handleCopyLink} title="Copy invite link">
                {copied ? <Check size={16} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Header Right (Theme and Optional Leave buttons) */}
          <div className="header-right-panel">
            <button
              className="theme-selector-btn"
              onClick={toggleTheme}
              title={`Switch Theme (Current: ${theme === 'default' ? 'Dark' : theme})`}
            >
              <Palette size={18} />
            </button>

            <button className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={handleLeaveRoom}>
              <LogOut size={14} />
              Leave
            </button>
          </div>
        </header>
      )}

      {/* Main Body */}
      {room === null ? (
        <JoinRoom
          onJoin={handleJoinRoom}
          onCreate={handleCreateRoom}
          initialRoomId={initialRoomId}
          error={error}
        />
      ) : (
        <div className="board-grid">
          <PokerBoard
            room={room}
            currentUser={currentUser}
            onSelectCard={handleSelectCard}
          />
          <SidebarOptions
            room={room}
            summary={summary || {
              totalParticipants: 0,
              totalVoted: 0,
              majorityValue: null,
              majorityCount: 0,
              allVotedSame: false,
              averageVote: null,
              distribution: []
            }}
            currentUser={currentUser}
            onRevealVotes={handleRevealVotes}
            onResetVotes={handleResetVotes}
            onClearVote={handleClearVote}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
          />
        </div>
      )}

      {/* Info Footer */}
      <footer className="info-footer">
        Estima &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
}

