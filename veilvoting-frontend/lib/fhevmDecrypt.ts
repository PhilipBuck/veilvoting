/**
 * Simplified FHEVM Decryption Helper
 * Based on frontend/fhevm/FhevmDecryptionSignature.ts
 */

import { ethers } from "ethers";
import type { FhevmInstance } from "../fhevm/fhevmTypes";

export interface DecryptionSignature {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number;
  durationDays: number;
  userAddress: string;
  contractAddresses: string[];
}

/**
 * Create and sign EIP-712 message for FHEVM decryption
 */
export async function createDecryptionSignature(
  instance: FhevmInstance,
  contractAddress: string,
  signer: ethers.Signer
): Promise<DecryptionSignature> {
  const userAddress = await signer.getAddress();
  const startTimestamp = Math.floor(Date.now() / 1000);
  const durationDays = 365;

  // Generate keypair for decryption
  const { publicKey, privateKey } = instance.generateKeypair();

  // Create EIP-712 message
  const eip712 = instance.createEIP712(
    publicKey,
    [contractAddress],
    startTimestamp,
    durationDays
  );

  // Sign the message
  const signature = await signer.signTypedData(
    eip712.domain,
    { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    eip712.message
  );

  return {
    publicKey,
    privateKey,
    signature,
    startTimestamp,
    durationDays,
    userAddress,
    contractAddresses: [contractAddress],
  };
}

/**
 * Decrypt FHEVM handles
 */
export async function decryptHandles(
  instance: FhevmInstance,
  handles: Array<{ handle: string; contractAddress: string }>,
  sig: DecryptionSignature
): Promise<Record<string, bigint>> {
  const result = await instance.userDecrypt(
    handles,
    sig.privateKey,
    sig.publicKey,
    sig.signature,
    sig.contractAddresses,
    sig.userAddress,
    sig.startTimestamp,
    sig.durationDays
  );

  return result;
}



