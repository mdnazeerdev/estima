export interface Participant {
  id: string; // Socket ID or unique identifier
  name: string;
  vote: string | null; // e.g. "0", "0.5", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89", "?", "☕", or null
  isHost: boolean;
}

export interface TimerState {
  duration: number; // in seconds
  timeLeft: number; // in seconds
  isRunning: boolean;
}

export interface RoomState {
  roomId: string;
  participants: Participant[];
  showVotes: boolean;
  timer: TimerState;
}

export interface VoteDistributionItem {
  value: string;
  count: number;
}

export interface VoteSummary {
  totalParticipants: number;
  totalVoted: number;
  majorityValue: string | null;
  majorityCount: number;
  allVotedSame: boolean;
  averageVote: number | null;
  distribution: VoteDistributionItem[];
}
