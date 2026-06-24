import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export const certificateQueue = new Queue("certificate-issuance", {
  connection: connection as any,
});

export async function enqueueCertificateIssuance(data: {
  certificateId: string;
  tenantSlug: string;
  tenantId: string;
}) {
  await certificateQueue.add("issue", data);
}
