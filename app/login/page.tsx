// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { api } from "../lib/api";

export default function LoginPage() {
  const [step, setStep] = useState<"login" | "otp">("login");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.login(email, password);
      if (!result.success) {
        setError(result.message || "Login failed");
        return;
      }
      if (result.data?.userId) {
        setUserId(result.data.userId);
        setStep("otp");
      } else {
        setError("Unexpected response");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

 const handleVerifyOTP = async () => {
  setLoading(true);
  setError("");
  
  try {
    const result = await api.verifyOTP(userId, otp);
    
    // Debug - you can remove later
    console.log("OTP Verify Full Response:", result);

    if (!result.success) {
      setError(result.message || "Verification failed");
      return;
    }

    // ── IMPORTANT: This is the correct structure based on your real response ──
    if (result.data?.accessToken && result.data?.id && result.data?.name) {
      // Create user object from the fields that are directly in data
      const userData = {
        id: result.data.id,
        name: result.data.name,
        email: result.data.email,
        // role: result.data.role,     // optional
        // phoneNumber: result.data.phoneNumber,  // optional
      };

      login(userData, result.data.accessToken);
      router.push("/dashboard");
    } else {
      setError("Invalid response format from server");
    }
  } catch (err: unknown) {
    console.error("OTP verification error:", err);
    setError(
      err instanceof Error ? err.message : "Verification failed"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Location Tracker</h1>
          <p className="text-gray-600 mt-2">
            {step === "login"
              ? "Sign in to your account"
              : "Enter verification code"}
          </p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {step === "login" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email or Phone
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Enter email or phone"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Enter password"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleVerifyOTP()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
                placeholder="0000"
                maxLength={4}
              />
              <p className="text-sm text-gray-500 mt-2 text-center">
                Enter the 4-digit code sent to your email
              </p>
            </div>
            <button
              onClick={handleVerifyOTP}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              onClick={() => setStep("login")}
              className="w-full text-gray-600 py-2 text-sm hover:text-gray-800"
            >
              Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
