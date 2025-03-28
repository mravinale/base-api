import 'reflect-metadata';
import { Resend, type CreateEmailOptions, type CreateEmailResponse } from 'resend';
import { singleton, inject } from 'tsyringe';
import { Logger } from './Logger';
import constants from '../config/constants';

/**
 * Email service for sending emails using Resend.com
 */
@singleton()
export class EmailService {
  // Inject Resend instance instead of creating it here
  constructor(@inject('ResendClient') private readonly resend: Resend) {
    Logger.info('Email service initialized.');
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
      Logger.info(`Attempting to send email. To: ${to}, Subject: ${subject}`);
      const { data, error } = await this.resend.emails.send({
        from,
        to,
        subject,
        html,
      });

      if (error) {
        Logger.error('Email sending failed:', error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      Logger.info(`Email sent successfully. To: ${to}, ID: ${data?.id}`);
      return data;
    } catch (error) {
      Logger.error('Email service error:', error);
      throw error;
    }
  }

  /**
   * Send a verification email for BetterAuth
   * @param user User object containing email
   * @param url Verification URL (including token)
   * @param token Verification token (optional, might not be needed if included in url)
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
    const html =
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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

    try {
      await this.sendEmail({
        to: user.email,
        subject,
        html,
      });
      Logger.info(`Verification email sent to ${user.email}`);
    } catch (error) {
      Logger.error(`Error sending verification email to ${user.email}:`, error);
    }
  }

  /**
   * Send a password reset email
   * @param user User object containing email
   * @param url Reset password URL (including token)
   * @param token Reset token (optional, might not be needed if included in url)
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
    const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
      </div>`;

    try {
      await this.sendEmail({
        to: user.email,
        subject,
        html,
      });
      Logger.info(`Password reset email sent to ${user.email}`);
    } catch (error) {
      Logger.error(`Error sending password reset email to ${user.email}:`, error);
      throw error;
    }
  }
}
