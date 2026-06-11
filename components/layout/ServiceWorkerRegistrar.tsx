"use client";
/**
 * ServiceWorkerRegistrar — registers /sw.js on the client side only.
 * This is a render-nothing component placed in the root layout.
 * All navigator access is inside useEffect, making it fully SSR-safe.
 */
import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none", // Always re-fetch sw.js from network
        });

        // Check for SW updates every 60 seconds while the app is open
        setInterval(() => registration.update(), 60_000);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // A new version is ready — optionally notify the user here
              console.log("[SW] New version available. Refresh to update.");
            }
          });
        });

        console.log("[SW] Registered:", registration.scope);
      } catch (err) {
        console.error("[SW] Registration failed:", err);
      }
    };

    // Register after the page has loaded so it doesn't compete with
    // critical resources on the initial paint.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
