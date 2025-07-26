// Unit tests for TimerService
import { TimerService } from '../services/TimerService'

// Mock timers for testing
jest.useFakeTimers()

describe('TimerService', () => {
  let timer: TimerService

  beforeEach(() => {
    timer = new TimerService()
    jest.clearAllTimers()
  })

  afterEach(() => {
    timer.destroy()
  })

  describe('basic timer functionality', () => {
    it('should start timer correctly', () => {
      timer.start(60) // 1 minute

      const state = timer.getState()
      expect(state.isRunning).toBe(true)
      expect(state.isPaused).toBe(false)
      expect(state.totalTime).toBe(60)
      expect(state.timeRemaining).toBe(60)
    })

    it('should pause and resume timer', () => {
      timer.start(60)
      
      // Advance time by 10 seconds
      jest.advanceTimersByTime(10000)
      
      timer.pause()
      let state = timer.getState()
      expect(state.isRunning).toBe(false)
      expect(state.isPaused).toBe(true)
      
      // Advance time while paused (should not affect remaining time)
      jest.advanceTimersByTime(5000)
      
      timer.resume()
      state = timer.getState()
      expect(state.isRunning).toBe(true)
      expect(state.isPaused).toBe(false)
    })

    it('should stop timer', () => {
      timer.start(60)
      timer.stop()

      const state = timer.getState()
      expect(state.isRunning).toBe(false)
      expect(state.isPaused).toBe(false)
    })

    it('should reset timer', () => {
      timer.start(60)
      jest.advanceTimersByTime(10000)
      
      timer.reset()
      
      const state = timer.getState()
      expect(state.isRunning).toBe(false)
      expect(state.isPaused).toBe(false)
      expect(state.totalTime).toBe(0)
      expect(state.timeRemaining).toBe(0)
    })
  })

  describe('time calculations', () => {
    it('should calculate remaining time correctly', () => {
      timer.start(60)
      
      // Advance by 10 seconds
      jest.advanceTimersByTime(10000)
      
      expect(timer.getRemainingTime()).toBe(50)
    })

    it('should calculate elapsed time correctly', () => {
      timer.start(60)
      
      // Advance by 15 seconds
      jest.advanceTimersByTime(15000)
      
      expect(timer.getElapsedTime()).toBeCloseTo(15, 0)
    })

    it('should handle timer expiration', () => {
      timer.start(10) // 10 seconds
      
      // Advance past expiration
      jest.advanceTimersByTime(15000)
      
      expect(timer.getRemainingTime()).toBe(0)
      expect(timer.isExpired()).toBe(true)
    })

    it('should calculate progress percentage', () => {
      timer.start(100) // 100 seconds
      
      // Advance by 25 seconds
      jest.advanceTimersByTime(25000)
      
      expect(timer.getProgress()).toBeCloseTo(25, 0)
    })
  })

  describe('callbacks', () => {
    it('should call callbacks on timer updates', () => {
      const callback = jest.fn()
      timer.addCallback(callback)
      
      timer.start(60)
      
      // Advance time to trigger callback
      jest.advanceTimersByTime(1000)
      
      expect(callback).toHaveBeenCalledWith(59)
    })

    it('should remove callbacks', () => {
      const callback = jest.fn()
      timer.addCallback(callback)
      timer.removeCallback(callback)
      
      timer.start(60)
      jest.advanceTimersByTime(1000)
      
      expect(callback).not.toHaveBeenCalled()
    })

    it('should clear all callbacks', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()
      
      timer.addCallback(callback1)
      timer.addCallback(callback2)
      timer.clearCallbacks()
      
      timer.start(60)
      jest.advanceTimersByTime(1000)
      
      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
    })

    it('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error')
      })
      const normalCallback = jest.fn()
      
      timer.addCallback(errorCallback)
      timer.addCallback(normalCallback)
      
      timer.start(60)
      jest.advanceTimersByTime(1000)
      
      // Normal callback should still be called despite error in first callback
      expect(normalCallback).toHaveBeenCalled()
    })
  })

  describe('time formatting', () => {
    it('should format time correctly for minutes and seconds', () => {
      expect(TimerService.formatTime(65)).toBe('01:05')
      expect(TimerService.formatTime(125)).toBe('02:05')
      expect(TimerService.formatTime(0)).toBe('00:00')
    })

    it('should format time correctly for hours', () => {
      expect(TimerService.formatTime(3665)).toBe('01:01:05')
      expect(TimerService.formatTime(7200)).toBe('02:00:00')
    })

    it('should get formatted remaining time', () => {
      timer.start(125) // 2:05
      expect(timer.getFormattedTimeRemaining()).toBe('02:05')
      
      jest.advanceTimersByTime(5000) // Advance 5 seconds
      expect(timer.getFormattedTimeRemaining()).toBe('02:00')
    })

    it('should get formatted elapsed time', () => {
      timer.start(180) // 3 minutes
      
      jest.advanceTimersByTime(65000) // Advance 1:05
      expect(timer.getFormattedElapsedTime()).toBe('01:05')
    })
  })

  describe('edge cases', () => {
    it('should handle starting already running timer', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      timer.start(60)
      timer.start(30) // Should warn and not restart
      
      expect(consoleSpy).toHaveBeenCalledWith('Timer is already running')
      expect(timer.getState().totalTime).toBe(60) // Should remain original duration
      
      consoleSpy.mockRestore()
    })

    it('should handle pausing non-running timer', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      timer.pause() // Should warn
      
      expect(consoleSpy).toHaveBeenCalledWith('Timer is not running or already paused')
      
      consoleSpy.mockRestore()
    })

    it('should handle resuming non-paused timer', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      timer.start(60)
      timer.resume() // Should warn since not paused
      
      expect(consoleSpy).toHaveBeenCalledWith('Timer is not paused')
      
      consoleSpy.mockRestore()
    })

    it('should handle zero duration timer', () => {
      timer.start(0)
      
      expect(timer.getRemainingTime()).toBe(0)
      expect(timer.isExpired()).toBe(true)
      expect(timer.getProgress()).toBe(0)
    })
  })

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      const callback = jest.fn()
      timer.addCallback(callback)
      timer.start(60)
      
      timer.destroy()
      
      const state = timer.getState()
      expect(state.isRunning).toBe(false)
      
      // Advance time - callback should not be called
      jest.advanceTimersByTime(1000)
      expect(callback).not.toHaveBeenCalled()
    })
  })
})