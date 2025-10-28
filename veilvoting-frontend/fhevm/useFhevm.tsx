"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { FhevmInstance } from "./fhevmTypes";
import { createFhevmInstance, FhevmAbortError } from "./internal/fhevm";

interface FhevmContextType {
  instance: FhevmInstance | null;
  isInitializing: boolean;
  error: string | null;
  initialize: (provider: any) => Promise<void>;
}

const FhevmContext = createContext<FhevmContextType | null>(null);

export function FhevmProvider({ children }: { children: React.ReactNode }) {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async (provider: any) => {
    if (isInitializing || instance) return;

    setIsInitializing(true);
    setError(null);

    const controller = new AbortController();

    try {
      const fhevmInstance = await createFhevmInstance({
        provider,
        signal: controller.signal,
      });

      setInstance(fhevmInstance);
    } catch (err) {
      if (err instanceof FhevmAbortError) {
        console.log("FHEVM initialization aborted");
      } else {
        const message = err instanceof Error ? err.message : "Failed to initialize FHEVM";
        setError(message);
        console.error("FHEVM initialization error:", err);
      }
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, instance]);

  return (
    <FhevmContext.Provider value={{ instance, isInitializing, error, initialize }}>
      {children}
    </FhevmContext.Provider>
  );
}

export function useFhevm() {
  const context = useContext(FhevmContext);
  if (!context) {
    throw new Error("useFhevm must be used within FhevmProvider");
  }
  return context;
}


