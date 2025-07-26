import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { DifficultyLevel } from '../types/aptitude'

interface TopicCardProps {
  topic: string
  subcategory: string
  difficulty: DifficultyLevel
  estimatedTime: number
  questionsCount: number
  completed: boolean
  accuracy?: number
  lastPracticed?: Date
  onPress: () => void
}

export const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  subcategory,
  difficulty,
  estimatedTime,
  questionsCount,
  completed,
  accuracy = 0,
  lastPracticed,
  onPress
}) => {
  const getDifficultyColor = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'Easy': return '#28a745'
      case 'Medium': return '#ffc107'
      case 'Hard': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const getAccuracyColor = (acc: number) => {
    if (acc >= 80) return '#28a745'
    if (acc >= 60) return '#ffc107'
    return '#dc3545'
  }

  const formatLastPracticed = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return `${Math.ceil(diffDays / 30)} months ago`
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.topicTitle}>{topic}</Text>
        <View style={styles.statusContainer}>
          {completed && <Text style={styles.completedBadge}>✅</Text>}
          <View 
            style={[
              styles.difficultyBadge, 
              { backgroundColor: getDifficultyColor(difficulty) }
            ]}
          >
            <Text style={styles.difficultyText}>{difficulty}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.subcategoryText}>{subcategory}</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Time</Text>
          <Text style={styles.statValue}>~{estimatedTime}m</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Questions</Text>
          <Text style={styles.statValue}>{questionsCount}</Text>
        </View>
        
        {completed && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Accuracy</Text>
            <Text 
              style={[
                styles.statValue, 
                { color: getAccuracyColor(accuracy) }
              ]}
            >
              {accuracy.toFixed(0)}%
            </Text>
          </View>
        )}
      </View>

      {lastPracticed && (
        <Text style={styles.lastPracticedText}>
          Last practiced: {formatLastPracticed(lastPracticed)}
        </Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.actionText}>
          {completed ? 'Practice Again' : 'Start Practice'} →
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedBadge: {
    fontSize: 16,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  subcategoryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  lastPracticedText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  footer: {
    alignItems: 'flex-end',
  },
  actionText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
})