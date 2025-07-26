import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface StreakTrackerProps {
  currentStreak: number
  longestStreak: number
  practiceHistory: Array<{
    date: string
    practiced: boolean
    questionsAnswered: number
  }>
}

export const StreakTracker: React.FC<StreakTrackerProps> = ({
  currentStreak,
  longestStreak,
  practiceHistory
}) => {
  const getStreakEmoji = (streak: number): string => {
    if (streak >= 30) return '🏆'
    if (streak >= 14) return '🔥'
    if (streak >= 7) return '⚡'
    if (streak >= 3) return '💪'
    return '🌱'
  }

  const getStreakMessage = (streak: number): string => {
    if (streak >= 30) return 'Legendary Streak!'
    if (streak >= 14) return 'On Fire!'
    if (streak >= 7) return 'Great Momentum!'
    if (streak >= 3) return 'Building Habits!'
    if (streak >= 1) return 'Getting Started!'
    return 'Start Your Journey!'
  }

  const renderCalendar = () => {
    const today = new Date()
    const days = []
    
    // Show last 14 days
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]
      
      const dayData = practiceHistory.find(h => h.date === dateString)
      const practiced = dayData?.practiced || false
      const isToday = i === 0
      
      days.push(
        <View
          key={dateString}
          style={[
            styles.calendarDay,
            practiced && styles.calendarDayPracticed,
            isToday && styles.calendarDayToday
          ]}
        >
          <Text style={[
            styles.calendarDayText,
            practiced && styles.calendarDayTextPracticed,
            isToday && styles.calendarDayTextToday
          ]}>
            {date.getDate()}
          </Text>
          {practiced && (
            <View style={styles.practiceIndicator}>
              <Text style={styles.practiceCount}>
                {dayData?.questionsAnswered || 0}
              </Text>
            </View>
          )}
        </View>
      )
    }
    
    return <View style={styles.calendar}>{days}</View>
  }

  const getMotivationalMessage = (): string => {
    if (currentStreak === 0) {
      return "Start your practice streak today! Even 5 minutes makes a difference."
    }
    if (currentStreak === 1) {
      return "Great start! Come back tomorrow to build your streak."
    }
    if (currentStreak < 7) {
      return `${7 - currentStreak} more days to reach a week streak!`
    }
    if (currentStreak < 30) {
      return `Amazing! ${30 - currentStreak} more days for a legendary streak!`
    }
    return "You're a practice legend! Keep up the incredible consistency!"
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Practice Streak</Text>
      
      <View style={styles.streakHeader}>
        <View style={styles.streakMain}>
          <Text style={styles.streakEmoji}>{getStreakEmoji(currentStreak)}</Text>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>Current Streak</Text>
          <Text style={styles.streakMessage}>{getStreakMessage(currentStreak)}</Text>
        </View>
        
        <View style={styles.streakStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{longestStreak}</Text>
            <Text style={styles.statLabel}>Longest</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {practiceHistory.filter(h => h.practiced).length}
            </Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>
        </View>
      </View>

      <View style={styles.calendarContainer}>
        <Text style={styles.calendarTitle}>Last 14 Days</Text>
        {renderCalendar()}
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotPracticed]} />
            <Text style={styles.legendText}>Practiced</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotToday]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotEmpty]} />
            <Text style={styles.legendText}>No Practice</Text>
          </View>
        </View>
      </View>

      <View style={styles.motivationContainer}>
        <Text style={styles.motivationText}>{getMotivationalMessage()}</Text>
      </View>

      <View style={styles.milestonesContainer}>
        <Text style={styles.milestonesTitle}>🎯 Streak Milestones</Text>
        <View style={styles.milestones}>
          {[
            { days: 3, emoji: '💪', label: 'Habit Builder', achieved: currentStreak >= 3 },
            { days: 7, emoji: '⚡', label: 'Week Warrior', achieved: currentStreak >= 7 },
            { days: 14, emoji: '🔥', label: 'Fire Streak', achieved: currentStreak >= 14 },
            { days: 30, emoji: '🏆', label: 'Legend', achieved: currentStreak >= 30 }
          ].map((milestone, index) => (
            <View 
              key={index}
              style={[
                styles.milestone,
                milestone.achieved && styles.milestoneAchieved
              ]}
            >
              <Text style={[
                styles.milestoneEmoji,
                !milestone.achieved && styles.milestoneEmojiInactive
              ]}>
                {milestone.emoji}
              </Text>
              <Text style={[
                styles.milestoneLabel,
                milestone.achieved && styles.milestoneLabelAchieved
              ]}>
                {milestone.label}
              </Text>
              <Text style={styles.milestoneDays}>{milestone.days} days</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  streakMain: {
    flex: 1,
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  streakMessage: {
    fontSize: 12,
    color: '#ff6b35',
    fontWeight: '600',
    textAlign: 'center',
  },
  streakStats: {
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  calendarContainer: {
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 12,
  },
  calendarDay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  calendarDayPracticed: {
    backgroundColor: '#28a745',
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#007bff',
  },
  calendarDayText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  calendarDayTextPracticed: {
    color: '#fff',
  },
  calendarDayTextToday: {
    color: '#007bff',
  },
  practiceIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffc107',
    justifyContent: 'center',
    alignItems: 'center',
  },
  practiceCount: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendDotPracticed: {
    backgroundColor: '#28a745',
  },
  legendDotToday: {
    backgroundColor: '#007bff',
  },
  legendDotEmpty: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  motivationContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  motivationText: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
    lineHeight: 20,
  },
  milestonesContainer: {
    marginTop: 8,
  },
  milestonesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  milestones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  milestone: {
    alignItems: 'center',
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  milestoneAchieved: {
    backgroundColor: '#d4edda',
  },
  milestoneEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  milestoneEmojiInactive: {
    opacity: 0.3,
  },
  milestoneLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginBottom: 2,
  },
  milestoneLabelAchieved: {
    color: '#155724',
    fontWeight: '600',
  },
  milestoneDays: {
    fontSize: 8,
    color: '#999',
  },
})

export default StreakTracker