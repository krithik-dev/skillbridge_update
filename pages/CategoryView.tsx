import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native'
import { AptitudeStackParamList, DifficultyLevel } from '../types/aptitude'
import { useSession } from '../hooks/useSession'
import { AptitudeService } from '../services/AptitudeService'

type CategoryViewNavigationProp = NavigationProp<AptitudeStackParamList>
type CategoryViewRouteProp = RouteProp<AptitudeStackParamList, 'CategoryView'>

interface SubcategoryCardProps {
  subcategory: string
  topics: string[]
  estimatedTime: number
  userProgress?: { [topic: string]: { completed: boolean; accuracy: number } }
  onPress: (topic: string) => void
}

const SubcategoryCard: React.FC<SubcategoryCardProps> = ({ 
  subcategory, 
  topics, 
  estimatedTime,
  userProgress = {},
  onPress 
}) => {
  const completedTopics = topics.filter(topic => userProgress[topic]?.completed).length
  const progressPercentage = topics.length > 0 ? (completedTopics / topics.length) * 100 : 0

  return (
    <View style={styles.subcategoryCard}>
      <View style={styles.subcategoryHeader}>
        <Text style={styles.subcategoryTitle}>{subcategory}</Text>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{completedTopics}/{topics.length}</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
        </View>
      </View>
      
      <Text style={styles.estimatedTime}>⏱️ ~{estimatedTime} min</Text>
      
      <View style={styles.topicsContainer}>
        {topics.map((topic, index) => {
          const topicProgress = userProgress[topic]
          const isCompleted = topicProgress?.completed || false
          const accuracy = topicProgress?.accuracy || 0
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.topicButton,
                isCompleted && styles.topicButtonCompleted
              ]}
              onPress={() => onPress(topic)}
            >
              <View style={styles.topicContent}>
                <Text style={[
                  styles.topicText,
                  isCompleted && styles.topicTextCompleted
                ]}>
                  {topic}
                </Text>
                {isCompleted && (
                  <View style={styles.topicStats}>
                    <Text style={styles.accuracyText}>
                      ✅ {accuracy.toFixed(0)}%
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const DifficultySelector: React.FC<{
  selectedDifficulty: DifficultyLevel
  onSelect: (difficulty: DifficultyLevel) => void
}> = ({ selectedDifficulty, onSelect }) => {
  const difficulties: DifficultyLevel[] = ['Easy', 'Medium', 'Hard']
  
  return (
    <View style={styles.difficultyContainer}>
      <Text style={styles.difficultyLabel}>Select Difficulty:</Text>
      <View style={styles.difficultyButtons}>
        {difficulties.map((difficulty) => (
          <TouchableOpacity
            key={difficulty}
            style={[
              styles.difficultyButton,
              selectedDifficulty === difficulty && styles.difficultyButtonSelected
            ]}
            onPress={() => onSelect(difficulty)}
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
  )
}

export default function CategoryView() {
  const navigation = useNavigation<CategoryViewNavigationProp>()
  const route = useRoute<CategoryViewRouteProp>()
  const session = useSession()
  const { category, categoryConfig } = route.params
  
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('Medium')
  const [userProgress, setUserProgress] = useState<{ [topic: string]: { completed: boolean; accuracy: number } }>({})
  const [loading, setLoading] = useState(true)
  const [categoryStats, setCategoryStats] = useState({
    totalTopics: 0,
    completedTopics: 0,
    averageAccuracy: 0
  })

  useEffect(() => {
    loadUserProgress()
  }, [session])

  const loadUserProgress = async () => {
    if (!session?.user) {
      setLoading(false)
      return
    }

    try {
      const metrics = await AptitudeService.getPerformanceMetrics(session.user.id)
      if (metrics) {
        // Find performance for this category
        const categoryPerformance = metrics.categoryWisePerformance.find(
          cat => cat.category === category
        )

        // Calculate topic-level progress (simplified for now)
        const progress: { [topic: string]: { completed: boolean; accuracy: number } } = {}
        let totalTopics = 0
        let completedTopics = 0
        let totalAccuracy = 0

        Object.values(categoryConfig.subcategories).forEach(subcat => {
          subcat.topics.forEach(topic => {
            totalTopics++
            // For now, mark as completed if category has been practiced
            const completed = categoryPerformance ? categoryPerformance.questionsAttempted > 0 : false
            const accuracy = categoryPerformance ? categoryPerformance.accuracy : 0
            
            progress[topic] = { completed, accuracy }
            if (completed) {
              completedTopics++
              totalAccuracy += accuracy
            }
          })
        })

        setUserProgress(progress)
        setCategoryStats({
          totalTopics,
          completedTopics,
          averageAccuracy: completedTopics > 0 ? totalAccuracy / completedTopics : 0
        })
      }
    } catch (error) {
      console.error('Error loading user progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTopicPress = (subcategory: string, topic: string) => {
    navigation.navigate('TopicPractice', {
      category,
      subcategory,
      topic,
      difficulty: selectedDifficulty
    })
  }

  const handleQuickPractice = () => {
    // Select a random subcategory and topic for quick practice
    const subcategories = Object.keys(categoryConfig.subcategories)
    const randomSubcategory = subcategories[Math.floor(Math.random() * subcategories.length)]
    const topics = categoryConfig.subcategories[randomSubcategory].topics
    const randomTopic = topics[Math.floor(Math.random() * topics.length)]
    
    handleTopicPress(randomSubcategory, randomTopic)
  }

  const getRecommendedDifficulty = (): DifficultyLevel => {
    if (categoryStats.averageAccuracy >= 80) return 'Hard'
    if (categoryStats.averageAccuracy >= 60) return 'Medium'
    return 'Easy'
  }

  const handleSmartPractice = () => {
    // Find topics that need more practice (not completed or low accuracy)
    const weakTopics: { subcategory: string; topic: string }[] = []
    
    Object.entries(categoryConfig.subcategories).forEach(([subcategory, config]) => {
      config.topics.forEach(topic => {
        const progress = userProgress[topic]
        if (!progress?.completed || progress.accuracy < 70) {
          weakTopics.push({ subcategory, topic })
        }
      })
    })

    if (weakTopics.length > 0) {
      const randomWeak = weakTopics[Math.floor(Math.random() * weakTopics.length)]
      handleTopicPress(randomWeak.subcategory, randomWeak.topic)
    } else {
      handleQuickPractice()
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    )
  }

  const recommendedDifficulty = getRecommendedDifficulty()

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.categoryIcon}>{categoryConfig.icon}</Text>
        <Text style={styles.title}>{category}</Text>
        <Text style={styles.description}>{categoryConfig.description}</Text>
        
        {session?.user && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{categoryStats.completedTopics}</Text>
              <Text style={styles.statLabel}>Topics Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{categoryStats.averageAccuracy.toFixed(0)}%</Text>
              <Text style={styles.statLabel}>Average Accuracy</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{categoryStats.totalTopics}</Text>
              <Text style={styles.statLabel}>Total Topics</Text>
            </View>
          </View>
        )}
      </View>

      <DifficultySelector
        selectedDifficulty={selectedDifficulty}
        onSelect={setSelectedDifficulty}
      />

      {recommendedDifficulty !== selectedDifficulty && session?.user && (
        <View style={styles.recommendationContainer}>
          <Text style={styles.recommendationText}>
            💡 Based on your performance, we recommend <Text style={styles.recommendedDifficulty}>{recommendedDifficulty}</Text> difficulty
          </Text>
          <TouchableOpacity 
            style={styles.useRecommendedButton}
            onPress={() => setSelectedDifficulty(recommendedDifficulty)}
          >
            <Text style={styles.useRecommendedText}>Use Recommended</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.quickActionContainer}>
        <TouchableOpacity style={styles.quickActionButton} onPress={handleQuickPractice}>
          <Text style={styles.quickActionText}>🚀 Quick Practice</Text>
        </TouchableOpacity>
        
        {session?.user && categoryStats.completedTopics > 0 && (
          <TouchableOpacity style={styles.smartPracticeButton} onPress={handleSmartPractice}>
            <Text style={styles.smartPracticeText}>🎯 Smart Practice</Text>
            <Text style={styles.smartPracticeSubtext}>Focus on weak areas</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.subcategoriesContainer}>
        <Text style={styles.sectionTitle}>Choose a Topic Area</Text>
        
        {Object.entries(categoryConfig.subcategories).map(([subcategory, config]) => (
          <SubcategoryCard
            key={subcategory}
            subcategory={subcategory}
            topics={config.topics}
            estimatedTime={config.estimatedTime}
            userProgress={userProgress}
            onPress={(topic) => handleTopicPress(subcategory, topic)}
          />
        ))}
      </View>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Practice Tips</Text>
        <Text style={styles.tipsText}>
          • Start with Easy difficulty if you're new to this category{'\n'}
          • Practice regularly for 15-20 minutes daily{'\n'}
          • Review explanations carefully to understand concepts{'\n'}
          • Move to higher difficulty as you improve{'\n'}
          • Focus on accuracy first, then speed
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
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
    marginTop: 4,
  },
  difficultyContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  difficultyLabel: {
    fontSize: 16,
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
  recommendationContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  recommendationText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 12,
  },
  recommendedDifficulty: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  useRecommendedButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  useRecommendedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionContainer: {
    padding: 20,
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  smartPracticeButton: {
    flex: 1,
    backgroundColor: '#17a2b8',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  smartPracticeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  smartPracticeSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
  subcategoriesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  subcategoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
  subcategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subcategoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 2,
  },
  estimatedTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicButton: {
    backgroundColor: '#e9ecef',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  topicButtonCompleted: {
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  topicContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topicText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  topicTextCompleted: {
    color: '#155724',
    fontWeight: '600',
  },
  topicStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accuracyText: {
    fontSize: 12,
    color: '#155724',
    fontWeight: '600',
  },
  tipsContainer: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    margin: 20,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
})