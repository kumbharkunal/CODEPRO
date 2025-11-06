import { useSocketContext } from '@/contexts/SocketContext';
import { useAppSelector } from '@/store/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function SocketDebugPanel() {
  const { socket, isConnected } = useSocketContext();
  const user = useAppSelector(state => state.auth.user);

  const testToast = () => {
    toast.success('Test toast working! 🎉');
  };

  const testSocket = () => {
    if (!socket) {
      toast.error('Socket not initialized');
      return;
    }

    const userId = user?.id;
    console.log('🧪 Manual test - User ID:', userId);
    console.log('🧪 Socket ID:', socket.id);
    console.log('🧪 Socket connected:', socket.connected);
    
    // Re-emit join room
    socket.emit('join-room', `user_${userId}`);
    toast('Join room request sent. Check console for confirmation.', { icon: '🔍' });
  };

  const testBackendEmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/reviews/test-notification`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ Backend test response:', response.data);
      toast.success('Backend emitted WebSocket event! Check if you received it.', {
        duration: 5000
      });
    } catch (error: any) {
      console.error('❌ Backend test failed:', error);
      toast.error('Failed to trigger backend emit: ' + error.message);
    }
  };

  const triggerManualEvent = () => {
    // This simulates receiving a WebSocket event
    window.dispatchEvent(new CustomEvent('review-created', {
      detail: {
        pullRequestNumber: 999,
        pullRequestTitle: 'Manual Test',
        reviewId: 'test123',
        status: 'pending',
        timestamp: new Date().toISOString(),
      }
    }));
    
    toast.success('Manual event dispatched! Check if other components react.');
  };

  return (
    <Card className="p-4 space-y-4 border-2 border-dashed">
      <h3 className="font-bold text-lg">🔧 Socket Debug Panel</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Connection Status:</span>
          <span className={isConnected ? 'text-green-500' : 'text-red-500'}>
            {isConnected ? '✅ Connected' : '❌ Disconnected'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Socket ID:</span>
          <span className="font-mono text-xs">{socket?.id || 'N/A'}</span>
        </div>
        
        <div className="flex justify-between">
          <span>User ID:</span>
          <span className="font-mono text-xs">
            {user?.id || 'N/A'}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Room:</span>
          <span className="font-mono text-xs">
            user_{user?.id || 'N/A'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Button onClick={testToast} variant="outline" size="sm" className="w-full">
          1. Test Toast 🍞
        </Button>
        <Button onClick={testSocket} variant="outline" size="sm" className="w-full">
          2. Test Socket Connection 🔌
        </Button>
        <Button onClick={testBackendEmit} variant="default" size="sm" className="w-full">
          3. Test Backend Emit 🚀
        </Button>
        <Button onClick={triggerManualEvent} variant="outline" size="sm" className="w-full">
          4. Trigger Manual Event 🎯
        </Button>
      </div>

      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
        <strong>How to use:</strong><br />
        1. Click "Test Toast" - Should show a toast immediately<br />
        2. Click "Test Socket Connection" - Check console<br />
        3. Click "Test Backend Emit" - Should trigger real WebSocket<br />
        4. Open browser console (F12) for detailed logs
      </div>
    </Card>
  );
}