import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { useSession } from '../hooks/useSession'
import { AptitudeStackParamList, AptitudeCategory } from '../types/aptitude'
import { CATEGORY_CONFIGS } from '../database/seed_data'
import { AptitudeMigrations } from '../database/migrations'
import { AptitudeService } from '../services/AptitudeService'

type AptitudeHomeNavigationProp = NavigationProp<AptitudeStackParamList>

interface CategoryCardProps {
  category: AptitudeCategory
  description: string
  icon: string
  progress?: {
    completed: number
    total: number
    accuracy: number
    lastPracticed?: Date
  }
  onPress: () => void
}

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  category, 
  description, 
  icon, 
  progress,
  onPress 
}) => {
  const progressPercentage = progress ? (progress.completed / progress.total) * 100 : 0
  const hasProgress = progress && progress.completed > 0

  return (
    <TouchableOpacity style={styles.categoryCard} onPress={onPress}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryIcon}>{icon}</Text>
        <View style={styles.categoryTitleContainer}>
          <Text style={styles.categoryTitle}>{category}</Text>
          {hasProgress && (
            <View style={styles.categoryProgress}>
              <Text style={styles.progressText}>
                {progress.completed}/{progress.total} topics
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progressPercentage}%` }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>
      </View>
      
      <Text style={styles.categoryDescription}>{description}</Text>
      
      {hasProgress && (
        <View style={styles.categoryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{progress.accuracy.toFixed(0)}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          {progress.lastPracticed && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.ceil((Date.now() - progress.lastPracticed.getTime()) / (1000 * 60 * 60 * 24))}d
              </Text>
              <Text style={styles.statLabel}>Days ago</Text>
            </View>
          )}
        </View>
      )}
      
      <View style={styles.categoryFooter}>
        <Text style={styles.startText}>
          {hasProgress ? 'Continue Practice' : 'Start Practice'} →
        </Text>
      </View>
    </TouchableOpacity>
  )
}

export default function AptitudeHome() {
  const navigation = useNavigation<AptitudeHomeNavigationProp>()
  const session = useSession()
  const [isInitialized, setIsInitialized] = useState(false)
  const [categoryProgress, setCategoryProgress] = useState<{
    [key: string]: {
      completed: number
      total: number
      accuracy: number
      lastPracticed?: Date
    }
  }>({})

  useEffect(() => {
    initializeAptitudeFeature()
  }, [session])

  const initializeAptitudeFeature = async () => {
    try {
      // Run database migrations if needed
      const migrationSuccess = await AptitudeMigrations.runMigrations()
      if (!migrationSuccess) {
        console.warn('Database migrations failed, some features may not work')
      }

      // Initialize user preferences if user is logged in
      if (session?.user) {
        await AptitudeMigrations.initializeUserPreferences(session.user.id)
        await loadCategoryProgress()
      }

      // Verify database setup
      const verificationSuccess = await AptitudeMigrations.verifySetup()
      if (!verificationSuccess) {
        console.warn('Database verification failed')
      }

      setIsInitialized(true)
    } catch (error) {
      console.error('Error initializing aptitude feature:', error)
      Alert.alert(
        'Initialization Error',
        'There was an issue setting up the aptitude feature. Some functionality may be limited.'
      )
      setIsInitialized(true) // Allow user to continue even if initialization fails
    }
  }

  const loadCategoryProgress = async () => {
    if (!session?.user) return

    try {
      const metrics = await AptitudeService.getPerformanceMetrics(session.user.id)
      if (metrics) {
        const progress: typeof categoryProgress = {}

        Object.entries(CATEGORY_CONFIGS).forEach(([category, config]) => {
          const categoryPerformance = metrics.categoryWisePerformance.find(
            cat => cat.category === category
          )

          // Count total topics in this category
          const totalTopics = Object.values(config.subcategories).reduce(
            (sum, subcat) => sum + subcat.topics.length, 0
          )

          progress[category] = {
            completed: categoryPerformance ? Math.min(categoryPerformance.questionsAttempted, totalTopics) : 0,
            total: totalTopics,
            accuracy: categoryPerformance ? categoryPerformance.accuracy : 0,
            lastPracticed: categoryPerformance ? categoryPerformance.lastPracticed : undefined
          }
        })

        setCategoryProgress(progress)
      }
    } catch (error) {
      console.error('Error loading category progress:', error)
    }
  }

  const handleCategoryPress = (category: AptitudeCategory) => {
    if (!isInitialized) {
      Alert.alert('Please wait', 'The aptitude feature is still initializing...')
      return
    }

    navigation.navigate('CategoryView', {
      category,
      categoryConfig: CATEGORY_CONFIGS[category]
    })
  }

  const handleProgressDashboard = () => {
    if (!session?.user) {
      Alert.alert('Login Required', 'Please log in to view your progress dashboard.')
      return
    }
    navigation.navigate('ProgressDashboard')
  }

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing Aptitude Feature...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧠 Aptitude & Reasoning</Text>
        <Text style={styles.subtitle}>
          Master aptitude tests and logical reasoning skills
        </Text>
      </View>

      {session?.user && (
        <TouchableOpacity 
          style={styles.progressButton} 
          onPress={handleProgressDashboard}
        >
          <Text style={styles.progressButtonText}>📊 View Progress Dashboard</Text>
        </TouchableOpacity>
      )}

      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>Choose Your Practice Area</Text>
        
        {Object.entries(CATEGORY_CONFIGS).map(([category, config]) => (
          <CategoryCard
            key={category}
            category={category as AptitudeCategory}
            description={config.description}
            icon={config.icon}
            progress={categoryProgress[category]}
            onPress={() => handleCategoryPress(category as AptitudeCategory)}
          />
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            // Navigate to a random category for quick practice
            const categories = Object.keys(CATEGORY_CONFIGS) as AptitudeCategory[]
            const randomCategory = categories[Math.floor(Math.random() * categories.length)]
            handleCategoryPress(randomCategory)
          }}
        >
          <Text style={styles.actionButtonText}>🎲 Random Practice</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            const mockTestConfig = {
              id: 'general_aptitude_test',
              title: 'General Aptitude Test',
              description: 'Comprehensive test covering all aptitude areas',
              duration: 60, // minutes
              sections: [
                {
                  name: 'Quantitative Aptitude',
                  questions: [],
                  timeLimit: 20,
                  instructions: 'Solve mathematical problems without calculator.',
                  maxQuestions: 15
                },
                {
                  name: 'Verbal Aptitude',
                  questions: [],
                  timeLimit: 15,
                  instructions: 'Answer language and comprehension questions.',
                  maxQuestions: 10
                },
                {
                  name: 'Logical Reasoning',
                  questions: [],
                  timeLimit: 15,
                  instructions: 'Solve logical puzzles and patterns.',
                  maxQuestions: 10
                },
                {
                  name: 'Analytical Reasoning',
                  questions: [],
                  timeLimit: 10,
                  instructions: 'Analyze data and solve reasoning problems.',
                  maxQuestions: 5
                }
              ],
              totalQuestions: 40,
              passingScore: 60,
              difficulty: 'Medium' as const,
              category: 'Quantitative Aptitude' as const
            }
            
            navigation.navigate('MockTest', { testConfig: mockTestConfig })
          }}
        >
          <Text style={styles.actionButtonText}>📝 Mock Tests</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>About Aptitude Practice</Text>
        <Text style={styles.infoText}>
          • Practice questions across 4 major aptitude areas{'\n'}
          • AI-powered explanations for every question{'\n'}
          • Track your progress and identify weak areas{'\n'}
          • Adaptive difficulty based on your performance{'\n'}
          • Timed mock tests for exam preparation
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
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  progressButton: {
    margin: 20,
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  progressButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  categoryCard: {
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
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  categoryProgress: {
    alignItems: 'flex-start',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    width: 120,
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007bff',
    borderRadius: 2,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  categoryFooter: {
    alignItems: 'flex-end',
  },
  startText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  quickActions: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  infoSection: {
    padding: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
})