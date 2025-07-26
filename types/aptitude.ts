// TypeScript interfaces and types for the Aptitude and Logical Reasoning feature

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type SessionType = 'practice' | 'mock_test';
export type QuestionType = 'multiple-choice' | 'numerical' | 'true-false';

// Main categories for aptitude questions
export type AptitudeCategory = 
  | 'Quantitative Aptitude'
  | 'Verbal Aptitude' 
  | 'Logical Reasoning'
  | 'Analytical Reasoning';

// Subcategories for each main category
export interface CategoryConfig {
  'Quantitative Aptitude': 'Arithmetic' | 'Algebra' | 'Geometry' | 'Data Interpretation';
  'Verbal Aptitude': 'Reading Comprehension' | 'Vocabulary' | 'Grammar' | 'Sentence Completion';
  'Logical Reasoning': 'Pattern Recognition' | 'Syllogisms' | 'Critical Thinking' | 'Puzzles';
  'Analytical Reasoning': 'Data Sufficiency' | 'Logical Puzzles' | 'Coding-Decoding' | 'Direction Distance';
}

// Core question interface
export interface AptitudeQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  difficulty: DifficultyLevel;
  timeLimit?: number; // in seconds
  category: AptitudeCategory;
  subcategory: string;
  topic: string;
  hasImage?: boolean;
  imageUrl?: string;
  hints?: string[];
}

// Database model interfaces
export interface AptitudeSession {
  id: string;
  user_id: string;
  category: string;
  subcategory?: string;
  topic?: string;
  session_type: SessionType;
  questions_attempted: number;
  correct_answers: number;
  total_time_spent: number; // in seconds
  difficulty?: DifficultyLevel;
  xp_earned: number;
  coins_earned: number;
  created_at: string;
  completed_at?: string;
}

export interface QuestionAttempt {
  id: string;
  session_id: string;
  question_id: string;
  question_text: string;
  user_answer?: string;
  correct_answer: string;
  is_correct: boolean;
  time_taken: number; // in seconds
  hints_used: number;
  explanation?: string;
  created_at: string;
}

export interface MockTestResult {
  id: string;
  user_id: string;
  test_id: string;
  test_name: string;
  total_questions: number;
  correct_answers: number;
  total_time_taken: number; // in seconds
  section_wise_scores: Record<string, SectionScore>;
  percentile?: number;
  grade?: string;
  created_at: string;
}

export interface SectionScore {
  correct: number;
  total: number;
  time: number; // in seconds
}

export interface AptitudeUserPreferences {
  id: string;
  user_id: string;
  preferred_difficulty: DifficultyLevel;
  weak_categories: string[];
  strong_categories: string[];
  daily_practice_goal: number;
  preferred_session_duration: number; // in seconds
  last_updated: string;
}

// Practice session data for creating new sessions
export interface PracticeSessionData {
  userId: string;
  category: string;
  subcategory?: string;
  topic?: string;
  sessionType: SessionType;
  questionsAttempted: number;
  correctAnswers: number;
  totalTimeSpent: number;
  difficulty?: DifficultyLevel;
  xpEarned: number;
  coinsEarned: number;
  questionAttempts: QuestionAttemptData[];
}

export interface QuestionAttemptData {
  questionId: string;
  questionText: string;
  userAnswer?: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
  hintsUsed: number;
  explanation?: string;
}

// Performance metrics and analytics
export interface PerformanceMetrics {
  overallAccuracy: number;
  categoryWisePerformance: CategoryPerformance[];
  recentSessions: AptitudeSession[];
  strengthsAndWeaknesses: AnalysisData;
  improvementSuggestions: string[];
  totalQuestionsAttempted: number;
  totalTimeSpent: number; // in seconds
  averageSessionTime: number; // in seconds
  streak: number; // consecutive days of practice
}

export interface CategoryPerformance {
  category: string;
  accuracy: number;
  averageTime: number; // in seconds per question
  questionsAttempted: number;
  lastPracticed: Date;
  improvementTrend: 'improving' | 'declining' | 'stable';
}

export interface AnalysisData {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  focusAreas: string[];
}

// Mock test configuration
export interface MockTestConfig {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  sections: TestSection[];
  totalQuestions: number;
  passingScore: number;
  difficulty: DifficultyLevel;
  category: AptitudeCategory;
}

export interface TestSection {
  name: string;
  questions: AptitudeQuestion[];
  timeLimit: number; // in minutes
  instructions: string;
  maxQuestions?: number;
}

// Navigation types for the aptitude stack
export type AptitudeStackParamList = {
  AptitudeHome: undefined;
  CategoryView: {
    category: AptitudeCategory;
    categoryConfig: any;
  };
  TopicPractice: {
    category: string;
    subcategory: string;
    topic: string;
    difficulty: DifficultyLevel;
  };
  MockTest: {
    testConfig: MockTestConfig;
  };
  ResultsView: {
    sessionId: string;
    sessionType: SessionType;
  };
  ProgressDashboard: undefined;
};

// Component prop types
export interface CategoryCardProps {
  category: AptitudeCategory;
  description: string;
  icon: string;
  totalQuestions: number;
  userProgress: number;
  onPress: () => void;
}

export interface TopicCardProps {
  topic: string;
  difficulty: DifficultyLevel;
  estimatedTime: number;
  questionsCount: number;
  completed: boolean;
  onPress: () => void;
}

export interface QuestionCardProps {
  question: AptitudeQuestion;
  currentIndex: number;
  totalQuestions: number;
  selectedAnswer?: string;
  showAnswer: boolean;
  onAnswerSelect: (answer: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onHint: () => void;
}

// API response types
export interface QuestionGenerationRequest {
  category: string;
  subcategory: string;
  topic: string;
  difficulty: DifficultyLevel;
  count: number;
  questionType?: QuestionType;
}

export interface QuestionGenerationResponse {
  questions: AptitudeQuestion[];
  success: boolean;
  error?: string;
}

export interface ExplanationRequest {
  question: AptitudeQuestion;
  userAnswer: string;
  context?: string;
}

export interface ExplanationResponse {
  explanation: string;
  success: boolean;
  error?: string;
}

// Timer related types
export interface TimerState {
  timeRemaining: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
  totalTime: number; // in seconds
}

export type TimerCallback = (timeRemaining: number) => void;

// Error types
export interface AptitudeError {
  code: string;
  message: string;
  context?: string;
  retryable: boolean;
}

// Constants
export const APTITUDE_CONSTANTS = {
  DEFAULT_QUESTION_COUNT: 10,
  DEFAULT_TIME_LIMIT: 60, // seconds per question
  MAX_HINTS_PER_QUESTION: 3,
  XP_PER_CORRECT_ANSWER: 10,
  COINS_PER_QUESTION: 1,
  BONUS_XP_STREAK: 5,
  MOCK_TEST_DURATION: 120, // minutes
  CATEGORIES: [
    'Quantitative Aptitude',
    'Verbal Aptitude',
    'Logical Reasoning',
    'Analytical Reasoning'
  ] as const,
  DIFFICULTIES: ['Easy', 'Medium', 'Hard'] as const,
  SESSION_TYPES: ['practice', 'mock_test'] as const
} as const;