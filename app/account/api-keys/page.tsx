import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ApiKeyManager from "./ApiKeyManager";
import supabase from "@/lib/supabase";
import { providers } from "@/lib/ai-config";

export const metadata: Metadata = {
  title: "API Keys | MARS Next",
  description: "Manage your AI provider API keys",
};

export default async function ApiKeysPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/signin?callbackUrl=/account/api-keys");
  }

  // Fetch user's existing API keys
  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Link
          href="/account"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center mb-2"
        >
          ← Back to Account
        </Link>
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="text-muted-foreground">
          Manage your AI provider API keys for models like GPT-4, Claude, and Gemini
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>API Key Management</CardTitle>
          <CardDescription>
            Configure API keys to use different AI models in your agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none mb-6">
            <p>
              MARS Next works with multiple AI providers. To use their services, 
              you need to provide your own API keys. Your keys are securely stored 
              and used only for your account.
            </p>
            <ul>
              <li><strong>OpenAI:</strong> For GPT-3.5 and GPT-4 models</li>
              <li><strong>Anthropic:</strong> For Claude models</li>
              <li><strong>Google:</strong> For Gemini models</li>
              <li><strong>xAI:</strong> For Grok models</li>
              <li><strong>DeepSeek:</strong> For DeepSeek models</li>
            </ul>
          </div>
          
          <Separator className="my-6" />
          
          <ApiKeyManager initialApiKeys={apiKeys || []} userId={session.user.id} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>API Usage</CardTitle>
          <CardDescription>
            Monitor your API usage across providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Track your API usage and costs. This will help you manage your budget
            and understand your usage patterns.
          </p>
          
          <Button variant="outline" asChild>
            <Link href="/account/usage">View Usage Stats</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 