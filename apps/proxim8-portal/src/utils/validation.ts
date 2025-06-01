import { ValidationError } from "@/types/error";

/**
 * Validation rule interface for client-side validation
 */
export interface ValidationRule {
  required?: boolean;
  type?: "string" | "number" | "boolean" | "object" | "array";
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  validator?: (value: any) => boolean;
  errorMessage?: string;
}

/**
 * Validation schema for form validation
 */
export interface ValidationSchema {
  [field: string]: ValidationRule;
}

/**
 * Validation result for a single field
 */
export interface FieldValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validation results for a form
 */
export interface ValidationResults {
  isValid: boolean;
  fields: {
    [field: string]: FieldValidationResult;
  };
  getFirstError: () => string | null;
}

/**
 * Validate a single form field
 */
export function validateField(
  value: any,
  rule: ValidationRule,
  fieldName: string
): FieldValidationResult {
  // Check if the field is required but missing
  if (
    rule.required &&
    (value === undefined || value === null || value === "")
  ) {
    return {
      valid: false,
      message: rule.errorMessage || `${fieldName} is required`,
    };
  }

  // Skip further validation if the field is not present and not required
  if (
    (value === undefined || value === null || value === "") &&
    !rule.required
  ) {
    return { valid: true };
  }

  // Check the type
  if (rule.type) {
    const actualType = Array.isArray(value) ? "array" : typeof value;
    if (actualType !== rule.type) {
      return {
        valid: false,
        message: rule.errorMessage || `${fieldName} must be a ${rule.type}`,
      };
    }
  }

  // Check min length for strings and arrays
  if (
    rule.minLength !== undefined &&
    (typeof value === "string" || Array.isArray(value)) &&
    value.length < rule.minLength
  ) {
    return {
      valid: false,
      message:
        rule.errorMessage ||
        `${fieldName} must be at least ${rule.minLength} characters long`,
    };
  }

  // Check max length for strings and arrays
  if (
    rule.maxLength !== undefined &&
    (typeof value === "string" || Array.isArray(value)) &&
    value.length > rule.maxLength
  ) {
    return {
      valid: false,
      message:
        rule.errorMessage ||
        `${fieldName} must be at most ${rule.maxLength} characters long`,
    };
  }

  // Check min value for numbers
  if (rule.min !== undefined && typeof value === "number" && value < rule.min) {
    return {
      valid: false,
      message: rule.errorMessage || `${fieldName} must be at least ${rule.min}`,
    };
  }

  // Check max value for numbers
  if (rule.max !== undefined && typeof value === "number" && value > rule.max) {
    return {
      valid: false,
      message: rule.errorMessage || `${fieldName} must be at most ${rule.max}`,
    };
  }

  // Check pattern for strings
  if (rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
    return {
      valid: false,
      message: rule.errorMessage || `${fieldName} has an invalid format`,
    };
  }

  // Custom validator
  if (rule.validator && !rule.validator(value)) {
    return {
      valid: false,
      message: rule.errorMessage || `${fieldName} is invalid`,
    };
  }

  return { valid: true };
}

/**
 * Validate a form object against a schema
 */
export function validateForm(
  formData: Record<string, any>,
  schema: ValidationSchema
): ValidationResults {
  const results: ValidationResults = {
    isValid: true,
    fields: {},
    getFirstError: () => {
      for (const field in results.fields) {
        if (!results.fields[field].valid && results.fields[field].message) {
          return results.fields[field].message!;
        }
      }
      return null;
    },
  };

  // Validate each field
  for (const [field, rule] of Object.entries(schema)) {
    const fieldResult = validateField(formData[field], rule, field);
    results.fields[field] = fieldResult;

    // Update overall validity
    if (!fieldResult.valid) {
      results.isValid = false;
    }
  }

  return results;
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  url: /^(https?:\/\/)?([\w\d-]+\.)+[\w\d]{2,}(\/[\w\d-_.~%]*)*(\?.*)?$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^[0-9]+$/,
  ethAddress: /^0x[a-fA-F0-9]{40}$/,
  solanaAddress: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  ipfsUrl: /^(ipfs:\/\/|https:\/\/ipfs\.io\/ipfs\/)[a-zA-Z0-9]{46}$/,
  username: /^[a-zA-Z0-9_-]{3,16}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
};

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  login: {
    email: {
      required: true,
      type: "string" as const,
      pattern: ValidationPatterns.email,
      errorMessage: "Please enter a valid email address",
    },
    password: {
      required: true,
      type: "string" as const,
      minLength: 8,
      errorMessage: "Password must be at least 8 characters long",
    },
  },
  profile: {
    username: {
      required: true,
      type: "string" as const,
      minLength: 3,
      maxLength: 30,
      pattern: ValidationPatterns.username,
      errorMessage: "Username must be 3-30 alphanumeric characters",
    },
    bio: {
      required: false,
      type: "string" as const,
      maxLength: 500,
      errorMessage: "Bio cannot exceed 500 characters",
    },
    email: {
      required: false,
      type: "string" as const,
      pattern: ValidationPatterns.email,
      errorMessage: "Please enter a valid email address",
    },
    website: {
      required: false,
      type: "string" as const,
      pattern: ValidationPatterns.url,
      errorMessage: "Please enter a valid URL",
    },
  },
};

/**
 * Convert a ValidationError from the API to a user-friendly format
 */
// export function formatValidationError(error: ValidationError): string {
//   if (error.fields && Object.keys(error.fields).length > 0) {
//     // Return the first validation error message
//     const firstField = Object.keys(error.fields)[0];
//     return error.fields[firstField].message || error.message;
//   }

//   return error.message || "Validation failed";
// }

/**
 * Check if the given error is a validation error
 */
export function isValidationError(error: any): error is ValidationError {
  return (
    error &&
    typeof error === "object" &&
    error.code === "validation_error" &&
    error.fields &&
    typeof error.fields === "object"
  );
}
