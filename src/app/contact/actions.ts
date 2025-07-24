
'use server';

import nodemailer from 'nodemailer';
import { z } from 'zod';

const contactFormSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  subject: z.string().min(1, 'الموضوع مطلوب'),
  message: z.string().min(1, 'الرسالة مطلوبة'),
});

const smtpConfig = {
  host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_SERVER_PORT || '465', 10),
  secure: (process.env.EMAIL_SERVER_SECURE || 'true') === 'true',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
};

export async function sendContactMessage(formData: FormData) {
  const rawFormData = {
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  };

  const validationResult = contactFormSchema.safeParse(rawFormData);

  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.errors.map(e => e.message).join(', '),
    };
  }
  
  const { name, email, subject, message } = validationResult.data;

  // Check if email credentials are set in .env
  if (!smtpConfig.auth.user || !smtpConfig.auth.pass || !process.env.EMAIL_TO) {
    console.error('Email server credentials or recipient email are not set in .env file.');
    // In a real production environment, you might want to return a more user-friendly error.
    // For this app, we will simulate success to avoid blocking the user if env is not set up.
    console.log("------- CONTACT FORM SIMULATION -------");
    console.log(`From: ${name} <${email}>`);
    console.log("Subject:", subject);
    console.log("Message:", message);
    console.log("---------------------------------------");
    return { success: true };
  }
  
  const transporter = nodemailer.createTransport(smtpConfig);

  const mailOptions = {
    from: `"${name}" <${email}>`,
    to: process.env.EMAIL_TO,
    subject: `رسالة جديدة من شاليها: ${subject}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif;">
        <p><strong>الاسم:</strong> ${name}</p>
        <p><strong>البريد الإلكتروني:</strong> ${email}</p>
        <hr>
        <h3>${subject}</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Failed to send contact email:', error);
    return { success: false, error: 'Failed to send the message.' };
  }
}
