import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";

interface AuthSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "signin" | "signup";
}

export const AuthSheet = ({ open, onOpenChange, defaultMode = "signin" }: AuthSheetProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const navigate = useNavigate();
  const { signIn, sendOtp, user } = useAuth();
  const { toast } = useToast();

  // Update mode when defaultMode changes or when sheet opens
  useEffect(() => {
    if (open) {
      setMode(defaultMode);
    }
  }, [defaultMode, open]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error, user: loginUser } = await signIn(email, password);
    if (!error) {
      onOpenChange(false);
      setEmail("");
      setPassword("");
      
      // Check role directly from login response user data
      if (loginUser?.role === 'admin') {
        console.log('User is admin from login response, redirecting to dashboard');
        // Small delay to ensure state is updated
        setTimeout(() => {
          window.location.href = "/admin-dashboard";
        }, 200);
      } else {
        navigate("/");
      }
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password length (minimum 6 characters)
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const { error } = await sendOtp(email);
    setLoading(false);
    if (!error) {
      onOpenChange(false);
      // Navigate to OTP verification page
      navigate("/auth/verify", {
        state: {
          email,
          password,
          fullName,
        },
        replace: true,
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-lg overflow-y-auto"
        style={{
          backgroundImage: 'url(/bg-green.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="mb-6">
            <div className="text-center mb-6 mt-6">
              <div className="inline-flex items-center justify-center p-3 rounded-lg">
                <img src="/logo-white.png" alt="Phresh - Fresh Juices" className="h-12 w-auto" />
              </div>
            </div>
            <SheetTitle className="sr-only">Authentication</SheetTitle>
          </SheetHeader>

          <div className="flex-1">
            <Tabs value={mode} onValueChange={(value) => setMode(value as "signin" | "signup")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger 
                  value="signin" 
                  className="text-white data-[state=active]:bg-green-800 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-green-900 pb-1"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="text-white data-[state=active]:bg-green-800 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-green-900 pb-1"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                <Card className="bg-white/95">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center text-gray-900">Welcome back</CardTitle>
                    <CardDescription className="text-center text-gray-600">
                      Sign in to your account to continue shopping
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-900">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-900">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-green-800 text-white hover:bg-green-900 font-semibold" 
                        disabled={loading}
                      >
                        {loading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <Card className="bg-white/95">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center text-gray-900">Create account</CardTitle>
                    <CardDescription className="text-center text-gray-600">
                      Join us to discover fresh, healthy juices
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-gray-900">Full Name</Label>
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-900">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-900">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Choose a strong password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-green-800 text-white hover:bg-green-900 font-semibold" 
                        disabled={loading}
                      >
                        {loading ? "Sending code..." : "Send verification code"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

