# Base API

## Start application
 
* Install dependencies `yarn install`
* Start with local project `yarn dev`

## Tech Stack
### This project is a seed for building a **node.js** api. It includes the following features:
  * [tsoa](https://www.npmjs.com/package/tsoa) `integrated OpenAPI compiler framework`
  * [tsyringe](https://www.npmjs.com/package/tsyringe) `inversion of control / dependency injection`
  * [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express) `auto-generated swagger-ui generated API docs from express`
  * [mocha](https://www.npmjs.com/package/mocha), [chai](https://www.npmjs.com/package/chai), [supertest](https://www.npmjs.com/package/supertest), [ts-mockito](https://github.com/NagRock/ts-mockito#readme) `unit and integration testing tools`
  * [typeorm](https://www.npmjs.com/package/typeorm) `SQL ORM`
  * [better-auth](https://www.npmjs.com/package/better-auth) `authentication service integration`
  * [resend](https://www.npmjs.com/package/resend) `email service for verification and password reset`

## API Swagger documentation 
* `<url>/docs`

## Endpoint URL
* `<url>`

## Commands
* **installation:** `yarn install` *download dependencies*
* **test:** `yarn test` *unit and integration tests*
* **build:** `yarn build` *production build*
* **dev:** `yarn dev` *starts the server on development mode*
* **local** `yarn local` *starts the server with nodemon locally*

## CI/CD
### GitHub Actions Workflow

The project uses GitHub Actions for continuous integration and deployment. The workflow is defined in `.github/workflows/build-and-test.yml`.

#### Workflow Summary:
* **Build and Test Job:**
  * Sets up Node.js environment
  * Installs dependencies
  * Creates test environment configuration
  * Builds the application
  * Runs linting checks
  * Executes tests (unit and integration)
  * Uploads test coverage reports to Codecov (if configured)

* **Security Scan Job:**
  * Runs Snyk security scan to identify vulnerabilities in dependencies
  * Configured to flag high severity issues

#### Required Secrets:
To use all features of the workflow, set up the following GitHub secrets:
* `RESEND_API_KEY` - API key for the Resend email service
* `DEFAULT_FROM_EMAIL` - Default sender email address
* `CODECOV_TOKEN` - Token for uploading coverage reports to Codecov (optional)
* `SNYK_TOKEN` - Token for Snyk security scanning (optional)

#### Deployment:
For deployment to AWS or other cloud providers, additional workflow jobs can be added to:
* Create Docker images
* Push to container registries (ECR, Docker Hub, etc.)
* Deploy to hosting environments (ECS, Elastic Beanstalk, etc.)
