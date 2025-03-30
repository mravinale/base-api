import 'reflect-metadata';
import { expect } from 'chai'; 
import * as sinon from 'sinon';
import { Resend } from 'resend'; 
import { EmailService } from '@infrastructure/utils/EmailService'; 
import { Logger } from '@infrastructure/utils/Logger'; 
import constants from '@infrastructure/config/constants'; 

describe('EmailService', () => {
    let emailService: EmailService;
    let mockResend: sinon.SinonStubbedInstance<Resend>; // Use stubbed instance type
    let resendSendStub: sinon.SinonStub;
    let loggerInfoStub: sinon.SinonStub;
    let loggerErrorStub: sinon.SinonStub;

    // Store original values to restore them later
    const originalApiKey = constants.EMAIL.RESEND_API_KEY;
    const originalFromEmail = constants.EMAIL.DEFAULT_FROM_EMAIL;

    // Define test constants
    const testApiKey = 're_test_123456789';
    const testFromEmail = 'test@example.com';
    const testToEmail = 'recipient@example.com';
    const testName = 'Test User';
    const testVerificationUrl = 'http://localhost:3000/verify?token=verification_token_123';
    const testVerificationToken = 'verification_token_123';
    const testResetUrl = 'http://localhost:3000/reset?token=reset_token_456'; 
    const testResetToken = 'reset_token_456'; 

    beforeEach(() => { 
        // Set constants for the test environment
        constants.EMAIL.RESEND_API_KEY = testApiKey;
        constants.EMAIL.DEFAULT_FROM_EMAIL = testFromEmail;

        // Stub Logger methods
        loggerInfoStub = sinon.stub(Logger, 'info');
        loggerErrorStub = sinon.stub(Logger, 'error');

        // Create a stub for the Resend client's send method
        resendSendStub = sinon.stub();
        // Create a mock Resend object with the stubbed send method
        // Note: We cast to `any` because we only need to mock the `emails.send` part
        mockResend = { emails: { send: resendSendStub } } as any;

        // Instantiate EmailService with the mocked Resend client
        emailService = new EmailService(mockResend as Resend); 
    });

    afterEach(() => { 
        // Restore original constant values
        constants.EMAIL.RESEND_API_KEY = originalApiKey;
        constants.EMAIL.DEFAULT_FROM_EMAIL = originalFromEmail;

        // Restore all Sinon stubs/spies/mocks
        sinon.restore();
    });

    // Test 1: Initialization Logging
    it('should log initialization upon creation', () => {
        // Assert
        // The constructor is called in beforeEach, so we just check the stub here.
        sinon.assert.calledOnce(loggerInfoStub);
        sinon.assert.calledWith(loggerInfoStub, 'Email service initialized.');
    });

    // Suite for sendVerificationEmail
    describe('sendVerificationEmail', () => {
        // Define arguments and expected payload for these tests
        const verificationArgs = {
            user: { email: testToEmail, name: testName },
            url: testVerificationUrl,
            token: testVerificationToken,
        };

        // Test 2: Successful Verification Email
        it('should call resend.emails.send with correct params and log success', async () => {
            // Arrange: Configure the stub to resolve successfully
            resendSendStub.resolves({ data: { id: 'mock_email_id' }, error: null });

            // Act: Call the method under test
            await emailService.sendVerificationEmail(verificationArgs);

            // Assert: Check if resend.emails.send was called correctly
            // Use sinon.match for html to allow any string, matching the simplified payload
            sinon.assert.calledWith(resendSendStub, sinon.match({
                from: testFromEmail,
                to: testToEmail,
                subject: 'Verify your email address',
                html: sinon.match.string // Match any string for HTML
            }));

            // Assert: Check for correct logging
            // Check the log for attempting to send
            sinon.assert.calledWith(
                loggerInfoStub,
                `Attempting to send email. To: ${testToEmail}, Subject: Verify your email address`
            );
            // Check the log for successful sending (from the private sendEmail method)
            sinon.assert.calledWith(
                loggerInfoStub,
                `Email sent successfully. To: ${testToEmail}, ID: mock_email_id`
            );
            // Check the final log specific to verification email
            sinon.assert.calledWith(loggerInfoStub, `Verification email sent to ${testToEmail}`);
            // Ensure no error logs were called
            sinon.assert.notCalled(loggerErrorStub);
        });

        // Test 3: Verification Email - Generic Send Failure (rejects)
        it('should log errors correctly when resend.emails.send rejects', async () => {
            // Arrange: Configure the stub to reject with a generic error
            const sendError = new Error('Network failure');
            resendSendStub.rejects(sendError);

            // Act: Call the method under test
            await emailService.sendVerificationEmail(verificationArgs);

            // Assert: Check for correct error logging
            // Check the log from the private sendEmail method's catch block
            sinon.assert.calledWith(
                loggerErrorStub, 
                'Email service error:', // Prefix
                sendError             // Error object
            );
            // Check the log from the sendVerificationEmail method's catch block
            sinon.assert.calledWith(
                loggerErrorStub,
                `Error sending verification email to ${testToEmail}:`, // Prefix
                sendError                                          // Error object
            );
            
            // Assert: Ensure the success-specific log was not called
            sinon.assert.neverCalledWith(loggerInfoStub, `Verification email sent to ${testToEmail}`);
            
            // Assert: Check that the initial attempt log was still called
            sinon.assert.calledWith(
                loggerInfoStub,
                `Attempting to send email. To: ${testToEmail}, Subject: Verify your email address`
            );
        });

        // Test 4: Verification Email - Resend API Error (resolves with error object)
        it('should log errors correctly when resend returns an error object', async () => {
            // Arrange: Define a mock Resend error and configure the stub
            const resendError = { name: 'validation_error', message: 'Invalid \'to\' address' };
            resendSendStub.resolves({ data: null, error: resendError });

            // Act: Call the method under test
            await emailService.sendVerificationEmail(verificationArgs);

            // Assert: Check for correct error logging
            // Check the log from the private sendEmail method's if (response.error) block
            sinon.assert.calledWith(
                loggerErrorStub,
                'Email sending failed:', // Prefix from sendEmail
                resendError             // The original error object from Resend
            );
            // Check the log from the sendVerificationEmail method's catch block
            // This catches the *new* error thrown by sendEmail
            sinon.assert.calledWith(
                loggerErrorStub,
                `Error sending verification email to ${testToEmail}:`, // Prefix from sendVerificationEmail
                sinon.match.instanceOf(Error)                       // Match any Error object
                       .and(sinon.match.has('message', `Failed to send email: ${resendError.message}`)) // Match the specific message of the *new* error
            );

            // Assert: Ensure the success-specific log was not called
            sinon.assert.neverCalledWith(loggerInfoStub, `Verification email sent to ${testToEmail}`);

            // Assert: Check that the initial attempt log was still called
            sinon.assert.calledWith(
                loggerInfoStub,
                `Attempting to send email. To: ${testToEmail}, Subject: Verify your email address`
            );
        });

        // --- More verification email tests will follow ---

    });

    // --- Suite for sendPasswordResetEmail ---
    describe('sendPasswordResetEmail', () => {
        // Define arguments and expected payload for these tests
        const resetArgs = {
            user: { email: testToEmail, name: testName },
            url: testResetUrl,
            token: testResetToken,
        };

        const expectedResetPayload = {
            from: testFromEmail,
            to: testToEmail,
            subject: 'Reset your password',
            html: 
`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
` +
`        <h2>Password Reset</h2>
` +
`        <p>Hello ${testName},</p>
` +
`        <p>We received a request to reset your password. Click the button below to create a new password:</p>
` +
`        <div style="text-align: center; margin: 30px 0;">
` +
`          <a href="${testResetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
` +
`            Reset Password
` +
`          </a>
` +
`        </div>
` +
`        <p>Or copy and paste this link in your browser:</p>
` +
`        <p>${testResetUrl}</p>
` +
`        <p>If you didn't request a password reset, you can safely ignore this email.</p>
` +
`      </div>
    `,
        };

        // Test 5: Successful Password Reset Email
        it('should call resend.emails.send with correct params and log success', async () => {
            // Arrange
            resendSendStub.resolves({ data: { id: 'mock_reset_id' }, error: null });

            // Act
            await emailService.sendPasswordResetEmail(resetArgs);

            // Assert: Check send call
            sinon.assert.calledWith(resendSendStub, sinon.match({
                from: testFromEmail,
                to: testToEmail,
                subject: expectedResetPayload.subject,
                html: sinon.match.string // Match any string for HTML
            }));

            // Assert: Check logging
            sinon.assert.calledWith(
                loggerInfoStub,
                `Attempting to send email. To: ${testToEmail}, Subject: ${expectedResetPayload.subject}`
            );
            sinon.assert.calledWith(
                loggerInfoStub,
                `Email sent successfully. To: ${testToEmail}, ID: mock_reset_id`
            );
            sinon.assert.calledWith(loggerInfoStub, `Password reset email sent to ${testToEmail}`);
            sinon.assert.notCalled(loggerErrorStub);
        });

        // Test 6: Password Reset Email - Network Error (rejects)
        it('should log errors correctly when resend.emails.send rejects', async () => {
            // Arrange: Define an error and configure the stub to reject
            const sendError = new Error('Network failure during reset');
            resendSendStub.rejects(sendError);

            // Act: Call the method under test and expect it to reject
            try {
                await emailService.sendPasswordResetEmail(resetArgs);
                // If the above line does not throw, the test should fail
                throw new Error('sendPasswordResetEmail should have rejected but resolved instead.');
            } catch (error) {
                // Assert: Check that the caught error is the expected one
                expect(error).to.equal(sendError);

                // Assert: Check for correct error logging AFTER catching the error
                // Check the log from the private sendEmail method's catch block
                sinon.assert.calledWith(
                    loggerErrorStub,
                    'Email service error:',
                    sendError
                );
                // Check the log from the sendPasswordResetEmail method's catch block
                sinon.assert.calledWith(
                    loggerErrorStub,
                    `Error sending password reset email to ${testToEmail}:`,
                    sendError
                );

                // Assert: Ensure the success-specific log was not called
                sinon.assert.neverCalledWith(loggerInfoStub, `Password reset email sent to ${testToEmail}`);

                // Assert: Check that the initial attempt log was still called
                sinon.assert.calledWith(
                    loggerInfoStub,
                    `Attempting to send email. To: ${testToEmail}, Subject: ${expectedResetPayload.subject}`
                );
            }
        });

        // Test 7: Password Reset Email - Resend API Error (resolves with error object)
        it('should log errors correctly and throw when resend returns an error object', async () => {
            // Arrange: Define a mock Resend error and configure the stub
            const resendError = { name: 'api_error', message: 'Missing API key' };
            resendSendStub.resolves({ data: null, error: resendError });

            // Act & Assert: Call the method and expect it to throw
            try {
                await emailService.sendPasswordResetEmail(resetArgs);
                throw new Error('sendPasswordResetEmail should have thrown but resolved instead.');
            } catch (error) {
                // Assert: Check the caught error (the one thrown by sendEmail)
                expect(error).to.be.instanceOf(Error);
                expect((error as Error).message).to.equal(`Failed to send email: ${resendError.message}`);

                // Assert: Check for correct error logging AFTER catching the error
                // Check the log from the private sendEmail method's if (response.error) block
                sinon.assert.calledWith(
                    loggerErrorStub,
                    'Email sending failed:', // Prefix from sendEmail
                    resendError             // The original error object from Resend
                );
                // Check the log from the sendPasswordResetEmail method's catch block
                sinon.assert.calledWith(
                    loggerErrorStub,
                    `Error sending password reset email to ${testToEmail}:`, // Prefix from sendPasswordResetEmail
                    error                   // The new Error object caught by the test
                );

                // Assert: Ensure the success-specific log was not called
                sinon.assert.neverCalledWith(loggerInfoStub, `Password reset email sent to ${testToEmail}`);

                 // Assert: Check that the initial attempt log was still called
                sinon.assert.calledWith(
                    loggerInfoStub,
                    `Attempting to send email. To: ${testToEmail}, Subject: ${expectedResetPayload.subject}`
                );
            }
        });

        // --- End of password reset email tests ---

    });

});