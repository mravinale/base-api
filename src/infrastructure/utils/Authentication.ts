import * as express from "express";
import { IUserDto } from "../../application/users/userDto";
import { auth } from "../config/auth";
import { UserRole } from "../../domain/entities/User";
import jwt from 'jsonwebtoken';
import constants from '../config/constants';

// Extend the User type to include role for authorization
interface UserWithRole extends IUserDto {
  role?: UserRole;
}

// Convert Express headers to Headers object for better-auth
function convertHeaders(requestHeaders: express.Request['headers']): Headers {
  // Create a new Headers object
  const headers = new Headers();
  
  // Add each header to the Headers object
  Object.entries(requestHeaders).forEach(([key, value]) => {
    if (typeof value === 'string') {
      headers.append(key, value);
    } else if (Array.isArray(value)) {
      headers.append(key, value.join(', '));
    }
  });
  
  return headers;
}

declare global {
    namespace Express {
        interface Request {
            user?: IUserDto;
        }
    }
}

export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  if (securityName !== "jwt") {
    return Promise.reject(new Error("Unsupported security name"));
  }

  try {
    // First, try to authenticate with better-auth
    try {
      // Get session using better-auth
      const session = await auth.api.getSession({ 
        headers: convertHeaders(request.headers)
      });
      
      if (session?.user) {
        // Check scopes against user role
        const userFromSession = session.user as UserWithRole;
        const userRole = userFromSession.role;
        
        if (scopes?.length && (!userRole || !scopes.includes(userRole))) {
          const error = new Error("JWT does not contain required scope");
          (error as any).status = 401;
          return Promise.reject(error);
        }
        
        // Set user in request for downstream middleware/controllers
        request.user = userFromSession;
        return userFromSession;
      }
    } catch (betterAuthError) {
      // If better-auth fails, we'll try direct JWT verification
      console.log('Better-auth authentication failed, falling back to direct JWT verification');
    }
    
    // Fall back to direct JWT verification
    const token = request.headers.authorization?.split(' ')[1];
    
    if (!token) {
      const error = new Error("No token provided");
      (error as any).status = 401;
      return Promise.reject(error);
    }
    
    // Verify the token directly
    const decodedToken = jwt.verify(token, constants.CRYPTO.secret) as any;
    
    // Create user object from token payload
    const userFromToken: UserWithRole = {
      id: decodedToken.id,
      email: decodedToken.email,
      name: decodedToken.name,
      role: decodedToken.role
    };
    
    // Check scopes against user role
    if (scopes?.length && (!userFromToken.role || !scopes.includes(userFromToken.role))) {
      const error = new Error("JWT does not contain required scope");
      (error as any).status = 401;
      return Promise.reject(error);
    }
    
    // Set user in request for downstream middleware/controllers
    request.user = userFromToken;
    return userFromToken;
  } catch (error) {
    // For authentication errors, set 401 status
    if (error instanceof Error) {
      (error as any).status = 401; // Set status code to 401 Unauthorized
    }
    
    return Promise.reject(error);
  }
}
