import { betterAuth } from "better-auth";
import { jwt, bearer } from "better-auth/plugins";
import { AdapterWrapper } from "../auth/adapter";
import { container } from "tsyringe";
import { DbConnection } from "./dbConnection";
import constants from "./constants";
 
// Create a configuration object for better-auth
const authConfig = {
  // In production/development, use AdapterWrapper (which wraps TypeORMAdapter)
  adapter: new AdapterWrapper(container.resolve(DbConnection).datasource),

  // Use your existing secret for compatibility with session encryption
  secret: constants.CRYPTO.secret,
  
  // Enable email and password authentication
  emailAndPassword: {
    enabled: true,
  },
  
  plugins: [
    jwt({
      jwt: {
        // JWT configuration
        issuer: constants.BASE_URL || "http://localhost:3030",
        audience: constants.BASE_URL || "http://localhost:3030",
        expirationTime: "1d", // Adjust based on your current expiration
        
        // Define payload to include role for authorization
        definePayload: (session) => ({
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role // Include role for authorization checks
        })
      }
    }),
    // Add bearer plugin for token authentication
    bearer({
      // Only accept signed tokens
      requireSignature: false
    })
  ]
};

// Export the auth instance
export const auth = betterAuth(authConfig);
