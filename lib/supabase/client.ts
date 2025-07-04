import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function getUserUsageSummary(userId: string, dateRange: { from: Date; to: Date }) {
  // This is a mock implementation
  // In a real application, you would query your Supabase database
  // Example: return await supabase.from('usage_logs').select('*').eq('user_id', userId).gte('created_at', dateRange.from).lte('created_at', dateRange.to)
  
  return {
    totalCost: 12.85,
    totalTokens: 1250000,
    dailyAverage: 41250,
  }
} 