import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

/**
 * Load environment variables from the appropriate .env file based on NODE_ENV
 */
const loadEnvironment = (): void => {
  // Determine environment file name based on NODE_ENV
  const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env.local';
  
  // Define potential file locations (source or compiled code)
  const possibleLocations = [
    path.resolve(__dirname, 'env', envFile),                           
    path.resolve(__dirname, '..', '..', '..', 'src/infrastructure/config/env', envFile)
  ];
  
  // Find first existing env file
  const envPath = possibleLocations.find(fs.existsSync);
  
  if (!envPath) {
    throw new Error(`Environment file not found for ${envFile}`);
  }

  console.log(`Loading environment from: ${envPath}`);
  dotenv.config({
    path: envPath,
    debug: process.env.NODE_ENV !== 'production'
  });
};

// Load environment variables immediately
loadEnvironment();

// Function to get a dynamic port for tests
export const getTestPort = (): number => {
    // Generate a random port between 4000-9000 for tests
    return process.env.TEST_PORT ? parseInt(process.env.TEST_PORT, 10) : Math.floor(Math.random() * 5000) + 4000;
};

const constants = {
  environment: process.env.NODE_ENV,
  port: process.env.NODE_ENV === 'test' ? getTestPort() : process.env.PORT,
  BASE_URL: process.env.BASE_URL,
  CRYPTO: {
    secret: process.env.CRYPTO_SECRET
  },
  SQL: {
    name: process.env.SQL_DB,
    username: process.env.SQL_USERNAME,
    password: process.env.SQL_PASSWORD,
    host: process.env.SQL_HOST,
    port: Number(process.env.SQL_PORT),
    dialect: process.env.SQL_DIALECT
  },
  AWS: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    mainBucket: process.env.AWS_MAINBUCKET
  },
  // Email configuration for Resend.com
  EMAIL: {
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
    DEFAULT_FROM_EMAIL: process.env.DEFAULT_FROM_EMAIL || 'noreply@yourdomain.com'
  },
  errorTypes: {
    db: { statusCode: 500, name: 'Internal Server Error', message: 'database error' },
    validation: { statusCode: 400, name: 'Bad Request', message: 'validation error' },
    auth: { statusCode: 401, name: 'Unauthorized', message: 'auth error' },
    forbidden: { statusCode: 403, name: 'Forbidden', message: 'forbidden content' },
    notFound: { statusCode: 404, name: 'Not Found', message: 'content not found' },
    entity: { statusCode: 422, name: 'Unprocessable Entity', message: 'entity error' }
  },
  get errorMap() {
    return {
      ValidateError: this.errorTypes.validation,
      ValidationError: this.errorTypes.validation,
      CastError: this.errorTypes.db
    };
  }
};

export default constants;
