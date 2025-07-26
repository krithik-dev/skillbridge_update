import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native'
import { useRoute, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native'
import { AptitudeStackParamList, AptitudeQuestion, QuestionAttemptData } from '../types/aptitude'
import { useSession } from '../hooks/useSession'
import { AptitudeService } from '../services/AptitudeService'
import { TimerService } from '../services/TimerService'

type TopicPracticeRouteProp = RouteProp<AptitudeStackParamList, 'TopicPractice'>
type TopicPracticeNavigationProp = NavigationProp<AptitudeStackParamList>

interface PracticeState {
  questions: AptitudeQuestion[]
  currentIndex: number
  selectedAnswer: string | null
  showAnswer: boolean
  showExplanation: boolean
  explanation: string
  score: number
  timeSpent: number
  questionAttempts: QuestionAttemptData[]
  hintsUsed: number
}

export default function TopicPractice() {
  const route = useRoute<TopicPracticeRouteProp>()
  const navigation = useNavigation<TopicPracticeNavigationProp>()
  const session = useSession()
  const { category, subcategory, topic, difficulty } = route.params

  const [loading, setLoading] = useState(true)
  const [loadingExplanation, setLoadingExplanation] = useState(false)
  const [practiceState, setPracticeState] = useState<PracticeState>({
    questions: [],
    currentIndex: 0,
    selectedAnswer: null,
    showAnswer: false,
    showExplanation: false,
    explanation: '',
    score: 0,
    timeSpent: 0,
    questionAttempts: [],
    hintsUsed: 0
  })

  const timerRef = useRef<TimerService>(new TimerService())
  const questionStartTime = useRef<Date>(new Date())
  const fadeAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    loadQuestions()
    return () => {
      timerRef.current.destroy()
    }
  }, [])

  useEffect(() => {
    if (practiceState.questions.length > 0 && !loading) {
      startQuestionTimer()
    }
  }, [practiceState.currentIndex, loading])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      
      const response = await AptitudeService.generateQuestions({
        category,
        subcategory,
        topic,
        difficulty,
        count: 10,
        questionType: 'multiple-choice'
      })

      if (response.success && response.questions.length > 0) {
        setPracticeState(prev => ({
          ...prev,
          questions: response.questions
        }))
      } else {
        Alert.alert(
          'Question Generation Failed',
          response.error || 'Unable to generate questions. Please try again.',
          [
            { text: 'Go Back', onPress: () => navigation.goBack() },
            { text: 'Retry', onPress: loadQuestions }
          ]
        )
      }
    } catch (error) {
      console.error('Error loading questions:', error)
      Alert.alert(
        'Error',
        'Failed to load questions. Please check your connection and try again.',
        [{ text: 'Go Back', onPress: () => navigation.goBack() }]
      )
    } finally {
      setLoading(false)
    }
  }

  const startQuestionTimer = () => {
    questionStartTime.current = new Date()
  }

  const getQuestionTime = (): number => {
    return Math.floor((Date.now() - questionStartTime.current.getTime()) / 1000)
  }

  const handleAnswerSelect = async (answer: string) => {
    if (practiceState.showAnswer) return

    const currentQuestion = practiceState.questions[practiceState.currentIndex]
    const isCorrect = answer === currentQuestion.correctAnswer
    const timeTaken = getQuestionTime()

    // Update practice state
    setPracticeState(prev => ({
      ...prev,
      selectedAnswer: answer,
      showAnswer: true,
      score: isCorrect ? prev.score + 1 : prev.score,
      timeSpent: prev.timeSpent + timeTaken,
      questionAttempts: [
        ...prev.questionAttempts,
        {
          questionId: currentQuestion.id,
          questionText: currentQuestion.question,
          userAnswer: answer,
          correctAnswer: currentQuestion.correctAnswer,
          isCorrect,
          timeTaken,
          hintsUsed: prev.hintsUsed,
          explanation: currentQuestion.explanation
        }
      ]
    }))

    // Get AI explanation if answer is wrong or user wants detailed explanation
    if (!isCorrect || Math.random() > 0.7) { // 30% chance for correct answers
      await getAIExplanation(currentQuestion, answer)
    }
  }

  const getAIExplanation = async (question: AptitudeQuestion, userAnswer: string) => {
    try {
      setLoadingExplanation(true)
      
      const response = await AptitudeService.getExplanation({
        question,
        userAnswer,
        context: `This is a ${difficulty} level question from ${category} - ${subcategory} on ${topic}`
      })

      if (response.success) {
        setPracticeState(prev => ({
          ...prev,
          explanation: response.explanation,
          showExplanation: true
        }))
      }
    } catch (error) {
      console.error('Error getting explanation:', error)
      setPracticeState(prev => ({
        ...prev,
        explanation: question.explanation || 'Explanation not available.',
        showExplanation: true
      }))
    } finally {
      setLoadingExplanation(false)
    }
  }

  const handleNext = () => {
    if (practiceState.currentIndex + 1 < practiceState.questions.length) {
      // Animate transition
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()

      setPracticeState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        selectedAnswer: null,
        showAnswer: false,
        showExplanation: false,
        explanation: '',
        hintsUsed: 0
      }))
    } else {
      finishPractice()
    }
  }

  const handlePrevious = () => {
    if (practiceState.currentIndex > 0) {
      setPracticeState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex - 1,
        selectedAnswer: null,
        showAnswer: false,
        showExplanation: false,
        explanation: '',
        hintsUsed: 0
      }))
    }
  }

  const handleHint = () => {
    const currentQuestion = practiceState.questions[practiceState.currentIndex]
    
    if (practiceState.hintsUsed >= 3) {
      Alert.alert('Hint Limit', 'You have used all available hints for this question.')
      return
    }

    const hints = [
      'Think about the key concepts involved in this problem.',
      'Break down the problem into smaller steps.',
      'Consider what information is given and what you need to find.'
    ]

    Alert.alert(
      'Hint',
      hints[practiceState.hintsUsed] || 'Try to eliminate obviously wrong answers first.',
      [{ text: 'OK' }]
    )

    setPracticeState(prev => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1
    }))
  }

  const finishPractice = async () => {
    if (session?.user) {
      try {
        const sessionData = {
          userId: session.user.id,
          category,
          subcategory,
          topic,
          sessionType: 'practice' as const,
          questionsAttempted: practiceState.questions.length,
          correctAnswers: practiceState.score,
          totalTimeSpent: practiceState.timeSpent,
          difficulty,
          xpEarned: practiceState.score * 10,
          coinsEarned: practiceState.questions.length,
          questionAttempts: practiceState.questionAttempts
        }

        await AptitudeService.saveProgress(sessionData)
      } catch (error) {
        console.error('Error saving progress:', error)
      }
    }

    // Navigate to results
    navigation.navigate('ResultsView', {
      sessionId: 'temp-session-id', // Will be replaced with actual session ID
      sessionType: 'practice'
    })
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Generating questions...</Text>
        <Text style={styles.loadingSubtext}>
          Creating {difficulty.toLowerCase()} level questions on {topic}
        </Text>
      </View>
    )
  }

  const currentQuestion = practiceState.questions[practiceState.currentIndex]
  const progress = ((practiceState.currentIndex + 1) / practiceState.questions.length) * 100

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Question {practiceState.currentIndex + 1} of {practiceState.questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{practiceState.score}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.floor(practiceState.timeSpent / 60)}m</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </View>
      </View>

      {/* Question */}
      <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
        <View style={styles.questionHeader}>
          <Text style={styles.topicText}>{topic}</Text>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{difficulty}</Text>
          </View>
        </View>
        
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
        
        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options?.map((option, index) => {
            const isSelected = option === practiceState.selectedAnswer
            const isCorrect = option === currentQuestion.correctAnswer
            const showCorrect = practiceState.showAnswer && isCorrect
            const showIncorrect = practiceState.showAnswer && isSelected && !isCorrect

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  isSelected && !practiceState.showAnswer && styles.optionSelected,
                  showCorrect && styles.optionCorrect,
                  showIncorrect && styles.optionIncorrect
                ]}
                onPress={() => handleAnswerSelect(option)}
                disabled={practiceState.showAnswer}
              >
                <Text style={[
                  styles.optionText,
                  isSelected && !practiceState.showAnswer && styles.optionTextSelected,
                  showCorrect && styles.optionTextCorrect,
                  showIncorrect && styles.optionTextIncorrect
                ]}>
                  {String.fromCharCode(65 + index)}. {option}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Hint Button */}
        {!practiceState.showAnswer && (
          <TouchableOpacity style={styles.hintButton} onPress={handleHint}>
            <Text style={styles.hintButtonText}>
              💡 Hint ({3 - practiceState.hintsUsed} left)
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Answer Explanation */}
      {practiceState.showAnswer && (
        <View style={styles.answerContainer}>
          <View style={styles.answerHeader}>
            <Text style={styles.answerTitle}>
              {practiceState.selectedAnswer === currentQuestion.correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
            </Text>
            <Text style={styles.correctAnswerText}>
              Correct Answer: {currentQuestion.correctAnswer}
            </Text>
          </View>

          {practiceState.showExplanation && (
            <View style={styles.explanationContainer}>
              <Text style={styles.explanationTitle}>Explanation:</Text>
              {loadingExplanation ? (
                <ActivityIndicator size="small" color="#007bff" />
              ) : (
                <Text style={styles.explanationText}>{practiceState.explanation}</Text>
              )}
            </View>
          )}

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            {practiceState.currentIndex > 0 && (
              <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
                <Text style={styles.navButtonText}>← Previous</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.navButton, styles.nextButton]} 
              onPress={handleNext}
            >
              <Text style={[styles.navButtonText, styles.nextButtonText]}>
                {practiceState.currentIndex + 1 < practiceState.questions.length ? 'Next →' : 'Finish'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007bff',
    borderRadius: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  questionContainer: {
    backgroundColor: '#fff',
    margin: 16,
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
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  topicText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  difficultyBadge: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 26,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  optionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007bff',
  },
  optionCorrect: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  optionIncorrect: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  optionTextSelected: {
    color: '#007bff',
    fontWeight: '600',
  },
  optionTextCorrect: {
    color: '#155724',
    fontWeight: '600',
  },
  optionTextIncorrect: {
    color: '#721c24',
    fontWeight: '600',
  },
  hintButton: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ffeaa7',
    alignItems: 'center',
  },
  hintButtonText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  answerContainer: {
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
  answerHeader: {
    marginBottom: 16,
  },
  answerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#666',
  },
  explanationContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#007bff',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    color: '#fff',
  },
})