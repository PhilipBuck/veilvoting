import { JsonRpcProvider } from "ethers";
import type { FhevmInstance } from "../fhevmTypes";

export class FhevmAbortError extends Error {
  constructor(message = "FHEVM operation was cancelled") {
    super(message);
    this.name = "FhevmAbortError";
  }
}

async function getChainId(provider: any): Promise<number> {
  if (typeof provider === "string") {
    const rpcProvider = new JsonRpcProvider(provider);
    return Number((await rpcProvider.getNetwork()).chainId);
  }
  const chainId = await provider.request({ method: "eth_chainId" });
  return Number.parseInt(chainId as string, 16);
}

async function tryFetchFHEVMHardhatNodeRelayerMetadata(
  rpcUrl: string
): Promise<
  | {
      ACLAddress: `0x${string}`;
      InputVerifierAddress: `0x${string}`;
      KMSVerifierAddress: `0x${string}`;
    }
  | undefined
> {
  try {
    const rpc = new JsonRpcProvider(rpcUrl);
    const version = await rpc.send("web3_clientVersion", []);
    
    if (!version || typeof version !== "string" || !version.toLowerCase().includes("hardhat")) {
      return undefined;
    }

    const metadata = await rpc.send("fhevm_relayer_metadata", []);
    
    if (!metadata || typeof metadata !== "object") {
      return undefined;
    }
    
    if (
      "ACLAddress" in metadata &&
      "InputVerifierAddress" in metadata &&
      "KMSVerifierAddress" in metadata
    ) {
      return metadata as any;
    }
  } catch {
    return undefined;
  }
  
  return undefined;
}

export const createFhevmInstance = async (parameters: {
  provider: any;
  mockChains?: Record<number, string>;
  signal: AbortSignal;
}): Promise<FhevmInstance> => {
  const { signal, provider: providerOrUrl, mockChains } = parameters;

  const throwIfAborted = () => {
    if (signal.aborted) throw new FhevmAbortError();
  };

  // Resolve chainId
  const chainId = await getChainId(providerOrUrl);
  
  const _mockChains: Record<number, string> = {
    31337: "http://localhost:8545",
    ...(mockChains ?? {}),
  };

  const rpcUrl =
    typeof providerOrUrl === "string"
      ? providerOrUrl
      : _mockChains[chainId] || "http://localhost:8545";

  const isMock = Object.hasOwn(_mockChains, chainId);

  if (isMock) {
    const fhevmRelayerMetadata = await tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl);

    if (fhevmRelayerMetadata) {
      throwIfAborted();
      
      //////////////////////////////////////////////////////////////////////////
      // 
      // WARNING!!
      // ALWAYS USE DYNAMIC IMPORT TO AVOID INCLUDING THE ENTIRE FHEVM MOCK LIB 
      // IN THE FINAL PRODUCTION BUNDLE!!
      // 
      //////////////////////////////////////////////////////////////////////////
      const fhevmMock = await import("./mock/fhevmMock");
      const mockInstance = await fhevmMock.fhevmMockCreateInstance({
        rpcUrl,
        chainId,
        metadata: fhevmRelayerMetadata,
      });

      throwIfAborted();
      return mockInstance;
    }
  }

  throwIfAborted();

  // For non-mock networks, we need the Relayer SDK
  // This should be loaded via CDN or npm package
  throw new Error(
    "Relayer SDK integration required for non-localhost networks. Please ensure the SDK is loaded."
  );
};

