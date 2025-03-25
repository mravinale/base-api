import * as express from "express";
import * as jwt from "jsonwebtoken";
import { ISecurityDto } from "../../application/security/Dtos/securityDto";
import { IUserDto } from "../../application/users/userDto";
import constants from "./../config/constants";
import { auth } from "../config/auth";
import { UserRole } from "../../domain/entities/User";

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
    // Try better-auth first (for new tokens)
    try {
      // Convert Express headers to format accepted by better-auth
      const session = await auth.api.getSession({ 
        headers: convertHeaders(request.headers)
      });
      
      if (session?.user) {
        // Check scopes against user role
        const userWithRole = session.user as UserWithRole;
        const userRole = userWithRole.role;
        if (scopes?.length && (!userRole || !scopes.includes(userRole))) {
          return Promise.reject(new Error("JWT does not contain required scope"));
        }
        
        // Set user in request for backward compatibility
        request.user = userWithRole;
        return userWithRole;
      }
    } catch (e) {
      // Fall back to legacy verification if better-auth fails
      // This ensures backward compatibility
    }

    // Legacy token verification
    const token =
      request.body.token ||
      request.query.token ||
      request.headers?.authorization ||
      request.headers["x-access-token"];

    if (!token) {
      return Promise.reject(new Error("No token provided"));
    }

    // Clean token (remove Bearer prefix if present)
    const cleanToken = token.includes("Bearer") 
      ? token.split("Bearer")[1].trim() 
      : token;

    // Verify with jsonwebtoken for backward compatibility
    const decoded = await new Promise<ISecurityDto>((resolve, reject) => {
      jwt.verify(cleanToken, constants.CRYPTO.secret, (err: any, decodedToken: any) => {
        if (err) {
          return reject(err);
        }
        resolve(decodedToken as ISecurityDto);
      });
    });

    // Check scopes for authorization
    if (!scopes || !decoded || !decoded.role || decoded.role === "" || !scopes.includes(decoded.role)) {
      return Promise.reject(new Error("JWT does not contain required scope"));
    }

    // Set user in request for downstream middleware/controllers
    request.user = decoded as IUserDto;
    return decoded;
  } catch (error) {
    // Provide more specific error messages based on error type
    if (error instanceof jwt.TokenExpiredError) {
      const authError = new Error("Token expired");
      (authError as any).status = 401; // Set status code to 401 Unauthorized
      return Promise.reject(authError);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      const authError = new Error("Invalid token");
      (authError as any).status = 401; // Set status code to 401 Unauthorized
      return Promise.reject(authError);
    }
    
    // For other authentication errors, also set 401 status
    if (error instanceof Error && 
        (error.message === "No token provided" || 
         error.message === "JWT does not contain required scope")) {
      (error as any).status = 401; // Set status code to 401 Unauthorized
    }
    
    return Promise.reject(error);
  }
}
