declare module 'better-auth' {
  export interface BetterAuthOptions {
    adapter: any;
    secret: string | undefined;
    emailAndPassword?: {
      enabled: boolean;
    };
    plugins?: any[];
  }

  export interface User {
    id: string;
    email: string;
    password?: string;
    role?: string;
    [key: string]: any;
  }

  export interface Session {
    id: string;
    userId: string;
    [key: string]: any;
  }

  export interface SignInResponse {
    user: User;
    session: Session;
    token: string;
  }

  export interface SignUpResponse {
    user: User;
    session: Session;
    token: string;
  }

  export interface BetterAuthAPI {
    users: {
      create(user: Partial<User>): Promise<User>;
      getById(id: string): Promise<User | null>;
      getByEmail(email: string): Promise<User | null>;
      update(id: string, data: Partial<User>): Promise<User>;
      delete(id: string): Promise<void>;
    };
    sessions: {
      create(userId: string, data?: any): Promise<Session>;
      getById(id: string): Promise<Session | null>;
      delete(id: string): Promise<void>;
    };
    auth: {
      login(email: string, password: string): Promise<{ user: User; session: Session }>;
      logout(sessionId: string): Promise<void>;
    };
    signInEmail(request: { body: { email: string; password: string } }): Promise<SignInResponse>;
    signUpEmail(request: { body: { email: string; password: string; name: string; metadata: any } }): Promise<SignUpResponse>;
    signOut(request: { headers: any }): Promise<void>;
    getSession(request: { headers: any }): Promise<Session | null>;
  }

  export interface BetterAuth {
    api: BetterAuthAPI;
  }

  export function betterAuth(options: BetterAuthOptions): BetterAuth;
  export default function(options: BetterAuthOptions): BetterAuth;
}

declare module 'better-auth/plugins' {
  export function jwt(options?: any): any;
  export function bearer(options?: any): any;
}

declare module 'better-auth/dist/plugins/access' {
  export type Statements = any;
  export type Subset<K, T> = any;
  export type AuthortizeResponse = any;
  export function createAccessControl(statements: any): any;
}
