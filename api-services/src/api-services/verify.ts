import { Router, Request, Response } from 'express';
import { verifyCertificateOnChain } from '../lib/contract';
import { prisma, getTenantPrisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

const router = Router();

router.get('/:hash', async (req: Request, res: Response) => {
  try {
    const hash = req.params.hash as string;
    let chainResult = null;
    try {
      chainResult = await verifyCertificateOnChain(hash);
    } catch (e) {
      return res.status(500).json({ isValid: false, reason: "RPC_ERROR", certificate: null });
    }

    if (!chainResult.record || !chainResult.record.tenantId) {
      return res.json({ isValid: false, reason: "NOT_FOUND", certificate: null });
    }

    const { isValid, record } = chainResult;
    const tenant = await prisma.tenant.findUnique({ where: { id: record.tenantId } });

    if (!tenant) {
      return res.json({ isValid: false, reason: "INVALID_TENANT", certificate: null });
    }
    
    if (tenant.status === 'BANNED') {
      return res.json({ isValid: false, reason: "BANNED", certificate: null });
    }

    const tenantPrisma = getTenantPrisma(tenant.slug);
    const dbCert = await tenantPrisma.certificate.findUnique({ where: { certificateHash: hash } });

    let reason;
    if (!isValid) {
        if (record.revoked) reason = "REVOKED";
        else if (record.expiresAt !== 0 && Date.now() > record.expiresAt * 1000) reason = "EXPIRED";
        else reason = "INVALID";
    }

    res.json({
      isValid,
      onChain: {
        txHash: dbCert?.txHash,
        blockNumber: dbCert?.blockNumber?.toString(),
        issuedAt: record.issuedAt,
        tenantId: record.tenantId
      },
      certificate: dbCert ? {
        recipientName: dbCert.recipientName,
        courseName: dbCert.courseName,
        issueDate: dbCert.issueDate,
        tenantName: tenant.name
      } : null,
      reason
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:hash/pdf', async (req: Request, res: Response) => {
  try {
    const hash = req.params.hash as string;
    
    let chainResult = null;
    try {
      chainResult = await verifyCertificateOnChain(hash);
    } catch (e) {
      return res.status(500).json({ error: "RPC_ERROR" });
    }

    if (!chainResult.record || !chainResult.record.tenantId) {
      return res.status(404).json({ error: 'Certificate not found on chain' });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: chainResult.record.tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    if (tenant.status === 'BANNED') return res.status(403).json({ error: 'Organization has been banned' });

    const tenantPrisma = getTenantPrisma(tenant.slug);
    const certificate = await tenantPrisma.certificate.findUnique({ where: { certificateHash: hash } });
    
    if (!certificate) return res.status(404).json({ error: 'Certificate data not found' });
    if (!certificate.localPdfPath) return res.status(404).json({ error: 'PDF not generated yet' });

    const fullPath = path.resolve(process.cwd(), certificate.localPdfPath);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'PDF file missing' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${certificate.recipientName}-certificate.pdf"`);
    fs.createReadStream(fullPath).pipe(res);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
