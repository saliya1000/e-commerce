import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

export const initMailer = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    console.log(`[MAILER] Ethereal Email configured. User: ${testAccount.user}`);
  } catch (error) {
    console.error("[MAILER] Failed to configure Ethereal Email", error);
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
    console.log("Email Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("[MAILER] Failed to send email", error);
  }
};

// Keep existing mock mailer function and update to use Ethereal
export const sendPasswordResetEmail = async (email: string, token: string) => {
  const link = `http://localhost:5173/reset-password?token=${token}`;
  await sendEmail(
    email,
    "Password Reset Request",
    `You requested a password reset. Use this link: ${link}`,
    `<p>You requested a password reset. Click <a href="${link}">here</a> to reset your password.</p>`
  );
};
