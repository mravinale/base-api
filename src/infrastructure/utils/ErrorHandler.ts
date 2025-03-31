import { Request, Response, NextFunction } from 'express';

import constants from '../config/constants';
import { Logger } from './Logger';

export interface ErrorType {
  statusCode: number;
  name: string;
  message: string;
  fields?: { [field: string]: { message: string } };
  code?: string;           // For specific error codes (e.g., 'ERR_VALIDATION', 'ERR_DATABASE')
  source?: string;         // Module/component where the error originated
  timestamp?: Date;        // When the error occurred
  data?: any;              // Additional contextual data
}

export class ApiError extends Error implements ErrorType {
  // Public instance fields first
  public statusCode: number = 500;
  public fields?: { [field: string]: { message: string } };
  public code?: string;
  public source?: string;
  public timestamp: Date;
  public data?: any;

  // Constructor after public fields
  constructor(errorType: ErrorType) {
    super(errorType.message);
    this.name = errorType.name;
    if (errorType.statusCode) this.statusCode = errorType.statusCode;
    this.fields = errorType.fields;
    this.code = errorType.code;
    this.source = errorType.source;
    this.data = errorType.data;
    this.timestamp = new Date();
  }

  // Static methods after constructor
  // Helper methods for common error types
  public static badRequest(message: string, fields?: { [field: string]: { message: string } }): ApiError {
    return new ApiError({
      statusCode: 400,
      name: 'BadRequestError',
      message,
      fields,
      code: 'ERR_BAD_REQUEST'
    });
  }
  
  public static notFound(message: string, entity?: string): ApiError {
    return new ApiError({
      statusCode: 404,
      name: 'NotFoundError',
      message: entity ? `${entity} not found: ${message}` : message,
      code: 'ERR_NOT_FOUND'
    });
  }
  
  public static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError({
      statusCode: 401,
      name: 'UnauthorizedError',
      message,
      code: 'ERR_UNAUTHORIZED'
    });
  }
  
  public static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError({
      statusCode: 403,
      name: 'ForbiddenError',
      message,
      code: 'ERR_FORBIDDEN'
    });
  }
  
  public static validation(message: string, fields?: { [field: string]: { message: string } }): ApiError {
    return new ApiError({
      statusCode: 422,
      name: 'ValidationError',
      message,
      fields,
      code: 'ERR_VALIDATION'
    });
  }
  
  public static internal(message: string, data?: any): ApiError {
    return new ApiError({
      statusCode: 500,
      name: 'InternalServerError',
      message,
      data,
      code: 'ERR_INTERNAL'
    });
  }
  
  public static database(message: string, data?: any): ApiError {
    return new ApiError({
      statusCode: 500,
      name: 'DatabaseError',
      message,
      data,
      code: 'ERR_DATABASE'
    });
  }
}

export class ErrorHandler {
  // Public static methods
  public static handleError(error: any, req: Request, res: Response, next: NextFunction): void {
    const normalizedError: ApiError = ErrorHandler.normalizeError(error);
    const { name, message, fields, statusCode, code, source, timestamp, data } = normalizedError;
    
    // Add request context for better debugging
    const requestContext = ErrorHandler.extractRequestContext(req);
    
    // Structured logging with context
    Logger.error({
      error: {
        statusCode,
        name,
        message,
        code,
        source,
        timestamp,
        fields: fields || {},
      },
      request: requestContext,
      stack: normalizedError.stack
    });
    
    // Don't expose stack traces or internal data in production
    const isProduction = constants.environment === 'production';
    const responsePayload: any = {
      status: statusCode,
      name,
      message,
      code,
      ...(fields && { fields })
    };
    
    // Only include data in non-production environments
    if (!isProduction && data) {
      responsePayload.data = data;
    }
    
    res.status(statusCode).json(responsePayload);
    next();
  }

  private static normalizeError(error: any): ApiError {
    // Already an ApiError
    if (error instanceof ApiError) {
      return error;
    }
    
    // Handle standard Error objects or plain strings
    if (typeof error === 'string') {
      return ApiError.internal(error);
    }
    
    // Handle standard Error objects
    if (error instanceof Error) {
      // Check for status code in error object (common in HTTP errors)
      const statusCode = (error as any).status || (error as any).statusCode;
      
      if (statusCode) {
        // Map common status codes to appropriate error types
        switch (statusCode) {
          case 400: return ApiError.badRequest(error.message || 'Bad request');
          case 401: return ApiError.unauthorized(error.message || 'Unauthorized');
          case 403: return ApiError.forbidden(error.message || 'Forbidden');
          case 404: return ApiError.notFound(error.message || 'Not found');
          case 422: return ApiError.validation(error.message || 'Validation failed', (error as any).fields);
          default: break;
        }
      }
      
      // Handle specific error types by name
      switch (error.name) {
        case 'ValidateError':
        case 'ValidationError':
          return ApiError.validation(error.message || 'Validation failed', (error as any).fields || {});
        
        case 'CastError':
        case 'MongoError':
        case 'SequelizeError':
        case 'QueryFailedError':
        case 'EntityNotFoundError':
          return ApiError.database('Database operation failed', { originalError: error.message });
        
        case 'JsonWebTokenError':
        case 'TokenExpiredError':
          return ApiError.unauthorized(error.message || 'Authentication failed');
        
        default:
          // Check against the error map in constants
          if (constants.errorMap && constants.errorMap[error.name]) {
            const mappedError = constants.errorMap[error.name];
            return new ApiError({
              statusCode: mappedError.statusCode,
              name: mappedError.name,
              message: error.message || mappedError.message
            });
          }
          
          // Default to internal server error for unhandled error types
          return ApiError.internal(error.message || 'An unexpected error occurred');
      }
    }
    
    // Handle plain objects with error-like properties
    if (error && typeof error === 'object') {
      if (error.message) {
        return ApiError.internal(error.message, { originalError: error });
      }
    }
    
    // Fallback for completely unknown error types
    return ApiError.internal('An unexpected error occurred', { originalError: String(error) });
  }
  
  private static extractRequestContext(req: Request): any {
    if (!req) {
      return { missing: 'Request object was not provided' };
    }
    
    // Extract useful information from the request for debugging
    return {
      url: req.originalUrl || req.url,
      method: req.method,
      ip: req.ip,
      userId: (req as any).user?.id, // If you store user in request
      userAgent: req.headers['user-agent'],
      query: req.query,
      // Don't include sensitive data like passwords or tokens
      body: ErrorHandler.sanitizeRequestBody(req.body)
    };
  }
  
  private static sanitizeRequestBody(body: any): any {
    if (!body) return {};
    
    // Create a copy to avoid modifying the original
    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken', 'secret', 'apiKey'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}
