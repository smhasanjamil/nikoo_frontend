// src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5008";

const API_URL = `${API_BASE}/api/v1`;   // ← this matches your route structure

export const api = {
  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async verifyOTP(userId: string, otpCode: string) {
    const res = await fetch(`${API_URL}/auth/login-otp-verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, otpCode, type: "login" }),
    });
    return res.json();
  },

  async getMyLocation(token: string) {
    const res = await fetch(`${API_URL}/locations/my-latest`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getNearbyUsers(token: string, radius: number = 50000) {
    const res = await fetch(`${API_URL}/locations/nearby?radius=${radius}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
};