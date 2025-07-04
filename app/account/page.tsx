import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My Account | MARS Next",
  description: "Manage your account settings and preferences",
};

export default async function AccountPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/signin?callbackUrl=/account");
  }

  const user = session.user;

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Manage your profile details and account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
              <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{user?.name || "User"}</h3>
              <p className="text-sm text-muted-foreground">{user?.email || "No email provided"}</p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium mb-2">Account Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" asChild>
                <Link href="/account/edit-profile">Edit Profile</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/account/api-keys">Manage API Keys</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/account/preferences">Preferences</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/account/billing">Billing & Plans</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>
            Your recent activity and resource usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Projects</p>
              <p className="text-2xl font-semibold">12</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Agents</p>
              <p className="text-2xl font-semibold">5</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">API Calls</p>
              <p className="text-2xl font-semibold">358</p>
            </div>
          </div>
          <Button className="w-full" variant="outline" asChild>
            <Link href="/account/usage">View Detailed Usage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 