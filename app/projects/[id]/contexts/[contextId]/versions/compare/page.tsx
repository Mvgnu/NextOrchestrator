"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import versionService, { Version } from "@/lib/version-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, GitCompare, ArrowUpDown } from "lucide-react";

export default function CompareVersionsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const contextId = params.contextId as string;
  const version1Id = searchParams.get("v1");
  const version2Id = searchParams.get("v2");

  const [version1, setVersion1] = useState<Version | null>(null);
  const [version2, setVersion2] = useState<Version | null>(null);
  const [differences, setDifferences] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVersions() {
      if (!version1Id || !version2Id) {
        setError("Two version IDs are required for comparison");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [v1, v2] = await Promise.all([
          versionService.getVersion(version1Id),
          versionService.getVersion(version2Id)
        ]);

        setVersion1(v1);
        setVersion2(v2);

        // Compare the versions
        if (v1 && v2) {
          const diff = versionService.compareVersions(v1, v2);
          setDifferences(diff);
        }
      } catch (err) {
        console.error("Error loading versions for comparison:", err);
        setError("Failed to load versions for comparison");
      } finally {
        setIsLoading(false);
      }
    }

    loadVersions();
  }, [version1Id, version2Id]);

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading version comparison...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Button variant="outline" onClick={handleBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Context
        </Button>
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-red-500 mb-2">Error</h1>
          <p>{error}</p>
        </Card>
      </div>
    );
  }

  if (!version1 || !version2) {
    return (
      <div className="container py-8">
        <Button variant="outline" onClick={handleBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Context
        </Button>
        <Card className="p-6">
          <p>One or both of the requested versions could not be found.</p>
        </Card>
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

      <div className="grid gap-8">
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <GitCompare className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Version Comparison</h1>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <h2 className="font-medium">{version1.name}</h2>
              <p className="text-sm text-muted-foreground">
                Created {formatDistanceToNow(new Date(version1.created_at), { addSuffix: true })}
              </p>
              {version1.description && <p className="text-sm">{version1.description}</p>}
            </div>
            
            <div className="space-y-2">
              <h2 className="font-medium">{version2.name}</h2>
              <p className="text-sm text-muted-foreground">
                Created {formatDistanceToNow(new Date(version2.created_at), { addSuffix: true })}
              </p>
              {version2.description && <p className="text-sm">{version2.description}</p>}
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Changes</h2>
            
            {Object.keys(differences).length === 0 ? (
              <p className="text-muted-foreground">No differences found between these versions.</p>
            ) : (
              Object.entries(differences).map(([key, diff]) => (
                <Card key={key} className="p-4 border-l-4 border-l-blue-500">
                  <h3 className="font-medium mb-2">{key}</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-3 rounded-md">
                      <Badge variant="outline" className="mb-2">Previous</Badge>
                      <pre className="text-xs whitespace-pre-wrap">
                        {diff.previous !== undefined 
                          ? typeof diff.previous === 'object' 
                            ? JSON.stringify(diff.previous, null, 2) 
                            : String(diff.previous)
                          : '(not present)'}
                      </pre>
                    </div>
                    
                    <div className="bg-muted/30 p-3 rounded-md">
                      <Badge variant="outline" className="mb-2">Current</Badge>
                      <pre className="text-xs whitespace-pre-wrap">
                        {diff.current !== undefined 
                          ? typeof diff.current === 'object' 
                            ? JSON.stringify(diff.current, null, 2) 
                            : String(diff.current)
                          : '(not present)'}
                      </pre>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
} 