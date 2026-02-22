import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(sessionId) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io('http://127.0.0.1:5001', {
      query: { sessionId },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Set up event listeners
    this.socket.on('queue:position-update', (data) => {
      this.emit('positionUpdate', data);
    });

    this.socket.on('queue:trust-update', (data) => {
      this.emit('trustUpdate', data);
    });

    this.socket.on('queue:advance', (data) => {
      this.emit('advance', data);
    });

    this.socket.on('queue:size-update', (data) => {
      this.emit('sizeUpdate', data);
    });

    // Start heartbeat
    this.startHeartbeat(sessionId);
  }

  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  startHeartbeat(sessionId) {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat', { sessionId });
      }
    }, 30000);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in socket listener for ${event}:`, error);
      }
    });
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }
}

export default new SocketService();
