import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ilprkbnymmokthtmzdqf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscHJrYm55bW1va3RodG16ZHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDE5ODIsImV4cCI6MjA4MjQxNzk4Mn0.kV9HqG-Shj_MAuE4ygWGmOTpbzkIlEAchDxnDmw46yg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
