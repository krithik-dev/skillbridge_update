import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { AptitudeStackParamList, PerformanceMetrics, CategoryPerformance } from '../types/aptitude'
import { useSession } from '../hooks/useSession'
import { AptitudeService } from '../services/AptitudeService'
import { CATEGORY_CONFIGS } from '../database/seed_data'

type ProgressDashboardNavigationProp = NavigationProp<AptitudeStackParamList>

const { width: screenWidth } = Dimensions.get('window')

interface ChartData {
  label: string
  value: number
  color: string
}

export default function ProgressDashboard() {
  const navigation = useNavigation<ProgressDashboardNavigationProp>()
  const session = useSession()
  
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('month')

  useEffect(() => {
    loadPerformanceData()
  }, [session])

  const loadPerformanceData = async () => {
    if (!session?.user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const performanceData = await AptitudeService.getPerformanceMetrics(session.user.id)
      setMetrics(performanceData)
    } catch (error) {
      console.error('Error loading performance data:', error)
      Alert.alert('Error', 'Failed to load performance data. Please try again.')
    } finally {
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
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const renderOverviewCards = () => {
    if (!metrics) return null

    const performance = getPerformanceLevel(metrics.overallAccuracy)
    
    return (
      <View style={styles.overviewContainer}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewEmoji}>{performance.emoji}</Text>
          <Text style={[styles.overviewValue, { color: performance.color }]}>
            {metrics.overallAccuracy.toFixed(1)}%
          </Text>
          <Text style={styles.overviewLabel}>Overall Accuracy</Text>
          <Text style={[styles.overviewLevel, { color: performance.color }]}>
            {performance.level}
          </Text>
        </View>

        <View style={styles.overviewCard}>
          <Text style={styles.overviewEmoji}>📊</Text>
          <Text style={styles.overviewValue}>{metrics.totalQuestionsAttempted}</Text>
          <Text style={styles.overviewLabel}>Questions Practiced</Text>
        </View>

        <View style={styles.overviewCard}>
          <Text style={styles.overviewEmoji}>⏱️</Text>
          <Text style={styles.overviewValue}>{formatTime(metrics.totalTimeSpent)}</Text>
          <Text style={styles.overviewLabel}>Time Spent</Text>
        </View>

        <View style={styles.overviewCard}>
          <Text style={styles.overviewEmoji}>🔥</Text>
          <Text style={styles.overviewValue}>{metrics.streak}</Text>
          <Text style={styles.overviewLabel}>Day Streak</Text>
        </View>
      </View>
    )
  }

  const renderCategoryChart = () => {
    if (!metrics || metrics.categoryWisePerformance.length === 0) return null

    const chartData: ChartData[] = metrics.categoryWisePerformance.map((cat, index) => ({
      label: cat.category.split(' ')[0], // Shortened label
      value: cat.accuracy,
      color: ['#007bff', '#28a745', '#ffc107', '#dc3545'][index % 4]
    }))

    const maxValue = Math.max(...chartData.map(d => d.value))

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>📊 Category Performance</Text>
        
        <View style={styles.barChart}>
          {chartData.map((data, index) => (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View 
                  style={[
                    styles.bar,
                    { 
                      height: (data.value / maxValue) * 120,
                      backgroundColor: data.color
                    }
                  ]} 
                />
              </View>
              <Text style={styles.barLabel}>{data.label}</Text>
              <Text style={styles.barValue}>{data.value.toFixed(0)}%</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  const renderCategoryDetails = () => {
    if (!metrics || metrics.categoryWisePerformance.length === 0) return null

    return (
      <View style={styles.categoryContainer}>
        <Text style={styles.sectionTitle}>📈 Detailed Performance</Text>
        
        {metrics.categoryWisePerformance.map((category, index) => {
          const config = CATEGORY_CONFIGS[category.category as keyof typeof CATEGORY_CONFIGS]
          const performance = getPerformanceLevel(category.accuracy)
          
          return (
            <View key={index} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryIcon}>{config?.icon || '📚'}</Text>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.category}</Text>
                  <Text style={styles.categoryStats}>
                    {category.questionsAttempted} questions • {formatTime(category.averageTime * category.questionsAttempted)}
                  </Text>
                </View>
                <View style={styles.categoryScore}>
                  <Text style={[styles.categoryAccuracy, { color: performance.color }]}>
                    {category.accuracy.toFixed(1)}%
                  </Text>
                  <Text style={styles.categoryLevel}>{performance.level}</Text>
                </View>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill,
                      { 
                        width: `${category.accuracy}%`,
                        backgroundColor: performance.color
                      }
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.categoryMetrics}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Avg. Time</Text>
                  <Text style={styles.metricValue}>{formatTime(category.averageTime)}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Last Practiced</Text>
                  <Text style={styles.metricValue}>
                    {Math.ceil((Date.now() - category.lastPracticed.getTime()) / (1000 * 60 * 60 * 24))}d ago
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Trend</Text>
                  <Text style={[
                    styles.metricValue,
                    { color: category.improvementTrend === 'improving' ? '#28a745' : 
                             category.improvementTrend === 'declining' ? '#dc3545' : '#666' }
                  ]}>
                    {category.improvementTrend === 'improving' ? '📈' : 
                     category.improvementTrend === 'declining' ? '📉' : '➡️'}
                  </Text>
                </View>
              </View>
            </View>
          )
        })}
      </View>
    )
  }

  const renderInsights = () => {
    if (!metrics) return null

    return (
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>💡 Insights & Recommendations</Text>
        
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>🎯 Strengths</Text>
          {metrics.strengthsAndWeaknesses.strengths.length > 0 ? (
            metrics.strengthsAndWeaknesses.strengths.map((strength, index) => (
              <Text key={index} style={styles.insightText}>• {strength}</Text>
            ))
          ) : (
            <Text style={styles.insightText}>Keep practicing to identify your strengths!</Text>
          )}
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>📚 Areas for Improvement</Text>
          {metrics.strengthsAndWeaknesses.weaknesses.length > 0 ? (
            metrics.strengthsAndWeaknesses.weaknesses.map((weakness, index) => (
              <Text key={index} style={styles.insightText}>• {weakness}</Text>
            ))
          ) : (
            <Text style={styles.insightText}>Great job! No major weaknesses identified.</Text>
          )}
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>🚀 Recommendations</Text>
          {metrics.improvementSuggestions.map((suggestion, index) => (
            <Text key={index} style={styles.insightText}>• {suggestion}</Text>
          ))}
        </View>
      </View>
    )
  }

  const renderRecentActivity = () => {
    if (!metrics || metrics.recentSessions.length === 0) return null

    return (
      <View style={styles.activityContainer}>
        <Text style={styles.sectionTitle}>📅 Recent Activity</Text>
        
        {metrics.recentSessions.slice(0, 5).map((session, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Text style={styles.activityEmoji}>
                {session.session_type === 'mock_test' ? '📝' : '🎯'}
              </Text>
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>
                {session.topic || session.category}
              </Text>
              <Text style={styles.activityDetails}>
                {session.correct_answers}/{session.questions_attempted} correct • {session.difficulty}
              </Text>
              <Text style={styles.activityTime}>
                {new Date(session.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.activityScore}>
              <Text style={styles.activityAccuracy}>
                {session.questions_attempted > 0 ? 
                  Math.round((session.correct_answers / session.questions_attempted) * 100) : 0}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    )
  }

  if (!session?.user) {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.loginEmoji}>🔐</Text>
        <Text style={styles.loginTitle}>Login Required</Text>
        <Text style={styles.loginText}>
          Please log in to view your progress dashboard and performance analytics.
        </Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    )
  }

  if (!metrics || metrics.totalQuestionsAttempted === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyTitle}>No Progress Data Yet</Text>
        <Text style={styles.emptyText}>
          Start practicing to see your performance analytics and progress tracking here.
        </Text>
        <TouchableOpacity 
          style={styles.startPracticeButton}
          onPress={() => navigation.navigate('AptitudeHome')}
        >
          <Text style={styles.startPracticeText}>🚀 Start Practicing</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Progress Dashboard</Text>
        <Text style={styles.subtitle}>Track your aptitude learning journey</Text>
      </View>

      {renderOverviewCards()}
      {renderCategoryChart()}
      {renderCategoryDetails()}
      {renderInsights()}
      {renderRecentActivity()}

      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadPerformanceData}
        >
          <Text style={styles.refreshButtonText}>🔄 Refresh Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </TouchableOpacity>
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
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loginEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  startPracticeButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 12,
    paddingHorizontal: 32,
  },
  startPracticeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
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
  overviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (screenWidth - 56) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  overviewLevel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 24,
    borderRadius: 12,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  barValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  categoryContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryStats: {
    fontSize: 12,
    color: '#666',
  },
  categoryScore: {
    alignItems: 'flex-end',
  },
  categoryAccuracy: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  categoryLevel: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  insightsContainer: {
    margin: 16,
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  activityContainer: {
    margin: 16,
  },
  activityItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  activityDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 10,
    color: '#999',
  },
  activityScore: {
    alignItems: 'flex-end',
  },
  activityAccuracy: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  actionContainer: {
    padding: 16,
    gap: 12,
  },
  refreshButton: {
    backgroundColor: '#17a2b8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#6c757d',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})