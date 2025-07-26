import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native'
import { AptitudeStackParamList, DifficultyLevel } from '../types/aptitude'
import { TopicCard } from '../components/TopicCard'
import { useSession } from '../hooks/useSession'
import { AptitudeService } from '../services/AptitudeService'

type TopicSelectionNavigationProp = NavigationProp<AptitudeStackParamList>
type TopicSelectionRouteProp = RouteProp<AptitudeStackParamList, 'CategoryView'>

interface TopicData {
  topic: string
  subcategory: string
  estimatedTime: number
  questionsCount: number
  completed: boolean
  accuracy: number
  lastPracticed?: Date
}

export default function TopicSelection() {
  const navigation = useNavigation<TopicSelectionNavigationProp>()
  const route = useRoute<TopicSelectionRouteProp>()
  const session = useSession()
  const { category, categoryConfig } = route.params

  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('Medium')
  const [topics, setTopics] = useState<TopicData[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'accuracy'>('name')

  useEffect(() => {
    loadTopicsData()
  }, [session])

  const loadTopicsData = async () => {
    try {
      const allTopics: TopicData[] = []

      // Get user performance metrics if logged in
      let userMetrics = null
      if (session?.user) {
        userMetrics = await AptitudeService.getPerformanceMetrics(session.user.id)
      }

      // Build topics data from category config
      Object.entries(categoryConfig.subcategories).forEach(([subcategory, config]) => {
        config.topics.forEach(topic => {
          // Find performance data for this topic (simplified)
          const categoryPerformance = userMetrics?.categoryWisePerformance.find(
            cat => cat.category === category
          )

          allTopics.push({
            topic,
            subcategory,
            estimatedTime: Math.floor(config.estimatedTime / config.topics.length),
            questionsCount: 10, // Default question count
            completed: categoryPerformance ? categoryPerformance.questionsAttempted > 0 : false,
            accuracy: categoryPerformance ? categoryPerformance.accuracy : 0,
            lastPracticed: categoryPerformance ? categoryPerformance.lastPracticed : undefined
          })
        })
      })

      setTopics(allTopics)
    } catch (error) {
      console.error('Error loading topics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTopicPress = (topicData: TopicData) => {
    navigation.navigate('TopicPractice', {
      category,
      subcategory: topicData.subcategory,
      topic: topicData.topic,
      difficulty: selectedDifficulty
    })
  }

  const getSortedTopics = () => {
    const sorted = [...topics]
    
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.topic.localeCompare(b.topic))
      case 'progress':
        return sorted.sort((a, b) => {
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1 // Incomplete first
          }
          return b.accuracy - a.accuracy
        })
      case 'accuracy':
        return sorted.sort((a, b) => a.accuracy - b.accuracy) // Lowest accuracy first
      default:
        return sorted
    }
  }

  const getFilteredTopics = () => {
    return getSortedTopics()
  }

  const completedCount = topics.filter(t => t.completed).length
  const averageAccuracy = topics.length > 0 
    ? topics.reduce((sum, t) => sum + t.accuracy, 0) / topics.length 
    : 0

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading topics...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select a Topic</Text>
        <Text style={styles.categoryText}>{category}</Text>
        
        {session?.user && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{completedCount}/{topics.length}</Text>
              <Text style={styles.summaryLabel}>Completed</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{averageAccuracy.toFixed(0)}%</Text>
              <Text style={styles.summaryLabel}>Avg Accuracy</Text>
            </View>
          </View>
        )}
      </View>

      {/* Difficulty Selector */}
      <View style={styles.difficultyContainer}>
        <Text style={styles.sectionTitle}>Difficulty Level</Text>
        <View style={styles.difficultyButtons}>
          {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((difficulty) => (
            <TouchableOpacity
              key={difficulty}
              style={[
                styles.difficultyButton,
                selectedDifficulty === difficulty && styles.difficultyButtonSelected
              ]}
              onPress={() => setSelectedDifficulty(difficulty)}
            >
              <Text
                style={[
                  styles.difficultyButtonText,
                  selectedDifficulty === difficulty && styles.difficultyButtonTextSelected
                ]}
              >
                {difficulty}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sectionTitle}>Sort by</Text>
        <View style={styles.sortButtons}>
          {[
            { key: 'name', label: 'Name' },
            { key: 'progress', label: 'Progress' },
            { key: 'accuracy', label: 'Accuracy' }
          ].map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.sortButton,
                sortBy === key && styles.sortButtonSelected
              ]}
              onPress={() => setSortBy(key as any)}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === key && styles.sortButtonTextSelected
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Topics List */}
      <View style={styles.topicsContainer}>
        <Text style={styles.sectionTitle}>
          Topics ({getFilteredTopics().length})
        </Text>
        
        {getFilteredTopics().map((topicData, index) => (
          <TopicCard
            key={`${topicData.subcategory}-${topicData.topic}`}
            topic={topicData.topic}
            subcategory={topicData.subcategory}
            difficulty={selectedDifficulty}
            estimatedTime={topicData.estimatedTime}
            questionsCount={topicData.questionsCount}
            completed={topicData.completed}
            accuracy={topicData.accuracy}
            lastPracticed={topicData.lastPracticed}
            onPress={() => handleTopicPress(topicData)}
          />
        ))}
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
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  difficultyContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  difficultyButtonSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  difficultyButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  difficultyButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  sortContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  sortButtonSelected: {
    backgroundColor: '#e9ecef',
    borderColor: '#adb5bd',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
  },
  sortButtonTextSelected: {
    color: '#333',
    fontWeight: '600',
  },
  topicsContainer: {
    padding: 20,
    marginTop: 8,
  },
})