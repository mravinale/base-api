import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { TypeORMAdapter } from "../auth/typeormAdapter";
import { container } from "tsyringe";
import { DbConnection } from "./dbConnection";
import constants from "./constants";

// Check if we're in test mode
const isTestMode = process.env.NODE_ENV === 'test';

// Create a configuration object for better-auth
const authConfig = {
  // In test mode, use the memory adapter
  // In production/development, use TypeORM adapter
  adapter: isTestMode ? 'memory' : undefined,
  
  // Use your existing secret for compatibility with session encryption
  secret: constants.CRYPTO.secret,
  plugins: [
    jwt({
      jwt: {
        // JWT configuration
        issuer: constants.BASE_URL || "http://localhost:3000",
        audience: constants.BASE_URL || "http://localhost:3000",
        expirationTime: "1d", // Adjust based on your current expiration
        
        // Define payload to include role for authorization
        definePayload: (session) => ({
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role // Include role for authorization checks
        })
      }
    })
  ]
};

// Export the auth instance
export const auth = betterAuth(authConfig);
