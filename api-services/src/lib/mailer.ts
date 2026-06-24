import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendCertificateEmail(to: string, pdfPath: string, verificationUrl: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@certplatform.com',
    to,
    subject: 'Your Certificate is Ready',
    text: `Congratulations! Your certificate is attached.\n\nYou can verify it online here: ${verificationUrl}`,
    attachments: [
      {
        filename: 'certificate.pdf',
        path: pdfPath
      }
    ]
  };

  return transporter.sendMail(mailOptions);
}
