'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface AgentFeedbackDashboardProps {
  projectId: string
  agentId: string
  userId: string
}

// Mock data
const mockFeedbackData = [
  { id: 1, rating: 5, comment: "This agent helped me solve my problem quickly!", date: "2023-10-15" },
  { id: 2, rating: 4, comment: "Pretty good, but could be more detailed.", date: "2023-10-14" },
  { id: 3, rating: 5, comment: "Excellent response, saved me hours of work!", date: "2023-10-12" },
  { id: 4, rating: 3, comment: "Answer was okay but took too many follow-up questions.", date: "2023-10-10" },
  { id: 5, rating: 4, comment: "Good information provided.", date: "2023-10-08" },
]

const mockAnalyticsData = [
  { day: 'Mon', interactions: 145, positiveRatings: 120 },
  { day: 'Tue', interactions: 132, positiveRatings: 105 },
  { day: 'Wed', interactions: 164, positiveRatings: 140 },
  { day: 'Thu', interactions: 187, positiveRatings: 160 },
  { day: 'Fri', interactions: 212, positiveRatings: 190 },
  { day: 'Sat', interactions: 143, positiveRatings: 125 },
  { day: 'Sun', interactions: 106, positiveRatings: 90 },
]

export default function AgentFeedbackDashboard({ projectId, agentId, userId }: AgentFeedbackDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false);
  const [updatedPrompt, setUpdatedPrompt] = useState<string | null>(null);
  const [showReinvoke, setShowReinvoke] = useState(false);
  const [reinvokeMessage, setReinvokeMessage] = useState('');
  const [reinvokeResponse, setReinvokeResponse] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Calculate metrics
  const totalInteractions = mockAnalyticsData.reduce((sum, day) => sum + day.interactions, 0)
  const totalPositive = mockAnalyticsData.reduce((sum, day) => sum + day.positiveRatings, 0)
  const satisfactionRate = Math.round((totalPositive / totalInteractions) * 100)
  
  const averageRating = mockFeedbackData.reduce((sum, item) => sum + item.rating, 0) / mockFeedbackData.length
  
  return (
    <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="feedback">Recent Feedback</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        <div className="flex justify-end gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setUpdatedPrompt(null);
              try {
                const res = await fetch(`/api/agents/${agentId}/apply-feedback`, { method: 'POST' });
                if (!res.ok) throw new Error((await res.json()).message || 'Failed to apply feedback');
                const data = await res.json();
                setUpdatedPrompt(data.agent.system_prompt || '');
                toast({ title: 'Prompt Updated', description: 'Agent prompt updated based on feedback.' });
              } catch (err: any) {
                toast({ title: 'Error', description: err.message || 'Failed to update prompt', variant: 'destructive' });
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? 'Applying...' : 'Apply Feedback to Prompt'}
          </Button>
          <Dialog open={showReinvoke} onOpenChange={setShowReinvoke}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setShowReinvoke(true)}>
                Re-invoke Agent with Updated Prompt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Re-invoke Agent</DialogTitle>
                <DialogDescription>Enter a user message to test the agent with its latest prompt.</DialogDescription>
              </DialogHeader>
              <Textarea
                value={reinvokeMessage}
                onChange={e => setReinvokeMessage(e.target.value)}
                placeholder="Enter your message..."
                rows={3}
              />
              <DialogFooter>
                <Button
                  onClick={async () => {
                    setLoading(true);
                    setReinvokeResponse(null);
                    try {
                      const res = await fetch(`/api/agents/${agentId}/reinvoke`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userMessage: reinvokeMessage }),
                      });
                      if (!res.ok) throw new Error((await res.json()).message || 'Failed to re-invoke agent');
                      const data = await res.json();
                      setReinvokeResponse(data.response.response || '');
                      toast({ title: 'Agent Re-invoked', description: 'Agent generated a new response.' });
                    } catch (err: any) {
                      toast({ title: 'Error', description: err.message || 'Failed to re-invoke agent', variant: 'destructive' });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || !reinvokeMessage.trim()}
                >
                  {loading ? 'Running...' : 'Run Agent'}
                </Button>
              </DialogFooter>
              {reinvokeResponse && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Agent Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded border overflow-x-auto">{reinvokeResponse}</pre>
                  </CardContent>
                </Card>
              )}
            </DialogContent>
          </Dialog>
        </div>
        {updatedPrompt && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Updated System Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded border overflow-x-auto">{updatedPrompt}</pre>
            </CardContent>
          </Card>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInteractions}</div>
              <p className="text-xs text-muted-foreground">
                Past 7 days
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{satisfactionRate}%</div>
              <Progress value={satisfactionRate} className="h-2 mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}/5.0</div>
              <div className="flex items-center mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg 
                    key={i}
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill={i < Math.floor(averageRating) ? "currentColor" : "none"} 
                    stroke="currentColor"
                    className="w-4 h-4 mr-1 text-yellow-500"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={i < Math.floor(averageRating) ? 0 : 1.5}
                      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" 
                    />
                  </svg>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
            <CardDescription>
              User interactions and positive ratings over time
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockAnalyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="interactions" fill="#8884d8" name="Total Interactions" />
                  <Bar dataKey="positiveRatings" fill="#82ca9d" name="Positive Ratings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="feedback" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent User Feedback</CardTitle>
            <CardDescription>
              The most recent feedback from users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockFeedbackData.map((feedback) => (
                <div key={feedback.id} className="border rounded-lg p-4">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg 
                            key={i}
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill={i < feedback.rating ? "currentColor" : "none"} 
                            stroke="currentColor"
                            className="w-4 h-4 mr-1 text-yellow-500"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={i < feedback.rating ? 0 : 1.5}
                              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" 
                            />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{feedback.date}</span>
                  </div>
                  <p className="mt-2">{feedback.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="analytics" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Detailed Performance Analytics</CardTitle>
            <CardDescription>
              A deeper look into your agent's performance and user feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This section will be expanded with more detailed analytics in the future.
            </p>
            <Separator className="my-4" />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-medium mb-2">Monthly Overview</h3>
                <p className="text-sm text-muted-foreground">
                  Total Interactions: 2,458<br />
                  Average Response Time: 1.2s<br />
                  Success Rate: 92%
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">User Demographics</h3>
                <p className="text-sm text-muted-foreground">
                  Unique Users: 873<br />
                  Returning Users: 64%<br />
                  Average Session Length: 8.5 min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
} 