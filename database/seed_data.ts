// Seed data for aptitude categories and sample questions
import { AptitudeQuestion, MockTestConfig, AptitudeCategory } from '../types/aptitude';

// Category configurations with subcategories and topics
export const CATEGORY_CONFIGS = {
  'Quantitative Aptitude': {
    icon: '🔢',
    description: 'Mathematical and numerical problem solving',
    subcategories: {
      'Arithmetic': {
        topics: ['Percentages', 'Ratios and Proportions', 'Averages', 'Simple Interest', 'Compound Interest'],
        estimatedTime: 45 // minutes
      },
      'Algebra': {
        topics: ['Linear Equations', 'Quadratic Equations', 'Inequalities', 'Progressions'],
        estimatedTime: 50
      },
      'Geometry': {
        topics: ['Areas and Perimeters', 'Volumes', 'Coordinate Geometry', 'Triangles'],
        estimatedTime: 55
      },
      'Data Interpretation': {
        topics: ['Bar Charts', 'Line Graphs', 'Pie Charts', 'Tables', 'Mixed Charts'],
        estimatedTime: 40
      }
    }
  },
  'Verbal Aptitude': {
    icon: '📚',
    description: 'Language skills and comprehension',
    subcategories: {
      'Reading Comprehension': {
        topics: ['Passage Analysis', 'Main Ideas', 'Inference', 'Vocabulary in Context'],
        estimatedTime: 60
      },
      'Vocabulary': {
        topics: ['Synonyms', 'Antonyms', 'Word Meanings', 'Analogies'],
        estimatedTime: 30
      },
      'Grammar': {
        topics: ['Sentence Correction', 'Error Spotting', 'Fill in the Blanks'],
        estimatedTime: 35
      },
      'Sentence Completion': {
        topics: ['Context Clues', 'Logical Flow', 'Coherence'],
        estimatedTime: 40
      }
    }
  },
  'Logical Reasoning': {
    icon: '🧩',
    description: 'Pattern recognition and logical thinking',
    subcategories: {
      'Pattern Recognition': {
        topics: ['Number Series', 'Letter Series', 'Figure Patterns', 'Analogies'],
        estimatedTime: 45
      },
      'Syllogisms': {
        topics: ['Categorical Syllogisms', 'Conditional Statements', 'Logical Deductions'],
        estimatedTime: 50
      },
      'Critical Thinking': {
        topics: ['Assumptions', 'Conclusions', 'Cause and Effect', 'Strengthen/Weaken'],
        estimatedTime: 55
      },
      'Puzzles': {
        topics: ['Seating Arrangements', 'Blood Relations', 'Direction Sense', 'Ranking'],
        estimatedTime: 60
      }
    }
  },
  'Analytical Reasoning': {
    icon: '🔍',
    description: 'Data analysis and problem solving',
    subcategories: {
      'Data Sufficiency': {
        topics: ['Statement Analysis', 'Sufficiency Evaluation', 'Combined Statements'],
        estimatedTime: 50
      },
      'Logical Puzzles': {
        topics: ['Grid Puzzles', 'Matching Problems', 'Scheduling', 'Grouping'],
        estimatedTime: 65
      },
      'Coding-Decoding': {
        topics: ['Letter Coding', 'Number Coding', 'Symbol Coding', 'Mixed Coding'],
        estimatedTime: 40
      },
      'Direction Distance': {
        topics: ['Direction Problems', 'Distance Calculation', 'Path Finding'],
        estimatedTime: 35
      }
    }
  }
} as const;

