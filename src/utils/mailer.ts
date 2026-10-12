import nodemailer from 'nodemailer';
import dns from 'dns';

let transporter: nodemailer.Transporter | null = null;

const resolveMailHost = async (): Promise<string> => {
  if (process.env.MAILHOG_HOST) return process.env.MAILHOG_HOST;
  if (process.env.SMTP_HOST) return process.env.SMTP_HOST;
  return new Promise((resolve) => {
    dns.lookup('mailhog', (err) => {
      if (!err) {
        resolve('mailhog');
      } else {
        resolve('localhost');
      }
    });
  });
};

export const initMailer = async () => {
  try {
    const host = await resolveMailHost();
    const port = Number(process.env.MAILHOG_PORT || process.env.SMTP_PORT) || 1025;
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      ignoreTLS: true
    });
    console.log(`[MAILER] Mailhog Email configured at ${host}:${port}`);
  } catch (error) {
    console.error("[MAILER] Failed to configure Mailhog Email", error);
  }
};

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  if (!transporter) {
    await initMailer();
  }
  if (!transporter) {
    console.warn("[MAILER] Transporter not initialized. Call initMailer() first.");
    return null;
  }
  
  try {
    const info = await transporter.sendMail({
      from: '"HappyPets Store" <noreply@happypets.com>',
      to,
      subject,
      text,
      html,
    });

    console.log(`[MAILER] Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("[MAILER] Failed to send email", error);
    throw error;
  }
};

export interface ContactEmailPayload {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export const sendContactMessageEmail = async (payload: ContactEmailPayload) => {
  const { name, email, phone, subject, message } = payload;
  const emailSubject = `[Contact Form] ${subject || 'New Support Inquiry from ' + name}`;
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@happypets.com';

  const textContent = `
New Contact Message Received:
----------------------------------------
From: ${name} <${email}>
Phone: ${phone || 'Not provided'}
Subject: ${subject || 'General Inquiry'}

Message:
${message}
----------------------------------------
HappyPets Storefront Contact Form
  `.trim();

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #4338ca; margin: 0 0 6px 0; font-size: 22px;">🐾 New Customer Contact Message</h2>
        <p style="color: #6b7280; margin: 0; font-size: 14px;">Submitted via the HappyPets Contact / Support form.</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; width: 100px;"><strong>Name:</strong></td>
          <td style="padding: 8px 0; color: #111827; font-weight: 600;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;"><strong>Email:</strong></td>
          <td style="padding: 8px 0; color: #4338ca;"><a href="mailto:${email}" style="color: #4338ca; text-decoration: none;">${email}</a></td>
        </tr>
        ${phone ? `<tr>
          <td style="padding: 8px 0; color: #6b7280;"><strong>Phone:</strong></td>
          <td style="padding: 8px 0; color: #111827;">${phone}</td>
        </tr>` : ''}
        ${subject ? `<tr>
          <td style="padding: 8px 0; color: #6b7280;"><strong>Subject:</strong></td>
          <td style="padding: 8px 0; color: #111827; font-weight: 600;">${subject}</td>
        </tr>` : ''}
      </table>

      <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
        <strong style="display: block; margin-bottom: 8px; color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Message Content:</strong>
        <p style="margin: 0; color: #1f2937; white-space: pre-wrap; line-height: 1.6; font-size: 15px;">${message}</p>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
        HappyPets Customer Support System • MailHog Inbox
      </div>
    </div>
  `;

  // 1. Send notification to support team / admin inbox in MailHog
  const supportMail = await sendEmail(supportEmail, emailSubject, textContent, htmlContent);

  // 2. Send customer confirmation receipt so customer's email also receives a copy in MailHog
  try {
    const customerSubject = `We received your message, ${name}! - HappyPets Support`;
    const customerText = `Hello ${name},\n\nThank you for reaching out to HappyPets! We have received your message regarding "${subject || 'Support Inquiry'}" and our support team is reviewing it. We will reply back within 24 hours.\n\nYour message:\n"${message}"\n\nWarm regards,\nThe HappyPets Team`;
    const customerHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #4338ca; margin-top: 0;">Thank you for contacting HappyPets! 🐾</h2>
        <p style="color: #374151; font-size: 15px;">Hi <strong>${name}</strong>,</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.5;">We received your message and our team will get back to you as quickly as possible (usually within 24 business hours).</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
          <p style="margin: 0; font-size: 13px; color: #6b7280; font-weight: 600;">COPY OF YOUR MESSAGE:</p>
          <p style="margin: 8px 0 0 0; color: #1f2937; white-space: pre-wrap; font-size: 14px; line-height: 1.5;">${message}</p>
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">Best regards,<br/><strong style="color: #111827;">HappyPets Customer Support Team</strong></p>
      </div>
    `;
    await sendEmail(email, customerSubject, customerText, customerHtml);
  } catch (err) {
    console.warn('[MAILER] Customer receipt send failed (non-critical):', err);
  }

  return supportMail;
};

// Keep existing mock mailer function and update to use Mailhog
export const sendPasswordResetEmail = async (email: string, token: string) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const link = `${clientUrl}/reset-password?token=${token}`;
  await sendEmail(
    email,
    "Password Reset Request",
    `You requested a password reset. Use this link: ${link}`,
    `<p>You requested a password reset. Click <a href="${link}">here</a> to reset your password.</p>`
  );
};
