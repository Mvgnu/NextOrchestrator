'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { addDays, format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { DateRangePickerWrapper } from '@/components/ui/date-range-wrapper';

// Mock data for the usage chart
const generateUsageData = (days: number) => {
  const data = []
  const today = new Date()
  
  for (let i = days; i >= 0; i--) {
    const date = addDays(today, -i)
    data.push({
      date: format(date, 'MMM dd'),
      tokens: Math.floor(Math.random() * 100000) + 10000,
    })
  }
  
  return data
}

export default function UsageDashboard() {
  // Mock data for visualization while building UI
  const mockUsageSummary = {
    totalCost: 12.86,
    totalTokens: 985320,
    dailyAverage: 32844,
    dailyUsage: [
      { date: '2023-07-01', tokens: 32000, cost: 0.42 },
      { date: '2023-07-02', tokens: 45000, cost: 0.58 },
      { date: '2023-07-03', tokens: 38000, cost: 0.49 },
      { date: '2023-07-04', tokens: 41000, cost: 0.53 },
      { date: '2023-07-05', tokens: 50000, cost: 0.65 },
      { date: '2023-07-06', tokens: 62000, cost: 0.81 },
      { date: '2023-07-07', tokens: 58000, cost: 0.75 }
    ],
    providerUsage: [
      { provider: 'openai', tokens: 735000, cost: 9.86, percentage: 74.6 },
      { provider: 'anthropic', tokens: 185000, cost: 2.40, percentage: 18.7 },
      { provider: 'google', tokens: 65320, cost: 0.60, percentage: 6.7 }
    ],
    modelUsage: [
      { model: 'gpt-4', tokens: 320000, cost: 6.40, percentage: 49.8 },
      { model: 'gpt-3.5-turbo', tokens: 415000, cost: 3.46, percentage: 26.9 },
      { model: 'claude-3-opus', tokens: 185000, cost: 2.40, percentage: 18.7 },
      { model: 'gemini-pro', tokens: 65320, cost: 0.60, percentage: 4.6 }
    ],
    projectUsage: [
      { project_name: 'Project Mars', tokens: 485000, cost: 6.82, percentage: 53.0 },
      { project_name: 'DataSync Pro', tokens: 320000, cost: 4.20, percentage: 32.7 },
      { project_name: 'AI Assistant', tokens: 180320, cost: 1.84, percentage: 14.3 }
    ]
  };
  
  // In a real application, you would fetch this data from your database
  const usageData = generateUsageData(30);
  
  // Use mock data for now
  const displayData = mockUsageSummary;
  
  const monthlyLimit = 3000000 // 3 million tokens
  const usagePercentage = (displayData.totalTokens / monthlyLimit) * 100;
  
  // Format numbers for display
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };
  
  // Format cost for display
  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(cost);
  };
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Usage Dashboard</h1>
      
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          Monitor your API usage and costs
        </p>
        <DateRangePickerWrapper />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Cost</CardTitle>
            <CardDescription>Current billing period</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${displayData.totalCost.toFixed(2)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Tokens</CardTitle>
            <CardDescription>API consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{displayData.totalTokens.toLocaleString()}</p>
            <div className="mt-2">
              <Progress value={usagePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {usagePercentage.toFixed(1)}% of monthly limit
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Daily Average</CardTitle>
            <CardDescription>Token consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{displayData.dailyAverage.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Usage Trends</CardTitle>
          <CardDescription>Token usage over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={usageData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="tokens" 
                stroke="#8884d8" 
                fill="#8884d8"
                fillOpacity={0.3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Usage Breakdown</CardTitle>
          <CardDescription>By project and model</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium">{displayData.projectUsage[0].project_name}</span>
                <span>{displayData.projectUsage[0].tokens.toLocaleString()} tokens</span>
              </div>
              <Progress value={displayData.projectUsage[0].percentage} className="h-2" />
            </div>
            
            <Separator />
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium">{displayData.projectUsage[1].project_name}</span>
                <span>{displayData.projectUsage[1].tokens.toLocaleString()} tokens</span>
              </div>
              <Progress value={displayData.projectUsage[1].percentage} className="h-2" />
            </div>
            
            <Separator />
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium">{displayData.projectUsage[2].project_name}</span>
                <span>{displayData.projectUsage[2].tokens.toLocaleString()} tokens</span>
              </div>
              <Progress value={displayData.projectUsage[2].percentage} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}