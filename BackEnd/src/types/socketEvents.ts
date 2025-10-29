// WebSocket Events Documentation

export enum SocketEvents {
  // Connection events
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  
  // Room events
  JOIN_ROOM = 'join-room',
  LEAVE_ROOM = 'leave-room',
  
  // Review events
  REVIEW_CREATED = 'review-created',
  REVIEW_UPDATED = 'review-updated',
  REVIEW_COMPLETED = 'review-completed',
  REVIEW_FAILED = 'review-failed',
  
  // Notification events
  NOTIFICATION = 'notification',
}

export interface ReviewUpdatedPayload {
  reviewId: string;
  status: string;
  message: string;
  timestamp: string;
}

export interface ReviewCompletedPayload {
  reviewId: string;
  pullRequestTitle: string;
  issuesFound: number;
  qualityScore?: number;
  summary: string;
  timestamp: string;
}

export interface NotificationPayload {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
}