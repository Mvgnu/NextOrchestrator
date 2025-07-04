"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ContextService } from "@/lib/context-service";
import { Version } from "@/lib/version-service";
import { VersionHistory } from "@/components/ui/version-history";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Clock, GitBranch } from "lucide-react";

export default function ContextVersionsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const contextId = params.contextId as string;

  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVersions() {
      try {
        setIsLoading(true);
        const allVersions = await ContextService.getContextVersions(contextId);
        setVersions(allVersions);

        // Find the current version
        const currentVersion = allVersions.find((v) => v.is_current);
        if (currentVersion) {
          setCurrentVersionId(currentVersion.id);
        }
      } catch (err) {
        console.error("Error loading versions:", err);
        setError("Failed to load version history");
      } finally {
        setIsLoading(false);
      }
    }

    loadVersions();
  }, [contextId]);

  const handleBack = () => {
    router.push(`/projects/${projectId}/contexts/${contextId}`);
  };

  const handleSetCurrent = async (versionId: string) => {
    try {
      setIsProcessing(true);
      await ContextService.restoreVersion(contextId, versionId);
      
      // Update the state
      setVersions((prev) => 
        prev.map((v) => ({
          ...v,
          is_current: v.id === versionId,
        }))
      );
      setCurrentVersionId(versionId);
    } catch (err) {
      console.error("Error setting current version:", err);
      setError("Failed to set as current version");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompare = (version1Id: string, version2Id: string) => {
    router.push(`/projects/${projectId}/contexts/${contextId}/versions/compare?v1=${version1Id}&v2=${version2Id}`);
  };

  const handleRestore = async (versionId: string) => {
    try {
      setIsProcessing(true);
      await ContextService.restoreVersion(contextId, versionId);
      
      // Update the state
      setVersions((prev) => 
        prev.map((v) => ({
          ...v,
          is_current: v.id === versionId,
        }))
      );
      setCurrentVersionId(versionId);
      
      // Navigate back to context view
      router.push(`/projects/${projectId}/contexts/${contextId}`);
    } catch (err) {
      console.error("Error restoring version:", err);
      setError("Failed to restore version");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading version history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Context
        </Button>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200 mb-6">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      <div className="grid gap-8">
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <GitBranch className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Version History</h1>
          </div>

          <VersionHistory
            versions={versions}
            currentVersionId={currentVersionId}
            onSetCurrent={handleSetCurrent}
            onCompare={handleCompare}
            onRestore={handleRestore}
            isLoadingAction={isProcessing}
          />
        </Card>
      </div>
    </div>
  );
} 