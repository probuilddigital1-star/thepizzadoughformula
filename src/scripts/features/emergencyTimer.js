/**
 * Emergency Dough Timer
 * Countdown timer for 2-hour emergency pizza dough
 *
 * @module features/emergencyTimer
 */

/**
 * Default timer duration: 2 hours in milliseconds
 */
export const DEFAULT_DURATION = 2 * 60 * 60 * 1000;

/**
 * Emergency Timer Class
 * Manages countdown, persistence, and notifications
 */
export class EmergencyTimer {
  /**
   * Create a new EmergencyTimer
   * @param {number} duration - Duration in milliseconds (default: 2 hours)
   */
  constructor(duration = DEFAULT_DURATION) {
    this.duration = duration;
    this.remaining = duration;
    this.intervalId = null;
    this.isRunning = false;
    this.startedAt = null;

    // Callbacks
    this.onTick = null;
    this.onComplete = null;
    this.onStateChange = null;

    // Try to restore saved state
    this.loadState();
  }

  /**
   * Start the timer
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startedAt = Date.now();
    const endTime = this.startedAt + this.remaining;

    this.intervalId = setInterval(() => {
      this.remaining = Math.max(0, endTime - Date.now());

      if (this.onTick) {
        this.onTick(this.getFormattedTime(), this.getProgress());
      }

      if (this.remaining <= 0) {
        this.complete();
      }
    }, 1000);

    this.saveState();

    if (this.onStateChange) {
      this.onStateChange('running');
    }
  }

  /**
   * Pause the timer
   */
  pause() {
    if (!this.isRunning) return;

    this.isRunning = false;
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.saveState();

    if (this.onStateChange) {
      this.onStateChange('paused');
    }
  }

  /**
   * Toggle between start and pause
   */
  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  /**
   * Reset the timer to initial duration
   */
  reset() {
    this.pause();
    this.remaining = this.duration;
    this.startedAt = null;
    this.saveState();

    if (this.onTick) {
      this.onTick(this.getFormattedTime(), this.getProgress());
    }

    if (this.onStateChange) {
      this.onStateChange('reset');
    }
  }

  /**
   * Handle timer completion
   * @private
   */
  complete() {
    this.pause();
    this.remaining = 0;

    if (this.onComplete) {
      this.onComplete();
    }

    if (this.onStateChange) {
      this.onStateChange('completed');
    }

    this.playNotification();
    this.clearState();
  }

  /**
   * Get formatted time string (HH:MM:SS)
   * @returns {string} Formatted time
   */
  getFormattedTime() {
    const hours = Math.floor(this.remaining / 3600000);
    const minutes = Math.floor((this.remaining % 3600000) / 60000);
    const seconds = Math.floor((this.remaining % 60000) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get time components
   * @returns {{hours: number, minutes: number, seconds: number}}
   */
  getTimeComponents() {
    return {
      hours: Math.floor(this.remaining / 3600000),
      minutes: Math.floor((this.remaining % 3600000) / 60000),
      seconds: Math.floor((this.remaining % 60000) / 1000)
    };
  }

  /**
   * Get progress as a percentage (0-100)
   * @returns {number} Progress percentage
   */
  getProgress() {
    return Math.round(((this.duration - this.remaining) / this.duration) * 100);
  }

  /**
   * Save timer state to localStorage
   * @private
   */
  saveState() {
    if (typeof localStorage === 'undefined') return;

    const state = {
      remaining: this.remaining,
      isRunning: this.isRunning,
      savedAt: Date.now(),
      duration: this.duration
    };

    localStorage.setItem('emergencyTimer', JSON.stringify(state));
  }

  /**
   * Load timer state from localStorage
   * @private
   */
  loadState() {
    if (typeof localStorage === 'undefined') return;

    try {
      const saved = localStorage.getItem('emergencyTimer');
      if (!saved) return;

      const state = JSON.parse(saved);

      // Calculate remaining time accounting for elapsed time since save
      if (state.isRunning) {
        const elapsed = Date.now() - state.savedAt;
        this.remaining = Math.max(0, state.remaining - elapsed);

        // Auto-start if timer was running
        if (this.remaining > 0) {
          // Defer start to allow callbacks to be set
          setTimeout(() => this.start(), 0);
        } else {
          // Timer completed while page was closed
          this.remaining = 0;
          setTimeout(() => {
            if (this.onComplete) this.onComplete();
            this.playNotification();
          }, 0);
        }
      } else {
        this.remaining = state.remaining;
      }

      // Use saved duration if available
      if (state.duration) {
        this.duration = state.duration;
      }
    } catch (e) {
      console.warn('Failed to load timer state:', e);
    }
  }

  /**
   * Clear saved state
   * @private
   */
  clearState() {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem('emergencyTimer');
  }

  /**
   * Play audio notification
   * Uses Web Audio API for a simple beep
   */
  playNotification() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const audioContext = new AudioContext();

      // Create a beep pattern: beep-beep-beep
      const playBeep = (time, frequency = 440, duration = 200) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration / 1000);

        oscillator.start(time);
        oscillator.stop(time + duration / 1000);
      };

      const now = audioContext.currentTime;
      playBeep(now, 523); // C5
      playBeep(now + 0.3, 659); // E5
      playBeep(now + 0.6, 784); // G5
      playBeep(now + 0.9, 1047); // C6

    } catch (e) {
      console.warn('Failed to play notification:', e);
    }
  }

  /**
   * Set timer duration and reset
   * @param {number} duration - New duration in milliseconds
   */
  setDuration(duration) {
    this.pause();
    this.duration = duration;
    this.remaining = duration;
    this.saveState();

    if (this.onTick) {
      this.onTick(this.getFormattedTime(), this.getProgress());
    }
  }

  /**
   * Add time to the timer
   * @param {number} milliseconds - Time to add
   */
  addTime(milliseconds) {
    this.remaining = Math.min(this.remaining + milliseconds, this.duration);
    this.saveState();

    if (this.onTick) {
      this.onTick(this.getFormattedTime(), this.getProgress());
    }
  }

  /**
   * Get current state
   * @returns {{isRunning: boolean, remaining: number, progress: number, formattedTime: string}}
   */
  getState() {
    return {
      isRunning: this.isRunning,
      remaining: this.remaining,
      progress: this.getProgress(),
      formattedTime: this.getFormattedTime()
    };
  }
}

/**
 * Create preset timers for common durations
 */
export const TIMER_PRESETS = {
  emergency: {
    name: 'Emergency Dough',
    duration: 2 * 60 * 60 * 1000, // 2 hours
    description: 'Quick same-day dough'
  },
  roomTemp: {
    name: 'Room Temp Rise',
    duration: 4 * 60 * 60 * 1000, // 4 hours
    description: 'Standard room temperature bulk ferment'
  },
  poolish: {
    name: 'Poolish/Biga',
    duration: 12 * 60 * 60 * 1000, // 12 hours
    description: 'Overnight pre-ferment'
  },
  ballRest: {
    name: 'Ball Rest',
    duration: 2 * 60 * 60 * 1000, // 2 hours
    description: 'Final ball proof before shaping'
  }
};

export default EmergencyTimer;
