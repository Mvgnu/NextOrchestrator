"use client";

import { useState } from "react";
import { Version } from "@/lib/version-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  Star, 
  StarOff,
  GitCommit,
  GitBranch,
  GitCompare
} from "lucide-react";

interface VersionHistoryProps {
  versions: Version[];
  currentVersionId?: string;
  onSetCurrent?: (versionId: string) => Promise<void>;
  onCompare?: (version1Id: string, version2Id: string) => void;
  onRestore?: (versionId: string) => Promise<void>;
  isLoadingAction?: boolean;
}

export function VersionHistory({
  versions,
  currentVersionId,
  onSetCurrent,
  onCompare,
  onRestore,
  isLoadingAction = false
}: VersionHistoryProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  const handleSelectVersion = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter(id => id !== versionId));
    } else {
      // If we already have 2 versions selected, replace the oldest selection
      if (selectedVersions.length >= 2) {
        setSelectedVersions([...selectedVersions.slice(1), versionId]);
      } else {
        setSelectedVersions([...selectedVersions, versionId]);
      }
    }
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2 && onCompare) {
      onCompare(selectedVersions[0], selectedVersions[1]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Version History</h3>
        {selectedVersions.length === 2 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCompare}
          >
            <GitCompare className="mr-2 h-4 w-4" />
            Compare Versions
          </Button>
        )}
      </div>
      
      <div className="space-y-3">
        {versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No version history available.</p>
        ) : (
          versions.map((version) => (
            <Card 
              key={version.id} 
              className={`p-4 transition-colors ${
                selectedVersions.includes(version.id) ? "border-primary" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{version.name}</h4>
                    {version.id === currentVersionId && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                    {version.parent_version_id && (
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  {version.description && (
                    <p className="mt-2 text-sm">{version.description}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSelectVersion(version.id)}
                    title="Select for comparison"
                  >
                    <GitCommit className="h-4 w-4" />
                  </Button>
                  
                  {onRestore && version.id !== currentVersionId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRestore(version.id)}
                      disabled={isLoadingAction}
                      title="Restore this version"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {onSetCurrent && version.id !== currentVersionId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSetCurrent(version.id)}
                      disabled={isLoadingAction}
                      title="Set as current version"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {version.metadata && (
                <>
                  <Separator className="my-3" />
                  <div className="flex flex-wrap gap-1">
                    {(version.metadata as any).tags?.map((tag: string) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 