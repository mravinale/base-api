# Linting Rules and Member Ordering

This document provides guidance on the linting rules used in this project, with a specific focus on member ordering in classes, which is a common source of linting errors.

## TSLint Configuration

The project uses TSLint for enforcing code quality and consistency. The configuration can be found in `tslint.json`.

## Member Ordering

One of the most important linting rules in this project is the `member-ordering` rule, which enforces a specific order of class members.

### Member Order

Members in classes must be ordered as follows:

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

### Common Linting Errors

The most common linting errors related to member ordering are:

1. **Private fields after constructor**: Private fields should be declared before the constructor.
2. **Public instance fields after static methods**: Public instance fields should be declared at the beginning of the class, before any methods.
3. **Constructor after methods**: The constructor should be placed after all fields but before any methods.

### Examples

#### ❌ Incorrect Member Ordering

```typescript
export class IncorrectExample {
  // Public static method before fields
  public static createInstance(): IncorrectExample {
    return new IncorrectExample();
  }
  
  // Public instance field after static method (ERROR)
  public name: string;
  
  constructor() {
    this.name = "example";
  }
  
  // Private field after constructor (ERROR)
  private id: string = "123";
  
  public getName(): string {
    return this.name;
  }
}
```

#### ✅ Correct Member Ordering

```typescript
export class CorrectExample {
  // 1. Public static fields (none in this example)
  
  // 2. Public instance fields
  public name: string;
  
  // 6. Private instance fields
  private id: string = "123";
  
  // 7. Constructor after all fields
  constructor() {
    this.name = "example";
  }
  
  // 10. Public static methods
  public static createInstance(): CorrectExample {
    return new CorrectExample();
  }
  
  // 11. Public instance methods
  public getName(): string {
    return this.name;
  }
}
```

## Running Linting Checks

To check your code for linting errors:

```bash
yarn lint
```

This will run the linting checks and report any errors found.

## Fixing Common Member Ordering Issues

When you encounter member ordering issues, follow these steps:

1. Identify the type of each member (field, constructor, method)
2. Identify the visibility of each member (public, protected, private)
3. For fields and methods, identify if they are static or instance
4. Rearrange the members according to the order specified above
5. Run linting checks again to verify the issues are resolved

## Automatic Fixes

Some linting errors can be fixed automatically using:

```bash
yarn lint:fix
```

However, member ordering issues often require manual intervention to ensure the correct order is maintained.

## Best Practices

- Always declare all fields at the top of the class
- Place private fields before the constructor
- Keep constructors after all fields but before any methods
- Group members by their type and visibility for better readability
