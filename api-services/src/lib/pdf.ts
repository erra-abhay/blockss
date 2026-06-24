import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export interface CertificateData {
  recipientName: string;
  courseName: string;
  issueDate: string;
  expiryDate?: string;
  certificateHash: string;
  tenantName: string;
  tenantLogoUrl?: string;
  verificationUrl: string;
}

export async function generateAndSaveCertificatePDF(params: {
  certificateId: string;
  tenantSlug: string;
  templateHtml: string;
  data: CertificateData;
}) {
  const { certificateId, tenantSlug, templateHtml, data } = params;

  // Compile Handlebars
  const template = handlebars.compile(templateHtml);
  
  // Generate QR Code
  const qrCodeDataUrl = await QRCode.toDataURL(data.verificationUrl);
  
  // Render HTML
  const html = template({
    ...data,
    qrCode: qrCodeDataUrl
  });

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Ensure directory exists
  const storageDir = path.join(process.cwd(), 'storage', 'certificates', tenantSlug);
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const filename = `${certificateId}.pdf`;
  const localPath = path.join(storageDir, filename);

  // Print PDF
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
  });

  await browser.close();

  fs.writeFileSync(localPath, pdfBuffer);

  return {
    localPath: `storage/certificates/${tenantSlug}/${filename}`,
    filename
  };
}
