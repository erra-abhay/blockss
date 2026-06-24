import { Router, Request, Response } from 'express';
import { prisma, runMigrationForTenant } from '../lib/prisma';
import { encryptKey, getPlatformSigner } from '../lib/ethers';
import { ethers } from 'ethers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getCertificateRegistry } from '../lib/contract';
import { requireAuth, requirePlatformAdmin } from '../middleware/auth';

const router = Router();

router.post('/register', requireAuth, requirePlatformAdmin, async (req: Request, res: Response) => {
  try {
    const { orgName, slug, shortName } = req.body;
    if (!orgName || !slug || !shortName) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) return res.status(400).json({ error: 'Slug in use' });

    const randomPrefix = crypto.randomBytes(6).toString('hex'); // 12 chars
    const username = `${randomPrefix}${shortName.toUpperCase()}`;
    const password = crypto.randomBytes(12).toString('base64');
    
    const wallet = ethers.Wallet.createRandom();
    const encryptedKey = encryptKey(wallet.privateKey);
    const passwordHash = await bcrypt.hash(password, 10);

    const tenant = await prisma.tenant.create({
      data: {
        name: orgName,
        slug,
        shortName: shortName.toUpperCase(),
        walletAddress: wallet.address,
        walletEncryptedKey: encryptedKey,
      }
    });

    await prisma.tenantUser.create({
      data: {
        tenantId: tenant.id,
        username,
        passwordHash,
        name: "Tenant Admin",
        role: "TENANT_ADMIN"
      }
    });

    await runMigrationForTenant(slug);

    try {
      const platformSigner = getPlatformSigner();
      const registry = getCertificateRegistry(platformSigner);
      const tx = await registry.addIssuer(wallet.address, tenant.id);
      await tx.wait();
    } catch (e) {
      console.error("Blockchain issuer registration failed", e);
    }

    res.json({ 
      tenantId: tenant.id, 
      slug, 
      walletAddress: wallet.address,
      adminCredentials: { username, password } 
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Platform Admin Organization & User Management ---

router.get('/', requireAuth, requirePlatformAdmin, async (req: Request, res: Response) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        users: {
          select: { id: true, name: true, username: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch certificate counts for each tenant
    const tenantsWithCounts = await Promise.all(tenants.map(async (t) => {
      let certCount = 0;
      try {
        const tenantPrisma = require('../lib/prisma').getTenantPrisma(t.slug);
        certCount = await tenantPrisma.certificate.count();
      } catch (e) {
        // Schema might not exist yet if it failed midway
      }
      return { ...t, certificateCount: certCount };
    }));

    res.json(tenantsWithCounts);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', requireAuth, requirePlatformAdmin, async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id as string },
      include: {
        users: {
          select: { id: true, name: true, username: true, role: true }
        }
      }
    });

    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    let certCount = 0;
    try {
      const tenantPrisma = require('../lib/prisma').getTenantPrisma(tenant.slug);
      certCount = await tenantPrisma.certificate.count();
    } catch (e) {
      // Ignore if schema issue
    }

    res.json({ ...tenant, certificateCount: certCount });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id/status', requireAuth, requirePlatformAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'PAUSED', 'BANNED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id as string },
      data: { status }
    });
    res.json(tenant);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/users', requireAuth, requirePlatformAdmin, async (req: Request, res: Response) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id as string } });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const username = `${email.split('@')[0]}_${crypto.randomBytes(3).toString('hex')}`;
    const password = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.tenantUser.create({
      data: {
        tenantId: tenant.id,
        username,
        passwordHash,
        name,
        role
      }
    });

    res.json({ user: { id: user.id, username, name, role }, credentials: { username, password } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id/users/:userId', requireAuth, requirePlatformAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.tenantUser.delete({
      where: { id: req.params.userId as string, tenantId: req.params.id as string }
    });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id/users/:userId/password', requireAuth, requirePlatformAdmin, async (req: Request, res: Response) => {
  try {
    const newPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await prisma.tenantUser.update({
      where: { id: req.params.userId as string, tenantId: req.params.id as string },
      data: { passwordHash }
    });
    res.json({ success: true, newPassword });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
