import 'reflect-metadata';
import { expect, assert } from 'chai';
import sinon from 'sinon';
import * as express from 'express';
import { expressAuthentication } from '@infrastructure/utils/Authentication';
import { auth } from '@infrastructure/config/authConfiguration';
import { UserRole } from '@domain/entities/User';

describe('Authentication', () => {
  let mockRequest: Partial<express.Request>;
  let mockAuthApi: any;
  let consoleLogStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;

  beforeEach(() => {
    // Create mock request
    mockRequest = {
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json'
      }
    };

    // Create stubs for console methods
    consoleLogStub = sinon.stub(console, 'log');
    consoleErrorStub = sinon.stub(console, 'error');

    // Create stub for better-auth getSession method
    mockAuthApi = {
      getSession: sinon.stub()
    };
    
    // Replace the auth.api with our mock
    (auth as any).api = mockAuthApi;
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('expressAuthentication', () => {
    it('should reject with error for unsupported security name', async () => {
      try {
        await expressAuthentication(mockRequest as express.Request, 'unsupported');
        assert.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Unsupported security name');
      }
    });

    it('should reject with error when better-auth returns no session', async () => {
      // Mock better-auth to return null session
      mockAuthApi.getSession.resolves(null);

      try {
        await expressAuthentication(mockRequest as express.Request, 'jwt');
        assert.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Invalid or expired token');
        expect(error.status).to.equal(401);
      }
    });

    it('should reject with error when better-auth returns session with no user', async () => {
      // Mock better-auth to return session without user
      mockAuthApi.getSession.resolves({ token: 'test-token' });

      try {
        await expressAuthentication(mockRequest as express.Request, 'jwt');
        assert.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Invalid or expired token');
        expect(error.status).to.equal(401);
      }
    });

    it('should authenticate successfully with valid session and user', async () => {
      // Mock user data
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        metadata: {
          role: UserRole.ADMIN
        }
      };

      // Mock better-auth to return valid session with user
      mockAuthApi.getSession.resolves({ 
        token: 'test-token',
        user: mockUser
      });

      const result = await expressAuthentication(mockRequest as express.Request, 'jwt');

      // Verify user is returned with correct properties
      expect(result).to.have.property('id', 'user-123');
      expect(result).to.have.property('email', 'test@example.com');
      expect(result).to.have.property('name', 'Test User');
      expect(result).to.have.property('role', UserRole.ADMIN);

      // Verify user is set in request
      expect(mockRequest.user).to.deep.equal(result);
    });

    it('should use default admin role when no role is provided', async () => {
      // Mock user data without role
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
        // No metadata or role
      };

      // Mock better-auth to return valid session with user
      mockAuthApi.getSession.resolves({ 
        token: 'test-token',
        user: mockUser
      });

      const result = await expressAuthentication(mockRequest as express.Request, 'jwt');

      // Verify default role is set
      expect(result.role).to.equal(UserRole.ADMIN);
    });

    it('should handle authentication errors gracefully', async () => {
      // Mock better-auth to throw an error
      const testError = new Error('Test auth error');
      mockAuthApi.getSession.rejects(testError);

      try {
        await expressAuthentication(mockRequest as express.Request, 'jwt');
        assert.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Authentication failed');
        expect(error.status).to.equal(401);
        
        // Verify error was logged
        sinon.assert.calledWith(consoleErrorStub, 'Authentication error:', testError);
      }
    });

    it('should handle array headers correctly', async () => {
      // Mock request with array header
      const requestWithArrayHeader: Partial<express.Request> = {
        headers: {
          authorization: 'Bearer test-token',
          'accept-encoding': ['gzip', 'deflate'] as any
        }
      };

      // Mock user data
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.USER
      };

      // Mock better-auth to return valid session with user
      mockAuthApi.getSession.resolves({ 
        token: 'test-token',
        user: mockUser
      });

      const result = await expressAuthentication(requestWithArrayHeader as express.Request, 'jwt');

      // Verify authentication succeeded
      expect(result).to.have.property('id', 'user-123');
      
      // Verify headers were converted correctly
      sinon.assert.calledOnce(mockAuthApi.getSession);
      const callArg = mockAuthApi.getSession.firstCall.args[0];
      expect(callArg).to.have.property('headers');
      
      // Headers should be a Headers object that was properly constructed
      // We can't directly test the Headers object, but we can verify getSession was called
    });
  });
});
