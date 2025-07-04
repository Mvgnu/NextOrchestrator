'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { AgentPresetService, PresetTemplate, PresetCategory } from '@/lib/agent-preset-service';

// Icons mapping for each preset
import {
  BookOpen,
  Code,
  SearchIcon,
  Briefcase,
  FileText,
  PenTool,
  BookMarked,
  HelpCircle,
  BarChart2,
  Edit3,
  Layers,
  Target,
  Book,
  GraduationCap,
} from 'lucide-react';

// Map category to human-readable label
const categoryLabels: Record<PresetCategory, string> = {
  writing: 'Writing',
  coding: 'Coding',
  research: 'Research',
  creative: 'Creative',
  business: 'Business',
  education: 'Education',
  personal: 'Personal',
  system: 'General',
  custom: 'Custom',
};

// Map icon name to Lucide icon component
const iconComponents: Record<string, React.ElementType> = {
  'search': SearchIcon,
  'bar-chart-2': BarChart2,
  'edit-3': Edit3,
  'file-text': FileText,
  'code': Code,
  'layers': Layers,
  'briefcase': Briefcase,
  'target': Target,
  'pen-tool': PenTool,
  'book-open': BookOpen,
  'book': Book,
  'graduation-cap': GraduationCap,
  'help-circle': HelpCircle,
};

type AgentPresetSelectorProps = {
  onSelect: (preset: PresetTemplate) => void;
  showCreateButton?: boolean;
  onCreateNew?: () => void;
  className?: string;
  buttonClassName?: string;
  defaultCategory?: PresetCategory | 'all';
  userId: string;
};

export function AgentPresetSelector({
  onSelect,
  showCreateButton = true,
  onCreateNew,
  className,
  buttonClassName,
  defaultCategory = 'all',
  userId,
}: AgentPresetSelectorProps) {
  const [open, setOpen] = useState(false);
  const [presets, setPresets] = useState<PresetTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<PresetCategory | 'all'>(defaultCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<PresetTemplate | null>(null);

  // Fetch presets on component mount
  useEffect(() => {
    async function fetchPresets() {
      try {
        setLoading(true);
        // In a real app, this would fetch from the API
        // For now, we'll use the predefined presets directly
        const fetchedPresets = AgentPresetService.getPredefinedPresets();
        setPresets(fetchedPresets);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch presets:', err);
        setError('Failed to load presets');
      } finally {
        setLoading(false);
      }
    }

    fetchPresets();
  }, [userId]);

  // Filter presets based on active category and search query
  const filteredPresets = presets.filter((preset) => {
    // Filter by category if not "all"
    if (activeCategory !== 'all' && preset.category !== activeCategory) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        preset.name.toLowerCase().includes(query) ||
        preset.description.toLowerCase().includes(query) ||
        preset.base_prompt.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Group presets by category
  const presetsByCategory: Record<string, PresetTemplate[]> = {};
  
  filteredPresets.forEach((preset) => {
    if (!presetsByCategory[preset.category]) {
      presetsByCategory[preset.category] = [];
    }
    presetsByCategory[preset.category].push(preset);
  });

  // Handle preset selection
  const handleSelectPreset = (preset: PresetTemplate) => {
    setSelectedPreset(preset);
    onSelect(preset);
    setOpen(false);
  };

  // Get all available categories
  const availableCategories = Array.from(
    new Set(presets.map((preset) => preset.category))
  );

  // Render icon for a preset
  const renderPresetIcon = (iconName: string) => {
    const IconComponent = iconComponents[iconName] || HelpCircle;
    return <IconComponent className="h-4 w-4 mr-2 flex-shrink-0" />;
  };

  return (
    <div className={cn('relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between',
              !selectedPreset && 'text-muted-foreground',
              buttonClassName
            )}
          >
            {selectedPreset ? (
              <div className="flex items-center">
                {renderPresetIcon(selectedPreset.icon)}
                <span>{selectedPreset.name}</span>
              </div>
            ) : (
              'Select an agent preset'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[350px]">
          <Tabs 
            defaultValue={activeCategory} 
            onValueChange={(value) => setActiveCategory(value as PresetCategory | 'all')}
            className="w-full"
          >
            <div className="flex items-center px-3 pt-3">
              <TabsList className="grid grid-cols-5 h-8 w-full">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="writing" className="text-xs">Writing</TabsTrigger>
                <TabsTrigger value="coding" className="text-xs">Coding</TabsTrigger>
                <TabsTrigger value="research" className="text-xs">Research</TabsTrigger>
                <TabsTrigger value="creative" className="text-xs">Creative</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="px-3 pb-2">
              <CommandInput
                placeholder="Search presets..."
                className="h-9 mt-2"
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
            </div>
            
            <TabsContent value="all" className="mt-0">
              <Command className="w-full">
                <CommandList>
                  <ScrollArea className="h-[300px]">
                    {loading ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        Loading presets...
                      </div>
                    ) : error ? (
                      <div className="py-6 text-center text-sm text-destructive">
                        {error}
                      </div>
                    ) : Object.keys(presetsByCategory).length === 0 ? (
                      <CommandEmpty>No presets found.</CommandEmpty>
                    ) : (
                      Object.entries(presetsByCategory).map(([category, categoryPresets]) => (
                        <CommandGroup
                          key={category}
                          heading={categoryLabels[category as PresetCategory] || category}
                          className="pb-2"
                        >
                          {categoryPresets.map((preset) => (
                            <CommandItem
                              key={preset.name}
                              value={preset.name}
                              onSelect={() => handleSelectPreset(preset)}
                              className="flex items-start py-2"
                            >
                              <div className="flex items-center mt-0.5">
                                {renderPresetIcon(preset.icon)}
                              </div>
                              <div className="flex flex-col">
                                <div className="font-medium">{preset.name}</div>
                                <div className="text-xs text-muted-foreground line-clamp-2">
                                  {preset.description}
                                </div>
                              </div>
                              {selectedPreset?.name === preset.name && (
                                <Check className="ml-auto h-4 w-4 flex-shrink-0" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ))
                    )}
                  </ScrollArea>
                </CommandList>
                
                {showCreateButton && (
                  <>
                    <CommandSeparator />
                    <CommandList>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setOpen(false);
                            onCreateNew?.();
                          }}
                          className="py-2 text-primary"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create new agent preset
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </>
                )}
              </Command>
            </TabsContent>
            
            {availableCategories.map((category) => (
              <TabsContent key={category} value={category} className="mt-0">
                <Command className="w-full">
                  <CommandList>
                    <ScrollArea className="h-[300px]">
                      {presetsByCategory[category]?.length > 0 ? (
                        <CommandGroup>
                          {presetsByCategory[category].map((preset) => (
                            <CommandItem
                              key={preset.name}
                              value={preset.name}
                              onSelect={() => handleSelectPreset(preset)}
                              className="flex items-start py-2"
                            >
                              <div className="flex items-center mt-0.5">
                                {renderPresetIcon(preset.icon)}
                              </div>
                              <div className="flex flex-col">
                                <div className="font-medium">{preset.name}</div>
                                <div className="text-xs text-muted-foreground line-clamp-2">
                                  {preset.description}
                                </div>
                              </div>
                              {selectedPreset?.name === preset.name && (
                                <Check className="ml-auto h-4 w-4 flex-shrink-0" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ) : (
                        <CommandEmpty>No presets found.</CommandEmpty>
                      )}
                    </ScrollArea>
                  </CommandList>
                </Command>
              </TabsContent>
            ))}
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
} 