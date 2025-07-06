import { query } from './db' // Import PG query function
import logger from './logger'

// purpose: track API usage data and provide analytics summaries
// inputs: database query helper, usage objects
// outputs: usage records and aggregated statistics
// status: stable
// depends_on: db.ts, logger.ts
// import supabase from './supabase' // REMOVE
// import type { Database } from '@/types/supabase' // REMOVE
// import { AIProvider } from './ai-config' // AIProvider might not be used directly in this file after refactor or defined elsewhere

// --- Local Type Definitions ---
export interface ApiUsage {
  id: string; // uuid
  user_id: string; // uuid
  project_id?: string | null; // uuid
  agent_id?: string | null; // uuid
  provider: string;
  model: string;
  action?: string | null;
  tokens_prompt: number;
  tokens_completion: number;
  tokens_total: number;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

export interface ApiUsageInsert {
  user_id: string;
  project_id?: string | null;
  agent_id?: string | null;
  provider: string;
  model: string;
  action?: string | null;
  tokens_prompt: number;
  tokens_completion: number;
  // tokens_total is calculated in trackUsage before insert or by DB default
}

export interface AgentRating {
  id: string; // uuid
  agent_id: string; // uuid
  user_id: string; // uuid
  rating: number;
  comment?: string | null;
  created_at: string; // timestamptz
}

export interface AgentRatingInsert {
  agent_id: string;
  user_id: string;
  rating: number;
  comment?: string | null;
}
// --- End Local Type Definitions ---

// Remove old Supabase types
// export type ApiUsage = Database['public']['Tables']['api_usage']['Row'] 
// export type ApiUsageInsert = Database['public']['Tables']['api_usage']['Insert']
// export type ApiUsageUpdate = Database['public']['Tables']['api_usage']['Update']

// Usage statistics types
export interface DailyUsage {
  date: string
  tokens: number
}

export interface ProviderUsage {
  provider: string
  tokens: number
  percentage: number
}

export interface ModelUsage {
  model: string
  provider: string
  tokens: number
  percentage: number
}

export interface ProjectUsage {
  project_id: string
  project_name: string
  tokens: number
  percentage: number
}

export interface UsageSummary {
  total_tokens: number
  total_cost_estimate: number
  daily_usage: DailyUsage[]
  provider_usage: ProviderUsage[]
  model_usage: ModelUsage[]
  project_usage: ProjectUsage[]
}

// Cost estimates per 1K tokens (approximate as of 2023)
const COST_PER_1K_TOKENS: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'gemini-pro': { input: 0.00125, output: 0.00125 },
  'gemini-1.5-pro': { input: 0.0035, output: 0.0035 },
}

// Helper function to estimate cost based on tokens and model
export const estimateCost = (
  model: string,
  tokensPrompt: number,
  tokensCompletion: number
): number => {
  const costInfo = COST_PER_1K_TOKENS[model] || { input: 0.005, output: 0.01 } // Default fallback
  
  const promptCost = (tokensPrompt / 1000) * costInfo.input
  const completionCost = (tokensCompletion / 1000) * costInfo.output
  
  return promptCost + completionCost
}

// Agent performance types
export interface AgentPerformanceSummary {
  agent_id: string;
  agent_name: string;
  model: string;
  avg_rating: number;
  total_interactions: number;
  total_tokens: number;
  cost_estimate: number;
  daily_ratings: { date: string; rating: number; count: number }[];
  daily_usage: { date: string; tokens: number; cost: number; count: number }[];
  trend_rating: number; // Percentage change from previous period
  trend_usage: number; // Percentage change from previous period
}

