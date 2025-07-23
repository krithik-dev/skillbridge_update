import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

const SUPABASE_URL = 'https://zlgbgtlvwtzasykxgjfd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ2JndGx2d3R6YXN5a3hnamZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTA3NTksImV4cCI6MjA2ODg2Njc1OX0.xqDu2l1rPBZ5vZbJ73WCKSunEvI_j-tOgO3OPCwvUc4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
