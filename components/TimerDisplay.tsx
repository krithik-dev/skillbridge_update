import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface TimerDisplayProps {
  timeRemaining: number // in seconds
  totalTime: number // in seconds
  isRunning: boolean
  isPaused: boolean
  showProgress?: boolean
  size?: 'small' | 'medium' | 'large'
  warningThreshold?: number // seconds when to show warning
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeRemaining,
  totalTime,
  isRunning,
  isPaused,
  showProgress = false,
  size = 'medium',
  warningThreshold = 300 // 5 minutes
}) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
  }

  const getProgressPercentage = (): number => {
    if (totalTime === 0) return 0
    return ((totalTime - timeRemaining) / totalTime) * 100
  }

  const getTimerColor = (): string => {
    if (isPaused) return '#ffc107' // Yellow for paused
    if (timeRemaining <= warningThreshold) return '#dc3545' // Red for warning
    if (timeRemaining <= warningThreshold * 2) return '#fd7e14' // Orange for caution
    return '#007bff' // Blue for normal
  }

  const getStatusText = (): string => {
    if (isPaused) return 'PAUSED'
    if (!isRunning) return 'STOPPED'
    if (timeRemaining <= 0) return 'TIME UP'
    return 'RUNNING'
  }

  const sizeStyles = {
    small: {
      container: styles.smallContainer,
      timeText: styles.smallTimeText,
      statusText: styles.smallStatusText,
      progressBar: styles.smallProgressBar
    },
    medium: {
      container: styles.mediumContainer,
      timeText: styles.mediumTimeText,
      statusText: styles.mediumStatusText,
      progressBar: styles.mediumProgressBar
    },
    large: {
      container: styles.largeContainer,
      timeText: styles.largeTimeText,
      statusText: styles.largeStatusText,
      progressBar: styles.largeProgressBar
    }
  }

  const currentStyles = sizeStyles[size]

  return (
    <View style={[styles.container, currentStyles.container]}>
      <View style={styles.timerContent}>
        <Text style={[
          currentStyles.timeText,
          { color: getTimerColor() }
        ]}>
          {formatTime(timeRemaining)}
        </Text>
        
        <Text style={[
          currentStyles.statusText,
          { color: getTimerColor() }
        ]}>
          {getStatusText()}
        </Text>
      </View>

      {showProgress && (
        <View style={[styles.progressContainer, currentStyles.progressBar]}>
          <View style={styles.progressBackground}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${getProgressPercentage()}%`,
                  backgroundColor: getTimerColor()
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {getProgressPercentage().toFixed(0)}% Complete
          </Text>
        </View>
      )}

      {timeRemaining <= warningThreshold && timeRemaining > 0 && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ {timeRemaining <= 60 ? 'Less than 1 minute' : `${Math.ceil(timeRemaining / 60)} minutes`} remaining!
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  timerContent: {
    alignItems: 'center',
  },
  
  // Small size styles
  smallContainer: {
    padding: 8,
  },
  smallTimeText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  smallStatusText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  smallProgressBar: {
    marginTop: 4,
    width: 80,
  },

  // Medium size styles
  mediumContainer: {
    padding: 12,
  },
  mediumTimeText: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  mediumStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  mediumProgressBar: {
    marginTop: 8,
    width: 120,
  },

  // Large size styles
  largeContainer: {
    padding: 16,
  },
  largeTimeText: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  largeStatusText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  largeProgressBar: {
    marginTop: 12,
    width: 200,
  },

  // Progress bar styles
  progressContainer: {
    alignItems: 'center',
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },

  // Warning styles
  warningContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#fff3cd',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
    textAlign: 'center',
  },
})

export default TimerDisplay