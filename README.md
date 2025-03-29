# Base API

[![Build and Test](https://github.com/mravinale/base.api/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/mravinale/base.api/actions/workflows/build-and-test.yml)
[![codecov](https://codecov.io/gh/mravinale/base.api/branch/main/graph/badge.svg)](https://codecov.io/gh/mravinale/base.api)
[![Known Vulnerabilities](https://snyk.io/test/github/mravinale/base.api/badge.svg)](https://snyk.io/test/github/mravinale/base.api)

A robust Node.js API starter template with TypeScript, following clean architecture principles and best practices for modern backend development.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
- [Development](#development)
  - [Available Commands](#available-commands)
  - [API Documentation](#api-documentation)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

This project is a seed for building a production-ready **Node.js** API with:

- **TypeScript** - Type-safe code with modern JavaScript features
- **Clean Architecture** - Clear separation of concerns with domain-driven design
- **API Documentation** - Auto-generated OpenAPI/Swagger documentation
- **Authentication** - Ready-to-use auth system with email verification and password reset
- **Database Integration** - SQL support with TypeORM
- **Testing Framework** - Comprehensive test setup for unit and integration tests
- **CI/CD Pipeline** - GitHub Actions workflow for continuous integration
- **Security Scanning** - Vulnerability detection with Snyk

## 🏗️ Architecture

The project follows a clean, layered architecture with a clear separation of concerns:

### Domain Layer
- Core business entities and logic
- Database migrations

### Application Layer
- Controllers: Handle HTTP requests/responses
- Services: Contain business logic
- Repositories: Handle data access
- DTOs: Data Transfer Objects for validation and response formatting

### Infrastructure Layer
- Configuration: Environment, database, and server setup
- Utils: Shared utilities and adapters
- Authentication: Security middleware and integrations

## 🚀 Getting Started

### Prerequisites

- Node.js (v20.x or higher)
- Yarn package manager
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/base.api.git
   cd base.api
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

### Environment Setup

1. Create environment files:
   ```bash
   mkdir -p src/infrastructure/config/env
   cp .env.example src/infrastructure/config/env/.env.local
   ```

2. Update the environment variables in `.env.local` with your configuration

## 💻 Development

### Available Commands

- **Installation:** `yarn install` - Download dependencies
- **Development:** `yarn dev` - Start the server in development mode
- **Local Development:** `yarn local` - Start with nodemon for auto-reloading
- **Build:** `yarn build` - Create production build
- **Testing:** `yarn test` - Run unit and integration tests
- **Linting:** `yarn lint` - Check code style
- **Type Checking:** `yarn type-check` - Verify TypeScript types

### API Documentation

Once the server is running, access the Swagger documentation at:
- `http://localhost:3000/docs` (replace with your configured port)

## 🧪 Testing

The project includes a comprehensive test suite:

- **Unit Tests** - Test individual components in isolation
- **Integration Tests** - Test interactions between components
- **Persistence Tests** - Test database operations

Run tests with:
```bash
yarn test
```

## 🔄 CI/CD

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
  * Uploads test coverage reports to Codecov

* **Security Scan Job:**
  * Runs Snyk security scan to identify vulnerabilities in dependencies
  * Configured to flag high severity issues

#### Required Secrets:
To use all features of the workflow, set up the following GitHub secrets:
* `RESEND_API_KEY` - API key for the Resend email service
* `DEFAULT_FROM_EMAIL` - Default sender email address
* `CODECOV_TOKEN` - Token for uploading coverage reports to Codecov (optional)
* `SNYK_TOKEN` - Token for Snyk security scanning (optional)

## 🌐 Deployment

For deployment to AWS or other cloud providers, additional workflow jobs can be added to:
* Create Docker images
* Push to container registries (ECR, Docker Hub, etc.)
* Deploy to hosting environments (ECS, Elastic Beanstalk, etc.)

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
