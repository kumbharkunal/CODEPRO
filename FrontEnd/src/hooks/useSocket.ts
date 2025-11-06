import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addReview, updateReview } from '@/store/slices/reviewSlice';
import toast from 'react-hot-toast';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

export const useSocket = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) return;

    // Create socket connection
    const token = localStorage.getItem('token');
    const socket = io(WS_URL, {
      transports: ['websocket'],
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
      console.log('WebSocket connected:', socket.id);
      setIsConnected(true);

      // 🔥 FIX 3: Join user's room - make sure user.id or user._id matches backend
      const userId = user._id || user.id;
      console.log(`Joining room: user_${userId}`);
      socket.emit('join-room', `user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Review events
    socket.on('review-created', (data) => {
      console.log('✅ WebSocket: Review created event received:', data);

      // Show toast notification
      toast.success(`New review created for PR #${data.pullRequestNumber}`);

      // 🔥 Optionally dispatch to Redux store
      // dispatch(addReview(data));

      // You can trigger a refetch here if needed
      window.dispatchEvent(new CustomEvent('review-created', { detail: data }));
    });

    socket.on('review-updated', (data) => {
      console.log('✅ WebSocket: Review updated event received:', data);

      toast(data.message || 'Review status updated', {
        icon: data.status === 'in_progress' ? '⚙️' : '📝',
      });

      // Trigger refetch
      window.dispatchEvent(new CustomEvent('review-updated', { detail: data }));
    });

    socket.on('review-completed', (data) => {
      console.log('✅ WebSocket: Review completed event received:', data);

      toast.success(
        `Review complete! Found ${data.issuesFound} issues. Quality score: ${data.qualityScore}/100`,
        { duration: 5000 }
      );

      // Trigger refetch
      window.dispatchEvent(new CustomEvent('review-completed', { detail: data }));
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        const userId = user.id;
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