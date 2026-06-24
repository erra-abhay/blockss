import { Router, Response } from 'express';
import { AuthRequest, requireAuth, requireTenantAdmin } from '../middleware/auth';
import { getTenantPrisma, prisma } from '../lib/prisma';
import { generateCertificateHash } from '../lib/hash';
import { enqueueCertificateIssuance } from '../lib/queue';
import { v4 as uuidv4 } from 'uuid';
import { revokeCertificateOnChain, verifyCertificateOnChain } from '../lib/contract';
import fs from 'fs';
import path from 'path';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tenantSlug = req.user!.tenantSlug;
    const tenantPrisma = getTenantPrisma(tenantSlug);
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '10');
    const skip = (page - 1) * limit;

    const certificates = await tenantPrisma.certificate.findMany({
      skip, take: limit, orderBy: { createdAt: 'desc' }
    });
    const totalCount = await tenantPrisma.certificate.count();
    res.json({ certificates, totalCount });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tenantSlug = req.user!.tenantSlug;
    const tenantId = req.user!.tenantId;
    const issuedById = req.user!.id;

    const { recipientName, recipientEmail, courseName, issueDate, expiryDate, templateId, metadata } = req.body;
    if (!recipientName || !recipientEmail || !courseName || !issueDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant || tenant.status === 'PAUSED' || tenant.status === 'BANNED') {
      return res.status(403).json({ error: 'Issuance is currently suspended for this organization' });
    }

    const uuid = uuidv4();
    const certificateHash = generateCertificateHash({
      recipientName, recipientEmail, courseName, issueDate, tenantId, uuid
    });

    const tenantPrisma = getTenantPrisma(tenantSlug);
    await tenantPrisma.certificate.create({
      data: {
        id: uuid, recipientName, recipientEmail, courseName,
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        certificateHash, status: 'PENDING', templateId, metadata, issuedById,
      }
    });

    await enqueueCertificateIssuance({ certificateId: uuid, tenantSlug, tenantId });
    res.status(202).json({ certificateId: uuid, status: 'PENDING' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tenantSlug = req.user!.tenantSlug;
    const tenantPrisma = getTenantPrisma(tenantSlug);
    const certificate = await tenantPrisma.certificate.findUnique({ where: { id: req.params.id as string } });
    
    if (!certificate) return res.status(404).json({ error: 'Not found' });

    let chainStatus = null;
    if (certificate.status === 'ISSUED' || certificate.status === 'REVOKED') {
      try {
        chainStatus = await verifyCertificateOnChain(certificate.certificateHash);
      } catch (e) {
        console.error("Chain verify error", e);
      }
    }
    res.json({ certificate, chainStatus });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', requireAuth, requireTenantAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const tenantSlug = req.user!.tenantSlug;
    const tenantId = req.user!.tenantId;
    const tenantPrisma = getTenantPrisma(tenantSlug);
    const certificate = await tenantPrisma.certificate.findUnique({ where: { id: req.params.id as string } });
    
    if (!certificate || certificate.status !== 'ISSUED') {
      return res.status(400).json({ error: 'Cannot revoke this certificate.' });
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    await revokeCertificateOnChain({ hash: certificate.certificateHash, encryptedKey: tenant.walletEncryptedKey });

    const updated = await tenantPrisma.certificate.update({
      where: { id: req.params.id as string }, data: { status: 'REVOKED' }
    });

    await prisma.auditLog.create({
      data: { tenantId, actorId: req.user!.id, action: 'CERTIFICATE_REVOKED', targetId: req.params.id as string }
    });

    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id/download', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tenantSlug = req.user!.tenantSlug;
    const tenantPrisma = getTenantPrisma(tenantSlug);
    const certificate = await tenantPrisma.certificate.findUnique({ where: { id: req.params.id as string } });
    
    if (!certificate) return res.status(404).json({ error: 'Not found' });
    if (!certificate.localPdfPath) return res.status(404).json({ error: 'PDF not generated yet' });

    const fullPath = path.resolve(process.cwd(), certificate.localPdfPath);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'PDF file missing' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${certificate.recipientName}-certificate.pdf"`);
    fs.createReadStream(fullPath).pipe(res);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/batch', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tenantSlug = req.user!.tenantSlug;

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant || tenant.status === 'PAUSED' || tenant.status === 'BANNED') {
      return res.status(403).json({ error: 'Issuance is currently suspended for this organization' });
    }

    const tenantPrisma = getTenantPrisma(tenantSlug);
    const batchId = uuidv4();
    const batch = await tenantPrisma.issuanceBatch.create({
      data: { id: batchId, name: "Batch Upload " + new Date().toISOString(), status: "PENDING", totalCount: 0, processed: 0, failed: 0 }
    });
    res.json({ batchId: batch.id, totalCount: batch.totalCount });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
