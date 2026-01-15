// src/lib/websocket-hook.ts
"use client";

import { useState, useEffect, useRef } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5008";

export const useLocationWebSocket = (userId?: string, token?: string | null) => {
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  // Use ref to store websocket so we can access latest value in cleanup
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userId || !token) return;

    const websocket = new WebSocket(WS_URL);
    wsRef.current = websocket;

    websocket.onopen = () => {
      console.log("WebSocket → Connected");
      // Only send if still open
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ type: "connect", userId }));
      }
      setConnected(true);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "connected":
            startLocationTracking(websocket, userId);
            break;
          case "locationBroadcast":
            updateUserLocation(data.userId, data.location);
            break;
          case "nearbyUsers":
            setActiveUsers(data.users ?? []);
            break;
        }
      } catch (e) {
        console.error("Failed to parse WS message:", e);
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnected(false);
    };

    websocket.onclose = () => {
      console.log("WebSocket closed");
      setConnected(false);
      wsRef.current = null;
    };

    return () => {
      // Cleanup - only send if connection is already open
      if (wsRef.current) {
        const ws = wsRef.current;
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ type: "stopTracking", userId }));
          } catch (e) {
            console.warn("Couldn't send stopTracking (probably already closing)", e);
          }
        }
        // Always try to close
        ws.close();
        wsRef.current = null;
      }
    };
  }, [userId, token]);

  const startLocationTracking = (ws: WebSocket, uid: string) => {
    if (!("geolocation" in navigator)) {
      console.warn("Geolocation is not supported by this browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (ws.readyState !== WebSocket.OPEN) return;

        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading ?? null,
          speed: position.coords.speed ?? null,
        };

        try {
          ws.send(
            JSON.stringify({
              type: "updateLocation",
              userId: uid,
              location,
            })
          );
        } catch (err) {
          console.warn("Failed to send location update:", err);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        // You can show UI message based on error.code
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("Location permission denied. Please enable it in browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            console.warn("Location request timed out");
            break;
          default:
            console.warn("Unknown geolocation error");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 8000,
      }
    );

    // Optional: return cleanup for watchPosition
    return () => navigator.geolocation.clearWatch(watchId);
  };

  const updateUserLocation = (uid: string, location: any) => {
    setActiveUsers((prev) => {
      const exists = prev.find((u) => u.id === uid);
      if (exists) {
        return prev.map((u) => (u.id === uid ? { ...u, location } : u));
      }
      return [...prev, { id: uid, location }];
    });
  };

  return { connected, activeUsers };
};