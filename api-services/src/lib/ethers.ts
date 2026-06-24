import crypto from "crypto";
import { ethers } from "ethers";

const ALGORITHM = "aes-256-cbc";
const MASTER_KEY = process.env.MASTER_ENCRYPTION_KEY || "12345678901234567890123456789012";

// Make sure key is exactly 32 bytes
const ENCRYPTION_KEY = Buffer.from(MASTER_KEY.padEnd(32, "0").substring(0, 32), "utf-8");

export function encryptKey(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decryptKey(text: string): string {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift()!, "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export function getProvider() {
  const rpcUrl = process.env.BESU_RPC_URL || "http://127.0.0.1:1603";
  return new ethers.JsonRpcProvider(rpcUrl);
}

export function getPlatformSigner() {
  const provider = getProvider();
  const privateKey = process.env.PLATFORM_WALLET_PRIVATE_KEY;
  if (!privateKey) throw new Error("PLATFORM_WALLET_PRIVATE_KEY is missing in env");
  return new ethers.Wallet(privateKey, provider);
}

export function getTenantSigner(encryptedKey: string) {
  const provider = getProvider();
  const privateKey = decryptKey(encryptedKey);
  return new ethers.Wallet(privateKey, provider);
}
