import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bot, Phone, Key, Copy, ExternalLink } from "lucide-react";
import CustomerHeader from "@/components/layout/CustomerHeader";
import Footer from "@/components/layout/Footer";

const PasswordResetHelp = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();

  const handleTelegramReset = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/telegram-reset", {
        phoneNumber: phoneNumber.trim()
      });

      if (response.newPassword) {
        setNewPassword(response.newPassword);
        toast({
          title: "Password Reset Successful",
          description: "Your new temporary password has been generated. Please change it after logging in.",
        });
      } else {
        toast({
          title: "Success",
          description: response.message,
        });
      }
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    toast({
      title: "Copied",
      description: "Password copied to clipboard",
    });
  };

  return (
    <>
      <CustomerHeader />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold mb-4">Password Reset Guide</h1>
          <p className="text-muted-foreground">
            Reset your VividPlate account password using our Telegram bot or direct API
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Telegram Bot Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Telegram Bot Reset
              </CardTitle>
              <CardDescription>
                Use our Telegram bot for secure password reset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Step 1: Find the Bot</h3>
                  <p className="text-sm">Search for <strong>@Vividplatebot</strong> on Telegram</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.open('https://t.me/Vividplatebot', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Bot
                  </Button>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Step 2: Send Reset Command</h3>
                  <p className="text-sm mb-2">Send this message to the bot:</p>
                  <code className="bg-gray-100 p-2 rounded block text-sm">
                    /reset +YOUR_PHONE_NUMBER
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Example: /reset +1234567890
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Step 3: Get New Password</h3>
                  <p className="text-sm">
                    The bot will send you a new temporary password. Use it to log in and change it immediately.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Direct API Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Direct Reset
              </CardTitle>
              <CardDescription>
                Reset your password directly through our system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the phone number you used when registering
                  </p>
                </div>

                <Button 
                  onClick={handleTelegramReset} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>

                {newPassword && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h3 className="font-semibold mb-2 text-yellow-800">New Temporary Password</h3>
                    <div className="flex items-center gap-2">
                      <code className="bg-yellow-100 p-2 rounded flex-1 text-sm font-mono">
                        {newPassword}
                      </code>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={copyPassword}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-yellow-700 mt-2">
                      ⚠️ Please change this password immediately after logging in
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold mb-2">Security Tips</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Change the temporary password immediately</li>
                  <li>• Use a strong, unique password</li>
                  <li>• Keep your phone number updated in your profile</li>
                  <li>• Don't share your temporary password</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Troubleshooting</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Ensure your phone number is correctly formatted</li>
                  <li>• Check that your phone is registered to your account</li>
                  <li>• Contact support if you can't access your phone</li>
                  <li>• Bot commands are case-sensitive</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default PasswordResetHelp;