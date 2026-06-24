import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { getTenantPrisma, prisma } from '../lib/prisma';
import { generateAndSaveCertificatePDF } from '../lib/pdf';
import { issueCertificateOnChain } from '../lib/contract';
import { sendCertificateEmail } from '../lib/mailer';
import path from 'path';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const worker = new Worker(
  'certificate-issuance',
  async (job) => {
    const { certificateId, tenantSlug, tenantId } = job.data;
    
    console.log(`Processing job for certificate ${certificateId} (tenant: ${tenantSlug})`);

    const tenantPrisma = getTenantPrisma(tenantSlug);

    const certificate = await tenantPrisma.certificate.findUnique({
      where: { id: certificateId }
    });

    if (!certificate) throw new Error("Certificate not found");

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) throw new Error("Tenant not found");

    let templateHtml = `
      <html>
        <head><style>body { font-family: sans-serif; text-align: center; padding: 50px; }</style></head>
        <body>
          <h1>Certificate of Completion</h1>
          <p>This is to certify that</p>
          <h2>{{recipientName}}</h2>
          <p>has successfully completed the course</p>
          <h3>{{courseName}}</h3>
          <p>Issued on: {{issueDate}}</p>
          <img src="{{qrCode}}" width="150" height="150" />
        </body>
      </html>
    `;

    if (certificate.templateId) {
      const dbTemplate = await tenantPrisma.template.findUnique({
        where: { id: certificate.templateId }
      });
      if (dbTemplate) templateHtml = dbTemplate.htmlContent;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/verify/${certificate.certificateHash}`;

    // 2. Generate PDF
    const { localPath } = await generateAndSaveCertificatePDF({
      certificateId,
      tenantSlug,
      templateHtml,
      data: {
        recipientName: certificate.recipientName,
        courseName: certificate.courseName,
        issueDate: certificate.issueDate.toDateString(),
        certificateHash: certificate.certificateHash,
        tenantName: tenant.name,
        verificationUrl
      }
    });

    await tenantPrisma.certificate.update({
      where: { id: certificateId },
      data: { localPdfPath: localPath }
    });

    // 3. Issue on chain
    let onChain;
    try {
      onChain = await issueCertificateOnChain({
        tenantSlug,
        hash: certificate.certificateHash,
        recipientId: certificate.recipientEmail,
        courseId: certificate.courseName,
        expiresAt: certificate.expiryDate ? Math.floor(certificate.expiryDate.getTime() / 1000) : 0,
        encryptedKey: tenant.walletEncryptedKey
      });
    } catch (e) {
      console.error("Blockchain error:", e);
      throw new Error("Failed to issue on chain");
    }

    // 4. Update status
    await tenantPrisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: 'ISSUED',
        txHash: onChain.txHash,
        blockNumber: BigInt(onChain.blockNumber)
      }
    });

    // 5. Send email
    const fullPdfPath = path.join(process.cwd(), localPath);
    try {
      await sendCertificateEmail(certificate.recipientEmail, fullPdfPath, verificationUrl);
    } catch (e) {
      console.error("Email send failed:", e);
      // We don't fail the job if email fails, as blockchain tx succeeded.
    }

    // 6. Write AuditLog
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorId: 'system',
        action: 'CERTIFICATE_ISSUED',
        targetId: certificateId
      }
    });

    console.log(`Successfully issued certificate ${certificateId}`);
  },
  { connection }
);

worker.on('failed', async (job, err) => {
  if (job) {
    console.error(`Job ${job.id} failed: ${err.message}`);
    const { certificateId, tenantSlug } = job.data;
    try {
      const tenantPrisma = getTenantPrisma(tenantSlug);
      await tenantPrisma.certificate.update({
        where: { id: certificateId },
        data: { status: 'FAILED' }
      });
    } catch (e) {
      console.error("Failed to update status on error", e);
    }
  }
});

console.log("Certificate Worker started");
