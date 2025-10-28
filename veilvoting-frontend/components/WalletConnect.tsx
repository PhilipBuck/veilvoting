"use client";

import { useWallet } from "../hooks/useWallet";
import { useFhevm } from "../fhevm/useFhevm";
import { useEffect } from "react";
import { shortenAddress } from "../lib/utils";

export function WalletConnect() {
  const { address, chainId, isConnecting, connect, disconnect } = useWallet();
  const { initialize: initializeFhevm, isInitializing } = useFhevm();

  useEffect(() => {
    if (address && chainId && window.ethereum) {
      initializeFhevm(window.ethereum);
    }
  }, [address, chainId, initializeFhevm]);

  const getNetworkName = (id: number | null) => {
    if (!id) return "Unknown";
    if (id === 31337) return "Localhost";
    if (id === 11155111) return "Sepolia";
    return `Chain ${id}`;
  };

  if (address) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end text-sm">
          <div className="text-neutral-400">{getNetworkName(chainId)}</div>
          <div className="font-mono text-primary-400">{shortenAddress(address)}</div>
          {isInitializing && (
            <div className="text-xs text-neutral-500">Initializing FHEVM...</div>
          )}
        </div>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg border border-neutral-700 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}


