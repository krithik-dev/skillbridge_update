// Unit tests for AptitudeService
import { AptitudeService } from '../services/AptitudeService'
import { QuestionGenerationRequest, PracticeSessionData } from '../types/aptitude'

// Mock the dependencies
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test-session-id' }, error: null }))
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}))

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: jest.fn(() => ({
      generateContent: jest.fn(() => Promise.resolve({
        response: {
          text: jest.fn(() => Promise.resolve(`[
            {
              "question": "What is 25% of 80?",
              "options": ["15", "20", "25", "30"],
              "correctAnswer": "20",
              "explanation": "25% of 80 = 0.25 × 80 = 20"
            }
          ]`))
        }
      }))
    }))
  }))
}))

describe('AptitudeService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateQuestions', () => {
    it('should generate questions successfully', async () => {
      const request: QuestionGenerationRequest = {
        category: 'Quantitative Aptitude',
        subcategory: 'Arithmetic',
        topic: 'Percentages',
        difficulty: 'Easy',
        count: 1
      }

      const result = await AptitudeService.generateQuestions(request)

      expect(result.success).toBe(true)
      expect(result.questions).toHaveLength(1)
      expect(result.questions[0]).toMatchObject({
        question: 'What is 25% of 80?',
        options: ['15', '20', '25', '30'],
        correctAnswer: '20',
        explanation: '25% of 80 = 0.25 × 80 = 20',
        difficulty: 'Easy',
        category: 'Quantitative Aptitude',
        subcategory: 'Arithmetic',
        topic: 'Percentages'
      })
    })

    it('should handle AI generation failure gracefully', async () => {
      // Mock AI failure
      const mockModel = {
        generateContent: jest.fn(() => Promise.reject(new Error('AI service unavailable')))
      }
      
      const mockGenAI = {
        getGenerativeModel: jest.fn(() => mockModel)
      }

      // Temporarily replace the AI instance
      const originalGenAI = (AptitudeService as any).genAI
      ;(AptitudeService as any).genAI = mockGenAI
      ;(AptitudeService as any).model = mockModel

      const request: QuestionGenerationRequest = {
        category: 'Quantitative Aptitude',
        subcategory: 'Arithmetic',
        topic: 'Percentages',
        difficulty: 'Easy',
        count: 1
      }

      const result = await AptitudeService.generateQuestions(request)

      expect(result.success).toBe(false)
      expect(result.error).toContain('AI generation failed')
      expect(result.questions.length).toBeGreaterThan(0) // Should have fallback questions

      // Restore original
      ;(AptitudeService as any).genAI = originalGenAI
    })
  })

  describe('getExplanation', () => {
    it('should generate explanation successfully', async () => {
      const request = {
        question: {
          id: 'test-1',
          type: 'multiple-choice' as const,
          question: 'What is 25% of 80?',
          options: ['15', '20', '25', '30'],
          correctAnswer: '20',
          explanation: 'Basic explanation',
          difficulty: 'Easy' as const,
          category: 'Quantitative Aptitude' as const,
          subcategory: 'Arithmetic',
          topic: 'Percentages'
        },
        userAnswer: '25'
      }

      const result = await AptitudeService.getExplanation(request)

      expect(result.success).toBe(true)
      expect(result.explanation).toBeDefined()
      expect(typeof result.explanation).toBe('string')
    })
  })

  describe('saveProgress', () => {
    it('should save session data successfully', async () => {
      const sessionData: PracticeSessionData = {
        userId: 'test-user-id',
        category: 'Quantitative Aptitude',
        subcategory: 'Arithmetic',
        topic: 'Percentages',
        sessionType: 'practice',
        questionsAttempted: 5,
        correctAnswers: 4,
        totalTimeSpent: 300,
        difficulty: 'Easy',
        xpEarned: 40,
        coinsEarned: 5,
        questionAttempts: [
          {
            questionId: 'q1',
            questionText: 'Test question',
            userAnswer: '20',
            correctAnswer: '20',
            isCorrect: true,
            timeTaken: 60,
            hintsUsed: 0
          }
        ]
      }

      const result = await AptitudeService.saveProgress(sessionData)

      expect(result).toBe(true)
    })
  })

  describe('getPerformanceMetrics', () => {
    it('should return default metrics for new user', async () => {
      const result = await AptitudeService.getPerformanceMetrics('new-user-id')

      expect(result).toMatchObject({
        overallAccuracy: 0,
        categoryWisePerformance: [],
        recentSessions: [],
        totalQuestionsAttempted: 0,
        totalTimeSpent: 0,
        averageSessionTime: 0,
        streak: 0
      })
      expect(result?.strengthsAndWeaknesses.recommendations).toContain('Start practicing')
    })
  })

  describe('retryWithBackoff', () => {
    it('should retry failed operations', async () => {
      let attempts = 0
      const operation = jest.fn(() => {
        attempts++
        if (attempts < 3) {
          throw new Error('Temporary failure')
        }
        return Promise.resolve('success')
      })

      const result = await AptitudeService.retryWithBackoff(operation, 3, 100)

      expect(result).toBe('success')
      expect(attempts).toBe(3)
    })

    it('should throw error after max retries', async () => {
      const operation = jest.fn(() => Promise.reject(new Error('Persistent failure')))

      await expect(
        AptitudeService.retryWithBackoff(operation, 2, 100)
      ).rejects.toThrow('Persistent failure')

      expect(operation).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })
  })

  describe('utility methods', () => {
    it('should calculate correct time limits', () => {
      const easyTimeLimit = (AptitudeService as any).getTimeLimit('Easy')
      const mediumTimeLimit = (AptitudeService as any).getTimeLimit('Medium')
      const hardTimeLimit = (AptitudeService as any).getTimeLimit('Hard')

      expect(easyTimeLimit).toBe(60)
      expect(mediumTimeLimit).toBe(90)
      expect(hardTimeLimit).toBe(120)
    })

    it('should generate appropriate recommendations', () => {
      const mockPerformance = [
        {
          category: 'Quantitative Aptitude',
          accuracy: 30,
          averageTime: 60,
          questionsAttempted: 10,
          lastPracticed: new Date(),
          improvementTrend: 'stable' as const
        },
        {
          category: 'Verbal Aptitude',
          accuracy: 85,
          averageTime: 45,
          questionsAttempted: 15,
          lastPracticed: new Date(),
          improvementTrend: 'improving' as const
        }
      ]

      const recommendations = (AptitudeService as any).generateRecommendations(mockPerformance)

      expect(recommendations).toContain(expect.stringContaining('Focus more on Quantitative Aptitude'))
      expect(recommendations).toContain(expect.stringContaining('Great work on Verbal Aptitude'))
    })
  })
})