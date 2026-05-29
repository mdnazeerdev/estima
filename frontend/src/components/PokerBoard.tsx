import { useState } from 'react';
import { Users, CheckSquare, LayoutGrid, List } from 'lucide-react';
import { RoomState, Participant } from '../types';

interface PokerBoardProps {
  room: RoomState;
  currentUser: Participant | null;
  onSelectCard: (vote: string | null) => void;
}

const CARDS = ['0', '0.5', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'];

export default function PokerBoard({ room, currentUser, onSelectCard }: PokerBoardProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleCardClick = (card: string) => {
    if (currentUser?.vote === card) {
      // Toggle off if clicking the same card
      onSelectCard(null);
    } else {
      onSelectCard(card);
    }
  };

  // Find host name (omitted for flat permission structure)

  return (
    <div className="main-board-panel glass-panel animate-fade-in">
      {/* Board Header (No Room ID/Invite/Leave since they are in App Banner) */}
      <div className="board-header">
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Estimation Arena</h2>
        </div>
      </div>

      <div className="lobby-divider" style={{ margin: '0.5rem 0 1rem 0' }}></div>

      {/* Card Deck Selection for current user (Choose Your Estimate FIRST) */}
      <div className="deck-container" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0, marginBottom: '1.5rem' }}>
        <div className="deck-title">
          <span>Choose Your Estimate</span>
          {currentUser?.vote && (
            <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--accent-cyan)' }}>
              (Selected: {currentUser.vote})
            </span>
          )}
        </div>
        
        <div className="cards-list">
          {CARDS.map((card) => {
            const isSelected = currentUser?.vote === card;
            return (
              <button
                key={card}
                className={`voting-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleCardClick(card)}
                disabled={room.showVotes}
                title={room.showVotes ? 'Cannot vote while cards are revealed' : `Vote ${card}`}
              >
                {card}
              </button>
            );
          })}
        </div>
      </div>

      <div className="lobby-divider" style={{ margin: '0 0 1.5rem 0' }}></div>

      {/* Estimating Arena (Team Members SECOND) */}
      <div className="participants-section">
        <div className="participants-header-bar">
          <h3 className="participants-title">
            <Users size={16} />
            Team Members ({room.participants.length})
          </h3>
          
          <div className="view-toggles">
            <button 
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List / Column View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
        
        {viewMode === 'grid' ? (
          /* Grid View Layout */
          <div className="participants-grid">
            {room.participants.map((participant) => {
              const hasVoted = participant.vote !== null;
              const cardStateClass = room.showVotes ? 'reveal' : '';

              return (
                <div 
                  key={participant.id} 
                  className={`participant-container ${cardStateClass}`}
                >
                  <div className="card-3d-wrapper">
                    {/* Front Side: Face Down (Thinking / Voted state) */}
                    <div className={`card-face card-front ${hasVoted ? 'voted' : 'thinking'}`}>
                      {hasVoted ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <CheckSquare size={20} />
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Voted</span>
                        </div>
                      ) : (
                        <div className="pulse-indicator" />
                      )}
                    </div>

                    {/* Back Side: Face Up (Revealed values) */}
                    <div className={`card-face card-back ${participant.vote === null ? 'voted-value-null' : ''}`}>
                      {participant.vote || '?'}
                    </div>
                  </div>

                  <div className="participant-name">
                    {participant.name}
                    {participant.id === currentUser?.id && ' (You)'}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List / Column View Layout */
          <div className="participants-list-column animate-fade-in">
            {room.participants.map((participant) => {
              const hasVoted = participant.vote !== null;
              const cardStateClass = room.showVotes ? 'reveal' : '';

              return (
                <div 
                  key={participant.id} 
                  className={`participant-list-row ${cardStateClass}`}
                >
                  <div className="participant-row-info">
                    <span className="participant-row-name">
                      {participant.name}
                      {participant.id === currentUser?.id && ' (You)'}
                    </span>
                    {/* Host badge omitted for flat permission structure */}
                    <span className="participant-row-badge" style={{ 
                      backgroundColor: hasVoted ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.1)', 
                      color: hasVoted ? 'var(--accent-emerald)' : 'var(--text-muted)' 
                    }}>
                      {hasVoted ? 'Voted' : 'Thinking...'}
                    </span>
                  </div>

                  <div className="card-3d-wrapper small-card">
                    {/* Front Side: Face Down (Thinking / Voted state) */}
                    <div className={`card-face card-front ${hasVoted ? 'voted' : 'thinking'}`}>
                      {hasVoted ? (
                        <CheckSquare size={14} />
                      ) : (
                        <div className="pulse-indicator" style={{ width: '6px', height: '6px' }} />
                      )}
                    </div>

                    {/* Back Side: Face Up (Revealed values) */}
                    <div className={`card-face card-back ${participant.vote === null ? 'voted-value-null' : ''}`}>
                      {participant.vote || '?'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
