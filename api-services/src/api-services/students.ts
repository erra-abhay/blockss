import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AuthRequest, requireAuth, requireTenantAdmin } from '../middleware/auth';

const router = Router();

router.post('/onboard', requireAuth, requireTenantAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const tenantId = req.user!.tenantId;
    
    const username = `${email.split('@')[0]}_${crypto.randomBytes(3).toString('hex')}`;
    const password = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.tenantUser.create({
      data: {
        tenantId,
        username,
        passwordHash,
        name,
        role: "STUDENT"
      }
    });

    res.json({ student: { id: user.id, username, name }, credentials: { username, password } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
