import express from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { RoomState, Participant, VoteSummary } from './types';
import path from 'path';

const app = express();

// Secure application by setting various HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Turned off to allow websocket connections and static assets cleanly
}));
app.use(cors({ origin: '*' }));
app.use(express.json());

// Load SSL configuration if paths are provided
const sslKeyPath = process.env.SSL_KEY_PATH;
const sslCertPath = process.env.SSL_CERT_PATH;
const isHttpsConfigured = !!(sslKeyPath && sslCertPath && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath));

let server: http.Server | https.Server;

if (isHttpsConfigured) {
  try {
    const privateKey = fs.readFileSync(sslKeyPath!, 'utf8');
    const certificate = fs.readFileSync(sslCertPath!, 'utf8');
    const credentials = { key: privateKey, cert: certificate };
    server = https.createServer(credentials, app);
    console.log('SSL configuration loaded successfully. Initializing HTTPS server.');
  } catch (error) {
    console.error('Failed to load SSL certificates. Falling back to HTTP server.', error);
    server = http.createServer(app);
  }
} else {
  console.log('SSL paths not configured or certificates not found. Initializing HTTP server.');
  server = http.createServer(app);
}

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory room store
const rooms = new Map<string, RoomState>();

// Timer interval store (roomId -> NodeJS.Timeout)
const activeTimers = new Map<string, NodeJS.Timeout>();

// Grace period deletion store (roomId -> Timeout)
const roomCleanupTimeouts = new Map<string, NodeJS.Timeout>();

// Generates a short unique ID for the room (6 alphanumeric characters, mixed case, guaranteed mixed letters and numbers)
function generateRoomId(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const all = letters + numbers;
  let id = '';
  
  // Guarantee at least one letter and one number to enforce mixed alphanumeric content
  id += letters.charAt(Math.floor(Math.random() * letters.length));
  id += numbers.charAt(Math.floor(Math.random() * numbers.length));
  
  // Fill the remaining 4 characters
  for (let i = 0; i < 4; i++) {
    id += all.charAt(Math.floor(Math.random() * all.length));
  }
  
  // Shuffle the characters
  id = id.split('').sort(() => Math.random() - 0.5).join('');
  
  // Check uniqueness case-insensitively
  if (rooms.has(id.toLowerCase())) {
    return generateRoomId();
  }
  return id;
}

// Map a vote string to a numeric weight for comparison/sorting and average calculation
function getVoteWeight(vote: string): number {
  if (vote === '☕') return -2;
  if (vote === '?') return -1;
  const val = parseFloat(vote);
  return isNaN(val) ? -3 : val;
}

// Calculate voting statistics for a room
function calculateVoteSummary(room: RoomState): VoteSummary {
  const participants = room.participants;
  const totalParticipants = participants.length;
  const votedParticipants = participants.filter(p => p.vote !== null);
  const totalVoted = votedParticipants.length;

  if (totalVoted === 0) {
    return {
      totalParticipants,
      totalVoted,
      majorityValue: null,
      majorityCount: 0,
      allVotedSame: false,
      averageVote: null,
      distribution: []
    };
  }

  // Count frequencies
  const frequencies: Record<string, number> = {};
  let numericSum = 0;
  let numericCount = 0;

  votedParticipants.forEach(p => {
    const v = p.vote!;
    frequencies[v] = (frequencies[v] || 0) + 1;

    const weight = getVoteWeight(v);
    if (weight >= 0) {
      numericSum += weight;
      numericCount++;
    }
  });

  // Find max count
  let maxCount = 0;
  const maxGroups: string[] = [];

  Object.entries(frequencies).forEach(([value, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxGroups.length = 0; // clear
      maxGroups.push(value);
    } else if (count === maxCount) {
      maxGroups.push(value);
    }
  });

  // Resolve tie-breaker: sort tied values by weight descending and pick the highest
  maxGroups.sort((a, b) => getVoteWeight(b) - getVoteWeight(a));
  const majorityValue = maxGroups[0] || null;

  const allVotedSame = Object.keys(frequencies).length === 1;
  const averageVote = numericCount > 0 ? parseFloat((numericSum / numericCount).toFixed(1)) : null;

  // Calculate sorted vote distribution
  const distribution = Object.entries(frequencies)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return getVoteWeight(b.value) - getVoteWeight(a.value);
    });

  return {
    totalParticipants,
    totalVoted,
    majorityValue,
    majorityCount: maxCount,
    allVotedSame,
    averageVote,
    distribution
  };
}

