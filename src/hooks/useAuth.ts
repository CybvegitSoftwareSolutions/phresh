import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { toast } from "@/components/ui/use-toast";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  profileImage?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('jwt_token');
    if (token) {
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // Token might be invalid, clear it
        localStorage.removeItem('jwt_token');
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      localStorage.removeItem('jwt_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      const response = await apiService.register({
        name: fullName,
        email,
        password,
        phone,
      });

      if (response.success) {
        setUser(response.data.user);
        toast({
          title: "Account created",
          description: "Welcome to Phresh! Your account has been created successfully.",
        });
        return { error: null };
      } else {
        toast({
          title: "Sign up failed",
          description: response.message || "Failed to create account. Please try again.",
          variant: "destructive",
        });
        return { error: response.message };
      }
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });

      if (response.success) {
        setUser(response.data.user);
        toast({
          title: "Welcome back",
          description: "You're now signed in to Phresh.",
        });
        return { error: null };
      } else {
        toast({
          title: "Invalid credentials",
          description: response.message || "Please check your email and password and try again.",
          variant: "destructive",
        });
        return { error: response.message };
      }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your email and password and try again.",
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await apiService.logout();
      setUser(null);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully."
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message || "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateProfile = async (userData: any) => {
    try {
      const response = await apiService.updateProfile(userData);
      if (response.success) {
        setUser(response.data);
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
        return { error: null };
      } else {
        toast({
          title: "Update failed",
          description: response.message || "Failed to update profile. Please try again.",
          variant: "destructive",
        });
        return { error: response.message };
      }
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await apiService.changePassword({ currentPassword, newPassword });
      if (response.success) {
        toast({
          title: "Password changed",
          description: "Your password has been changed successfully.",
        });
        return { error: null };
      } else {
        toast({
          title: "Password change failed",
          description: response.message || "Failed to change password. Please try again.",
          variant: "destructive",
        });
        return { error: response.message };
      }
    } catch (error: any) {
      toast({
        title: "Password change failed",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const uploadProfileImage = async (imageFile: File) => {
    try {
      const response = await apiService.uploadProfileImage(imageFile);
      if (response.success) {
        setUser(response.data);
        toast({
          title: "Image uploaded",
          description: "Your profile image has been updated successfully.",
        });
        return { error: null };
      } else {
        toast({
          title: "Upload failed",
          description: response.message || "Failed to upload image. Please try again.",
          variant: "destructive",
        });
        return { error: response.message };
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  // OTP methods
  const sendOtp = async (email: string) => {
    try {
      const response = await apiService.sendOtp(email);
      if (response.success) {
        toast({
          title: "OTP sent",
          description: "A verification code has been sent to your email.",
        });
        return { error: null };
      } else {
        toast({
          title: "Failed to send OTP",
          description: response.message || "Failed to send verification code. Please try again.",
          variant: "destructive",
        });
        return { error: response.message };
      }
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.message || "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const verifyOtp = async (email: string, password: string, fullName: string, otp: string) => {
    try {
      const response = await apiService.verifyOtp(fullName, email, password, otp);
      if (response.success) {
        setUser(response.data.user);
        toast({
          title: "Account created",
          description: "Welcome to Phresh! Your account has been created successfully.",
        });
        return { error: null };
      } else {
        toast({
          title: "Verification failed",
          description: response.message || "Invalid OTP. Please try again.",
          variant: "destructive",
        });
        return { error: response.message };
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const resendOtp = async (email: string) => {
    try {
      const response = await apiService.resendOtp(email);
      if (response.success) {
        toast({
          title: "OTP sent",
          description: "A new verification code has been sent to your email.",
        });
        return { error: null };
      } else {
        toast({
          title: "Failed to resend OTP",
          description: response.message || "Failed to resend verification code. Please try again.",
          variant: "destructive",
        });
        return { error: response.message };
      }
    } catch (error: any) {
      toast({
        title: "Failed to resend OTP",
        description: error.message || "Failed to resend verification code. Please try again.",
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    sendOtp,
    verifyOtp,
    resendOtp,
    updateProfile,
    changePassword,
    uploadProfileImage,
  };
};
