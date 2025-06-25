import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FastLogin() {
  const [, setLocation] = useLocation();
  const { loginMutation } = useAuth();
  const [credentials, setCredentials] = useState({ username: "", password: "" });

  const testAccounts = [
    { username: "admin", password: "admin1234", label: "Admin", type: "admin" },
    { username: "restaurant1", password: "password123", label: "Restaurant Owner", type: "owner" },
    { username: "entotocloudrestaurant@gmail.com", password: "cloud123", label: "Premium User", type: "premium" }
  ];

  const handleQuickLogin = (username: string, password: string) => {
    loginMutation.mutate({ username, password }, {
      onSuccess: () => setLocation("/dashboard")
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(credentials, {
      onSuccess: () => setLocation("/dashboard")
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">VividPlate</CardTitle>
          <p className="text-sm text-gray-600">Quick Login</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-3">
            <Input
              placeholder="Username or Email"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              required
            />
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="space-y-2">
            <p className="text-xs text-center text-gray-500">Quick Test Accounts</p>
            {testAccounts.map((account) => (
              <Button
                key={account.username}
                variant="outline"
                size="sm"
                className="w-full text-left justify-start"
                onClick={() => handleQuickLogin(account.username, account.password)}
                disabled={loginMutation.isPending}
              >
                {account.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}