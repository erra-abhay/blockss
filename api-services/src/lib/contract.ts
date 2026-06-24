import { ethers } from "ethers";
import { getProvider, getTenantSigner } from "./ethers";

// ABI placeholder: In production, import directly from the generated Hardhat artifact:
// import CertificateRegistryArtifact from "../contracts/artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json";
// Since it may not exist yet, we define the minimal ABI for this app.
const CertificateRegistryABI = [
  "function issueCertificate(bytes32 hash, string tenantId, string recipientId, string courseId, uint256 expiresAt) external",
  "function revokeCertificate(bytes32 hash) external",
  "function verifyCertificate(bytes32 hash) external view returns (tuple(bytes32 hash, string tenantId, string recipientId, string courseId, uint256 issuedAt, uint256 expiresAt, bool revoked, address issuedBy) record, bool isValid)",
  "function addIssuer(address issuer, string tenantId) external"
];

export function getCertificateRegistry(signerOrProvider: ethers.Signer | ethers.Provider) {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error("CONTRACT_ADDRESS missing in env");
  return new ethers.Contract(contractAddress, CertificateRegistryABI, signerOrProvider);
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = 3, backoff = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await sleep(backoff);
    return withRetry(fn, retries - 1, backoff * 2);
  }
}

export async function issueCertificateOnChain(params: {
  tenantSlug: string;
  hash: string;
  recipientId: string;
  courseId: string;
  expiresAt: number;
  encryptedKey: string;
}) {
  return withRetry(async () => {
    const signer = getTenantSigner(params.encryptedKey);
    const contract = getCertificateRegistry(signer);
    
    const tx = await contract.issueCertificate(
      params.hash,
      params.tenantSlug,
      params.recipientId,
      params.courseId,
      params.expiresAt
    );
    
    const receipt = await tx.wait();
    return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
  });
}

export async function revokeCertificateOnChain(params: { hash: string; encryptedKey: string }) {
  return withRetry(async () => {
    const signer = getTenantSigner(params.encryptedKey);
    const contract = getCertificateRegistry(signer);
    
    const tx = await contract.revokeCertificate(params.hash);
    const receipt = await tx.wait();
    return receipt.hash;
  });
}

export async function verifyCertificateOnChain(hash: string) {
  return withRetry(async () => {
    const provider = getProvider();
    const contract = getCertificateRegistry(provider);
    
    const [record, isValid] = await contract.verifyCertificate(hash);
    return {
      record: {
        hash: record.hash,
        tenantId: record.tenantId,
        recipientId: record.recipientId,
        courseId: record.courseId,
        issuedAt: Number(record.issuedAt),
        expiresAt: Number(record.expiresAt),
        revoked: record.revoked,
        issuedBy: record.issuedBy
      },
      isValid
    };
  });
}
