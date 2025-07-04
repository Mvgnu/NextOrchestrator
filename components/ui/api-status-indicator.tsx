'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIProvider } from '@/lib/ai-config';
import { ApiErrorType } from '@/lib/api-error-handler';

// API provider status types
type ProviderStatus = 'operational' | 'degraded' | 'down' | 'rate_limited' | 'unknown';

interface ProviderStatusInfo {
  provider: AIProvider;
  status: ProviderStatus;
  retryAfter?: number;
  message?: string;
  errorType?: ApiErrorType;
}

interface ApiStatusIndicatorProps {
  providers: ProviderStatusInfo[];
  onRefresh?: () => void;
  compact?: boolean;
}

export function ApiStatusIndicator({ providers, onRefresh, compact = false }: ApiStatusIndicatorProps) {
  const [countdown, setCountdown] = useState<Partial<Record<AIProvider, number>>>({});
  
  // Set up countdown timers for rate limited providers
  useEffect(() => {
    const rateLimitedProviders = providers.filter(p => 
      p.status === 'rate_limited' && p.retryAfter && p.retryAfter > 0
    );
    
    if (rateLimitedProviders.length === 0) return;
    
    // Initialize countdown values
    const initialCountdown: Partial<Record<AIProvider, number>> = {};
    rateLimitedProviders.forEach(p => {
      if (p.retryAfter) {
        initialCountdown[p.provider] = p.retryAfter;
      }
    });
    
    setCountdown(initialCountdown);
    
    // Set up interval to update countdown values
    const interval = setInterval(() => {
      setCountdown(prev => {
        const updated = { ...prev };
        let allZero = true;
        
        for (const provider in updated) {
          const count = updated[provider as AIProvider];
          if (count && count > 0) {
            updated[provider as AIProvider] = count - 1000; // Decrement by 1 second (1000ms)
            allZero = false;
          }
        }
        
        // Clear interval when all countdowns reach zero
        if (allZero) {
          clearInterval(interval);
        }
        
        return updated;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [providers]);
  
  // Format seconds for display
  const formatSeconds = (ms: number) => {
    if (ms <= 0) return '0s';
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  // Get status icon
  const getStatusIcon = (status: ProviderStatus) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'rate_limited':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };
  
  // Get status badge color
  const getStatusColor = (status: ProviderStatus): string => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'degraded': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'down': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'rate_limited': return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };
  
  // Compact version just shows icons with tooltips
  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center space-x-2">
          {providers.map((provider) => (
            <Tooltip key={provider.provider}>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  {getStatusIcon(provider.status)}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-sm">
                  <p className="font-medium">{provider.provider.charAt(0).toUpperCase() + provider.provider.slice(1)}</p>
                  <p>{provider.message || getStatusMessage(provider.status)}</p>
                  {provider.status === 'rate_limited' && 
                   countdown[provider.provider] !== undefined && 
                   countdown[provider.provider]! > 0 && (
                    <p>Retry in: {formatSeconds(countdown[provider.provider]!)}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          {onRefresh && (
            <Button variant="ghost" size="icon" onClick={onRefresh} className="h-8 w-8 rounded-full">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TooltipProvider>
    );
  }
  
  // Full version with badges and messages
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {providers.map((provider) => (
          <Badge key={provider.provider} variant="outline" className={getStatusColor(provider.status)}>
            <span className="mr-1">{getStatusIcon(provider.status)}</span>
            <span className="mr-1">{provider.provider}</span>
            {provider.status === 'rate_limited' && 
             countdown[provider.provider] !== undefined && 
             countdown[provider.provider]! > 0 && (
              <span>({formatSeconds(countdown[provider.provider]!)})</span>
            )}
          </Badge>
        ))}
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} className="h-6">
            <RefreshCw className="mr-1 h-3 w-3" />
            Refresh
          </Button>
        )}
      </div>
      {providers.some(p => p.status !== 'operational') && (
        <div className="text-sm text-muted-foreground">
          {providers.filter(p => p.status !== 'operational').map((provider) => (
            <p key={provider.provider} className="flex items-center">
              <span className="mr-2">{getStatusIcon(provider.status)}</span>
              {provider.message || `${provider.provider} is ${getStatusMessage(provider.status)}`}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to get a descriptive message based on status
function getStatusMessage(status: ProviderStatus): string {
  switch (status) {
    case 'operational':
      return 'operational';
    case 'degraded':
      return 'experiencing degraded performance';
    case 'down':
      return 'currently unavailable';
    case 'rate_limited':
      return 'rate limited';
    default:
      return 'in an unknown state';
  }
} 