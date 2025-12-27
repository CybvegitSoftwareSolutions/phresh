import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/useAuth";

interface LocationState {
  email: string;
  password: string;
  fullName: string;
}

const RESEND_COOLDOWN_SECONDS = 45;

export const OtpVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resendOtp, verifyOtp, user } = useAuth();
  const state = (location.state as LocationState | null) ?? null;

  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!state?.email || !state?.password || !state?.fullName) {
      navigate("/auth?mode=signup", { replace: true });
    }
  }, [navigate, state?.email, state?.password, state?.fullName]);

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  const obfuscatedEmail = useMemo(() => {
    if (!state?.email) return "";
    const [localPart, domain] = state.email.split("@");
    if (!domain) return state.email;
    const visible = localPart.slice(0, 2);
    const masked = localPart.length > 2 ? "*".repeat(localPart.length - 2) : "";
    return `${visible}${masked}@${domain}`;
  }, [state?.email]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!state?.email || !state?.password || !state?.fullName || otp.length < 6) {
      return;
    }

    setVerifying(true);
    const { error } = await verifyOtp(state.email, state.password, state.fullName, otp);
    setVerifying(false);

    if (!error) {
      navigate("/", { replace: true });
    }
  };

  const handleResend = async () => {
    if (!state?.email || !state?.fullName || cooldown > 0) {
      return;
    }

    setResending(true);
    const { error } = await resendOtp(state.email);
    setResending(false);

    if (!error) {
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setOtp("");
    }
  };

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-9">
          <img src="/phresh_logo.jpeg" alt="Phresh - Fresh Juices" className="mx-auto h-20 md:h-20 w-auto" />
        </div>

        <Card>
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">Verify your email</CardTitle>
            <CardDescription>
              Enter the 6-digit code we sent to {obfuscatedEmail} to finish creating your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot key={index} index={index} className="text-lg" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button type="submit" className="w-full" disabled={verifying || otp.length < 6}>
                {verifying ? "Verifying..." : "Verify and continue"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground space-y-2">
              <p>Didn't receive the code?</p>
              <Button
                type="button"
                variant="ghost"
                className="text-sm"
                onClick={handleResend}
                disabled={resending || cooldown > 0}
              >
                {resending
                  ? "Resending..."
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend code"}
              </Button>
            </div>

            <div className="mt-4 text-center">
              <Button
                type="button"
                variant="ghost"
                className="text-sm"
                onClick={() => navigate("/auth?mode=signup", { replace: true })}
              >
                Back to sign up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OtpVerificationPage;
