import { ethers } from "ethers";

export interface HashData {
  recipientName: string;
  recipientEmail: string;
  courseName: string;
  issueDate: string;
  tenantId: string;
  uuid: string;
}

export function generateCertificateHash(data: HashData): string {
  // Sort keys to ensure consistent JSON stringification
  const sortedData = {
    courseName: data.courseName,
    issueDate: data.issueDate,
    recipientEmail: data.recipientEmail,
    recipientName: data.recipientName,
    tenantId: data.tenantId,
    uuid: data.uuid,
  };
  
  const jsonString = JSON.stringify(sortedData);
  const bytes = ethers.toUtf8Bytes(jsonString);
  return ethers.keccak256(bytes);
}
