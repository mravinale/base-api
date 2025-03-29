import { expect } from 'chai';
import { Request, Response, NextFunction } from 'express';
import * as sinon from 'sinon';

import { ApiError, ErrorHandler } from '../ErrorHandler';
import { Logger } from '../Logger';

describe('ErrorHandler', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: sinon.SinonStub;
  let loggerErrorStub: sinon.SinonStub;
  
  beforeEach(() => {
    req = {
      originalUrl: '/test-url',
      method: 'GET',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent'
      },
      query: {},
      body: {}
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returns(undefined)
    };
    
    next = sinon.stub();
    
    // Stub Logger.error to avoid actual logging during tests
    loggerErrorStub = sinon.stub(Logger, 'error');
  });
  
  afterEach(() => {
    loggerErrorStub.restore();
    sinon.restore();
  });
  
  describe('ApiError', () => {
    it('should create an ApiError with the correct properties', () => {
      const error = new ApiError({
        statusCode: 400,
        name: 'TestError',
        message: 'Test message',
        fields: { field1: { message: 'Field error' } },
        code: 'TEST_CODE',
        source: 'test-source',
        data: { test: 'data' }
      });
      
      expect(error).to.be.an.instanceof(Error);
      expect(error).to.be.an.instanceof(ApiError);
      expect(error.statusCode).to.equal(400);
      expect(error.name).to.equal('TestError');
      expect(error.message).to.equal('Test message');
      expect(error.fields).to.deep.equal({ field1: { message: 'Field error' } });
      expect(error.code).to.equal('TEST_CODE');
      expect(error.source).to.equal('test-source');
      expect(error.data).to.deep.equal({ test: 'data' });
      expect(error.timestamp).to.be.an.instanceof(Date);
    });
    
    it('should create a badRequest error', () => {
      const error = ApiError.badRequest('Bad request message');
      
      expect(error.statusCode).to.equal(400);
      expect(error.name).to.equal('BadRequestError');
      expect(error.message).to.equal('Bad request message');
      expect(error.code).to.equal('ERR_BAD_REQUEST');
    });
    
    it('should create a notFound error', () => {
      const error = ApiError.notFound('Item not found', 'User');
      
      expect(error.statusCode).to.equal(404);
      expect(error.name).to.equal('NotFoundError');
      expect(error.message).to.equal('User not found: Item not found');
      expect(error.code).to.equal('ERR_NOT_FOUND');
    });
    
    it('should create an unauthorized error', () => {
      const error = ApiError.unauthorized();
      
      expect(error.statusCode).to.equal(401);
      expect(error.name).to.equal('UnauthorizedError');
      expect(error.message).to.equal('Unauthorized');
      expect(error.code).to.equal('ERR_UNAUTHORIZED');
    });
    
    it('should create a forbidden error', () => {
      const error = ApiError.forbidden('Custom forbidden message');
      
      expect(error.statusCode).to.equal(403);
      expect(error.name).to.equal('ForbiddenError');
      expect(error.message).to.equal('Custom forbidden message');
      expect(error.code).to.equal('ERR_FORBIDDEN');
    });
    
    it('should create a validation error', () => {
      const fields = { email: { message: 'Invalid email' } };
      const error = ApiError.validation('Validation failed', fields);
      
      expect(error.statusCode).to.equal(422);
      expect(error.name).to.equal('ValidationError');
      expect(error.message).to.equal('Validation failed');
      expect(error.fields).to.deep.equal(fields);
      expect(error.code).to.equal('ERR_VALIDATION');
    });
    
    it('should create an internal error', () => {
      const data = { detail: 'Error details' };
      const error = ApiError.internal('Internal server error', data);
      
      expect(error.statusCode).to.equal(500);
      expect(error.name).to.equal('InternalServerError');
      expect(error.message).to.equal('Internal server error');
      expect(error.data).to.deep.equal(data);
      expect(error.code).to.equal('ERR_INTERNAL');
    });
    
    it('should create a database error', () => {
      const data = { query: 'SELECT * FROM users' };
      const error = ApiError.database('Database error', data);
      
      expect(error.statusCode).to.equal(500);
      expect(error.name).to.equal('DatabaseError');
      expect(error.message).to.equal('Database error');
      expect(error.data).to.deep.equal(data);
      expect(error.code).to.equal('ERR_DATABASE');
    });
  });
  
  describe('handleError', () => {
    it('should handle ApiError instances correctly', () => {
      const apiError = ApiError.badRequest('Test bad request');
      
      ErrorHandler.handleError(apiError, req as Request, res as Response, next as NextFunction);
      
      expect(loggerErrorStub.called).to.equal(true);
      expect((res.status as sinon.SinonStub).called).to.equal(true);
      expect((res.status as sinon.SinonStub).firstCall.args[0]).to.equal(400);
      
      expect((res.json as sinon.SinonStub).called).to.equal(true);
      const jsonArg = (res.json as sinon.SinonStub).firstCall.args[0];
      expect(jsonArg.status).to.equal(400);
      expect(jsonArg.name).to.equal('BadRequestError');
      expect(jsonArg.message).to.equal('Test bad request');
      expect(jsonArg.code).to.equal('ERR_BAD_REQUEST');
      
      expect(next.called).to.equal(true);
    });
    
    it('should normalize standard Error objects', () => {
      const standardError = new Error('Standard error');
      
      ErrorHandler.handleError(standardError, req as Request, res as Response, next as NextFunction);
      
      expect(loggerErrorStub.called).to.equal(true);
      expect((res.status as sinon.SinonStub).firstCall.args[0]).to.equal(500);
      
      const jsonArg = (res.json as sinon.SinonStub).firstCall.args[0];
      expect(jsonArg.status).to.equal(500);
      expect(jsonArg.name).to.equal('InternalServerError');
      expect(jsonArg.message).to.equal('Standard error');
      
      expect(next.called).to.equal(true);
    });
    
    it('should handle string errors', () => {
      const stringError = 'String error message';
      
      ErrorHandler.handleError(stringError, req as Request, res as Response, next as NextFunction);
      
      expect(loggerErrorStub.called).to.equal(true);
      expect((res.status as sinon.SinonStub).firstCall.args[0]).to.equal(500);
      
      const jsonArg = (res.json as sinon.SinonStub).firstCall.args[0];
      expect(jsonArg.status).to.equal(500);
      expect(jsonArg.name).to.equal('InternalServerError');
      expect(jsonArg.message).to.equal('String error message');
      
      expect(next.called).to.equal(true);
    });
    
    it('should handle errors with status codes', () => {
      const errorWithStatus = new Error('Not found error');
      (errorWithStatus as any).status = 404;
      
      ErrorHandler.handleError(errorWithStatus, req as Request, res as Response, next as NextFunction);
      
      expect(loggerErrorStub.called).to.equal(true);
      expect((res.status as sinon.SinonStub).firstCall.args[0]).to.equal(404);
      
      const jsonArg = (res.json as sinon.SinonStub).firstCall.args[0];
      expect(jsonArg.status).to.equal(404);
      expect(jsonArg.name).to.equal('NotFoundError');
      expect(jsonArg.message).to.equal('Not found error');
      
      expect(next.called).to.equal(true);
    });
    
    it('should handle validation errors', () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      (validationError as any).fields = { email: { message: 'Invalid email' } };
      
      ErrorHandler.handleError(validationError, req as Request, res as Response, next as NextFunction);
      
      expect(loggerErrorStub.called).to.equal(true);
      expect((res.status as sinon.SinonStub).firstCall.args[0]).to.equal(422);
      
      const jsonArg = (res.json as sinon.SinonStub).firstCall.args[0];
      expect(jsonArg.status).to.equal(422);
      expect(jsonArg.name).to.equal('ValidationError');
      expect(jsonArg.message).to.equal('Validation failed');
      expect(jsonArg.fields).to.deep.equal({ email: { message: 'Invalid email' } });
      
      expect(next.called).to.equal(true);
    });
    
    it('should handle database errors', () => {
      const dbError = new Error('Database error');
      dbError.name = 'MongoError';
      
      ErrorHandler.handleError(dbError, req as Request, res as Response, next as NextFunction);
      
      expect(loggerErrorStub.called).to.equal(true);
      expect((res.status as sinon.SinonStub).firstCall.args[0]).to.equal(500);
      
      const jsonArg = (res.json as sinon.SinonStub).firstCall.args[0];
      expect(jsonArg.status).to.equal(500);
      expect(jsonArg.name).to.equal('DatabaseError');
      expect(jsonArg.message).to.equal('Database operation failed');
      
      expect(next.called).to.equal(true);
    });
    
    it('should handle JWT errors', () => {
      const jwtError = new Error('Token expired');
      jwtError.name = 'TokenExpiredError';
      
      ErrorHandler.handleError(jwtError, req as Request, res as Response, next as NextFunction);
      
      expect(loggerErrorStub.called).to.equal(true);
      expect((res.status as sinon.SinonStub).firstCall.args[0]).to.equal(401);
      
      const jsonArg = (res.json as sinon.SinonStub).firstCall.args[0];
      expect(jsonArg.status).to.equal(401);
      expect(jsonArg.name).to.equal('UnauthorizedError');
      expect(jsonArg.message).to.equal('Token expired');
      
      expect(next.called).to.equal(true);
    });
    
    it('should sanitize sensitive data in request body', () => {
      req.body = {
        email: 'test@example.com',
        password: 'secret123',
        token: 'jwt-token',
        name: 'Test User'
      };
      
      const error = new Error('Test error');
      ErrorHandler.handleError(error, req as Request, res as Response, next as NextFunction);
      
      expect(loggerErrorStub.called).to.equal(true);
      const logArg = loggerErrorStub.firstCall.args[0];
      expect(logArg.request.body).to.deep.equal({
        email: 'test@example.com',
        password: '[REDACTED]',
        token: '[REDACTED]',
        name: 'Test User'
      });
    });
    
    it('should handle missing request object gracefully', () => {
      const error = new Error('Test error');
      ErrorHandler.handleError(error, undefined as unknown as Request, res as Response, next as NextFunction);
      
      expect(loggerErrorStub.called).to.equal(true);
      const logArg = loggerErrorStub.firstCall.args[0];
      expect(logArg.request).to.deep.equal({
        missing: 'Request object was not provided'
      });
    });
    
    it('should handle plain objects with error-like properties', () => {
      const plainObjectError = {
        message: 'Plain object error'
      };
      
      ErrorHandler.handleError(plainObjectError, req as Request, res as Response, next as NextFunction);
      
      expect(loggerErrorStub.called).to.equal(true);
      expect((res.status as sinon.SinonStub).firstCall.args[0]).to.equal(500);
      
      const jsonArg = (res.json as sinon.SinonStub).firstCall.args[0];
      expect(jsonArg.status).to.equal(500);
      expect(jsonArg.name).to.equal('InternalServerError');
      expect(jsonArg.message).to.equal('Plain object error');
      
      expect(next.called).to.equal(true);
    });
    
    it('should handle completely unknown error types', () => {
      const unknownError = 123; // A number is not a typical error type
      
      ErrorHandler.handleError(unknownError, req as Request, res as Response, next as NextFunction);
      
      expect(loggerErrorStub.called).to.equal(true);
      expect((res.status as sinon.SinonStub).firstCall.args[0]).to.equal(500);
      
      const jsonArg = (res.json as sinon.SinonStub).firstCall.args[0];
      expect(jsonArg.status).to.equal(500);
      expect(jsonArg.name).to.equal('InternalServerError');
      expect(jsonArg.message).to.equal('An unexpected error occurred');
      
      expect(next.called).to.equal(true);
    });
  });
});
