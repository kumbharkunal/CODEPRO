import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addReview, updateReview } from '../store/slices/reviewSlice';
import toast from 'react-hot-toast';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
const isDev = import.meta.env.DEV;

export const useSocket = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) {
      return;
    }

    // Create socket connection
    const token = localStorage.getItem('token');

    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: token
      }
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      if (isDev) console.log('WebSocket connected');
      setIsConnected(true);

      // Join user's room
      const userId = user._id || user.id || user.clerkId;
      socket.emit('join-room', `user_${userId}`);
    });

    socket.on('disconnect', (reason) => {
      if (isDev) console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      setIsConnected(false);
    });

    socket.on('room-joined', (data) => {
      if (isDev) console.log('Joined room:', data.roomId);
    });

    // Review events
    socket.on('review-created', (data) => {
      if (isDev) console.log('Review created:', data);

      toast.success(`New review created for PR #${data.pullRequestNumber}`, {
        duration: 4000,
        icon: '🎉',
      });

      window.dispatchEvent(new CustomEvent('review-created', { detail: data }));
    });

    socket.on('review-updated', (data) => {
      if (isDev) console.log('Review updated:', data);

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
      if (isDev) console.log('Review completed:', data);

      toast.success(
        `Review complete! Found ${data.issuesFound} issues. Quality score: ${data.qualityScore}/100`,
        { 
          duration: 6000,
        }
      );

      window.dispatchEvent(new CustomEvent('review-completed', { detail: data }));
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        const userId = user._id || user.id || user.clerkId;
        socket.emit('leave-room', `user_${userId}`);
        socket.disconnect();
      }
    };
  }, [user, dispatch]);

  return {
    socket: socketRef.current,
    isConnected,
  };
};