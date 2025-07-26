import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native'
import { useRoute, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native'
import { AptitudeStackParamList } from '../types/aptitude'
import { useSession } from '../hooks/useSession'
import { AptitudeService } from '../services/AptitudeService'

type ResultsViewRouteProp = RouteProp<AptitudeStackParamList, 'ResultsView'>
type ResultsViewNavigationProp = NavigationProp<AptitudeStackParamList>

interface SessionResults {
  score: number
  totalQuestions: number
  accuracy: number
  timeSpent: number
  xpEarned: number
  coinsEarned: number
  category: string
  subcategory: string
  topic: string
  difficulty: string
  questionBreakdown: {
    correct: number
    incorrect: number
    averageTime: number
  }
  recommendations: string[]
}

export default function ResultsView() {
  const route = useRoute<ResultsViewRouteProp>()
  const navigation = useNavigation<ResultsViewNavigationProp>()
  const session = useSession()
  const { sessionId, sessionType } = route.params

  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<SessionResults | null>(null)

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      // For now, we'll use mock data since we don't have the actual session ID
      // In a real implementation, this would fetch from the database
      const mockResults: SessionResults = {
        score: 7,
        totalQuestions: 10,
        accuracy: 70,
        timeSpent: 480, // 8 minutes
        xpEarned: 70,
        coinsEarned: 10,
        category: 'Quantitative Aptitude',
        subcategory: 'Arithmetic',
        topic: 'Percentages',
        difficulty: 'Medium',
        questionBreakdown: {
          correct: 7,
          incorrect: 3,
          averageTime: 48
        },
        recommendations: [
          'Great job! You scored above average for this difficulty level.',
          'Focus on speed - try to solve questions faster.',
          'Review the incorrect answers to understand the concepts better.',
          'Consider practicing similar topics to reinforce learning.'
        ]
      }

      // Simulate loading delay
      setTimeout(() => {
        setResults(mockResults)
        setLoading(false)
      }, 1500)

    } catch (error) {
      console.error('Error loading results:', error)
      Alert.alert('Error', 'Failed to load results. Please try again.')
      setLoading(false)
    }
  }

  const getPerformanceLevel = (accuracy: number): { level: string; color: string; emoji: string } => {
    if (accuracy >= 90) return { level: 'Excellent', color: '#28a745', emoji: '🏆' }
    if (accuracy >= 80) return { level: 'Very Good', color: '#17a2b8', emoji: '🎯' }
    if (accuracy >= 70) return { level: 'Good', color: '#007bff', emoji: '👍' }
    if (accuracy >= 60) return { level: 'Fair', color: '#ffc107', emoji: '📈' }
    return { level: 'Needs Improvement', color: '#dc3545', emoji: '📚' }
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const handlePracticeAgain = () => {
    navigation.goBack() // Go back to practice
  }

  const handleViewProgress = () => {
    navigation.navigate('ProgressDashboard')
  }

  const handleGoHome = () => {
    navigation.navigate('AptitudeHome')
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Calculating your results...</Text>
      </View>
    )
  }

  if (!results) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load results</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadResults}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const performance = getPerformanceLevel(results.accuracy)

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎉 Practice Complete!</Text>
        <Text style={styles.subtitle}>Here's how you performed</Text>
      </View>

      {/* Score Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreEmoji}>{performance.emoji}</Text>
          <Text style={[styles.performanceLevel, { color: performance.color }]}>
            {performance.level}
          </Text>
        </View>
        
        <View style={styles.scoreMain}>
          <Text style={styles.scoreText}>
            {results.score}/{results.totalQuestions}
          </Text>
          <Text style={styles.accuracyText}>
            {results.accuracy}% Accuracy
          </Text>
        </View>

        <View style={styles.rewardsContainer}>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardValue}>+{results.xpEarned}</Text>
            <Text style={styles.rewardLabel}>XP</Text>
          </View>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardValue}>+{results.coinsEarned}</Text>
            <Text style={styles.rewardLabel}>Coins</Text>
          </View>
        </View>
      </View>

      {/* Session Details */}
      <View style={styles.detailsCard}>
        <Text style={styles.cardTitle}>Session Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Topic:</Text>
          <Text style={styles.detailValue}>{results.topic}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category:</Text>
          <Text style={styles.detailValue}>{results.category}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Difficulty:</Text>
          <Text style={styles.detailValue}>{results.difficulty}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time Spent:</Text>
          <Text style={styles.detailValue}>{formatTime(results.timeSpent)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Avg. per Question:</Text>
          <Text style={styles.detailValue}>{formatTime(results.questionBreakdown.averageTime)}</Text>
        </View>
      </View>

      {/* Performance Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.cardTitle}>Performance Breakdown</Text>
        
        <View style={styles.breakdownStats}>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownCircle, { backgroundColor: '#28a745' }]}>
              <Text style={styles.breakdownNumber}>{results.questionBreakdown.correct}</Text>
            </View>
            <Text style={styles.breakdownLabel}>Correct</Text>
          </View>
          
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownCircle, { backgroundColor: '#dc3545' }]}>
              <Text style={styles.breakdownNumber}>{results.questionBreakdown.incorrect}</Text>
            </View>
            <Text style={styles.breakdownLabel}>Incorrect</Text>
          </View>
          
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownCircle, { backgroundColor: '#007bff' }]}>
              <Text style={styles.breakdownNumber}>{results.totalQuestions}</Text>
            </View>
            <Text style={styles.breakdownLabel}>Total</Text>
          </View>
        </View>
      </View>

      {/* Recommendations */}
      <View style={styles.recommendationsCard}>
        <Text style={styles.cardTitle}>💡 Recommendations</Text>
        {results.recommendations.map((recommendation, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Text style={styles.recommendationBullet}>•</Text>
            <Text style={styles.recommendationText}>{recommendation}</Text>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handlePracticeAgain}>
          <Text style={styles.primaryButtonText}>🔄 Practice Again</Text>
        </TouchableOpacity>
        
        <View style={styles.secondaryButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleViewProgress}>
            <Text style={styles.secondaryButtonText}>📊 View Progress</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
            <Text style={styles.secondaryButtonText}>🏠 Go Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  scoreCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  performanceLevel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreMain: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 8,
  },
  accuracyText: {
    fontSize: 20,
    color: '#666',
    fontWeight: '600',
  },
  rewardsContainer: {
    flexDirection: 'row',
    gap: 32,
  },
  rewardItem: {
    alignItems: 'center',
  },
  rewardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
  },
  rewardLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  detailsCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  breakdownCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  recommendationsCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  recommendationBullet: {
    fontSize: 16,
    color: '#007bff',
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    flex: 1,
  },
  actionsContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})