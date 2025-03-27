import { Resend } from 'resend';
import { singleton } from 'tsyringe';
import constants from '../config/constants';

/**
 * Email service for sending emails using Resend.com
 */
@singleton()
export class EmailService {
  constructor() {
    // Initialize Resend with API key from environment variables
    this.resend = new Resend(constants.EMAIL.RESEND_API_KEY || 'xxxx');
  }

  /**
   * Send an email using Resend.com
   * @param to Recipient email address
   * @param subject Email subject
   * @param html HTML content of the email
   * @param from Optional sender email address
   * @returns Result of the email sending operation
   */
  public async sendEmail({
    to,
    subject,
    html,
    from = constants.EMAIL.DEFAULT_FROM_EMAIL,
  }: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
  }) {
    try {
      const { data, error } = await this.resend.emails.send({
        from,
        to,
        subject,
        html,
      });

      if (error) {
        console.error('Email sending failed:', error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }

  /**
   * Send a verification email for BetterAuth
   * @param user User object containing email
   * @param url Verification URL
   * @param token Verification token
   */
  public async sendVerificationEmail({
    user,
    url,
    token,
  }: {
    user: { email: string; name?: string };
    url: string;
    token: string;
  }) {
    const subject = 'Verify your email address';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Hello ${user.name || 'there'},</p>
        <p>Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Verify Email
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p>${url}</p>
        <p>If you didn't request this verification, you can safely ignore this email.</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  /**
   * Send a password reset email
   * @param user User object containing email
   * @param url Reset password URL
   * @param token Reset token
   */
  public async sendPasswordResetEmail({
    user,
    url,
    token,
  }: {
    user: { email: string; name?: string };
    url: string;
    token: string;
  }) {
    const subject = 'Reset your password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>Hello ${user.name || 'there'},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p>${url}</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }
  
  private resend: Resend;
}
