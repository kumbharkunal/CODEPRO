import { getIO } from '../config/socket';

/**
 * Broadcasts a WebSocket notification to both user and team rooms
 * @param userId - User ID to send personal notification to
 * @param teamId - Team ID to send team-wide notification to
 * @param event - Event name (e.g., 'review-created', 'review-updated')
 * @param data - Data payload to send
 */
export const broadcastToUserAndTeam = (
    userId: string,
    teamId: string | null | undefined,
    event: string,
    data: any
) => {
    try {
        const io = getIO();
        const userRoomId = `user_${userId}`;
        const teamRoomId = teamId ? `team_${teamId}` : null;

        // Count clients
        const userRoom = io.sockets.adapter.rooms.get(userRoomId);
        const userClients = userRoom ? userRoom.size : 0;

        let teamClients = 0;
        if (teamRoomId) {
            const teamRoom = io.sockets.adapter.rooms.get(teamRoomId);
            teamClients = teamRoom ? teamRoom.size : 0;
        }

        console.log(`📊 Broadcasting "${event}" to user room "${userRoomId}" - ${userClients} client(s)`);
        if (teamRoomId) {
            console.log(`📊 Broadcasting "${event}" to team room "${teamRoomId}" - ${teamClients} client(s)`);
        }

        // Send to user's personal room
        io.to(userRoomId).emit(event, data);

        // Send to team room (all team members)
        if (teamRoomId) {
            io.to(teamRoomId).emit(event, data);
        }

        console.log(`✅ Notification "${event}" sent to ${userClients} user client(s)${teamRoomId ? ` and ${teamClients} team client(s)` : ''}`);

        if (userClients === 0 && teamClients === 0) {
            console.warn(`⚠️ WARNING: No clients connected. "${event}" notification not delivered.`);
        }
    } catch (error) {
        console.error(`❌ Error broadcasting "${event}":`, error);
    }
};
