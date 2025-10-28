"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { BrowserProvider } from "ethers";

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  provider: any;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

const WALLET_CONNECTED_KEY = "veilvoting_wallet_connected";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(false);

  const connect = useCallback(async (isAutoConnect = false) => {
    if (typeof window === "undefined" || !window.ethereum) {
      if (!isAutoConnect) {
        alert("Please install MetaMask!");
      }
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: isAutoConnect ? "eth_accounts" : "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        // No accounts available
        if (!isAutoConnect) {
          console.log("No accounts found");
        }
        setIsConnecting(false);
        return;
      }

      const chainIdHex = await window.ethereum.request({
        method: "eth_chainId",
      });

      const ethersProvider = new BrowserProvider(window.ethereum);
      
      setAddress(accounts[0]);
      setChainId(parseInt(chainIdHex, 16));
      setProvider(window.ethereum);
      
      // Save connection state
      if (typeof window !== "undefined") {
        localStorage.setItem(WALLET_CONNECTED_KEY, "true");
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setProvider(null);
    
    // Clear connection state
    if (typeof window !== "undefined") {
      localStorage.removeItem(WALLET_CONNECTED_KEY);
    }
  }, []);

  // Auto-connect on mount if previously connected
  useEffect(() => {
    if (autoConnectAttempted) return;
    
    const wasConnected = typeof window !== "undefined" 
      ? localStorage.getItem(WALLET_CONNECTED_KEY) === "true"
      : false;

    if (wasConnected && window.ethereum) {
      connect(true); // Auto-connect without prompting
    }
    
    setAutoConnectAttempted(true);
  }, [autoConnectAttempted, connect]);

  // Listen to account and chain changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
        // Keep connection state
        localStorage.setItem(WALLET_CONNECTED_KEY, "true");
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16));
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect]);

  return (
    <WalletContext.Provider
      value={{ address, chainId, provider, isConnecting, connect, disconnect }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}


