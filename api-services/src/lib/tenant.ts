import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";
import { getToken } from "next-auth/jwt";

export async function resolveTenantFromRequest(req: NextRequest) {
  const host = req.headers.get("host") || "";
  
  // 1. Check subdomain: {slug}.platform.com (Assuming local dev might just use localhost, so we check custom logic)
  let tenantSlug = null;
  const match = host.match(/^([a-zA-Z0-9-]+)\.platform\.com/);
  if (match && match[1]) {
    tenantSlug = match[1];
  }

  // 2. Fallback: X-Tenant-Slug header
  if (!tenantSlug) {
    tenantSlug = req.headers.get("x-tenant-slug");
  }

  // 3. Fallback: JWT claim tenantSlug
  if (!tenantSlug) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || "" });
    if (token && token.tenantSlug) {
      tenantSlug = token.tenantSlug as string;
    }
  }

  if (!tenantSlug) return null;

  // 4. Validate tenant is active in DB
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug }
  });

  if (!tenant || !tenant.isActive) {
    return null;
  }

  return tenant;
}
