import { useState, useEffect } from "react";

export type DeviceMode = "desktop" | "mobile";

/**
 * Single source of truth for device mode across the entire app.
 * Evaluates to "mobile" when viewport width <= 768px.
 * In Chrome DevTools Device Mode and real phones, (pointer: coarse) is also true.
 * SSR-safe (defaults to "desktop" if window is undefined).
 */
export function useDeviceMode(): DeviceMode {
  const getMode = (): DeviceMode => {
    if (typeof window === "undefined") return "desktop";
    return window.innerWidth <= 768 ? "mobile" : "desktop";
  };

  const [mode, setMode] = useState<DeviceMode>(getMode);

  useEffect(() => {
    const updateMode = () => {
      setMode(getMode());
    };

    window.addEventListener("resize", updateMode);
    
    // Listen to pointer capability changes (e.g. toggling touch simulation)
    const mql = window.matchMedia("(pointer: coarse)");
    mql.addEventListener?.("change", updateMode);

    return () => {
      window.removeEventListener("resize", updateMode);
      mql.removeEventListener?.("change", updateMode);
    };
  }, []);

  return mode;
}
