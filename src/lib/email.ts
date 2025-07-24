
import nodemailer from 'nodemailer';

interface OtpEmailPayload {
    to: string;
    name: string;
    otp: string;
}

interface PasswordResetEmailPayload {
    to: string;
    name: string;
    password: string;
}

// NOTE: For this to work, you need to set up an App Password for your Gmail account.
// See: https://support.google.com/accounts/answer/185833
// You also need to add these variables to your .env.local file.
const smtpConfig = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
};

const transporter = nodemailer.createTransport(smtpConfig);

const emailEnabled = !!smtpConfig.auth.user && !!smtpConfig.auth.pass;

export async function sendVerificationEmail({ to, name, otp }: OtpEmailPayload) {
    const mailOptions = {
        from: `"شاليها" <${process.env.EMAIL_SERVER_USER || 'noreply@chaleha.com'}>`,
        to,
        subject: 'رمز التحقق الخاص بك من شاليها',
        html: `
      <div dir="rtl" style="font-family: 'Arial', sans-serif; text-align: right; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logo" alt="شعار شاليها" style="height: 80px;" />
        </div>
        <h2 style="color: #2c3e50;">مرحباً ${name}،</h2>
        <p>شكراً لتسجيلك في شاليها. استخدم الرمز التالي لإكمال عملية التحقق من حسابك كمضيف:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background-color: #f2f2f2; padding: 10px; border-radius: 5px; display: inline-block;">
          ${otp}
        </p>
        <p>هذا الرمز صالح لمدة 10 دقائق.</p>
        <p>إذا لم تطلب هذا، يمكنك تجاهل هذا البريد الإلكتروني بأمان.</p>
        <br>
        <p>مع تحيات،</p>
        <p><strong>فريق شاليها</strong></p>
      </div>
    `,
        attachments: [
            {
                filename: '3.png',
                path: './public/images/3.png', // تأكد أن المسار صحيح
                cid: 'logo',
            },
        ],
    };

    try {
        if (!emailEnabled) {
            console.log("------- EMAIL SIMULATION (OTP) -------");
            console.log("To:", to);
            console.log("OTP:", otp);
            console.log("--------------------------------------");
            return;
        }

        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${to}`);
    } catch (error) {
        console.error(`Failed to send email to ${to}`, error);
        throw new Error('Could not send verification email.');
    }
}

export async function sendPasswordResetEmail({ to, name, password }: PasswordResetEmailPayload) {
    const mailOptions = {
        from: `"شاليها" <${process.env.EMAIL_SERVER_USER || 'noreply@chaleha.com'}>`,
        to,
        subject: 'استعادة كلمة المرور الخاصة بك في شاليها',
        html: `
      <div dir="rtl" style="font-family: 'Arial', sans-serif; text-align: right; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logo" alt="شعار شاليها" style="height: 80px;" />
        </div>
        <h2 style="color: #2c3e50;">مرحباً ${name}،</h2>
        <p>لقد طلبت استعادة كلمة المرور الخاصة بك.</p>
        <p>كلمة مرورك هي:</p>
        <p style="font-size: 22px; font-weight: bold; background-color: #fff; padding: 10px 15px; border: 1px solid #ccc; border-radius: 6px; direction: ltr; display: inline-block;">
          ${password}
        </p>
        <p style="margin-top: 20px;">نوصي بتسجيل الدخول وتغيير كلمة المرور الخاصة بك من إعدادات الملف الشخصي.</p>
        <p style="color: #999;">إذا لم تطلب هذا، يمكنك تجاهل هذا البريد الإلكتروني.</p>
        <br />
        <p>مع تحيات،</p>
        <p><strong>فريق شاليها</strong></p>
      </div>
    `,
        attachments: [
            {
                filename: '3.png',
                path: './public/images/3.png',  // تأكد من المسار الصحيح للصورة على سيرفرك
                cid: 'logo'  // هذا هو المعرف الذي استخدمناه في src الصورة داخل html
            }
        ],
    };

    try {
        if (!emailEnabled) {
            console.log("------- EMAIL SIMULATION (Password Reset) -------");
            console.log("To:", to);
            console.log("Password:", password);
            console.log("-----------------------------------------------");
            return;
        }
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${to}`);
    } catch (error) {
        console.error(`Failed to send password reset email to ${to}:`, error);
        throw new Error('Could not send password reset email.');
    }
}

