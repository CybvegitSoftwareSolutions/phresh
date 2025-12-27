import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export const AdminLogin = () => {
  const { signIn, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log('Attempting admin login for:', email);
      
      // First, sign in the user
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        console.error('Sign in error:', signInError);
        if (signInError.message === "Invalid login credentials") {
          setError("Invalid email or password. If this is your first time, please check your email for a password setup link.");
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      // Wait a moment for auth state to settle, then check admin status
      setTimeout(async () => {
        try {
          // Get the current user from localStorage token
          const token = localStorage.getItem('jwt_token');
          if (!token) {
            setError("Authentication failed. Please try again.");
            setLoading(false);
            return;
          }

          // Make API call to get user profile
          const response = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            setError("Authentication failed. Please try again.");
            setLoading(false);
            return;
          }

          const userData = await response.json();
          console.log('Admin check - User data:', userData);

          if (userData.success && userData.data?.role === 'admin') {
            console.log('User is admin, redirecting to dashboard');
            toast({
              title: "Admin Login Successful",
              description: "Welcome to the admin dashboard!"
            });
            // Force a complete page navigation to ensure auth state is properly set
            window.location.replace('/admin-dashboard');
          } else {
            console.log('User is not admin, signing out');
            await signOut();
            setError("Access Denied: This account does not have admin privileges.");
            setLoading(false);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          await signOut();
          setError("Error verifying admin status. Please try again.");
          setLoading(false);
        }
      }, 1000); // Give auth state more time to settle
      
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    // For now, show a message that password reset is not available
    // This would need to be implemented in the backend
    toast({
      title: "Password Reset",
      description: "Please contact your system administrator for password reset assistance."
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full gradient-luxury flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Sign in to access the Phresh admin dashboard
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In as Admin"}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-xs text-muted-foreground"
                onClick={handlePasswordReset}
                disabled={loading}
              >
                Forgot password? Reset it here
              </Button>
            </div>

            <div className="text-center pt-4">
              <Button
                type="button"
                variant="link"
                className="text-sm text-muted-foreground"
                onClick={() => navigate('/')}
                disabled={loading}
              >
                Back to Store
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p><strong>Admin Account:</strong></p>
              <p>asadshafique5@gmail.com</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};