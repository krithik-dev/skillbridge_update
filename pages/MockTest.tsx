import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  BackHandler,
} from 'react-native'
import { useRoute, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native'
import { AptitudeStackParamList, AptitudeQuestion, MockTestConfig } from '../types/aptitude'
import { useSession } from '../hooks/useSession'
import { AptitudeService } from '../services/AptitudeService'
import { TimerService, useTimer } from '../services/TimerService'
import { QuestionNavigator } from '../components/QuestionNavigator'

type MockTestRouteProp = RouteProp<AptitudeStackParamList, 'MockTest'>
type MockTestNavigationProp = NavigationProp<AptitudeStackParamList>

interface TestState {
  currentSection: number
  currentQuestion: number
  answers: { [key: string]: string }
  flaggedQuestions: Set<string>
  sectionStartTime: Date
  testStartTime: Date
  isSubmitted: boolean
  showInstructions: boolean
  isPaused: boolean
}

export default function MockTest() {
  const route = useRoute<MockTestRouteProp>()
  const navigation = useNavigation<MockTestNavigationProp>()
  const session = useSession()
  const { testConfig } = route.params

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([])
  const [testState, setTestState] = useState<TestState>({
    currentSection: 0,
    currentQuestion: 0,
    answers: {},
    flaggedQuestions: new Set(),
    sectionStartTime: new Date(),
    testStartTime: new Date(),
    isSubmitted: false,
    showInstructions: true,
    isPaused: false
  })

  // Timer for the entire test
  const testTimer = useTimer(testConfig.duration * 60) // Convert minutes to seconds
  
  // Timer for current section
  const sectionTimer = useTimer()

  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [showNavigator, setShowNavigator] = useState(false)

  useEffect(() => {
    loadTestQuestions()
    
    // Handle back button press
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress)
    
    return () => {
      backHandler.remove()
      testTimer.stop()
      sectionTimer.stop()
    }
  }, [])

  useEffect(() => {
    // Show warning when 5 minutes left
    if (testTimer.timeRemaining === 300 && testTimer.timeRemaining > 0) {
      setShowTimeWarning(true)
    }
    
    // Auto-submit when time expires
    if (testTimer.isExpired() && !testState.isSubmitted) {
      handleAutoSubmit()
    }
  }, [testTimer.timeRemaining])

  const loadTestQuestions = async () => {
    try {
      setLoading(true)
      const allQuestions: AptitudeQuestion[] = []

      // Generate questions for each section
      for (const section of testConfig.sections) {
        const response = await AptitudeService.generateQuestions({
          category: testConfig.category,
          subcategory: section.name,
          topic: section.name,
          difficulty: testConfig.difficulty,
          count: section.maxQuestions || 10,
          questionType: 'multiple-choice'
        })

        if (response.success) {
          allQuestions.push(...response.questions)
        } else {
          // Use fallback questions if AI fails
          const fallbackQuestions = Array.from({ length: section.maxQuestions || 10 }, (_, i) => ({
            id: `fallback_${section.name}_${i}`,
            type: 'multiple-choice' as const,
            question: `Sample ${section.name} question ${i + 1}`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 'Option A',
            explanation: 'This is a sample question for testing purposes.',
            difficulty: testConfig.difficulty,
            category: testConfig.category,
            subcategory: section.name,
            topic: section.name
          }))
          allQuestions.push(...fallbackQuestions)
        }
      }

      setQuestions(allQuestions)
    } catch (error) {
      console.error('Error loading test questions:', error)
      Alert.alert('Error', 'Failed to load test questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackPress = (): boolean => {
    if (testState.showInstructions) {
      navigation.goBack()
      return true
    }
    
    Alert.alert(
      'Exit Test?',
      'Are you sure you want to exit? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    )
    return true
  }

  const startTest = () => {
    setTestState(prev => ({
      ...prev,
      showInstructions: false,
      testStartTime: new Date(),
      sectionStartTime: new Date()
    }))
    
    // Start timers
    testTimer.start(testConfig.duration * 60)
    const firstSectionTime = testConfig.sections[0]?.timeLimit || 30
    sectionTimer.start(firstSectionTime * 60)
  }

  const getCurrentQuestion = (): AptitudeQuestion | null => {
    let questionIndex = 0
    
    // Calculate the absolute question index based on current section and question
    for (let i = 0; i < testState.currentSection; i++) {
      questionIndex += testConfig.sections[i].maxQuestions || 10
    }
    questionIndex += testState.currentQuestion
    
    return questions[questionIndex] || null
  }

  const getQuestionKey = (): string => {
    return `${testState.currentSection}_${testState.currentQuestion}`
  }

  const handleAnswerSelect = (answer: string) => {
    const questionKey = getQuestionKey()
    setTestState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionKey]: answer
      }
    }))
  }

  const handleFlagQuestion = () => {
    const questionKey = getQuestionKey()
    setTestState(prev => {
      const newFlagged = new Set(prev.flaggedQuestions)
      if (newFlagged.has(questionKey)) {
        newFlagged.delete(questionKey)
      } else {
        newFlagged.add(questionKey)
      }
      return {
        ...prev,
        flaggedQuestions: newFlagged
      }
    })
  }

  const navigateToQuestion = (sectionIndex: number, questionIndex: number) => {
    // Check if moving to a different section
    if (sectionIndex !== testState.currentSection) {
      const newSectionTime = testConfig.sections[sectionIndex]?.timeLimit || 30
      sectionTimer.start(newSectionTime * 60)
      
      setTestState(prev => ({
        ...prev,
        currentSection: sectionIndex,
        currentQuestion: questionIndex,
        sectionStartTime: new Date()
      }))
    } else {
      setTestState(prev => ({
        ...prev,
        currentQuestion: questionIndex
      }))
    }
  }

  const handleNext = () => {
    const currentSection = testConfig.sections[testState.currentSection]
    const maxQuestions = currentSection?.maxQuestions || 10
    
    if (testState.currentQuestion + 1 < maxQuestions) {
      setTestState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1
      }))
    } else if (testState.currentSection + 1 < testConfig.sections.length) {
      // Move to next section
      navigateToQuestion(testState.currentSection + 1, 0)
    }
  }

  const handlePrevious = () => {
    if (testState.currentQuestion > 0) {
      setTestState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion - 1
      }))
    } else if (testState.currentSection > 0) {
      // Move to previous section
      const prevSection = testState.currentSection - 1
      const prevSectionQuestions = testConfig.sections[prevSection]?.maxQuestions || 10
      navigateToQuestion(prevSection, prevSectionQuestions - 1)
    }
  }

  const handleSubmitTest = () => {
    setShowSubmitModal(true)
  }

  const confirmSubmit = async () => {
    setShowSubmitModal(false)
    
    try {
      // Calculate results
      const totalQuestions = questions.length
      const answeredQuestions = Object.keys(testState.answers).length
      let correctAnswers = 0
      
      Object.entries(testState.answers).forEach(([questionKey, answer]) => {
        const [sectionIndex, questionIndex] = questionKey.split('_').map(Number)
        let absoluteIndex = 0
        
        for (let i = 0; i < sectionIndex; i++) {
          absoluteIndex += testConfig.sections[i].maxQuestions || 10
        }
        absoluteIndex += questionIndex
        
        const question = questions[absoluteIndex]
        if (question && answer === question.correctAnswer) {
          correctAnswers++
        }
      })

      // Save test results if user is logged in
      if (session?.user) {
        const testResult = {
          userId: session.user.id,
          category: testConfig.category,
          subcategory: 'Mock Test',
          topic: testConfig.title,
          sessionType: 'mock_test' as const,
          questionsAttempted: answeredQuestions,
          correctAnswers,
          totalTimeSpent: (testConfig.duration * 60) - testTimer.timeRemaining,
          difficulty: testConfig.difficulty,
          xpEarned: correctAnswers * 15, // Higher XP for mock tests
          coinsEarned: totalQuestions,
          questionAttempts: [] // Could be populated with detailed attempts
        }

        await AptitudeService.saveProgress(testResult)
      }

      setTestState(prev => ({ ...prev, isSubmitted: true }))
      
      // Navigate to results
      navigation.navigate('ResultsView', {
        sessionId: 'mock-test-session',
        sessionType: 'mock_test'
      })
      
    } catch (error) {
      console.error('Error submitting test:', error)
      Alert.alert('Error', 'Failed to submit test. Please try again.')
    }
  }

  const handleAutoSubmit = () => {
    Alert.alert(
      'Time Up!',
      'The test time has expired. Your test will be submitted automatically.',
      [{ text: 'OK', onPress: confirmSubmit }]
    )
  }

  const pauseTest = () => {
    testTimer.pause()
    sectionTimer.pause()
    setTestState(prev => ({ ...prev, isPaused: true }))
  }

  const resumeTest = () => {
    testTimer.resume()
    sectionTimer.resume()
    setTestState(prev => ({ ...prev, isPaused: false }))
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Preparing your mock test...</Text>
        <Text style={styles.loadingSubtext}>
          Generating {testConfig.totalQuestions} questions
        </Text>
      </View>
    )
  }

  // Instructions Screen
  if (testState.showInstructions) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.instructionsContainer}>
          <Text style={styles.testTitle}>{testConfig.title}</Text>
          <Text style={styles.testDescription}>{testConfig.description}</Text>
          
          <View style={styles.testInfoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Duration:</Text>
              <Text style={styles.infoValue}>{testConfig.duration} minutes</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Questions:</Text>
              <Text style={styles.infoValue}>{testConfig.totalQuestions}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Difficulty:</Text>
              <Text style={styles.infoValue}>{testConfig.difficulty}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Passing Score:</Text>
              <Text style={styles.infoValue}>{testConfig.passingScore}%</Text>
            </View>
          </View>

          <View style={styles.sectionsContainer}>
            <Text style={styles.sectionTitle}>Test Sections:</Text>
            {testConfig.sections.map((section, index) => (
              <View key={index} style={styles.sectionCard}>
                <Text style={styles.sectionName}>{section.name}</Text>
                <Text style={styles.sectionInfo}>
                  {section.maxQuestions} questions • {section.timeLimit} minutes
                </Text>
                <Text style={styles.sectionInstructions}>{section.instructions}</Text>
              </View>
            ))}
          </View>

          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>📋 Important Instructions:</Text>
            <Text style={styles.instructionsText}>
              • This is a timed test. You cannot pause once started{'\n'}
              • You can navigate between questions and sections{'\n'}
              • Flag questions for review if needed{'\n'}
              • Submit before time expires to save your answers{'\n'}
              • Ensure stable internet connection throughout{'\n'}
              • Do not refresh or close the app during the test
            </Text>
          </View>

          <View style={styles.startButtonContainer}>
            <TouchableOpacity style={styles.startButton} onPress={startTest}>
              <Text style={styles.startButtonText}>🚀 Start Test</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    )
  }

  const currentQuestion = getCurrentQuestion()
  const questionKey = getQuestionKey()
  const selectedAnswer = testState.answers[questionKey]
  const isFlagged = testState.flaggedQuestions.has(questionKey)

  return (
    <View style={styles.testContainer}>
      {/* Timer Header */}
      <View style={styles.timerHeader}>
        <View style={styles.timerInfo}>
          <Text style={styles.timerLabel}>Time Remaining:</Text>
          <Text style={[
            styles.timerValue,
            testTimer.timeRemaining < 300 && styles.timerWarning
          ]}>
            {testTimer.getFormattedTimeRemaining()}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.navigatorButton} 
            onPress={() => setShowNavigator(true)}
          >
            <Text style={styles.navigatorButtonText}>📋</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.pauseButton} onPress={pauseTest}>
            <Text style={styles.pauseButtonText}>⏸️</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitTest}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Question Content */}
      <ScrollView style={styles.questionContainer}>
        {currentQuestion && (
          <>
            <View style={styles.questionHeader}>
              <Text style={styles.questionNumber}>
                Section {testState.currentSection + 1}, Question {testState.currentQuestion + 1}
              </Text>
              <TouchableOpacity 
                style={[styles.flagButton, isFlagged && styles.flagButtonActive]}
                onPress={handleFlagQuestion}
              >
                <Text style={styles.flagButtonText}>
                  {isFlagged ? '🚩' : '⚐'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            <View style={styles.optionsContainer}>
              {currentQuestion.options?.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedAnswer === option && styles.optionSelected
                  ]}
                  onPress={() => handleAnswerSelect(option)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedAnswer === option && styles.optionTextSelected
                  ]}>
                    {String.fromCharCode(65 + index)}. {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Navigation Footer */}
      <View style={styles.navigationFooter}>
        <TouchableOpacity 
          style={[styles.navButton, testState.currentSection === 0 && testState.currentQuestion === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={testState.currentSection === 0 && testState.currentQuestion === 0}
        >
          <Text style={styles.navButtonText}>← Previous</Text>
        </TouchableOpacity>

        <Text style={styles.questionCounter}>
          {testState.currentQuestion + 1} of {testConfig.sections[testState.currentSection]?.maxQuestions || 10}
        </Text>

        <TouchableOpacity style={styles.navButton} onPress={handleNext}>
          <Text style={styles.navButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>

      {/* Submit Confirmation Modal */}
      <Modal
        visible={showSubmitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Submit Test?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to submit your test? You cannot make changes after submission.
            </Text>
            <Text style={styles.modalStats}>
              Answered: {Object.keys(testState.answers).length} of {questions.length} questions
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowSubmitModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalSubmitButton} onPress={confirmSubmit}>
                <Text style={styles.modalSubmitText}>Submit Test</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Warning Modal */}
      <Modal
        visible={showTimeWarning}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimeWarning(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⏰ Time Warning</Text>
            <Text style={styles.modalText}>
              Only 5 minutes remaining! Please review your answers and submit soon.
            </Text>
            
            <TouchableOpacity 
              style={styles.modalSubmitButton}
              onPress={() => setShowTimeWarning(false)}
            >
              <Text style={styles.modalSubmitText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pause Modal */}
      <Modal
        visible={testState.isPaused}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⏸️ Test Paused</Text>
            <Text style={styles.modalText}>
              Your test is paused. Timer will resume when you continue.
            </Text>
            
            <TouchableOpacity style={styles.modalSubmitButton} onPress={resumeTest}>
              <Text style={styles.modalSubmitText}>Resume Test</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Question Navigator */}
      <QuestionNavigator
        visible={showNavigator}
        onClose={() => setShowNavigator(false)}
        sections={testConfig.sections}
        currentSection={testState.currentSection}
        currentQuestion={testState.currentQuestion}
        answers={testState.answers}
        flaggedQuestions={testState.flaggedQuestions}
        onNavigate={navigateToQuestion}
      />
    </View>
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
  instructionsContainer: {
    padding: 20,
  },
  testTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  testDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  testInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  sectionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  sectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  sectionInstructions: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  instructionsCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  startButtonContainer: {
    gap: 12,
  },
  startButton: {
    backgroundColor: '#28a745',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  timerHeader: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerInfo: {
    flex: 1,
  },
  timerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
  },
  timerWarning: {
    color: '#dc3545',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  navigatorButton: {
    backgroundColor: '#17a2b8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  navigatorButtonText: {
    fontSize: 16,
  },
  pauseButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  pauseButtonText: {
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  questionContainer: {
    flex: 1,
    padding: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  flagButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  flagButtonActive: {
    backgroundColor: '#fff3cd',
  },
  flagButtonText: {
    fontSize: 16,
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 26,
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  optionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007bff',
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
  navigationFooter: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  navButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.5,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  questionCounter: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  modalStats: {
    fontSize: 14,
    color: '#007bff',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})