import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { resetRequestSchema, validateBody } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 reset requests per IP per 15 minutes
    const ip = getClientIp(request);
    const rl = checkRateLimit(`reset:${ip}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${rl.resetIn} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = validateBody(resetRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { email } = validation.data;

    // Find user by personal email or work email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { personalEmail: email },
          { email: email },
        ],
      },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    // Send reset email
    const targetEmail = email;
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Try to send email via SMTP
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: `"Unitech IT System" <${smtpUser}>`,
        to: targetEmail,
        subject: 'Password Reset - Unitech IT System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a2e;">🔐 Password Reset Request</h2>
            <p>Hi <strong>${user.displayName || user.name}</strong>,</p>
            <p>You requested a password reset for your Unitech IT System account (<strong>${user.username}</strong>).</p>
            <p>Click the button below to reset your password. This link expires in 1 hour.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #10b981; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 11px;">© 2026 Unitech IT System • Singapore</p>
          </div>
        `,
      });
    } else {
      // If SMTP is not configured, log the reset URL (development mode)
      console.log(`\n📧 Password Reset Link for ${user.username}: ${resetUrl}\n`);
    }

    return NextResponse.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Reset request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
