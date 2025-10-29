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
    const socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
      setIsConnected(true);
      
      // Join user's room
      socket.emit('join-room', `user_${user.id}`);
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
      console.log('Review created:', data);
      
      // Show toast notification
      toast.success(`New review created for PR #${data.pullRequestNumber}`);
      
      // Note: We'll fetch the full review from API
      // WebSocket just notifies, then we fetch latest data
    });

    socket.on('review-updated', (data) => {
      console.log('Review updated:', data);
      
      toast.info(data.message || 'Review status updated');
    });

    socket.on('review-completed', (data) => {
      console.log('Review completed:', data);
      
      toast.success(
        `Review complete! Found ${data.issuesFound} issues. Quality score: ${data.qualityScore}/100`,
        { duration: 5000 }
      );
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.emit('leave-room', `user_${user.id}`);
        socket.disconnect();
      }
    };
  }, [user, dispatch]);

  return {
    socket: socketRef.current,
    isConnected,
  };
};