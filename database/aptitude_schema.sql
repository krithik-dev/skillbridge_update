-- Aptitude and Logical Reasoning Database Schema
-- This file contains the database schema for the aptitude feature

-- Table for storing aptitude practice sessions
CREATE TABLE IF NOT EXISTS aptitude_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  topic VARCHAR(100),
  session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('practice', 'mock_test')),
  questions_attempted INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0, -- in seconds
  difficulty VARCHAR(10) CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  xp_earned INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes for better query performance
  INDEX idx_aptitude_sessions_user_id (user_id),
  INDEX idx_aptitude_sessions_category (category),
  INDEX idx_aptitude_sessions_created_at (created_at)
);

-- Table for storing individual question attempts within sessions
CREATE TABLE IF NOT EXISTS aptitude_question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES aptitude_sessions(id) ON DELETE CASCADE,
  question_id VARCHAR(100) NOT NULL,
  question_text TEXT NOT NULL,
  user_answer TEXT,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  time_taken INTEGER DEFAULT 0, -- in seconds
  hints_used INTEGER DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_question_attempts_session_id (session_id),
  INDEX idx_question_attempts_question_id (question_id)
);

-- Table for storing mock test results and detailed analysis
CREATE TABLE IF NOT EXISTS mock_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id VARCHAR(50) NOT NULL,
  test_name VARCHAR(200) NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER DEFAULT 0,
  total_time_taken INTEGER DEFAULT 0, -- in seconds
  section_wise_scores JSONB, -- {section_name: {correct: number, total: number, time: number}}
  percentile DECIMAL(5,2),
  grade VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_mock_test_results_user_id (user_id),
  INDEX idx_mock_test_results_test_id (test_id),
  INDEX idx_mock_test_results_created_at (created_at)
);

-- Table for storing user preferences and adaptive learning data
CREATE TABLE IF NOT EXISTS aptitude_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferred_difficulty VARCHAR(10) DEFAULT 'Medium',
  weak_categories JSONB DEFAULT '[]', -- Array of category names
  strong_categories JSONB DEFAULT '[]', -- Array of category names
  daily_practice_goal INTEGER DEFAULT 10, -- questions per day
  preferred_session_duration INTEGER DEFAULT 1800, -- 30 minutes in seconds
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to ensure one preference record per user
  UNIQUE(user_id)
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE aptitude_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aptitude_question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE aptitude_user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for aptitude_sessions
CREATE POLICY "Users can view their own aptitude sessions" ON aptitude_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own aptitude sessions" ON aptitude_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own aptitude sessions" ON aptitude_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for aptitude_question_attempts
CREATE POLICY "Users can view their own question attempts" ON aptitude_question_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM aptitude_sessions 
      WHERE aptitude_sessions.id = aptitude_question_attempts.session_id 
      AND aptitude_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own question attempts" ON aptitude_question_attempts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM aptitude_sessions 
      WHERE aptitude_sessions.id = aptitude_question_attempts.session_id 
      AND aptitude_sessions.user_id = auth.uid()
    )
  );

-- RLS Policies for mock_test_results
CREATE POLICY "Users can view their own mock test results" ON mock_test_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mock test results" ON mock_test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for aptitude_user_preferences
CREATE POLICY "Users can view their own preferences" ON aptitude_user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON aptitude_user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON aptitude_user_preferences
  FOR UPDATE USING (auth.uid() = user_id);