// Sample questions for initial testing and development
export const SAMPLE_QUESTIONS: AptitudeQuestion[] = [
  // Quantitative Aptitude - Arithmetic
  {
    id: 'qa_arith_001',
    type: 'multiple-choice',
    question: 'If 20% of a number is 40, what is 50% of that number?',
    options: ['80', '100', '120', '160'],
    correctAnswer: '100',
    explanation: 'If 20% of x = 40, then x = 40 ÷ 0.20 = 200. Therefore, 50% of 200 = 100.',
    difficulty: 'Easy',
    timeLimit: 60,
    category: 'Quantitative Aptitude',
    subcategory: 'Arithmetic',
    topic: 'Percentages'
  },
  {
    id: 'qa_arith_002',
    type: 'multiple-choice',
    question: 'The ratio of boys to girls in a class is 3:2. If there are 15 boys, how many girls are there?',
    options: ['8', '10', '12', '18'],
    correctAnswer: '10',
    explanation: 'If boys:girls = 3:2 and boys = 15, then 3x = 15, so x = 5. Girls = 2x = 2(5) = 10.',
    difficulty: 'Easy',
    timeLimit: 60,
    category: 'Quantitative Aptitude',
    subcategory: 'Arithmetic',
    topic: 'Ratios and Proportions'
  },

  // Verbal Aptitude - Vocabulary
  {
    id: 'va_vocab_001',
    type: 'multiple-choice',
    question: 'Choose the word that is most similar in meaning to "ABUNDANT":',
    options: ['Scarce', 'Plentiful', 'Moderate', 'Limited'],
    correctAnswer: 'Plentiful',
    explanation: 'Abundant means existing in large quantities; plentiful. The other options are antonyms or unrelated.',
    difficulty: 'Easy',
    timeLimit: 45,
    category: 'Verbal Aptitude',
    subcategory: 'Vocabulary',
    topic: 'Synonyms'
  },

  // Logical Reasoning - Pattern Recognition
  {
    id: 'lr_pattern_001',
    type: 'multiple-choice',
    question: 'Find the next number in the series: 2, 6, 12, 20, 30, ?',
    options: ['40', '42', '44', '46'],
    correctAnswer: '42',
    explanation: 'The differences are: 4, 6, 8, 10, ... (increasing by 2). Next difference is 12, so 30 + 12 = 42.',
    difficulty: 'Medium',
    timeLimit: 90,
    category: 'Logical Reasoning',
    subcategory: 'Pattern Recognition',
    topic: 'Number Series'
  },

  // Analytical Reasoning - Data Sufficiency
  {
    id: 'ar_data_001',
    type: 'multiple-choice',
    question: 'Is x > y? Statement 1: x + 2 > y + 2. Statement 2: x - 3 > y - 3.',
    options: [
      'Statement 1 alone is sufficient',
      'Statement 2 alone is sufficient', 
      'Both statements together are sufficient',
      'Each statement alone is sufficient'
    ],
    correctAnswer: 'Each statement alone is sufficient',
    explanation: 'Both statements are equivalent to x > y. Adding or subtracting the same value from both sides preserves the inequality.',
    difficulty: 'Medium',
    timeLimit: 120,
    category: 'Analytical Reasoning',
    subcategory: 'Data Sufficiency',
    topic: 'Statement Analysis'
  }
];

// Sample mock test configurations
export const SAMPLE_MOCK_TESTS: MockTestConfig[] = [
  {
    id: 'mock_test_001',
    title: 'General Aptitude Test - Beginner',
    description: 'A comprehensive test covering all aptitude areas for beginners',
    duration: 60, // minutes
    totalQuestions: 40,
    passingScore: 60, // percentage
    difficulty: 'Easy',
    category: 'Quantitative Aptitude', // Primary category
    sections: [
      {
        name: 'Quantitative Aptitude',
        questions: [], // Will be populated dynamically
        timeLimit: 20,
        instructions: 'Solve mathematical problems. Calculator not allowed.',
        maxQuestions: 15
      },
      {
        name: 'Verbal Aptitude',
        questions: [],
        timeLimit: 15,
        instructions: 'Answer questions based on language skills and comprehension.',
        maxQuestions: 10
      },
      {
        name: 'Logical Reasoning',
        questions: [],
        timeLimit: 15,
        instructions: 'Solve logical puzzles and pattern recognition problems.',
        maxQuestions: 10
      },
      {
        name: 'Analytical Reasoning',
        questions: [],
        timeLimit: 10,
        instructions: 'Analyze data and solve reasoning problems.',
        maxQuestions: 5
      }
    ]
  },
  {
    id: 'mock_test_002',
    title: 'Advanced Aptitude Challenge',
    description: 'Challenging test for advanced learners',
    duration: 90,
    totalQuestions: 60,
    passingScore: 70,
    difficulty: 'Hard',
    category: 'Logical Reasoning',
    sections: [
      {
        name: 'Quantitative Aptitude',
        questions: [],
        timeLimit: 30,
        instructions: 'Advanced mathematical problems requiring analytical thinking.',
        maxQuestions: 20
      },
      {
        name: 'Verbal Aptitude',
        questions: [],
        timeLimit: 20,
        instructions: 'Complex reading comprehension and vocabulary questions.',
        maxQuestions: 15
      },
      {
        name: 'Logical Reasoning',
        questions: [],
        timeLimit: 25,
        instructions: 'Advanced logical puzzles and critical thinking problems.',
        maxQuestions: 15
      },
      {
        name: 'Analytical Reasoning',
        questions: [],
        timeLimit: 15,
        instructions: 'Complex data analysis and reasoning challenges.',
        maxQuestions: 10
      }
    ]
  }
];

