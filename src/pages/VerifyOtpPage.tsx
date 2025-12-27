import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";

export const VerifyOtpPage = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, resendOtp, user } = useAuth();

  const { email, password, fullName } = location.state || {};

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!email || !password || !fullName) {
      navigate("/auth?mode=signup");
    }
  }, [email, password, fullName, navigate]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await verifyOtp(email, password, fullName, otp);
    setLoading(false);
    
    if (!error) {
      navigate("/");
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    const { error } = await resendOtp(email);
    setResendLoading(false);
    
    if (!error) {
      toast({
        title: "OTP sent",
        description: "A new verification code has been sent to your email.",
      });
    }
  };

  if (!email || !password || !fullName) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-9">
          <img src="/phresh_logo.jpeg" alt="Phresh - Fresh Juices" className="mx-auto h-20 md:h-20 w-auto" />
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Verify your email</CardTitle>
            <CardDescription className="text-center">
              We've sent a 6-digit verification code to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? "Verifying..." : "Verify & Create Account"}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Didn't receive the code?
              </p>
              <Button
                variant="ghost"
                onClick={handleResendOtp}
                disabled={resendLoading}
                className="text-sm"
              >
                {resendLoading ? "Sending..." : "Resend code"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-4">
          <Button variant="ghost" onClick={() => navigate("/auth?mode=signup")} className="text-sm">
            ← Back to signup
          </Button>
        </div>
      </div>
    </div>
  );
};
