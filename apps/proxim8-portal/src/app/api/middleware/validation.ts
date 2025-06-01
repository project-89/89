import { NextRequest, NextResponse } from "next/server";

/**
 * Interface for validation rules
 */
interface ValidationRules {
  [key: string]: {
    required?: boolean;
    type?: string;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    validator?: (value: any) => boolean;
    errorMessage?: string;
  };
}

/**
 * Middleware for validating API request body
 */
export async function validateBody(
  req: NextRequest,
  rules: ValidationRules,
  handler: (req: NextRequest, body: any) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Parse the request body
    const body = await req.json();

    // Validate the body against the rules
    const validationErrors = validateObject(body, rules);

    // If there are validation errors, return a 400 response
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // If validation passes, call the handler
    return handler(req, body);
  } catch (error) {
    console.error("[Validation Middleware] Error parsing request body:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

/**
 * Middleware for validating API request query parameters
 */
export async function validateQuery(
  req: NextRequest,
  rules: ValidationRules,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get the query parameters
    const query: Record<string, any> = {};
    for (const [key, value] of req.nextUrl.searchParams.entries()) {
      query[key] = value;
    }

    // Validate the query against the rules
    const validationErrors = validateObject(query, rules);

    // If there are validation errors, return a 400 response
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // If validation passes, call the handler
    return handler(req);
  } catch (error) {
    console.error("[Validation Middleware] Error validating query:", error);
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 }
    );
  }
}

/**
 * Validate an object against validation rules
 */
function validateObject(
  obj: Record<string, any>,
  rules: ValidationRules
): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];

  // Check each field against its rules
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = obj[field];

    // Check if the field is required but missing
    if (
      fieldRules.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push({
        field,
        message: fieldRules.errorMessage || `${field} is required`,
      });
      continue;
    }

    // Skip further validation if the field is not present
    if (value === undefined || value === null) {
      continue;
    }

    // Check the type
    if (fieldRules.type && typeof value !== fieldRules.type) {
      errors.push({
        field,
        message:
          fieldRules.errorMessage || `${field} must be a ${fieldRules.type}`,
      });
    }

    // Check min length for strings and arrays
    if (
      fieldRules.minLength !== undefined &&
      (typeof value === "string" || Array.isArray(value)) &&
      value.length < fieldRules.minLength
    ) {
      errors.push({
        field,
        message:
          fieldRules.errorMessage ||
          `${field} must be at least ${fieldRules.minLength} characters long`,
      });
    }

    // Check max length for strings and arrays
    if (
      fieldRules.maxLength !== undefined &&
      (typeof value === "string" || Array.isArray(value)) &&
      value.length > fieldRules.maxLength
    ) {
      errors.push({
        field,
        message:
          fieldRules.errorMessage ||
          `${field} must be at most ${fieldRules.maxLength} characters long`,
      });
    }

    // Check pattern for strings
    if (
      fieldRules.pattern &&
      typeof value === "string" &&
      !fieldRules.pattern.test(value)
    ) {
      errors.push({
        field,
        message: fieldRules.errorMessage || `${field} has an invalid format`,
      });
    }

    // Custom validator
    if (fieldRules.validator && !fieldRules.validator(value)) {
      errors.push({
        field,
        message: fieldRules.errorMessage || `${field} is invalid`,
      });
    }
  }

  return errors;
}
