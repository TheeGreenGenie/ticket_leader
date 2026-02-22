import { streamBehavior } from '../api/games';

class BehaviorCollector {
  constructor() {
    this.events = [];
    this.sessionId = null;
    this.isCollecting = false;
    this.flushInterval = null;
    this.lastMousePos = { x: 0, y: 0 };
    this.mouseMovementCount = 0;
  }

  start(sessionId) {
    if (this.isCollecting) return;

    this.sessionId = sessionId;
    this.isCollecting = true;
    this.events = [];

    // Add event listeners
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('scroll', this.handleScroll);
    document.addEventListener('click', this.handleClick);
    document.addEventListener('keypress', this.handleKeypress);

    // Flush events every 5 seconds
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5000);

    console.log('Behavior collection started');
  }

  stop() {
    if (!this.isCollecting) return;

    this.isCollecting = false;

    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('keypress', this.handleKeypress);

    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    // Final flush
    this.flush();
    this.sessionId = null;

    console.log('Behavior collection stopped');
  }

  handleMouseMove = (e) => {
    // Throttle mouse events
    this.mouseMovementCount++;
    if (this.mouseMovementCount % 10 !== 0) return;

    const dx = e.clientX - this.lastMousePos.x;
    const dy = e.clientY - this.lastMousePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Calculate entropy (variance in movement)
    const entropy = Math.min(1, distance / 100);

    this.events.push({
      type: 'mouse_move',
      timestamp: Date.now(),
      data: {
        x: e.clientX,
        y: e.clientY,
        dx,
        dy,
        distance
      },
      entropy
    });

    this.lastMousePos = { x: e.clientX, y: e.clientY };
  };

  handleScroll = () => {
    this.events.push({
      type: 'scroll',
      timestamp: Date.now(),
      data: {
        scrollY: window.scrollY,
        scrollX: window.scrollX
      },
      entropy: 0.5
    });
  };

  handleClick = (e) => {
    this.events.push({
      type: 'click',
      timestamp: Date.now(),
      data: {
        x: e.clientX,
        y: e.clientY,
        target: e.target.tagName
      },
      entropy: 0.7
    });
  };

  handleKeypress = () => {
    this.events.push({
      type: 'keypress',
      timestamp: Date.now(),
      data: {},
      entropy: 0.6
    });
  };

  async flush() {
    if (this.events.length === 0 || !this.sessionId) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await streamBehavior(this.sessionId, eventsToSend);
    } catch (error) {
      console.error('Failed to stream behavior:', error);
      // Re-add events on failure
      this.events = [...eventsToSend, ...this.events];
    }
  }
}

export default new BehaviorCollector();
