// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Users, Activity, LogOut, Navigation } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { useLocationWebSocket } from "../lib/websocket";
import { api } from "../lib/api";

type Location = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
};

type NearbyUser = {
  id: string;
  name: string;
  email: string;
  distance: number;
  location: Location;
};

export default function DashboardPage() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const { connected, activeUsers } = useLocationWebSocket(user?.id, token);

  const [myLocation, setMyLocation] = useState<Location | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) {
      router.replace("/login");
      return;
    }

    const loadData = async () => {
      try {
        const locResult = await api.getMyLocation(token);
        if (locResult.data) setMyLocation(locResult.data);
      } catch (err) {
        console.error("Failed to load my location:", err);
      }

      try {
        const nearbyResult = await api.getNearbyUsers(token);
        if (nearbyResult.data) setNearbyUsers(nearbyResult.data);
      } catch (err) {
        console.error("Failed to load nearby users:", err);
      }
    };

    loadData();

    const interval = setInterval(async () => {
      try {
        const nearbyResult = await api.getNearbyUsers(token);
        if (nearbyResult.data) setNearbyUsers(nearbyResult.data);
      } catch (err) {
        console.error("Failed to refresh nearby users:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user, token, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 w-10 h-10 rounded-full flex items-center justify-center">
                <MapPin className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Location Tracker
                </h1>
                <p className="text-sm text-gray-500">Welcome, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    connected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {connected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {nearbyUsers.length + 1}
                </p>
              </div>
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tracking Status</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {connected ? "Active" : "Inactive"}
                </p>
              </div>
              <div
                className={`${
                  connected ? "bg-green-100" : "bg-gray-100"
                } w-12 h-12 rounded-full flex items-center justify-center`}
              >
                <Activity
                  className={`${
                    connected ? "text-green-600" : "text-gray-600"
                  }`}
                  size={24}
                />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Your Location</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {myLocation
                    ? `${myLocation.latitude.toFixed(
                        4
                      )}, ${myLocation.longitude.toFixed(4)}`
                    : "Loading..."}
                </p>
              </div>
              <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center">
                <Navigation className="text-indigo-600" size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Active Users</h2>
          <div className="border-b border-gray-200 pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {user.name} (You)
                  </p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Online</span>
                </div>
                {myLocation && (
                  <p className="text-xs text-gray-500 mt-1">
                    {myLocation.latitude.toFixed(6)},{" "}
                    {myLocation.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {nearbyUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users size={48} className="mx-auto mb-2 opacity-50" />
                <p>No nearby users found</p>
                <p className="text-sm">Users within 50km will appear here</p>
              </div>
            ) : (
              nearbyUsers.map((nearbyUser) => (
                <div
                  key={nearbyUser.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-700 font-semibold">
                        {nearbyUser.name?.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {nearbyUser.name || "Unknown User"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(nearbyUser.distance / 1000).toFixed(2)} km away
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Online</span>
                    </div>
                    {nearbyUser.location && (
                      <p className="text-xs text-gray-500 mt-1">
                        {nearbyUser.location.latitude.toFixed(6)},{" "}
                        {nearbyUser.location.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
