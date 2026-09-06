import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

export const initMailer = async () => {
  try {
    transporter = nodemailer.createTransport({
      host: "mailhog",
      port: 1025,
      secure: false,
      ignoreTLS: true
    });
    console.log(`[MAILER] Mailhog Email configured at mailhog:1025`);
  } catch (error) {
    console.error("[MAILER] Failed to configure Mailhog Email", error);
  }
};

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  if (!transporter) {
    console.warn("[MAILER] Transporter not initialized. Call initMailer() first.");
    return;
  }
  
  try {
    const info = await transporter.sendMail({
      from: '"I Love Shopping" <noreply@iloveshopping.com>',
      to,
      subject,
      text,
      html,
    });

    console.log(`[MAILER] Email sent to ${to}`);
  } catch (error) {
    console.error("[MAILER] Failed to send email", error);
  }
};

// Keep existing mock mailer function and update to use Mailhog
export const sendPasswordResetEmail = async (email: string, token: string) => {
  const link = `http://localhost:5173/reset-password?token=${token}`;
  await sendEmail(
    email,
    "Password Reset Request",
    `You requested a password reset. Use this link: ${link}`,
    `<p>You requested a password reset. Click <a href="${link}">here</a> to reset your password.</p>`
  );
};
