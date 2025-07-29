"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { AppConfig } from "@/lib/config";

const ConfigContext = createContext<AppConfig | null>(null);

interface ConfigProviderProps {
  children: ReactNode;
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    // Fetch config from API route
    fetch("/api/config")
      .then(res => res.json())
      .then(data => {
        console.log("🔧 Config loaded from API:", data);
        setConfig(data);
      })
      .catch(error => {
        console.error("Failed to load config:", error);
        // Fallback to default values
        setConfig({
          autoplayDelay: 500,
          queueAutoplayDelay: 1000,
          controlsAutoHideDelay: 10000,
          timeUpdateInterval: 2000,
          ratingAnimationDuration: 15000,
          nextSongDuration: 15000,
        });
      });
  }, []);

  if (!config) {
    // Return loading state or default config
    return (
      <ConfigContext.Provider
        value={{
          autoplayDelay: 500,
          queueAutoplayDelay: 1000,
          controlsAutoHideDelay: 10000,
          timeUpdateInterval: 2000,
          ratingAnimationDuration: 15000,
          nextSongDuration: 15000,
        }}
      >
        {children}
      </ConfigContext.Provider>
    );
  }

  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
}

export function useConfig(): AppConfig {
  const config = useContext(ConfigContext);
  if (!config) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return config;
}
