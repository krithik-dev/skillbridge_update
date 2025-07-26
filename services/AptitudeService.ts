// Core service for aptitude and logical reasoning functionality
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '../lib/supabase'
import {
  AptitudeQuestion,
  PracticeSessionData,
  QuestionAttemptData,
  PerformanceMetrics,
  CategoryPerformance,
  DifficultyLevel,
  SessionType,
  QuestionGenerationRequest,
  QuestionGenerationResponse,
  ExplanationRequest,
  ExplanationResponse,
  AptitudeError
} from '../types/aptitude'
import { AI_PROMPTS, SAMPLE_QUESTIONS } from '../database/seed_data'

// 🔐 TODO: Move to environment variable
const GEMINI_API_KEY = 'AIzaSyDLPCKBIdNKcaLiH8WqF5mhWXyv2zzF9G0'

export class AptitudeService {
  private static genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  private static model = AptitudeService.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  /**
   * Generate aptitude questions using AI
   */
  static async generateQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
    try {
      const { category, subcategory, topic, difficulty, count, questionType = 'multiple-choice' } = request

      // Get appropriate prompt template
      const promptTemplate = this.getPromptTemplate(category, subcategory)
      
      const prompt = promptTemplate
        .replace('{count}', count.toString())
        .replace('{difficulty}', difficulty.toLowerCase())
        .replace('{topic}', topic)

      const enhancedPrompt = `${prompt}

IMPORTANT: Return ONLY a valid JSON array. Each question must have:
- question: string (the question text)
- options: array of exactly 4 strings (for multiple choice)
- correctAnswer: string (must match one of the options exactly)
- explanation: string (detailed explanation of why the answer is correct)

Example format:
[
  {
    "question": "What is 25% of 80?",
    "options": ["15", "20", "25", "30"],
    "correctAnswer": "20",
    "explanation": "25% of 80 = 0.25 × 80 = 20"
  }
]

Generate ${count} ${difficulty} level questions on ${topic} in ${category} - ${subcategory}.`

      const result = await this.model.generateContent(enhancedPrompt)
      const response = await result.response.text()

      // Extract JSON from response
      const jsonStart = response.indexOf('[')
      const jsonEnd = response.lastIndexOf(']') + 1
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No valid JSON found in AI response')
      }

      const jsonText = response.slice(jsonStart, jsonEnd)
      const parsedQuestions = JSON.parse(jsonText)

      // Transform to our question format
      const questions: AptitudeQuestion[] = parsedQuestions.map((q: any, index: number) => ({
        id: `generated_${Date.now()}_${index}`,
        type: questionType,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty,
        timeLimit: this.getTimeLimit(difficulty),
        category,
        subcategory,
        topic
      }))

