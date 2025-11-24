import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
const isDev = import.meta.env.DEV;

export const useSocket = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const lastConnectedTimeRef = useRef<number>(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectToastShownRef = useRef<boolean>(false);

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) {
      return;
    }

    // Create socket connection with enhanced reliability
    const token = localStorage.getItem('token');

    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity, // ✅ Never give up reconnecting
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000, // ✅ Max 10s between attempts
      timeout: 20000, // ✅ 20s connection timeout
      auth: {
        token: token
      }
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      if (isDev) console.log('✅ WebSocket connected');
      setIsConnected(true);

      // Show reconnection success toast if this was a reconnection
      if (reconnectToastShownRef.current) {
        toast.success('Connection restored!', {
          duration: 3000,
          icon: '✅',
        });
        reconnectToastShownRef.current = false;
      }

      // Join user's personal room
      const userId = user.id || user.clerkId;
      const userRoomId = `user_${userId}`;

      // Join team room if user has a team
      const teamId = user.teamId;
      const teamRoomId = teamId ? `team_${teamId}` : null;

      if (isDev) {
        console.log('User object:', user);
        console.log('Extracted userId:', userId);
        console.log('Joining user room:', userRoomId);
        if (teamRoomId) console.log('Joining team room:', teamRoomId);
      }

      // Join personal room
      socket.emit('join-room', userRoomId);

      // Join team room for team-wide notifications
      if (teamRoomId) {
        socket.emit('join-room', teamRoomId);
      }

      // Start heartbeat
      startHeartbeat(socket);
    });

    socket.on('disconnect', (reason) => {
      if (isDev) console.log('⚠️ WebSocket disconnected:', reason);
      setIsConnected(false);

      // Show reconnecting toast
      if (reason !== 'io client disconnect') {
        toast.error('Connection lost. Reconnecting...', {
          duration: Infinity,
          icon: '🔄',
          id: 'reconnecting-toast', // Use ID to prevent duplicates
        });
        reconnectToastShownRef.current = true;
      }

      // Stop heartbeat
      stopHeartbeat();
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      setIsConnected(false);
    });

    socket.on('room-joined', (data) => {
      if (isDev) {
        console.log('✅ Successfully joined room:', data.roomId);
        console.log('Socket ID:', data.socketId);
      }

      // Only dispatch event if enough time has passed since last connection
      // This prevents rapid successive events during reconnections
      const now = Date.now();
      const timeSinceLastConnect = now - lastConnectedTimeRef.current;
      const MIN_CONNECT_INTERVAL = 5000; // 5 seconds minimum between connection events

      if (timeSinceLastConnect >= MIN_CONNECT_INTERVAL) {
        lastConnectedTimeRef.current = now;
        // Dispatch event to trigger reviews refresh on connection
        // This ensures we get any reviews created while user was offline
        window.dispatchEvent(new CustomEvent('socket-connected'));
      } else {
        if (isDev) {
          console.log(`Skipping socket-connected event (last dispatched ${timeSinceLastConnect}ms ago)`);
        }
      }
    });

    // Heartbeat response
    socket.on('pong', () => {
      if (isDev) console.log('💓 Heartbeat OK');
    });

    // Review events
    socket.on('review-created', (data) => {
      console.log('🎉 Review created notification received:', data);

      toast.success(`New review created for PR #${data.pullRequestNumber}`, {
        duration: 4000,
        icon: '🎉',
      });

      window.dispatchEvent(new CustomEvent('review-created', { detail: data }));
    });

    socket.on('review-updated', (data) => {
      console.log('📝 Review updated notification received:', data);

      const icon = data.status === 'in_progress' ? '⚙️' :
        data.status === 'completed' ? '✅' :
          data.status === 'failed' ? '❌' : '📝';

      toast(data.message || 'Review status updated', {
        icon: icon,
        duration: 3000,
      });

      window.dispatchEvent(new CustomEvent('review-updated', { detail: data }));
    });

    socket.on('review-completed', (data) => {
      console.log('✅ Review completed notification received:', data);

      toast.success(
        `Review complete! Found ${data.issuesFound} issues. Quality score: ${data.qualityScore}/100`,
        {
          duration: 6000,
        }
      );

      window.dispatchEvent(new CustomEvent('review-completed', { detail: data }));
    });

    // Visibility change - reconnect when tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        console.log('Tab became visible, reconnecting socket...');
        socket.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      stopHeartbeat();
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (socket) {
        const userId = user.id || user.clerkId;
        const teamId = user.teamId;

        socket.emit('leave-room', `user_${userId}`);
        if (teamId) {
          socket.emit('leave-room', `team_${teamId}`);
        }
        socket.disconnect();
      }
    };
  }, [user, dispatch]);

  // Heartbeat functions
  const startHeartbeat = (socket: Socket) => {
    stopHeartbeat(); // Clear any existing interval

    heartbeatIntervalRef.current = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 25000); // Every 25 seconds
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
  };
};