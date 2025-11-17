import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer;

export const initializeSocket = (httpServer: HTTPServer) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:4000',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log('✅ Client connected:', socket.id);
        
        // Log authentication data for debugging
        const authToken = socket.handshake.auth?.token;
        console.log('🔐 Auth token present:', !!authToken);

        socket.on('join-room', (roomId: string) => {
            socket.join(roomId);
            console.log(`🚪 Client ${socket.id} joined room: ${roomId}`);
            
            // Get the number of clients in this room
            const room = io.sockets.adapter.rooms.get(roomId);
            const clientCount = room ? room.size : 0;
            console.log(`📊 Room "${roomId}" now has ${clientCount} client(s)`);
            
            // Send confirmation back to client
            socket.emit('room-joined', { 
                roomId, 
                socketId: socket.id,
                success: true 
            });
        });

        socket.on('leave-room', (roomId: string) => {
            socket.leave(roomId);
            console.log(`🚪 Client ${socket.id} left room: ${roomId}`);
        });

        socket.on('disconnect', () => {
            console.log('❌ Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};