import 'reflect-metadata';
import { expect } from 'chai';
import sinon from 'sinon';
import { container } from 'tsyringe';
import { authConfig } from '@infrastructure/config/authConfiguration';
import constants from '@infrastructure/config/constants';

// Mock EmailService methods
const mockEmailService = {
    sendVerificationEmail: sinon.stub().resolves(),
    sendPasswordResetEmail: sinon.stub().resolves(),
};

describe('Auth Configuration Unit Tests', () => {
    // Restore sinon stubs/mocks after each test
    afterEach(() => {
        sinon.restore();
    });

    // Setup mocks before each test
    beforeEach(() => {
        // Mock tsyringe container resolution for EmailService
        sinon.stub(container, 'resolve').returns(mockEmailService);
    });

    // Test 1: Basic Configuration Structure and Properties
    it('should have the correct basic configuration structure and properties for test env', () => {
        // Assertions based on the actual structure of authConfig
        expect(authConfig.adapter).to.not.equal(undefined);
        
        // Don't test the exact secret value since it's loaded from environment
        expect(typeof authConfig.secret).to.equal('string');
        
        expect(authConfig.emailAndPassword.enabled).to.equal(true);
        
        // In test environment, this might be false
        if (constants.environment === 'test') {
            expect(authConfig.emailAndPassword.requireEmailVerification).to.equal(false);
            expect(authConfig.emailVerification.sendOnSignUp).to.equal(false);
        }
        
        expect(authConfig.emailVerification.autoSignInAfterVerification).to.equal(true);
        expect(typeof authConfig.emailVerification.sendVerificationEmail).to.equal('function');
        expect(typeof authConfig.passwordReset.sendResetPasswordEmail).to.equal('function');
        
        // Check plugins
        expect(Array.isArray(authConfig.plugins)).to.equal(true);
        expect(authConfig.plugins.length >= 1).to.equal(true);
    });

    // Test 2: sendVerificationEmail handler
    it('should resolve EmailService and call sendVerificationEmail', async () => {
        // Arrange: Define mock user and URL
        const testUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
        const testUrl = `${constants.BASE_URL}/security/verify`;
        const testToken = 'abc';
        const expectedUrl = `${constants.BASE_URL}/security/verify?token=${testToken}`;

        // Ensure the container resolve stub is working
        expect(container.resolve('EmailService')).to.equal(mockEmailService);

        // Act: Call the handler function from the authConfig using correct path
        await authConfig.emailVerification.sendVerificationEmail({ user: testUser, url: testUrl, token: testToken });

        // Assert: Check that EmailService.sendVerificationEmail was called correctly
        expect(mockEmailService.sendVerificationEmail.calledOnce).to.equal(true);
        sinon.assert.calledOnceWithExactly(mockEmailService.sendVerificationEmail, {
            user: testUser,
            url: expectedUrl,
            token: testToken
        });
    });

    // Test 3: sendResetPasswordEmail handler
    it('should resolve EmailService and call sendPasswordResetEmail', async () => {
        // Arrange: Define mock user and URL
        const testUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
        const testUrl = `${constants.BASE_URL}/security/reset?token=xyz`;
        const testToken = 'xyz';

        // Act: Call the handler function from the authConfig
        await authConfig.passwordReset.sendResetPasswordEmail({ user: testUser, url: testUrl, token: testToken });

        // Assert: Check that EmailService.sendPasswordResetEmail was called correctly
        expect(mockEmailService.sendPasswordResetEmail.calledOnce).to.equal(true);
        sinon.assert.calledOnceWithExactly(mockEmailService.sendPasswordResetEmail, {
            user: testUser,
            url: testUrl,
            token: testToken,
        });
    });

    // Test 4: Plugin configuration
    it('should have plugins configured', () => {
        // Check that plugins array exists and has items
        expect(Array.isArray(authConfig.plugins)).to.equal(true);
        expect(authConfig.plugins.length > 0).to.equal(true);
        
        // Since the plugin structure might be complex and implementation-specific,
        // we'll just verify that plugins exist and are objects
        authConfig.plugins.forEach(plugin => {
            expect(typeof plugin).to.equal('object');
            expect(plugin !== null).to.equal(true);
        });
    });
});