// Default user preferences
export const DEFAULT_USER_PREFERENCES = {
  preferred_difficulty: 'Medium' as const,
  weak_categories: [],
  strong_categories: [],
  daily_practice_goal: 10,
  preferred_session_duration: 1800 // 30 minutes
};

// Question generation prompts for AI
export const AI_PROMPTS = {
  QUANTITATIVE: {
    ARITHMETIC: `Generate {count} {difficulty} level arithmetic questions on {topic}. 
    Each question should test practical problem-solving skills with real-world applications.
    Format as JSON array with fields: question, options (4 choices), correctAnswer, explanation.`,
    
    ALGEBRA: `Create {count} {difficulty} level algebra questions on {topic}.
    Focus on equation solving and algebraic manipulation.
    Format as JSON array with fields: question, options (4 choices), correctAnswer, explanation.`,
    
    GEOMETRY: `Generate {count} {difficulty} level geometry questions on {topic}.
    Include problems involving shapes, areas, volumes, and spatial reasoning.
    Format as JSON array with fields: question, options (4 choices), correctAnswer, explanation.`,
    
    DATA_INTERPRETATION: `Create {count} {difficulty} level data interpretation questions on {topic}.
    Include charts, graphs, and tables with analytical questions.
    Format as JSON array with fields: question, options (4 choices), correctAnswer, explanation.`
  },
  
  VERBAL: {
    READING_COMPREHENSION: `Generate {count} {difficulty} level reading comprehension questions on {topic}.
    Include a passage followed by questions testing understanding and inference.
    Format as JSON array with fields: question, options (4 choices), correctAnswer, explanation.`,
    
    VOCABULARY: `Create {count} {difficulty} level vocabulary questions on {topic}.
    Test word meanings, synonyms, antonyms, and usage in context.
    Format as JSON array with fields: question, options (4 choices), correctAnswer, explanation.`
  },
  
  LOGICAL: {
    PATTERN_RECOGNITION: `Generate {count} {difficulty} level pattern recognition questions on {topic}.
    Include number series, letter sequences, and figure patterns.
    Format as JSON array with fields: question, options (4 choices), correctAnswer, explanation.`,
    
    SYLLOGISMS: `Create {count} {difficulty} level syllogism questions on {topic}.
    Test logical deduction and reasoning from given premises.
    Format as JSON array with fields: question, options (4 choices), correctAnswer, explanation.`
  },
  
  ANALYTICAL: {
    DATA_SUFFICIENCY: `Generate {count} {difficulty} level data sufficiency questions on {topic}.
    Present problems with statements and ask what information is sufficient to solve.
    Format as JSON array with fields: question, options (4 choices), correctAnswer, explanation.`
  }
};

export default {
  CATEGORY_CONFIGS,
  SAMPLE_QUESTIONS,
  SAMPLE_MOCK_TESTS,
  DEFAULT_USER_PREFERENCES,
  AI_PROMPTS
};