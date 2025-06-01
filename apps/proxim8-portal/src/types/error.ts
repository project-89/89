/**
 * Standardized error types for the application
 */

/**
 * Base API error interface
 */
export interface ApiErrorOptions {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, any>;
  data?: any;
  error?: Error;
}

/**
 * API Error class for consistent error handling
 */
export class ApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, any>;
  data?: any;
  originalError?: Error;

  constructor(options: ApiErrorOptions) {
    super(options.message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.data = options.data;
    this.originalError = options.error;

    // This is needed for instanceof checks to work properly in ES5
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  // Convert to a plain object for logging
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
      data: this.data,
      stack: this.stack,
    };
  }
}

/**
 * Authentication related errors
 */
export interface AuthError extends ApiError {
  code: "unauthorized" | "forbidden" | "token_expired" | "invalid_token";
}

/**
 * Validation related errors
 */
export interface ValidationErrorOptions {
  message: string;
  field?: string;
  value?: any;
}

/**
 * Validation Error class
 */
export class ValidationError extends Error {
  field?: string;
  value?: any;

  constructor(options: ValidationErrorOptions) {
    super(options.message);
    this.name = "ValidationError";
    this.field = options.field;
    this.value = options.value;

    // This is needed for instanceof checks to work properly in ES5
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  // Convert to a plain object for logging
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      field: this.field,
      value: this.value,
      stack: this.stack,
    };
  }
}

/**
 * Resource not found error
 */
export interface NotFoundError extends ApiError {
  code: "not_found";
  resource: string;
}

/**
 * Rate limit error
 */
export interface RateLimitError extends ApiError {
  code: "rate_limit_exceeded";
  retryAfter?: number; // seconds until retry is allowed
}

/**
 * Server error
 */
export interface ServerError extends ApiError {
  code: "server_error" | "service_unavailable";
}

/**
 * Generic response error with discriminated union type
 */
export type ResponseError =
  | AuthError
  | ValidationError
  | NotFoundError
  | RateLimitError
  | ServerError
  | ApiError;

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: any): error is ApiError {
  return (
    error &&
    typeof error === "object" &&
    "status" in error &&
    "message" in error
  );
}

/**
 * Type guard to check if an error is a ValidationError
 */
export function isValidationError(error: any): error is ValidationError {
  return (
    isApiError(error) && error.code === "validation_error" && "fields" in error
  );
}

/**
 * Type guard to check if an error is an AuthError
 */
export function isAuthError(error: any): error is AuthError {
  return (
    isApiError(error) &&
    ["unauthorized", "forbidden", "token_expired", "invalid_token"].includes(
      error.code || ""
    )
  );
}

/**
 * Factory function to create a standardized API error
 */
export function createApiError(
  status: number,
  message: string,
  code?: string,
  details?: Record<string, any>
): ApiError {
  return new ApiError({
    status,
    message,
    code,
    details,
  });
}