export const ApiUsageService = {
  /**
   * Track a new API usage entry
   */
  async trackUsage(usage: ApiUsageInsert): Promise<ApiUsage> { 
    const tokensTotal = usage.tokens_prompt + usage.tokens_completion;
    
    const sql = `
      INSERT INTO api_usage (
        user_id, project_id, agent_id, provider, model, action, 
        tokens_prompt, tokens_completion, tokens_total
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    try {
      const { rows } = await query(sql, [
        usage.user_id,
        usage.project_id || null,
        usage.agent_id || null,
        usage.provider,
        usage.model,
        usage.action || null,
        usage.tokens_prompt,
        usage.tokens_completion,
        tokensTotal // Calculated total
      ]);
      if (!rows[0]) {
        throw new Error('Failed to insert API usage record, no data returned.');
      }
      return rows[0] as ApiUsage;
    } catch (error) {
      logger.error({ error }, 'Error tracking API usage');
      throw new Error(error instanceof Error ? error.message : 'Failed to track API usage');
    }
  },
  
  /**
   * Get usage summary for a user within a date range
   */
  async getUserUsageSummary(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageSummary> {
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    const sql = `
      SELECT 
        au.id, au.created_at, au.user_id, au.project_id, au.agent_id, 
        au.provider, au.model, au.tokens_prompt, au.tokens_completion, au.tokens_total,
        p.name as project_name
      FROM api_usage au
      LEFT JOIN projects p ON au.project_id = p.id
      WHERE au.user_id = $1
        AND au.created_at >= $2
        AND au.created_at <= $3
      ORDER BY au.created_at ASC;
    `;

    try {
      const { rows: usageData } = await query(sql, [userId, startDateStr, endDateStr]);

      const summary: UsageSummary = {
        total_tokens: 0,
        total_cost_estimate: 0,
        daily_usage: [],
        provider_usage: [],
        model_usage: [],
        project_usage: []
      };

      if (!usageData || usageData.length === 0) {
        return summary;
      }

      const providerMap = new Map<string, number>();
      const modelMap = new Map<string, { provider: string; tokens: number }>();
      const projectMap = new Map<string, { name: string; tokens: number }>();
      const dailyMap = new Map<string, number>();
      
      let totalTokens = 0;
      let totalCost = 0;

      usageData.forEach((usage: any) => { // Use `any` for now, or a more specific fetched type
        totalTokens += usage.tokens_total;
        const cost = estimateCost(usage.model, usage.tokens_prompt, usage.tokens_completion);
        totalCost += cost;

        const providerTokens = providerMap.get(usage.provider) || 0;
        providerMap.set(usage.provider, providerTokens + usage.tokens_total);

        const modelKey = usage.model;
        const modelData = modelMap.get(modelKey) || { provider: usage.provider, tokens: 0 };
        modelMap.set(modelKey, {
          ...modelData,
          tokens: modelData.tokens + usage.tokens_total
        });

        if (usage.project_id) {
          const projectName = usage.project_name || 'Unknown Project'; // project_name from join
          const projectData = projectMap.get(usage.project_id) || { name: projectName, tokens: 0 };
          projectMap.set(usage.project_id, {
            ...projectData,
            tokens: projectData.tokens + usage.tokens_total
          });
        }

        const day = new Date(usage.created_at).toISOString().split('T')[0];
        const dayTokens = dailyMap.get(day) || 0;
        dailyMap.set(day, dayTokens + usage.tokens_total);
      });

      summary.total_tokens = totalTokens;
      summary.total_cost_estimate = totalCost;

      summary.daily_usage = Array.from(dailyMap.entries())
        .map(([date, tokens]) => ({ date, tokens }))
        .sort((a, b) => a.date.localeCompare(b.date));

      summary.provider_usage = Array.from(providerMap.entries())
        .map(([provider, tokens]) => ({
          provider,
          tokens,
          percentage: totalTokens > 0 ? (tokens / totalTokens) * 100 : 0
        }))
        .sort((a, b) => b.tokens - a.tokens);

      summary.model_usage = Array.from(modelMap.entries())
        .map(([model, { provider, tokens }]) => ({
          model,
          provider,
          tokens,
          percentage: totalTokens > 0 ? (tokens / totalTokens) * 100 : 0
        }))
        .sort((a, b) => b.tokens - a.tokens);

      summary.project_usage = Array.from(projectMap.entries())
        .map(([project_id, { name, tokens }]) => ({
          project_id,
          project_name: name,
          tokens,
          percentage: totalTokens > 0 ? (tokens / totalTokens) * 100 : 0
        }))
        .sort((a, b) => b.tokens - a.tokens);

      return summary;

    } catch (error) {
      logger.error({ error }, 'Error fetching user usage summary');
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch usage summary');
    }
  },

  /**
   * Lightweight stats for the dashboard.
   */
  async getUserDashboardStats(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ total_tokens: number; avg_rating: number | null }> {
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    const usageSql = `
      SELECT COALESCE(SUM(tokens_total), 0) AS total_tokens
      FROM api_usage
      WHERE user_id = $1
        AND created_at >= $2
        AND created_at <= $3;
    `;

    const ratingSql = `
      SELECT AVG(rating) AS avg_rating
      FROM agent_ratings
      WHERE user_id = $1
        AND created_at >= $2
        AND created_at <= $3;
    `;

    try {
      const usagePromise = query(usageSql, [userId, startDateStr, endDateStr]);
      const ratingPromise = query(ratingSql, [userId, startDateStr, endDateStr]);
      const [usageResult, ratingResult] = await Promise.all([usagePromise, ratingPromise]);
      const totalTokens = parseInt(usageResult.rows[0]?.total_tokens ?? '0', 10);
      const avgRating = ratingResult.rows[0]?.avg_rating
        ? parseFloat(ratingResult.rows[0].avg_rating)
        : null;
      return { total_tokens: totalTokens, avg_rating: avgRating };
    } catch (error) {
      logger.error({ error }, 'Error fetching dashboard stats');
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch dashboard stats'
      );
    }
  },

  async getUserUsageRecords(
    userId: string, 
    startDate: Date, 
    endDate: Date,
    page = 1,
    pageSize = 50
  ): Promise<{
    data: ApiUsage[];
    count: number;
  }> {
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    const offset = (page - 1) * pageSize;

    const dataSql = `
      SELECT *
      FROM api_usage
      WHERE user_id = $1
        AND created_at >= $2
        AND created_at <= $3
      ORDER BY created_at DESC
      LIMIT $4
      OFFSET $5;
    `;

    const countSql = `
      SELECT COUNT(*)
      FROM api_usage
      WHERE user_id = $1
        AND created_at >= $2
        AND created_at <= $3;
    `;

    try {
      const dataPromise = query(dataSql, [userId, startDateStr, endDateStr, pageSize, offset]);
      const countPromise = query(countSql, [userId, startDateStr, endDateStr]);

      const [dataResult, countResult] = await Promise.all([dataPromise, countPromise]);
      
      const records = dataResult.rows as ApiUsage[];
      const totalCount = parseInt(countResult.rows[0].count, 10) || 0;

      return { data: records, count: totalCount };
    } catch (error) {
      logger.error({ error }, 'Error fetching API usage records');
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch usage records');
    }
  },

  async getAgentPerformanceData(
    userId: string,
    startDate: Date,
    endDate: Date,
    agentId?: string
  ): Promise<AgentPerformanceSummary[]> {
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    try {
      // Fetch agent data
      let agentsSql = `SELECT id, name, model FROM agents WHERE user_id = $1 ORDER BY name`;
      const agentParams: any[] = [userId];
      if (agentId) {
        agentsSql = `SELECT id, name, model FROM agents WHERE user_id = $1 AND id = $2 ORDER BY name`;
        agentParams.push(agentId);
      }
      const { rows: agents } = await query(agentsSql, agentParams);

      if (!agents || agents.length === 0) {
        return [];
      }

      const agentIds = agents.map((a: any) => a.id);

      // Fetch usage data for agents
      const usageSql = `
        SELECT agent_id, model, tokens_total, tokens_prompt, tokens_completion, created_at 
        FROM api_usage 
        WHERE agent_id = ANY($1::uuid[]) 
          AND created_at >= $2 
          AND created_at <= $3 
        ORDER BY created_at;
      `;
      const { rows: usageData } = await query(usageSql, [agentIds, startDateStr, endDateStr]);

      // Fetch ratings data for agents
      const ratingsSql = `
        SELECT agent_id, rating, created_at 
        FROM agent_ratings 
        WHERE agent_id = ANY($1::uuid[]) 
          AND created_at >= $2 
          AND created_at <= $3 
        ORDER BY created_at;
      `;
      const { rows: ratingsData } = await query(ratingsSql, [agentIds, startDateStr, endDateStr]);
      
      // The rest of the aggregation logic remains largely the same
      const performanceSummaries: AgentPerformanceSummary[] = agents.map((agent: any) => {
        const agentUsage = usageData?.filter((u: any) => u.agent_id === agent.id) || [];
        const agentRatings = ratingsData?.filter((r: any) => r.agent_id === agent.id) || [];
        
        let totalTokens = 0;
        let totalCost = 0;
        const dailyUsageMap = new Map<string, { tokens: number; cost: number; count: number }>();
        
        agentUsage.forEach((usage: any) => {
          totalTokens += usage.tokens_total;
          const cost = estimateCost(usage.model, usage.tokens_prompt, usage.tokens_completion);
          totalCost += cost;
          const day = new Date(usage.created_at).toISOString().split('T')[0];
          const dayData = dailyUsageMap.get(day) || { tokens: 0, cost: 0, count: 0 };
          dailyUsageMap.set(day, {
            tokens: dayData.tokens + usage.tokens_total,
            cost: dayData.cost + cost,
            count: dayData.count + 1
          });
        });
        
        const dailyRatingsMap = new Map<string, { total: number; count: number }>();
        let totalRating = 0;
        agentRatings.forEach((ratingEntry: any) => {
          totalRating += ratingEntry.rating;
          const day = new Date(ratingEntry.created_at).toISOString().split('T')[0];
          const dayData = dailyRatingsMap.get(day) || { total: 0, count: 0 };
          dailyRatingsMap.set(day, {
            total: dayData.total + ratingEntry.rating,
            count: dayData.count + 1
          });
        });
        
        const dailyRatings = Array.from(dailyRatingsMap.entries())
          .map(([date, data]) => ({ date, rating: data.count > 0 ? data.total / data.count : 0, count: data.count }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        const dailyUsage = Array.from(dailyUsageMap.entries())
          .map(([date, data]) => ({ date, tokens: data.tokens, cost: data.cost, count: data.count }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        const calculateTrend = (dataArray: any[], key: string): number => {
          if (dataArray.length < 2) return 0;
          const halfPoint = Math.floor(dataArray.length / 2);
          const firstHalf = dataArray.slice(0, halfPoint);
          const secondHalf = dataArray.slice(halfPoint);
          if (firstHalf.length === 0 || secondHalf.length === 0) return 0; // Avoid division by zero
          const firstAvg = firstHalf.reduce((sum, item) => sum + item[key], 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((sum, item) => sum + item[key], 0) / secondHalf.length;
          if (firstAvg === 0) return secondAvg === 0 ? 0 : (secondAvg > 0 ? 100 : -100) ; // Handle division by zero or large change
          return parseFloat((((secondAvg - firstAvg) / firstAvg) * 100).toFixed(1));
        };
        
        const trendRating = calculateTrend(dailyRatings, 'rating');
        const trendUsage = calculateTrend(dailyUsage, 'tokens');
        
        return {
          agent_id: agent.id,
          agent_name: agent.name,
          model: agent.model,
          avg_rating: agentRatings.length > 0 ? totalRating / agentRatings.length : 0,
          total_interactions: agentRatings.length, // Assuming one rating per interaction for this summary
          total_tokens: totalTokens,
          cost_estimate: totalCost,
          daily_ratings: dailyRatings,
          daily_usage: dailyUsage,
          trend_rating: trendRating,
          trend_usage: trendUsage
        };
      });
      return performanceSummaries;
    } catch (error) {
      logger.error({ error }, 'Error fetching agent performance data');
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch agent performance data');
    }
  }
}; 