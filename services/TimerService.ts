// Timer service for aptitude tests and practice sessions
import { TimerState, TimerCallback } from '../types/aptitude'

export class TimerService {
  private startTime: Date | null = null
  private pausedTime: number = 0 // Total paused time in milliseconds
  private duration: number = 0 // Total duration in seconds
  private intervalId: NodeJS.Timeout | null = null
  private callbacks: TimerCallback[] = []
  private isRunning: boolean = false
  private isPaused: boolean = false

  constructor() {
    this.reset()
  }

  /**
   * Start the timer with specified duration
   */
  start(durationInSeconds: number): void {
    if (this.isRunning) {
      console.warn('Timer is already running')
      return
    }

    this.duration = durationInSeconds
    this.startTime = new Date()
    this.pausedTime = 0
    this.isRunning = true
    this.isPaused = false

    this.startInterval()
  }

  /**
   * Resume timer from paused state
   */
  resume(): void {
    if (!this.isPaused) {
      console.warn('Timer is not paused')
      return
    }

    this.isPaused = false
    this.isRunning = true
    this.startTime = new Date(Date.now() - this.getElapsedTime() * 1000)
    this.startInterval()
  }

  /**
   * Pause the timer
   */
  pause(): void {
    if (!this.isRunning || this.isPaused) {
      console.warn('Timer is not running or already paused')
      return
    }

    this.isPaused = true
    this.isRunning = false
    this.pausedTime += this.getElapsedTime() * 1000
    this.clearInterval()
  }

  /**
   * Stop the timer completely
   */
  stop(): void {
    this.isRunning = false
    this.isPaused = false
    this.clearInterval()
  }

  /**
   * Reset the timer to initial state
   */
  reset(): void {
    this.stop()
    this.startTime = null
    this.pausedTime = 0
    this.duration = 0
  }

  /**
   * Get remaining time in seconds
   */
  getRemainingTime(): number {
    if (!this.startTime) return this.duration

    const elapsed = this.getElapsedTime()
    const remaining = Math.max(0, this.duration - elapsed)
    return Math.floor(remaining)
  }

  /**
   * Get elapsed time in seconds
   */
  getElapsedTime(): number {
    if (!this.startTime) return 0

    if (this.isPaused) {
      return this.pausedTime / 1000
    }

    const now = Date.now()
    const elapsed = (now - this.startTime.getTime() + this.pausedTime) / 1000
    return elapsed
  }

  /**
   * Get current timer state
   */
  getState(): TimerState {
    return {
      timeRemaining: this.getRemainingTime(),
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      totalTime: this.duration
    }
  }

  /**
   * Check if timer has expired
   */
  isExpired(): boolean {
    return this.getRemainingTime() <= 0 && this.duration > 0
  }

  /**
   * Get progress as percentage (0-100)
   */
  getProgress(): number {
    if (this.duration === 0) return 0
    const elapsed = this.getElapsedTime()
    return Math.min(100, (elapsed / this.duration) * 100)
  }

  /**
   * Add callback to be called on timer updates
   */
  addCallback(callback: TimerCallback): void {
    this.callbacks.push(callback)
  }

  /**
   * Remove callback
   */
  removeCallback(callback: TimerCallback): void {
    const index = this.callbacks.indexOf(callback)
    if (index > -1) {
      this.callbacks.splice(index, 1)
    }
  }

  /**
   * Clear all callbacks
   */
  clearCallbacks(): void {
    this.callbacks = []
  }

  /**
   * Format time as MM:SS or HH:MM:SS
   */
  static formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
  }

  /**
   * Get time remaining as formatted string
   */
  getFormattedTimeRemaining(): string {
    return TimerService.formatTime(this.getRemainingTime())
  }

  /**
   * Get elapsed time as formatted string
   */
  getFormattedElapsedTime(): string {
    return TimerService.formatTime(Math.floor(this.getElapsedTime()))
  }

  /**
   * Start the internal interval for timer updates
   */
  private startInterval(): void {
    this.clearInterval()
    
    this.intervalId = setInterval(() => {
      const remaining = this.getRemainingTime()
      
      // Notify all callbacks
      this.callbacks.forEach(callback => {
        try {
          callback(remaining)
        } catch (error) {
          console.error('Error in timer callback:', error)
        }
      })

      // Auto-stop when timer expires
      if (remaining <= 0) {
        this.stop()
      }
    }, 1000) // Update every second
  }

  /**
   * Clear the internal interval
   */
  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop()
    this.clearCallbacks()
  }
}

/**
 * Hook for using timer in React components
 */
export const useTimer = (initialDuration: number = 0) => {
  const [timer] = React.useState(() => new TimerService())
  const [state, setState] = React.useState<TimerState>(timer.getState())

  React.useEffect(() => {
    const updateState = () => {
      setState(timer.getState())
    }

    timer.addCallback(updateState)

    // Update state immediately
    updateState()

    return () => {
      timer.removeCallback(updateState)
      timer.destroy()
    }
  }, [timer])

  const start = React.useCallback((duration?: number) => {
    timer.start(duration || initialDuration)
  }, [timer, initialDuration])

  const pause = React.useCallback(() => {
    timer.pause()
  }, [timer])

  const resume = React.useCallback(() => {
    timer.resume()
  }, [timer])

  const stop = React.useCallback(() => {
    timer.stop()
  }, [timer])

  const reset = React.useCallback(() => {
    timer.reset()
  }, [timer])

  return {
    ...state,
    start,
    pause,
    resume,
    stop,
    reset,
    getFormattedTimeRemaining: () => timer.getFormattedTimeRemaining(),
    getFormattedElapsedTime: () => timer.getFormattedElapsedTime(),
    getProgress: () => timer.getProgress(),
    isExpired: () => timer.isExpired()
  }
}

// Import React for the hook
import React from 'react'