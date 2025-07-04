'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import type { Agent, AgentUpdate } from '@/lib/agent-service'
import type { AgentPreset } from '@/lib/agent-preset-service'
import type { Provider, Model } from '@/lib/model-management-service'

const MANUAL_CONFIG_VALUE = "@manual_config";
const NONE_PRESET_VALUE = "@none_preset";

// Payload type for the form when creating an agent (user_id is added by API)
interface AgentFormClientCreatePayload {
    project_id: string;
    name: string;
    description?: string | null;
    system_prompt?: string | null;
    config?: any | null;
    is_public?: boolean;
}

interface AgentFormProps {
  projectId: string;
  presets: AgentPreset[];
  providers: Provider[];
  contexts?: {
    id: string;
    name: string;
  }[];
  existingAgent?: Agent | null;
}

export default function AgentForm({ 
  projectId, 
  presets, 
  providers: availableProviders, 
  contexts, 
  existingAgent 
}: AgentFormProps) {
  const router = useRouter();
  const params = useParams();
  const agentId = existingAgent?.id || params.agentId as string;

  const { toast } = useToast();
  const isEditMode = !!existingAgent;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [isPublic, setIsPublic] = useState(false);

  const [selectedPresetId, setSelectedPresetId] = useState<string>(isEditMode ? NONE_PRESET_VALUE : (presets[0]?.id || NONE_PRESET_VALUE) );
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  
  const [isManualProviderConfig, setIsManualProviderConfig] = useState(false);
  const [manualProviderName, setManualProviderName] = useState('');
  const [manualModelName, setManualModelName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && existingAgent) {
      setName(existingAgent.name || '');
      setDescription(existingAgent.description || '');
      setSystemPrompt(existingAgent.system_prompt || '');
      setTemperature(existingAgent.config?.temperature ?? 0.7);
      setMaxTokens(existingAgent.config?.max_tokens ?? 2048);
      setIsPublic(existingAgent.is_public || false);
      setSelectedPresetId(NONE_PRESET_VALUE);

      const agentProviderName = existingAgent.config?.provider;
      const agentModelName = existingAgent.config?.model;

      if (agentProviderName) {
        const providerMatch = availableProviders.find(p => p.name === agentProviderName);
        if (providerMatch) {
          setSelectedProviderId(providerMatch.id);
        } else {
          setIsManualProviderConfig(true);
          setManualProviderName(agentProviderName);
          if (agentModelName) setManualModelName(agentModelName);
        }
      } else {
        setIsManualProviderConfig(true);
      }
    } else if (presets.length > 0 && selectedPresetId !== NONE_PRESET_VALUE) {
      handlePresetSelect(selectedPresetId);
    } else {
      setSelectedProviderId(null);
      setIsManualProviderConfig(true); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingAgent, isEditMode, availableProviders]);

  useEffect(() => {
    if (selectedProviderId && selectedProviderId !== MANUAL_CONFIG_VALUE) {
      setIsLoadingModels(true);
      setAvailableModels([]);
      setSelectedModelId(null);
      fetch(`/api/providers/${selectedProviderId}/models`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch models');
          return res.json();
        })
        .then((data: Model[]) => {
          setAvailableModels(data);
          if (isEditMode && existingAgent?.config?.model && existingAgent.config.provider) {
            const currentProvider = availableProviders.find(p => p.id === selectedProviderId);
            if (currentProvider?.name === existingAgent.config.provider) {
                 const modelMatch = data.find(m => m.model_id_on_provider === existingAgent.config.model || m.display_name === existingAgent.config.model);
                 if (modelMatch) {
                    setSelectedModelId(modelMatch.model_id_on_provider);
                 }
            }
          }
        })
        .catch(err => {
          console.error('Error fetching models:', err);
          toast({ title: 'Error', description: 'Could not load models for this provider.', variant: 'destructive' });
          setAvailableModels([]);
        })
        .finally(() => setIsLoadingModels(false));
    } else {
      setAvailableModels([]);
      setSelectedModelId(null);
      setIsLoadingModels(false);
    }
  }, [selectedProviderId, isEditMode, existingAgent, availableProviders, toast]);

  const handlePresetSelect = useCallback((presetIdValue: string) => {
    setSelectedPresetId(presetIdValue);
    if (presetIdValue === NONE_PRESET_VALUE) {
      if (isEditMode && existingAgent) {
        setName(existingAgent.name || '');
        setDescription(existingAgent.description || '');
        setSystemPrompt(existingAgent.system_prompt || '');
        setTemperature(existingAgent.config?.temperature ?? 0.7);
        setMaxTokens(existingAgent.config?.max_tokens ?? 2048);
        const agentProviderName = existingAgent.config?.provider;
        const providerMatch = availableProviders.find(p => p.name === agentProviderName);
        if (providerMatch) {
            setSelectedProviderId(providerMatch.id);
            setIsManualProviderConfig(false);
        } else {
            setSelectedProviderId(MANUAL_CONFIG_VALUE);
            setIsManualProviderConfig(true);
            setManualProviderName(agentProviderName || '');
            setManualModelName(existingAgent.config?.model || '');
        }
      } else {
        setName(''); setDescription(''); setSystemPrompt('');
        setTemperature(0.7); setMaxTokens(2048);
        setSelectedProviderId(null);
        setIsManualProviderConfig(true);
        setManualProviderName(''); setManualModelName('');
      }
      return;
    }

    const selectedPreset = presets.find(p => p.id === presetIdValue);
    if (selectedPreset) {
      setName(selectedPreset.name || '');
      setDescription(selectedPreset.description || '');
      setSystemPrompt(selectedPreset.base_prompt || '');
      setTemperature(selectedPreset.temperature ?? 0.7);
      if (selectedPreset.recommended_provider) {
        const presetProvider = availableProviders.find(p => p.name === selectedPreset.recommended_provider);
        if (presetProvider) {
          setSelectedProviderId(presetProvider.id);
          setIsManualProviderConfig(false);
        } else {
          setSelectedProviderId(MANUAL_CONFIG_VALUE);
          setIsManualProviderConfig(true);
          setManualProviderName(selectedPreset.recommended_provider);
          setManualModelName(selectedPreset.recommended_model || '');
        }
      } else {
        setSelectedProviderId(MANUAL_CONFIG_VALUE);
        setIsManualProviderConfig(true);
        setManualProviderName(''); setManualModelName('');
      }
    }
  }, [presets, isEditMode, existingAgent, availableProviders]);

  useEffect(() => {
    if (selectedPresetId && selectedPresetId !== NONE_PRESET_VALUE && availableModels.length > 0) {
      const preset = presets.find(p => p.id === selectedPresetId);
      if (preset?.recommended_model) {
        const modelMatch = availableModels.find(m => m.model_id_on_provider === preset.recommended_model || m.display_name === preset.recommended_model);
        if (modelMatch) {
          setSelectedModelId(modelMatch.model_id_on_provider);
        }
      }
    }
  }, [availableModels, selectedPresetId, presets]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    let finalProviderName = '';
    let finalModelName = '';

    if (selectedProviderId && selectedProviderId !== MANUAL_CONFIG_VALUE) {
      const provider = availableProviders.find(p => p.id === selectedProviderId);
      finalProviderName = provider?.name || '';
      if (selectedModelId && selectedModelId !== MANUAL_CONFIG_VALUE) {
        const model = availableModels.find(m => m.model_id_on_provider === selectedModelId);
        finalModelName = model?.model_id_on_provider || '';
      } else {
        finalModelName = manualModelName;
      }
    } else {
      finalProviderName = manualProviderName;
      finalModelName = manualModelName;
    }

    if (!finalProviderName || !finalModelName) {
        setFormError('Provider and Model are required. Please select or enter them manually.');
        setIsSubmitting(false);
        toast({title: 'Validation Error', description: 'Provider and Model are required.', variant: 'destructive'});
        return;
    }

    let response;
    try {
      if (isEditMode) {
        const updatePayload: AgentUpdate = {
          name,
          description: description || null,
            system_prompt: systemPrompt || null,
            is_public: isPublic,
            config: {
                provider: finalProviderName,
                model: finalModelName,
          temperature,
          max_tokens: maxTokens,
            }
        };
        response = await fetch(`/api/agents/${agentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });
      } else {
        const createPayload = {
          project_id: projectId,
          name: name,
          description: description || null,
          system_prompt: systemPrompt || null,
          provider: finalProviderName,
          model: finalModelName,
          temperature: temperature,
          max_tokens: maxTokens,
          is_public: isPublic,
          memory_enabled: false,
        };
        response = await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createPayload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error || errorData.message || `Operation failed: ${response.statusText || response.status}`;
        throw new Error(message);
      }

      toast({
        title: isEditMode ? "Agent Updated" : "Agent Created",
        description: `Agent "${name}" has been successfully ${isEditMode ? 'updated' : 'created'}.`,
      });
      router.back();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setFormError(errorMessage);
      toast({
        title: isEditMode ? "Error Updating Agent" : "Error Creating Agent",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="preset">Load Configuration from Preset</Label>
        <Select onValueChange={handlePresetSelect} value={selectedPresetId} >
          <SelectTrigger id="preset">
            <SelectValue placeholder="Select a preset or configure manually" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_PRESET_VALUE}>None (Configure Manually)</SelectItem>
            {presets.map(preset => (
              <SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div>
        <Label htmlFor="name">Agent Name</Label>
        <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="systemPrompt">System Prompt (Optional)</Label>
        <Textarea id="systemPrompt" value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={6} />
      </div>

      <Separator />
      <h3 className="text-lg font-medium">Model Configuration</h3>

      <div>
        <Label htmlFor="provider">Provider</Label>
        <Select 
            onValueChange={(value) => {
                if (value === MANUAL_CONFIG_VALUE) {
                    setSelectedProviderId(null);
                    setIsManualProviderConfig(true);
                    setManualProviderName('');
                    setAvailableModels([]); setSelectedModelId(null); setManualModelName('');
                } else {
                    setSelectedProviderId(value);
                    setIsManualProviderConfig(false);
                }
            }} 
            value={isManualProviderConfig || !selectedProviderId ? MANUAL_CONFIG_VALUE : selectedProviderId}
        >
          <SelectTrigger id="provider">
            <SelectValue placeholder="Select a provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={MANUAL_CONFIG_VALUE}>None (Enter Manually)</SelectItem>
            {availableProviders.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isManualProviderConfig && (
        <div>
          <Label htmlFor="manualProviderName">Manual Provider Name</Label>
          <Input id="manualProviderName" value={manualProviderName} onChange={e => setManualProviderName(e.target.value)} placeholder="e.g., openai" />
        </div>
      )}

      <div>
        <Label htmlFor="model">Model</Label>
        {(isLoadingModels && !isManualProviderConfig && selectedProviderId !== MANUAL_CONFIG_VALUE) ? (
          <Input placeholder="Loading models..." disabled />
        ) : (
          <Select 
            onValueChange={(value) => {
                if (value === MANUAL_CONFIG_VALUE) {
                    setSelectedModelId(null);
                    setManualModelName('');
                } else {
                    setSelectedModelId(value);
                }
            }} 
            value={selectedModelId && availableModels.find(m => m.model_id_on_provider === selectedModelId) && !isManualProviderConfig ? selectedModelId : MANUAL_CONFIG_VALUE}
            disabled={isManualProviderConfig || (!isLoadingModels && availableModels.length === 0 && selectedProviderId !== MANUAL_CONFIG_VALUE) || !selectedProviderId}
          >
            <SelectTrigger id="model">
              <SelectValue placeholder={isManualProviderConfig ? "Enter model manually below" : "Select a model"} />
          </SelectTrigger>
          <SelectContent>
              <SelectItem value={MANUAL_CONFIG_VALUE}>None (Enter Manually)</SelectItem>
              {availableModels.map(m => (
                <SelectItem key={m.id} value={m.model_id_on_provider}>{m.display_name} ({m.model_id_on_provider})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        )}
      </div>

      {(isManualProviderConfig || (selectedProviderId && selectedModelId === MANUAL_CONFIG_VALUE) || (selectedProviderId && availableModels.length === 0 && !isLoadingModels)) && (
        <div>
          <Label htmlFor="manualModelName">Manual Model Name</Label>
          <Input 
            id="manualModelName" 
            value={manualModelName} 
            onChange={e => setManualModelName(e.target.value)} 
            placeholder={isManualProviderConfig ? "e.g., gpt-4o" : "Enter model name for selected provider"} 
          />
        </div>
      )}

      <div>
        <Label htmlFor="temperature">Temperature: {temperature.toFixed(1)}</Label>
        <Slider
          id="temperature"
            min={0} max={1} step={0.1} 
            defaultValue={[temperature]} 
            onValueChange={(value) => setTemperature(value[0])} 
        />
      </div>

      <div>
        <Label htmlFor="maxTokens">Max Tokens: {maxTokens}</Label>
        <Input 
            id="maxTokens" 
            type="number" 
            value={maxTokens} 
            onChange={e => setMaxTokens(parseInt(e.target.value, 10) || 0)} 
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="isPublic" checked={isPublic} onCheckedChange={(checked) => setIsPublic(checked as boolean)} />
        <Label htmlFor="isPublic">Make this agent publicly accessible</Label>
      </div>

      {formError && <p className="text-red-500 text-sm">{formError}</p>}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting || (!name.trim()) || ((!selectedProviderId || !selectedModelId) && (!manualProviderName.trim() || !manualModelName.trim()) && !isManualProviderConfig && selectedProviderId !== MANUAL_CONFIG_VALUE && selectedModelId !== MANUAL_CONFIG_VALUE ) }>
          {isSubmitting ? (isEditMode ? 'Updating Agent...' : 'Creating Agent...') : (isEditMode ? 'Save Changes' : 'Create Agent')}
      </Button>
      </div>
    </form>
  );
} 