'use client';

import { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, 
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { subDays, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';

// Type for the agent performance data
interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  model: string;
  avg_rating: number;
  total_interactions: number;
  total_tokens: number;
  cost_estimate: number;
  daily_ratings: { date: string; rating: number; count: number }[];
  daily_usage: { date: string; tokens: number; cost: number; count: number }[];
  trend_rating: number;
  trend_usage: number;
}

export default function AgentPerformanceClient() {
  const { data: session, status } = useSession({ required: false });
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'rating' | 'usage'>('rating');
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch agent performance data
  useEffect(() => {
    const fetchAgentPerformance = async () => {
      if (status === 'loading') return;
      if (status === 'unauthenticated') {
        setError('You must be signed in to view this page');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Build the API URL with query parameters
        const apiUrl = `/api/agent-performance?timeframe=${timeframe}${
          selectedAgent ? `&agentId=${selectedAgent}` : ''
        }`;
        
        // Fetch data from API
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        setAgentPerformance(result.data || []);
        
        // Set default selected agent if not already set
        if (!selectedAgent && result.data && result.data.length > 0) {
          setSelectedAgent(result.data[0].agent_id);
        }
      } catch (err) {
        console.error('Error fetching agent performance:', err);
        setError('Failed to load performance data. Please try again later.');
        
        // If in development, use mock data as fallback
        if (process.env.NODE_ENV === 'development') {
          const mockData = generateMockAgentPerformance(90);
          setAgentPerformance(mockData);
          
          if (!selectedAgent && mockData.length > 0) {
            setSelectedAgent(mockData[0].agent_id);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAgentPerformance();
  }, [session, timeframe, status, selectedAgent]);
  
  // Update trend data when agent selection changes
  useEffect(() => {
    if (!selectedAgent) return;
    
    // Find the selected agent
    const agent = agentPerformance.find(a => a.agent_id === selectedAgent);
    if (!agent) return;
    
    // Set trend data based on view type
    if (viewType === 'rating') {
      setTrendData(agent.daily_ratings || []);
    } else {
      setTrendData(agent.daily_usage || []);
    }
  }, [selectedAgent, viewType, agentPerformance]);
  
  // Mock data generator for development fallback
  const generateMockAgentPerformance = (days: number): AgentPerformance[] => {
    const agents = [
      { id: '1', name: 'Research Assistant', model: 'gpt-4' },
      { id: '2', name: 'Content Summarizer', model: 'gpt-3.5-turbo' },
      { id: '3', name: 'Code Helper', model: 'claude-3-sonnet' },
      { id: '4', name: 'Data Analyst', model: 'gemini-pro' }
    ];
    
    return agents.map(agent => {
      // Generate daily data
      const dailyRatings = [];
      const dailyUsage = [];
      let totalRating = 0;
      let totalUsageCount = 0;
      let totalTokens = 0;
      let totalCost = 0;
      
      for (let i = days; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        
        // Daily ratings (between 3-5)
        const count = Math.floor(Math.random() * 10) + 1;
        const rating = Math.round((Math.random() * 2 + 3) * 10) / 10;
        dailyRatings.push({ date, rating, count });
        
        // Daily usage
        const tokens = Math.floor(Math.random() * 10000) + 1000;
        const cost = tokens * (agent.model.includes('gpt-4') ? 0.00005 : 0.000015);
        dailyUsage.push({ 
          date, 
          tokens, 
          cost: parseFloat(cost.toFixed(4)), 
          count
        });
        
        totalRating += rating * count;
        totalUsageCount += count;
        totalTokens += tokens;
        totalCost += cost;
      }
      
      return {
        agent_id: agent.id,
        agent_name: agent.name,
        model: agent.model,
        avg_rating: parseFloat((totalRating / totalUsageCount).toFixed(1)),
        total_interactions: totalUsageCount,
        total_tokens: totalTokens,
        cost_estimate: parseFloat(totalCost.toFixed(2)),
        daily_ratings: dailyRatings,
        daily_usage: dailyUsage,
        trend_rating: 5.2,
        trend_usage: -3.8
      };
    });
  };
  
  // Format numbers
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Get the current agent
  const currentAgent = selectedAgent 
    ? agentPerformance.find(a => a.agent_id === selectedAgent) 
    : null;
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Agent Performance Analytics</h1>
        <div className="flex justify-center items-center h-96">
          <p className="text-xl">Loading performance data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Agent Performance Analytics</h1>
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <p className="text-xl text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (agentPerformance.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Agent Performance Analytics</h1>
        <div className="flex justify-center items-center h-96">
          <p className="text-xl text-muted-foreground">No agent performance data available</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Agent Performance Analytics</h1>
      
      <div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0 mb-8">
        <p className="text-muted-foreground flex-shrink-0">
          Track and analyze agent performance metrics and trends
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-48">
            <Select
              value={selectedAgent || ''}
              onValueChange={setSelectedAgent}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Agent" />
              </SelectTrigger>
              <SelectContent>
                {agentPerformance.map(agent => (
                  <SelectItem key={agent.agent_id} value={agent.agent_id}>
                    {agent.agent_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <Select 
              value={timeframe} 
              onValueChange={(value) => setTimeframe(value as '7d' | '30d' | '90d')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {currentAgent && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Rating
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-yellow-500"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentAgent.avg_rating.toFixed(1)}/5.0</div>
                <p className="text-xs text-muted-foreground">
                  {currentAgent.trend_rating > 0 
                    ? `+${currentAgent.trend_rating}% from previous period` 
                    : `${currentAgent.trend_rating}% from previous period`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Interactions
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-blue-500"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(currentAgent.total_interactions)}</div>
                <p className="text-xs text-muted-foreground">
                  For the selected timeframe
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Tokens
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-green-500"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(currentAgent.total_tokens)}</div>
                <p className="text-xs text-muted-foreground">
                  {currentAgent.trend_usage > 0 
                    ? `+${currentAgent.trend_usage}% from previous period` 
                    : `${currentAgent.trend_usage}% from previous period`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Estimated Cost
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-purple-500"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(currentAgent.cost_estimate)}</div>
                <p className="text-xs text-muted-foreground">
                  Using {currentAgent.model}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Agent Usage Metrics</CardTitle>
                <CardDescription>
                  Analyze performance over time
                </CardDescription>
                <div className="flex gap-2 pt-2">
                  <Tabs defaultValue="rating" className="w-full" onValueChange={(v) => setViewType(v as 'rating' | 'usage')}>
                    <TabsList className="grid w-full max-w-xs grid-cols-2">
                      <TabsTrigger value="rating">Rating History</TabsTrigger>
                      <TabsTrigger value="usage">Usage History</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {viewType === 'rating' ? (
                      <LineChart
                        data={trendData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date"
                          tickFormatter={(value) => {
                            try {
                              return format(new Date(value), 'MMM dd');
                            } catch (e) {
                              return value;
                            }
                          }}
                        />
                        <YAxis domain={[0, 5]} />
                        <Tooltip
                          formatter={(value: any) => [`${value} / 5.0`, 'Rating']}
                          labelFormatter={(label) => {
                            try {
                              return format(new Date(label), 'MMMM d, yyyy');
                            } catch (e) {
                              return label;
                            }
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="rating"
                          stroke="#facc15"
                          activeDot={{ r: 8 }}
                          isAnimationActive={true}
                          strokeWidth={2}
                        />
                      </LineChart>
                    ) : (
                      <AreaChart
                        data={trendData}
                        margin={{
                          top: 10,
                          right: 30,
                          left: 0,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date"
                          tickFormatter={(value) => {
                            try {
                              return format(new Date(value), 'MMM dd');
                            } catch (e) {
                              return value;
                            }
                          }}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value: any, name: any) => {
                            if (name === 'tokens') return [formatNumber(value), 'Tokens'];
                            if (name === 'cost') return [formatCurrency(value), 'Cost'];
                            return [value, name];
                          }}
                          labelFormatter={(label) => {
                            try {
                              return format(new Date(label), 'MMMM d, yyyy');
                            } catch (e) {
                              return label;
                            }
                          }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="tokens"
                          stackId="1"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          isAnimationActive={true}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Agent Details</CardTitle>
              <CardDescription>
                Technical information about this agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="font-medium mb-2">Model Information</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-sm">
                      Model: {currentAgent.model}
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      Provider: {currentAgent.model.split('-')[0].toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      Avg. Tokens per Session: {Math.round(currentAgent.total_tokens / Math.max(1, currentAgent.total_interactions))}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Performance Metrics</h3>
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">Response Rating</span>
                      <span className="text-base">{currentAgent.avg_rating.toFixed(1)} / 5.0</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">Total Interactions</span>
                      <span className="text-base">{formatNumber(currentAgent.total_interactions)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">Token Usage</span>
                      <span className="text-base">{formatNumber(currentAgent.total_tokens)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">Cost Estimate</span>
                      <span className="text-base">{formatCurrency(currentAgent.cost_estimate)}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Usage Trends</h3>
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">Rating Trend</span>
                      <span className={`text-base ${currentAgent.trend_rating >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {currentAgent.trend_rating > 0 ? '+' : ''}{currentAgent.trend_rating}%
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">Usage Trend</span>
                      <span className={`text-base ${currentAgent.trend_usage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {currentAgent.trend_usage > 0 ? '+' : ''}{currentAgent.trend_usage}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 
