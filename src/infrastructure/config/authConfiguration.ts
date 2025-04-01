import { betterAuth } from "better-auth";
import { jwt, bearer } from "better-auth/plugins";
import { AdapterWrapper } from "../utils/BetterAdapter";
import { container } from "tsyringe";
import { DbConnection } from "./dbConnection";
import constants from "./constants";
import { EmailService } from "../utils/EmailService";

// Custom verification URL to match our controller endpoint
const customUrl = '/security/verify';
// Create a configuration object for better-auth
export const authConfig = {
  // In production/development, use AdapterWrapper (which wraps TypeORMAdapter)
  adapter: new AdapterWrapper(container.resolve(DbConnection).datasource),

  // Use your existing secret for compatibility with session encryption
  secret: constants.CRYPTO.secret,
  
  // Enable email and password authentication
  emailAndPassword: {
    enabled: true,
    // Only require email verification in non-test environments
    requireEmailVerification: constants.environment !== 'test',
  },
  
  // Configure email verification
  emailVerification: {
    sendOnSignUp: constants.environment !== 'test', // Send verification email on signup (except in tests)
    autoSignInAfterVerification: true, // Auto sign-in after verification
    sendVerificationEmail: async ({ user, url, token }) => {
      const emailService = container.resolve(EmailService); 
      const myUrl = `${constants.BASE_URL}${customUrl}?token=${token}`;
      await emailService.sendVerificationEmail({ 
        user, 
        url: myUrl, 
        token 
      });

    }
  },
  
  // Configure password reset
  passwordReset: {
    sendResetPasswordEmail: async ({ user, url, token }) => {
      const emailService = container.resolve(EmailService); 
      await emailService.sendPasswordResetEmail({ user, url, token });
    }
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
