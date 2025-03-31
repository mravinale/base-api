# Contributing to Base API

Thank you for your interest in contributing to the Base API project! This document outlines the standards and guidelines for contributing to this codebase.

## Table of Contents

- [Code Organization Pattern](#code-organization-pattern)
- [Technical Implementation](#technical-implementation)
- [Member Ordering Rules](#member-ordering-rules)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)

## Code Organization Pattern

### Controllers

- Handle HTTP concerns: requests, responses, input validation (TSOA), and response formatting
- Use TSOA decorators to define routes and handle input validation
- Use `@Security` decorator to handle Authentication
- Delegate business logic to services
- Keep controllers thin and focused on HTTP concerns
- Avoid handling validations in the controller

Example:
```typescript
@Response(400, "Bad request")
@SuccessResponse("200", "User updated")
@Tags("User")
@Security("jwt", ["admin"])
@Route("users")
export class UsersController extends Controller {
  constructor(private usersService: UsersService) {
    super();
  }

  @Post()
  public async createUser(@Body() dto: ICreateUserDto): Promise<IUserDto> {
    // ...
  }
}
```

### Services

- Contain business logic and validation rules
- Orchestrate operations across repositories
- Throw errors on validation or domain issues
- Handle the conversion between entities and DTOs
- Use the Mapper service to handle the conversion between entities and DTOs
- Use `ApiError` to handle validations and errors and throw them to be handled by `ErrorHandler`
- Typically do not deal with Express or TSOA details—only pure TypeScript methods

### Repositories

- Handle all database interactions
- Use TypeORM for database operations
- Return domain entities, not DTOs
- Do not contain business logic
- Handle database-specific errors and convert them to domain errors

## Technical Implementation

### API Framework and Tooling

- **TSOA**: Used for API routing, input validation, and OpenAPI/Swagger generation
  - Use TSOA's built-in decorators (e.g., `@Get`, `@Post`, etc.) to define routes
  - During the build, TSOA generates a `swagger.json` file automatically
  - TSOA also provides runtime validation for DTOs to ensure correct data shapes
- **Express**: Web framework for handling HTTP requests and middleware
- **TypeORM**: Object-Relational Mapper for database interactions
- **TSyringe**: Dependency injection framework to keep components loosely coupled and testable
  - Controllers inject Services, Services inject Repositories, etc.

### Authentication

- **better-auth**: External authentication service used exclusively for user authentication
- All user auth flows through better-auth, including registration and login
- The application stores user data in its own database, but authentication tokens and sessions come from better-auth

### Error Handling

- **Centralized error handling** via the `ErrorHandler` middleware
- TSOA automatically handles validation errors for controller input
- Services **throw errors** for validation failures or domain issues, which bubble up to controllers and the centralized `ErrorHandler`

## Member Ordering Rules

To maintain consistency throughout the codebase, follow these member ordering rules for all classes:

1. Public static fields
2. Public instance fields
3. Protected static fields
4. Protected instance fields
5. Private static fields
6. Private instance fields
7. Public constructor
8. Protected constructor
9. Private constructor
10. Public static methods
11. Public instance methods
12. Protected static methods
13. Protected instance methods
14. Private static methods
15. Private instance methods

Example:
```typescript
export class ExampleClass {
  // 1. Public static fields
  public static readonly CONFIG: string = 'config';
  
  // 2. Public instance fields
  public name: string;
  
  // 6. Private instance fields
  private id: string;
  
  // 7. Public constructor
  constructor(name: string, id: string) {
    this.name = name;
    this.id = id;
  }
  
  // 10. Public static methods
  public static create(name: string): ExampleClass {
    return new ExampleClass(name, generateId());
  }
  
  // 11. Public instance methods
  public getName(): string {
    return this.name;
  }
  
  // 15. Private instance methods
  private generateId(): string {
    return Math.random().toString(36).substring(2);
  }
}
```

## Testing Guidelines

The project follows a comprehensive testing strategy with three main types of tests:

### Unit Tests

- Isolate a single service or component, mocking out dependencies (using `ts-mockito` or Sinon)
- Verify correct behavior via assertions
- Focus on business logic and edge cases

### Integration Tests

- Test multiple layers together (controllers, services, repositories)
- Commonly used to test API endpoints end-to-end
- Verify that different parts of the system work together

### Persistence Tests

- Specifically focus on database interactions, entity mappings, and queries
- Test complex database operations and transactions

### Test Approach

1. Read the service or component under test
2. Identify one scenario to test
3. Create the test for that scenario and run it
4. If it fails, understand and fix the test (or code) and run again
5. If it passes, create another test
6. Continue iteratively until minimal coverage is achieved

## Pull Request Process

1. Ensure your code follows the project's coding standards and member ordering rules
2. Update the documentation if necessary
3. Add or update tests as appropriate
4. Make sure all tests pass before submitting your PR
5. Update the README.md or other documentation if needed
6. Submit your PR with a clear description of the changes and any additional information that might be helpful for reviewers