// Broadcast room update along with calculated stats
function broadcastRoomUpdate(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const summary = calculateVoteSummary(room);
  io.to(roomId).emit('room-update', { room, summary });
}

io.on('connection', (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  // Track what room this socket is currently in to handle clean disconnects
  let currentRoomId: string | null = null;

  // 1. Create Room
  socket.on('create-room', ({ name }: { name: string }, callback) => {
    const roomId = generateRoomId();
    const mapKey = roomId.toLowerCase();
    const newRoom: RoomState = {
      roomId, // original mixed-case ID for display
      participants: [
        {
          id: socket.id,
          name: name.trim() || 'Host',
          vote: null,
          isHost: true
        }
      ],
      showVotes: false,
      timer: {
        duration: 30, // default to 30s
        timeLeft: 30,
        isRunning: false
      }
    };

    rooms.set(mapKey, newRoom);
    socket.join(mapKey);
    currentRoomId = mapKey;

    console.log(`Room created: ${roomId} by ${name}`);
    callback({ success: true, roomId, room: newRoom });
    broadcastRoomUpdate(mapKey);
  });

  // 2. Join Room
  socket.on('join-room', ({ roomId, name }: { roomId: string; name: string }, callback) => {
    const cleanRoomId = roomId.trim().toLowerCase();
    const room = rooms.get(cleanRoomId);

    if (!room) {
      callback({ success: false, message: 'Room not found.' });
      return;
    }

    // Cancel pending cleanup timeout if this was the last person rejoining
    if (roomCleanupTimeouts.has(cleanRoomId)) {
      console.log(`Cancelling cleanup timeout for room ${cleanRoomId}`);
      clearTimeout(roomCleanupTimeouts.get(cleanRoomId)!);
      roomCleanupTimeouts.delete(cleanRoomId);
    }

    // Check if user is already in the room
    const exists = room.participants.find(p => p.id === socket.id);
    if (!exists) {
      const participant: Participant = {
        id: socket.id,
        name: name.trim() || `Player ${room.participants.length + 1}`,
        vote: null,
        isHost: room.participants.length === 0 // Make host if room was somehow empty
      };
      room.participants.push(participant);
    }

    socket.join(cleanRoomId);
    currentRoomId = cleanRoomId;

    console.log(`User ${name} joined room: ${cleanRoomId}`);
    callback({ success: true, room });
    broadcastRoomUpdate(cleanRoomId);
  });

  // 3. Submit Vote
  socket.on('submit-vote', ({ roomId, vote }: { roomId: string; vote: string | null }) => {
    const cleanRoomId = roomId.trim().toLowerCase();
    const room = rooms.get(cleanRoomId);
    if (!room) return;

    const participant = room.participants.find(p => p.id === socket.id);
    if (participant) {
      participant.vote = vote;
      console.log(`User ${participant.name} voted: ${vote} in room ${cleanRoomId}`);
      broadcastRoomUpdate(cleanRoomId);
    }
  });

  // 4. Clear Vote (for individual)
  socket.on('clear-vote', ({ roomId }: { roomId: string }) => {
    const cleanRoomId = roomId.trim().toLowerCase();
    const room = rooms.get(cleanRoomId);
    if (!room) return;

    const participant = room.participants.find(p => p.id === socket.id);
    if (participant) {
      participant.vote = null;
      console.log(`User ${participant.name} cleared vote in room ${cleanRoomId}`);
      broadcastRoomUpdate(cleanRoomId);
    }
  });

  // 5. Reset Votes (clears all participants' votes & hides them)
  socket.on('reset-votes', ({ roomId }: { roomId: string }) => {
    const cleanRoomId = roomId.trim().toLowerCase();
    const room = rooms.get(cleanRoomId);
    if (!room) return;

    room.participants.forEach(p => {
      p.vote = null;
    });
    room.showVotes = false;

    // Reset and stop the timer if it's running
    if (room.timer.isRunning) {
      const timerInterval = activeTimers.get(cleanRoomId);
      if (timerInterval) {
        clearInterval(timerInterval);
        activeTimers.delete(cleanRoomId);
      }
      room.timer.isRunning = false;
    }
    room.timer.timeLeft = room.timer.duration;

    console.log(`Votes reset for room ${cleanRoomId}`);
    broadcastRoomUpdate(cleanRoomId);
  });

  // 6. Reveal Votes
  socket.on('reveal-votes', ({ roomId }: { roomId: string }) => {
    const cleanRoomId = roomId.trim().toLowerCase();
    const room = rooms.get(cleanRoomId);
    if (!room) return;

    room.showVotes = true;

    // Stop timer if it's running when votes are revealed
    if (room.timer.isRunning) {
      const timerInterval = activeTimers.get(cleanRoomId);
      if (timerInterval) {
        clearInterval(timerInterval);
        activeTimers.delete(cleanRoomId);
      }
      room.timer.isRunning = false;
    }

    console.log(`Votes revealed for room ${cleanRoomId}`);
    broadcastRoomUpdate(cleanRoomId);
  });

  // 7. Start Timer
  socket.on('start-timer', ({ roomId, duration }: { roomId: string; duration: number }) => {
    const cleanRoomId = roomId.trim().toLowerCase();
    const room = rooms.get(cleanRoomId);
    if (!room) return;

    // Clear any active timer first
    const existingTimer = activeTimers.get(cleanRoomId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    room.timer.duration = duration;
    room.timer.timeLeft = duration;
    room.timer.isRunning = true;

    console.log(`Timer started in room ${cleanRoomId} for ${duration}s`);
    broadcastRoomUpdate(cleanRoomId);

    const timerInterval = setInterval(() => {
      const currentRoom = rooms.get(cleanRoomId);
      if (!currentRoom || !currentRoom.timer.isRunning) {
        clearInterval(timerInterval);
        activeTimers.delete(cleanRoomId);
        return;
      }

      currentRoom.timer.timeLeft -= 1;

      if (currentRoom.timer.timeLeft <= 0) {
        currentRoom.timer.timeLeft = 0;
        currentRoom.timer.isRunning = false;
        // Automatically reveal votes when time runs out
        currentRoom.showVotes = true;
        clearInterval(timerInterval);
        activeTimers.delete(cleanRoomId);
        console.log(`Timer ended and votes auto-revealed in room ${cleanRoomId}`);
      }

      broadcastRoomUpdate(cleanRoomId);
    }, 1000);

    activeTimers.set(cleanRoomId, timerInterval);
  });

  // 8. Stop Timer
  socket.on('stop-timer', ({ roomId }: { roomId: string }) => {
    const cleanRoomId = roomId.trim().toLowerCase();
    const room = rooms.get(cleanRoomId);
    if (!room) return;

    room.timer.isRunning = false;
    const timerInterval = activeTimers.get(cleanRoomId);
    if (timerInterval) {
      clearInterval(timerInterval);
      activeTimers.delete(cleanRoomId);
    }

    console.log(`Timer stopped in room ${cleanRoomId}`);
    broadcastRoomUpdate(cleanRoomId);
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        const index = room.participants.findIndex(p => p.id === socket.id);
        if (index !== -1) {
          const removedParticipant = room.participants.splice(index, 1)[0];
          console.log(`Removed participant ${removedParticipant.name} from room ${currentRoomId}`);

          // If room is empty, schedule cleanup with a 5-second grace period (to handle tab refreshes)
          if (room.participants.length === 0) {
            const roomIdToClean = currentRoomId;
            console.log(`Room ${roomIdToClean} is empty. Deletion scheduled in 5 seconds.`);
            
            if (roomCleanupTimeouts.has(roomIdToClean)) {
              clearTimeout(roomCleanupTimeouts.get(roomIdToClean)!);
            }

            const timeout = setTimeout(() => {
              rooms.delete(roomIdToClean);
              roomCleanupTimeouts.delete(roomIdToClean);
              
              const timerInterval = activeTimers.get(roomIdToClean);
              if (timerInterval) {
                clearInterval(timerInterval);
                activeTimers.delete(roomIdToClean);
              }
              console.log(`Grace period expired. Room ${roomIdToClean} deleted.`);
            }, 5000);

            roomCleanupTimeouts.set(roomIdToClean, timeout);
          } else {
            // If the disconnected user was the host, reassign host to the first remaining participant
            if (removedParticipant.isHost) {
              room.participants[0].isHost = true;
              console.log(`Reassigned host in room ${currentRoomId} to ${room.participants[0].name}`);
            }
            broadcastRoomUpdate(currentRoomId);
          }
        }
      }
    }
  });
});

// Serve static frontend assets in production mode
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Fallback all non-API routes to index.html for SPA router
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

const PORT = process.env.PORT || (isHttpsConfigured ? 443 : 5000);
server.listen(PORT, () => {
  const protocol = isHttpsConfigured ? 'HTTPS' : 'HTTP';
  console.log(`${protocol} Server listening on port ${PORT}`);
});