      return {
        questions,
        success: true
      }
    } catch (error) {
      console.error('Error generating questions:', error)
      
      // Fallback to sample questions if AI fails
      const fallbackQuestions = this.getFallbackQuestions(request)
      
      return {
        questions: fallbackQuestions,
        success: false,
        error: `AI generation failed, using sample questions: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Get AI-powered explanation for a question
   */
  static async getExplanation(request: ExplanationRequest): Promise<ExplanationResponse> {
    try {
      const { question, userAnswer, context } = request

      const prompt = `
Provide a detailed explanation for this aptitude question:

Question: ${question.question}
Options: ${question.options?.join(', ') || 'N/A'}
Correct Answer: ${question.correctAnswer}
User's Answer: ${userAnswer}
Category: ${question.category} - ${question.subcategory}

Please explain:
1. Why the correct answer is right
2. Why the user's answer is wrong (if incorrect)
3. The concept or method used to solve this
4. Any tips for similar questions

Keep the explanation clear and educational. Use bullet points for better readability.
${context ? `Additional context: ${context}` : ''}
      `

      const result = await this.model.generateContent(prompt)
      const explanation = await result.response.text()

      return {
        explanation: explanation.trim(),
        success: true
      }
    } catch (error) {
      console.error('Error getting explanation:', error)
      
      return {
        explanation: question.explanation || 'Explanation not available at the moment.',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Save practice session data to database
   */
  static async saveProgress(sessionData: PracticeSessionData): Promise<boolean> {
    try {
      // Insert session record
      const { data: sessionRecord, error: sessionError } = await supabase
        .from('aptitude_sessions')
        .insert({
          user_id: sessionData.userId,
          category: sessionData.category,
          subcategory: sessionData.subcategory,
          topic: sessionData.topic,
          session_type: sessionData.sessionType,
          questions_attempted: sessionData.questionsAttempted,
          correct_answers: sessionData.correctAnswers,
          total_time_spent: sessionData.totalTimeSpent,
          difficulty: sessionData.difficulty,
          xp_earned: sessionData.xpEarned,
          coins_earned: sessionData.coinsEarned,
          completed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (sessionError) {
        throw sessionError
      }

      // Insert question attempts
      if (sessionData.questionAttempts.length > 0) {
        const questionAttempts = sessionData.questionAttempts.map(attempt => ({
          session_id: sessionRecord.id,
          question_id: attempt.questionId,
          question_text: attempt.questionText,
          user_answer: attempt.userAnswer,
          correct_answer: attempt.correctAnswer,
          is_correct: attempt.isCorrect,
          time_taken: attempt.timeTaken,
          hints_used: attempt.hintsUsed,
          explanation: attempt.explanation
        }))

        const { error: attemptsError } = await supabase
          .from('aptitude_question_attempts')
          .insert(questionAttempts)

        if (attemptsError) {
          console.error('Error saving question attempts:', attemptsError)
          // Don't fail the entire operation if attempts fail
        }
      }

      return true
    } catch (error) {
      console.error('Error saving progress:', error)
      return false
    }
  }

  /**
   * Get performance metrics for a user
   */
  static async getPerformanceMetrics(userId: string): Promise<PerformanceMetrics | null> {
    try {
      // Get all sessions for the user
      const { data: sessions, error: sessionsError } = await supabase
        .from('aptitude_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (sessionsError) {
        throw sessionsError
      }

      if (!sessions || sessions.length === 0) {
        return {
          overallAccuracy: 0,
          categoryWisePerformance: [],
          recentSessions: [],
          strengthsAndWeaknesses: {
            strengths: [],
            weaknesses: [],
            recommendations: ['Start practicing to see your performance metrics!'],
            focusAreas: []
          },
          improvementSuggestions: ['Begin with easy questions to build confidence'],
          totalQuestionsAttempted: 0,
          totalTimeSpent: 0,
          averageSessionTime: 0,
          streak: 0
        }
      }

      // Calculate overall metrics
      const totalQuestions = sessions.reduce((sum, s) => sum + s.questions_attempted, 0)
      const totalCorrect = sessions.reduce((sum, s) => sum + s.correct_answers, 0)
      const totalTime = sessions.reduce((sum, s) => sum + s.total_time_spent, 0)
      const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0

      // Calculate category-wise performance
      const categoryStats = new Map<string, {
        attempted: number
        correct: number
        totalTime: number
        lastPracticed: Date
      }>()

      sessions.forEach(session => {
        const category = session.category
        const existing = categoryStats.get(category) || {
          attempted: 0,
          correct: 0,
          totalTime: 0,
          lastPracticed: new Date(session.created_at)
        }

        categoryStats.set(category, {
          attempted: existing.attempted + session.questions_attempted,
          correct: existing.correct + session.correct_answers,
          totalTime: existing.totalTime + session.total_time_spent,
          lastPracticed: new Date(Math.max(
            existing.lastPracticed.getTime(),
            new Date(session.created_at).getTime()
          ))
        })
      })

      const categoryWisePerformance: CategoryPerformance[] = Array.from(categoryStats.entries())
        .map(([category, stats]) => ({
          category,
          accuracy: stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0,
          averageTime: stats.attempted > 0 ? stats.totalTime / stats.attempted : 0,
          questionsAttempted: stats.attempted,
          lastPracticed: stats.lastPracticed,
          improvementTrend: 'stable' as const // TODO: Calculate actual trend
        }))

      // Identify strengths and weaknesses
      const strengths = categoryWisePerformance
        .filter(cat => cat.accuracy >= 70)
        .map(cat => cat.category)

      const weaknesses = categoryWisePerformance
        .filter(cat => cat.accuracy < 50 && cat.questionsAttempted >= 5)
        .map(cat => cat.category)

      return {
        overallAccuracy,
        categoryWisePerformance,
        recentSessions: sessions.slice(0, 10),
        strengthsAndWeaknesses: {
          strengths,
          weaknesses,
          recommendations: this.generateRecommendations(categoryWisePerformance),
          focusAreas: weaknesses
        },
        improvementSuggestions: this.generateImprovementSuggestions(categoryWisePerformance),
        totalQuestionsAttempted: totalQuestions,
        totalTimeSpent: totalTime,
        averageSessionTime: sessions.length > 0 ? totalTime / sessions.length : 0,
        streak: this.calculateStreak(sessions)
      }
    } catch (error) {
      console.error('Error getting performance metrics:', error)
      return null
    }
  }

  /**
   * Get appropriate prompt template for category/subcategory
   */
  private static getPromptTemplate(category: string, subcategory: string): string {
    const categoryKey = category.replace(' ', '_').toUpperCase()
    const subcategoryKey = subcategory.replace(' ', '_').toUpperCase()
    
    // Try to find specific prompt
    const categoryPrompts = (AI_PROMPTS as any)[categoryKey]
    if (categoryPrompts && categoryPrompts[subcategoryKey]) {
      return categoryPrompts[subcategoryKey]
    }

    // Fallback to generic prompt
    return `Generate {count} {difficulty} level questions on {topic} in the {category} - {subcategory} area. 
    Each question should be practical and test real understanding.
    Format as JSON array with fields: question, options (4 choices), correctAnswer, explanation.`
  }

  /**
   * Get fallback questions when AI generation fails
   */
  private static getFallbackQuestions(request: QuestionGenerationRequest): AptitudeQuestion[] {
    const { category, subcategory, topic, difficulty, count } = request
    
    // Filter sample questions by criteria
    let filteredQuestions = SAMPLE_QUESTIONS.filter(q => 
      q.category === category &&
      q.subcategory === subcategory &&
      q.difficulty === difficulty
    )

    // If no exact matches, broaden the search
    if (filteredQuestions.length === 0) {
      filteredQuestions = SAMPLE_QUESTIONS.filter(q => q.category === category)
    }

    // If still no matches, use any sample questions
    if (filteredQuestions.length === 0) {
      filteredQuestions = SAMPLE_QUESTIONS.slice(0, count)
    }

    // Return requested number of questions (or all available)
    return filteredQuestions.slice(0, count)
  }

  /**
   * Get time limit based on difficulty
   */
  private static getTimeLimit(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case 'Easy': return 60 // 1 minute
      case 'Medium': return 90 // 1.5 minutes
      case 'Hard': return 120 // 2 minutes
      default: return 90
    }
  }

  /**
   * Generate improvement recommendations
   */
  private static generateRecommendations(performance: CategoryPerformance[]): string[] {
    const recommendations: string[] = []

    performance.forEach(cat => {
      if (cat.accuracy < 50 && cat.questionsAttempted >= 5) {
        recommendations.push(`Focus more on ${cat.category} - current accuracy is ${cat.accuracy.toFixed(1)}%`)
      } else if (cat.accuracy >= 80) {
        recommendations.push(`Great work on ${cat.category}! Try harder difficulty levels`)
      }
    })

    if (recommendations.length === 0) {
      recommendations.push('Keep practicing regularly to improve your skills')
    }

    return recommendations
  }

  /**
   * Generate improvement suggestions
   */
  private static generateImprovementSuggestions(performance: CategoryPerformance[]): string[] {
    const suggestions: string[] = []

    const weakAreas = performance.filter(cat => cat.accuracy < 60)
    const strongAreas = performance.filter(cat => cat.accuracy >= 80)

    if (weakAreas.length > 0) {
      suggestions.push(`Practice more in: ${weakAreas.map(cat => cat.category).join(', ')}`)
    }

    if (strongAreas.length > 0) {
      suggestions.push(`Consider harder difficulty in: ${strongAreas.map(cat => cat.category).join(', ')}`)
    }

    suggestions.push('Practice consistently for 15-20 minutes daily')
    suggestions.push('Review explanations carefully to understand concepts')

    return suggestions
  }

  /**
   * Calculate practice streak
   */
  private static calculateStreak(sessions: any[]): number {
    if (sessions.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Group sessions by date
    const sessionsByDate = new Map<string, boolean>()
    sessions.forEach(session => {
      const sessionDate = new Date(session.created_at)
      sessionDate.setHours(0, 0, 0, 0)
      const dateKey = sessionDate.toISOString().split('T')[0]
      sessionsByDate.set(dateKey, true)
    })

    // Count consecutive days from today backwards
    let currentDate = new Date(today)
    while (true) {
      const dateKey = currentDate.toISOString().split('T')[0]
      if (sessionsByDate.has(dateKey)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

  /**
   * Handle API errors with retry logic
   */
  static async handleAPIError(error: Error, context: string): Promise<void> {
    const aptitudeError: AptitudeError = {
      code: 'API_ERROR',
      message: error.message,
      context,
      retryable: true
    }

    console.error('Aptitude API Error:', aptitudeError)
    
    // Log error to analytics/monitoring service if available
    // await AnalyticsService.logError(aptitudeError)
  }

  /**
   * Retry operation with exponential backoff
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxRetries) {
          throw lastError
        }

        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }
}