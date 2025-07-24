
'use server';

import { sendVerificationEmail } from "@/lib/email";

// This is a temporary in-memory store for OTPs.
// In a production environment, you should use a more persistent store like Redis or a database table.
const otpStore: Record<string, { code: string; expires: number }> = {};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtpAction({ email, name }: { email: string; name: string }) {
    const otp = generateOtp();
    otpStore[email] = { code: otp, expires: Date.now() + 10 * 60 * 1000 }; // 10 minutes expiry

    // --- DEVELOPMENT CRITICAL STEP ---
    // Log the OTP to the server console FIRST to ensure it's always available for testing.
    console.log(`\n\n--- DEVELOPMENT OTP ---`);
    console.log(`OTP for ${email}: ${otp}`);
    console.log(`-----------------------\n\n`);

    try {
        await sendVerificationEmail({
            to: email,
            name: name,
            otp: otp,
        });

        // If sendVerificationEmail completes without throwing, it means it either sent the email
        // or logged the simulation successfully.
        return { success: true };

    } catch (error) {
        console.error("--- ACTION FAILED TO SEND EMAIL ---", error);
        // Even if sending fails, we return success because the OTP is available in the console for development.
        // This prevents the user flow from being blocked.
        return { success: true, message: "Could not send verification email, but proceeding with console OTP." };
    }
}


export async function verifyOtpAction({ email, otp }: { email: string; otp: string }) {
    const storedOtp = otpStore[email];
    if (storedOtp && storedOtp.code === otp && Date.now() < storedOtp.expires) {
        delete otpStore[email]; // OTP is single-use
        return true;
    }
    return false;
}
