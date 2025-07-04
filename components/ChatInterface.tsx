'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils'; // For conditional classes
import type { ChatMessage, AgentResponseChunk } from '@/app/services/synthesisService'; // Import types
import { ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react'; // Import feedback icons
import { useToast } from '@/components/ui/use-toast'; // Import useToast
import { useSession } from 'next-auth/react'; // Import useSession
import { v4 as uuidv4 } from 'uuid'; // Add at the top for UUID generation

/**
 * purpose: Chat interface component supporting agentic traceability and per-step feedback for assistant messages
 * status: stable
 * inputs: messages (ChatMessage[]), onSend, onFeedback, etc.
 * outputs: Interactive chat UI with agentic reasoning expansion and feedback controls
 * depends_on: ChatMessage, AgentStep, feedback API
 * related_docs: /docs/agentic-feedback.md
 */

// Define props based on dependencies identified
interface AgentInfo {
    id: string;
    name: string;
}
interface ContextInfo {
    id: string;
    summary: string; // Using summary for display in selector
}

// Define payload for feedback API
interface AgentRatingPayload {
  agent_id: string;
  project_id: string;
  user_id: string; // user_id is required by the API route for agent_ratings
  rating_overall?: number | null;
  comment?: string | null; // Assuming 'comment' is the field for feedback_text
}

interface ChatInterfaceProps {
    projectId: string;
    availableAgents: AgentInfo[];
    availableContexts: ContextInfo[];
}

export default function ChatInterface({
    projectId,
    availableAgents,
    availableContexts,
}: ChatInterfaceProps) {
    const [selectedAgentId, setSelectedAgentId] = useState<string>(availableAgents[0]?.id || '');
    const [selectedContextIds, setSelectedContextIds] = useState<Set<string>>(new Set());
    const [currentMessage, setCurrentMessage] = useState<string>('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast(); // Add toast hook
    const { data: session } = useSession(); // Get session data

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null); // For aborting fetch

    const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    // Cleanup function to abort fetch if component unmounts during streaming
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    const handleContextChange = (contextId: string, checked: boolean | 'indeterminate') => {
        setSelectedContextIds(prev => {
            const newSet = new Set(prev);
            if (checked === true) {
                newSet.add(contextId);
            } else {
                newSet.delete(contextId);
            }
            return newSet;
        });
    };

    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!currentMessage.trim() || isStreaming || !selectedAgentId) return;

        setError(null);
        const userMessage: ChatMessage = { role: 'user', content: currentMessage };
        const currentHistory = messages; // Capture history before adding new messages
        setMessages(prev => [...prev, userMessage]);
        setCurrentMessage(''); // Clear input immediately

        // Add placeholder for assistant message
        const assistantMessagePlaceholder: ChatMessage = { role: 'assistant', content: '', message_id: uuidv4() };
        setMessages(prev => [...prev, assistantMessagePlaceholder]);

        setIsStreaming(true);
        abortControllerRef.current = new AbortController(); // Create new AbortController

        try {
            const response = await fetch(`/api/projects/${projectId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userMessage.content,
                    agentId: selectedAgentId,
                    contextIds: Array.from(selectedContextIds),
                    // Pass only relevant history (trim if needed, respect memory flag eventually)
                    history: currentHistory.filter(m => m.role === 'user' || m.role === 'assistant'),
                }),
                signal: abortControllerRef.current.signal, // Pass signal to fetch
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `API request failed with status ${response.status}`);
            }

            if (!response.body) {
                throw new Error('Response body is null');
            }

            // Process stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let currentAssistantContent = '';

            while (!done) {
                // Check for abort signal
                if (abortControllerRef.current?.signal.aborted) {
                    console.log("Fetch aborted by component unmount or new request");
                    done = true; // Exit loop
                    setError('Request cancelled.'); // Optional: Set an error state
                    // Reset the placeholder message or remove it
                    setMessages(prev => prev.slice(0, -1)); // Remove placeholder
                    break;
                }

                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (done) break;

                const chunkString = decoder.decode(value, { stream: true }); 

                 const lines = chunkString.split('\n\n').filter(line => line.trim() !== '');
                 for (const line of lines) {
                     if (line.startsWith('data: ')) {
                         try {
                            const jsonData: AgentResponseChunk = JSON.parse(line.substring(6)); 

                             if (jsonData.type === 'content') {
                                currentAssistantContent += jsonData.delta;
                                setMessages(prev =>
                                    prev.map((msg, index) =>
                                        index === prev.length - 1 // Update last message
                                            ? { ...msg, content: currentAssistantContent }
                                            : msg
                                    )
                                );
                            } else if (jsonData.type === 'metadata') {
                                console.log('Received metadata:', jsonData.metadata);
                                // Optionally update the final message state with metadata
                                setMessages(prev =>
                                    prev.map((msg, index) =>
                                        index === prev.length - 1
                                            ? { ...msg, metadata: jsonData.metadata } // Add metadata to message?
                                            : msg
                                    )
                                );
                             } else if (jsonData.type === 'error') {
                                 console.error('Stream error chunk:', jsonData.error);
                                 setError(`Stream Error: ${jsonData.error}`);
                                 setMessages(prev =>
                                     prev.map((msg, index) =>
                                         index === prev.length - 1
                                             ? { ...msg, content: `${currentAssistantContent}\n\n**Error:** ${jsonData.error}` }
                                             : msg
                                     )
                                 );
                                 done = true; // Stop processing on error
                                 break;
                             }
                         } catch (parseError) {
                             console.error('Failed to parse SSE chunk:', parseError, 'Chunk:', line);
                             // Decide how to handle parse errors - maybe show an error in UI?
                         }
                     }
                 }
            } // End while loop

        } catch (err: any) {
             if (err.name === 'AbortError') {
                console.log('Fetch aborted successfully.');
                // State is already handled in the loop
            } else {
                console.error('Chat fetch error:', err);
                setError(err.message || 'Failed to send message.');
                 setMessages(prev =>
                     prev.map((msg, index) =>
                         index === prev.length - 1
                             ? { ...msg, content: `**Error:** ${err.message || 'Failed to get response.'}` }
                             : msg
                     )
                 );
            }
        } finally {
            setIsStreaming(false);
            abortControllerRef.current = null; // Clear the controller
        }
    }, [currentMessage, isStreaming, selectedAgentId, projectId, selectedContextIds, messages]);

    // Function to stop streaming
    const handleStopStreaming = () => {
        if (isStreaming) {
             abortControllerRef.current?.abort();
        }
    };

    // Placeholder function to handle feedback clicks
    const [feedbackComment, setFeedbackComment] = useState<string>('');
    const [feedbackTarget, setFeedbackTarget] = useState<{index: number, rating: number, message_id: string} | null>(null);

    const handleFeedbackClick = (messageIndex: number, rating: number, message_id: string) => {
        setFeedbackTarget({ index: messageIndex, rating, message_id });
    };

    const submitFeedback = async () => {
        if (!feedbackTarget) return;
        const { index, rating, message_id } = feedbackTarget;
        const message = messages[index];
        const userId = session?.user?.id;
        if (!message || message.role !== 'assistant' || !userId) {
            toast({ title: "Error", description: "Cannot submit feedback without message or user session.", variant: "destructive" });
            return;
        }
        const agentIdForFeedback = selectedAgentId;
        toast({ title: "Submitting Feedback...", description: `Rating: ${rating > 0 ? 'Positive' : 'Negative'}` });
        const feedbackPayload = {
            agent_id: agentIdForFeedback,
            rating,
            comment: feedbackComment,
            message_id,
        };
        try {
            const response = await fetch('/api/feedback/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedbackPayload),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to submit feedback: ${response.statusText}`);
            }
            toast({ title: "Feedback Submitted!", description: "Thank you for your feedback!" });
            setFeedbackTarget(null);
            setFeedbackComment('');
            // Optionally, track feedback status per message
        } catch (err) {
            console.error("Failed to submit feedback:", err);
            toast({ title: "Feedback Failed", description: (err as Error).message || "Could not submit feedback.", variant: "destructive" });
        }
    };

    const toggleExpand = (index: number) => {
        setExpandedMessages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) newSet.delete(index);
            else newSet.add(index);
            return newSet;
        });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-150px)]"> {/* Adjust height dynamically */}
            {/* Top Selectors */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 border-b">
                <div className="flex-1 min-w-0"> {/* Ensure selects don't overflow */}
                    <Label htmlFor="agent-selector">Agent</Label>
                    <Select value={selectedAgentId} onValueChange={setSelectedAgentId} disabled={isStreaming}>
                        <SelectTrigger id="agent-selector" className="truncate"> {/* Truncate long names */}
                            <SelectValue placeholder="Select Agent" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableAgents.length > 0 ? (
                                availableAgents.map(agent => (
                                <SelectItem key={agent.id} value={agent.id}>
                                    {agent.name}
                                </SelectItem>
                            ))
                            ) : (
                                <SelectItem value="" disabled>No agents available</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-1 min-w-0"> {/* Ensure context list doesn't overflow */}
                     <Label>Contexts (Select to include)</Label>
                     <ScrollArea className="h-20 border rounded-md p-2"> {/* Limit height */}
                        <div className="space-y-1">
                            {availableContexts.length > 0 ? availableContexts.map(context => (
                                <div key={context.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`context-${context.id}`}
                                        checked={selectedContextIds.has(context.id)}
                                        onCheckedChange={(checked) => handleContextChange(context.id, checked)}
                                        disabled={isStreaming}
                                    />
                                    <Label htmlFor={`context-${context.id}`} className="text-sm font-normal cursor-pointer truncate" title={context.summary}> {/* Show full summary on hover */}
                                        {context.summary}
                                    </Label>
                                </div>
                            )) : <p className="text-sm text-muted-foreground p-1">No contexts available.</p>}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Message History */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={cn(
                                'flex',
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            <div
                                className={cn(
                                    'p-3 rounded-lg max-w-[75%]',
                                    message.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                )}
                            >
                                {message.role === 'assistant' && (
                                    <p className="text-xs font-semibold mb-1">Agent Response</p>
                                )}
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        // Customize rendering if needed
                                    }}
                                >
                                    {message.content}
                                </ReactMarkdown>
                                {message.role === 'assistant' && message.agentSteps && message.agentSteps.length > 0 && (
                                    <div className="mt-2">
                                        <Button size="sm" variant="outline" onClick={() => toggleExpand(index)}>
                                            {expandedMessages.has(index) ? 'Hide Reasoning' : 'Show Reasoning'}
                                        </Button>
                                        {expandedMessages.has(index) && (
                                            <div className="mt-2 space-y-2 border rounded p-2 bg-muted">
                                                {message.agentSteps.map((step, stepIdx) => (
                                                    <div key={step.step_id} className="border-b pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                                                        <div className="font-semibold text-xs mb-1">{step.agent_name || step.agent_id}</div>
                                                        <div className="text-sm mb-1 whitespace-pre-line">{step.content}</div>
                                                        {/* Feedback controls for each step */}
                                                        <div className="flex items-center gap-2">
                                                            <Button variant="ghost" size="icon" className="h-6 w-6" title="Good step"
                                                                onClick={() => handleFeedbackClick(index, 1, step.step_id)}>
                                                                <ThumbsUpIcon className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6" title="Bad step"
                                                                onClick={() => handleFeedbackClick(index, -1, step.step_id)}>
                                                                <ThumbsDownIcon className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                            </Button>
                                                        </div>
                                                        {feedbackTarget && feedbackTarget.index === index && feedbackTarget.message_id === step.step_id && (
                                                            <div className="mt-2 flex flex-col gap-2">
                                                                <Textarea
                                                                    value={feedbackComment}
                                                                    onChange={e => setFeedbackComment(e.target.value)}
                                                                    placeholder="Optional comment..."
                                                                    rows={2}
                                                                />
                                                                <div className="flex gap-2">
                                                                    <Button size="sm" onClick={submitFeedback}>Submit</Button>
                                                                    <Button size="sm" variant="ghost" onClick={() => setFeedbackTarget(null)}>Cancel</Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isStreaming && messages[messages.length - 1]?.role === 'assistant' && (
                        <div className="flex justify-start">
                            <div className="p-3 rounded-lg max-w-[75%] bg-muted">
                                <p className="text-xs font-semibold mb-1">Agent Response</p>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        // Customize rendering if needed
                                    }}
                                >
                                    {messages[messages.length - 1].content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}           
            <div className="p-4 border-t bg-background">
                 {error && <p className="text-sm text-red-600 mb-2">Error: {error}</p>}
                <div className="relative">
                    <Textarea
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder={`Ask ${availableAgents.find(a=>a.id === selectedAgentId)?.name || 'selected agent'}... (Shift+Enter for newline)`}
                        className="flex-grow resize-none pr-20" // Add padding for button
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                        disabled={!selectedAgentId || isStreaming}
                    />
                     <div className="absolute right-2 bottom-2 flex gap-2">
                         {isStreaming && (
                            <Button 
                                type="button" 
                                variant="outline"
                                size="sm"
                                onClick={handleStopStreaming}
                                title="Stop generating"
                            >
                                Stop
                            </Button>
                         )}
                        <Button 
                            type="button" 
                            onClick={() => handleSubmit()} 
                            disabled={isStreaming || !currentMessage.trim() || !selectedAgentId}
                            title="Send message"
                            size="sm"
                        >
                            Send
                        </Button>
                     </div>
                </div>
            </div>
        </div>
    );
} 