// Database migration utilities for aptitude feature
import { supabase } from '../lib/supabase';

export class AptitudeMigrations {
  /**
   * Run all aptitude-related database migrations
   */
  static async runMigrations(): Promise<boolean> {
    try {
      console.log('Starting aptitude database migrations...');
      
      // Check if tables already exist
      const tablesExist = await this.checkTablesExist();
      if (tablesExist) {
        console.log('Aptitude tables already exist, skipping migration');
        return true;
      }

      // Create tables
      await this.createAptitudeTables();
      
      console.log('Aptitude database migrations completed successfully');
      return true;
    } catch (error) {
      console.error('Error running aptitude migrations:', error);
      return false;
    }
  }

  /**
   * Check if aptitude tables already exist
   */
  private static async checkTablesExist(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('aptitude_sessions')
        .select('id')
        .limit(1);
      
      // If no error, table exists
      return !error;
    } catch (error) {
      // Table doesn't exist
      return false;
    }
  }

  /**
   * Create all aptitude-related tables
   */
  private static async createAptitudeTables(): Promise<void> {
    const createTablesSQL = `
      -- Create aptitude_sessions table
      CREATE TABLE IF NOT EXISTS aptitude_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        category VARCHAR(50) NOT NULL,
        subcategory VARCHAR(50),
        topic VARCHAR(100),
        session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('practice', 'mock_test')),
        questions_attempted INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        total_time_spent INTEGER DEFAULT 0,
        difficulty VARCHAR(10) CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
        xp_earned INTEGER DEFAULT 0,
        coins_earned INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      );

      -- Create aptitude_question_attempts table
      CREATE TABLE IF NOT EXISTS aptitude_question_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES aptitude_sessions(id) ON DELETE CASCADE,
        question_id VARCHAR(100) NOT NULL,
        question_text TEXT NOT NULL,
        user_answer TEXT,
        correct_answer TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT FALSE,
        time_taken INTEGER DEFAULT 0,
        hints_used INTEGER DEFAULT 0,
        explanation TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create mock_test_results table
      CREATE TABLE IF NOT EXISTS mock_test_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        test_id VARCHAR(50) NOT NULL,
        test_name VARCHAR(200) NOT NULL,
        total_questions INTEGER NOT NULL,
        correct_answers INTEGER DEFAULT 0,
        total_time_taken INTEGER DEFAULT 0,
        section_wise_scores JSONB,
        percentile DECIMAL(5,2),
        grade VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create aptitude_user_preferences table
      CREATE TABLE IF NOT EXISTS aptitude_user_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        preferred_difficulty VARCHAR(10) DEFAULT 'Medium',
        weak_categories JSONB DEFAULT '[]',
        strong_categories JSONB DEFAULT '[]',
        daily_practice_goal INTEGER DEFAULT 10,
        preferred_session_duration INTEGER DEFAULT 1800,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_aptitude_sessions_user_id ON aptitude_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_aptitude_sessions_category ON aptitude_sessions(category);
      CREATE INDEX IF NOT EXISTS idx_aptitude_sessions_created_at ON aptitude_sessions(created_at);
      CREATE INDEX IF NOT EXISTS idx_question_attempts_session_id ON aptitude_question_attempts(session_id);
      CREATE INDEX IF NOT EXISTS idx_question_attempts_question_id ON aptitude_question_attempts(question_id);
      CREATE INDEX IF NOT EXISTS idx_mock_test_results_user_id ON mock_test_results(user_id);
      CREATE INDEX IF NOT EXISTS idx_mock_test_results_test_id ON mock_test_results(test_id);
      CREATE INDEX IF NOT EXISTS idx_mock_test_results_created_at ON mock_test_results(created_at);
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
    
    if (error) {
      throw new Error(`Failed to create tables: ${error.message}`);
    }

    // Enable RLS and create policies
    await this.setupRowLevelSecurity();
  }

  /**
   * Set up Row Level Security policies
   */
  private static async setupRowLevelSecurity(): Promise<void> {
    const rlsSQL = `
      -- Enable RLS
      ALTER TABLE aptitude_sessions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE aptitude_question_attempts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE mock_test_results ENABLE ROW LEVEL SECURITY;
      ALTER TABLE aptitude_user_preferences ENABLE ROW LEVEL SECURITY;

      -- Policies for aptitude_sessions
      CREATE POLICY IF NOT EXISTS "Users can view their own aptitude sessions" ON aptitude_sessions
        FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can insert their own aptitude sessions" ON aptitude_sessions
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can update their own aptitude sessions" ON aptitude_sessions
        FOR UPDATE USING (auth.uid() = user_id);

      -- Policies for aptitude_question_attempts
      CREATE POLICY IF NOT EXISTS "Users can view their own question attempts" ON aptitude_question_attempts
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM aptitude_sessions 
            WHERE aptitude_sessions.id = aptitude_question_attempts.session_id 
            AND aptitude_sessions.user_id = auth.uid()
          )
        );

      CREATE POLICY IF NOT EXISTS "Users can insert their own question attempts" ON aptitude_question_attempts
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM aptitude_sessions 
            WHERE aptitude_sessions.id = aptitude_question_attempts.session_id 
            AND aptitude_sessions.user_id = auth.uid()
          )
        );

      -- Policies for mock_test_results
      CREATE POLICY IF NOT EXISTS "Users can view their own mock test results" ON mock_test_results
        FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can insert their own mock test results" ON mock_test_results
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      -- Policies for aptitude_user_preferences
      CREATE POLICY IF NOT EXISTS "Users can view their own preferences" ON aptitude_user_preferences
        FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can insert their own preferences" ON aptitude_user_preferences
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can update their own preferences" ON aptitude_user_preferences
        FOR UPDATE USING (auth.uid() = user_id);
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    
    if (error) {
      console.warn('Some RLS policies may already exist:', error.message);
    }
  }

  /**
   * Initialize default user preferences for a user
   */
  static async initializeUserPreferences(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('aptitude_user_preferences')
        .upsert({
          user_id: userId,
          preferred_difficulty: 'Medium',
          weak_categories: [],
          strong_categories: [],
          daily_practice_goal: 10,
          preferred_session_duration: 1800,
          last_updated: new Date().toISOString()
        });

      if (error) {
        console.error('Error initializing user preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error initializing user preferences:', error);
      return false;
    }
  }

  /**
   * Clean up test data (for development/testing)
   */
  static async cleanupTestData(userId?: string): Promise<boolean> {
    try {
      if (userId) {
        // Clean up specific user's data
        await supabase.from('aptitude_sessions').delete().eq('user_id', userId);
        await supabase.from('mock_test_results').delete().eq('user_id', userId);
        await supabase.from('aptitude_user_preferences').delete().eq('user_id', userId);
      } else {
        // Clean up all test data (use with caution!)
        console.warn('Cleaning up ALL aptitude data...');
        await supabase.from('aptitude_question_attempts').delete().neq('id', '');
        await supabase.from('aptitude_sessions').delete().neq('id', '');
        await supabase.from('mock_test_results').delete().neq('id', '');
        await supabase.from('aptitude_user_preferences').delete().neq('id', '');
      }

      return true;
    } catch (error) {
      console.error('Error cleaning up test data:', error);
      return false;
    }
  }

  /**
   * Verify database setup
   */
  static async verifySetup(): Promise<boolean> {
    try {
      // Test each table
      const tables = [
        'aptitude_sessions',
        'aptitude_question_attempts', 
        'mock_test_results',
        'aptitude_user_preferences'
      ];

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.error(`Table ${table} verification failed:`, error);
          return false;
        }
      }

      console.log('All aptitude tables verified successfully');
      return true;
    } catch (error) {
      console.error('Database verification failed:', error);
      return false;
    }
  }
}