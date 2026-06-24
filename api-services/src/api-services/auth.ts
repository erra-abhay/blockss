import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    if (username.length === 12) {
      const pAdmin = await prisma.platformAdmin.findUnique({ where: { username } });
      if (pAdmin) {
        const isValid = await bcrypt.compare(password, pAdmin.passwordHash);
        if (isValid) {
          const token = jwt.sign(
            { id: pAdmin.id, role: 'PLATFORM_ADMIN', username },
            JWT_SECRET,
            { expiresIn: '1d' }
          );
          return res.json({ token, user: { id: pAdmin.id, role: 'PLATFORM_ADMIN', username } });
        }
      }
    }

    const tUser = await prisma.tenantUser.findUnique({ where: { username } });
    if (tUser) {
      const isValid = await bcrypt.compare(password, tUser.passwordHash);
      if (isValid) {
        const tenant = await prisma.tenant.findUnique({ where: { id: tUser.tenantId } });
        if (!tenant || tenant.status !== 'ACTIVE') return res.status(401).json({ error: 'Tenant inactive or banned' });

        const token = jwt.sign(
          { id: tUser.id, role: tUser.role, tenantId: tUser.tenantId, tenantSlug: tenant.slug, username },
          JWT_SECRET,
          { expiresIn: '1d' }
        );
        return res.json({
          token,
          user: { id: tUser.id, role: tUser.role, tenantId: tUser.tenantId, tenantSlug: tenant.slug, name: tUser.name, username }
        });
      }
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
