/**
 * Utility to convert Zod schemas to Mongoose schemas
 * This is a simplified version - you might want to use a library like zod-mongoose
 */

import { Schema, SchemaDefinition, SchemaDefinitionType } from 'mongoose';
import { z } from 'zod';

type MongooseSchemaType = SchemaDefinitionType<any> | Schema;

/**
 * Convert a Zod schema to a Mongoose schema definition
 */
export function zodToMongooseDefinition(zodSchema: z.ZodType<any>): SchemaDefinition {
  const definition: SchemaDefinition = {};
  
  if (zodSchema instanceof z.ZodObject) {
    const shape = zodSchema.shape;
    
    for (const [key, value] of Object.entries(shape)) {
      definition[key] = zodTypeToMongooseType(value as z.ZodType<any>);
    }
  }
  
  return definition;
}

/**
 * Convert a single Zod type to a Mongoose type definition
 */
function zodTypeToMongooseType(zodType: z.ZodType<any>): MongooseSchemaType {
  // Handle optional types
  if (zodType instanceof z.ZodOptional) {
    const innerType = zodTypeToMongooseType(zodType.unwrap());
    if (typeof innerType === 'object' && !Array.isArray(innerType)) {
      return { ...innerType, required: false };
    }
    return innerType;
  }
  
  // Handle default types
  if (zodType instanceof z.ZodDefault) {
    const innerType = zodTypeToMongooseType(zodType._def.innerType);
    const defaultValue = zodType._def.defaultValue();
    
    if (typeof innerType === 'object' && !Array.isArray(innerType)) {
      return { ...innerType, default: defaultValue };
    }
    return { type: innerType, default: defaultValue };
  }
  
  // Handle string types
  if (zodType instanceof z.ZodString) {
    const checks = (zodType as any)._def.checks || [];
    const result: any = { type: String, required: true };
    
    for (const check of checks) {
      if (check.kind === 'min') result.minlength = check.value;
      if (check.kind === 'max') result.maxlength = check.value;
    }
    
    return result;
  }
  
  // Handle number types
  if (zodType instanceof z.ZodNumber) {
    const checks = (zodType as any)._def.checks || [];
    const result: any = { type: Number, required: true };
    
    for (const check of checks) {
      if (check.kind === 'min') result.min = check.value;
      if (check.kind === 'max') result.max = check.value;
    }
    
    return result;
  }
  
  // Handle boolean types
  if (zodType instanceof z.ZodBoolean) {
    return { type: Boolean, required: true };
  }
  
  // Handle date types
  if (zodType instanceof z.ZodDate) {
    return { type: Date, required: true };
  }
  
  // Handle enum types
  if (zodType instanceof z.ZodEnum) {
    return {
      type: String,
      enum: zodType._def.values,
      required: true
    };
  }
  
  // Handle array types
  if (zodType instanceof z.ZodArray) {
    const elementType = zodTypeToMongooseType(zodType._def.type);
    return [{
      ...elementType,
      _id: false // Don't create _id for array elements by default
    }];
  }
  
  // Handle object types (nested schemas)
  if (zodType instanceof z.ZodObject) {
    const nestedDefinition = zodToMongooseDefinition(zodType);
    return new Schema(nestedDefinition, { _id: false });
  }
  
  // Handle any type
  if (zodType instanceof z.ZodAny) {
    return Schema.Types.Mixed;
  }
  
  // Default fallback
  return Schema.Types.Mixed;
}

/**
 * Create a Mongoose schema from a Zod schema
 */
export function createMongooseSchema<T>(
  zodSchema: z.ZodType<T>,
  options?: any
): Schema {
  const definition = zodToMongooseDefinition(zodSchema);
  return new Schema(definition, options);
}

/**
 * Example usage:
 * 
 * const UserZodSchema = z.object({
 *   name: z.string().min(1).max(100),
 *   email: z.string().email(),
 *   age: z.number().min(0).max(150).optional(),
 *   isActive: z.boolean().default(true),
 *   roles: z.array(z.enum(['user', 'admin'])),
 *   profile: z.object({
 *     bio: z.string().optional(),
 *     avatar: z.string().url().optional()
 *   })
 * });
 * 
 * const UserMongooseSchema = createMongooseSchema(UserZodSchema, {
 *   timestamps: true,
 *   methods: {
 *     // Add your methods here
 *   }
 * });
 * 
 * export const UserModel = mongoose.model('User', UserMongooseSchema);
 * export type User = z.infer<typeof UserZodSchema>;
 */