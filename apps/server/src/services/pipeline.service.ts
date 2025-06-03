import { ERROR_MESSAGES } from '../constants';
import {
  ClonePipelineConfigRequest,
  CreatePipelineConfigRequest,
  DeletePipelineConfigRequest,
  GetPipelineConfigRequest,
  GetPipelineConfigsRequest,
  GetSystemPipelineConfigsRequest,
  PipelineConfig,
  PipelineConfigDocument,
  PipelineConfigListResponse,
  PipelineExecutionContext,
  PipelineExecutionResult,
  PipelineValidationResponse,
  SystemPipelineConfigsResponse,
  toPipelineConfig,
  UpdatePipelineConfigRequest,
  ValidatePipelineConfigRequest,
} from '../schemas';
import { ApiError, idFilter } from '../utils';
import { getDb } from '../utils/mongodb';

const LOG_PREFIX = '[Pipeline Service]';

// Add Proxim8 collections to constants
const PROXIM8_COLLECTIONS = {
  PIPELINE_CONFIGS: 'proxim8.pipeline-configs',
  PIPELINE_EXECUTIONS: 'proxim8.pipeline-executions',
} as const;

/**
 * Create a new pipeline configuration
 */
export const createPipelineConfig = async (
  request: CreatePipelineConfigRequest,
  createdBy: string
): Promise<PipelineConfig> => {
  try {
    console.log(`${LOG_PREFIX} Creating pipeline config:`, request.body.name);
    const db = await getDb();

    // Validate pipeline configuration
    const validationResult = await validatePipelineConfigInternal({
      middlewares: request.body.middlewares || [],
      steps: request.body.steps || [],
      output: request.body.output,
    });

    if (!validationResult.valid) {
      throw new ApiError(
        400,
        `Invalid pipeline configuration: ${validationResult.errors[0]?.message}`
      );
    }

    const now = new Date();

    // Create pipeline config document
    const configDoc: Omit<PipelineConfigDocument, 'id'> = {
      name: request.body.name,
      description: request.body.description,
      isSystem: false,
      createdBy,
      middlewares: request.body.middlewares || [],
      defaultOptions: request.body.defaultOptions || {},
      steps: request.body.steps || [],
      output: request.body.output,
      createdAt: now,
      updatedAt: now,
    };

    // Insert into database
    const result = await db
      .collection(PROXIM8_COLLECTIONS.PIPELINE_CONFIGS)
      .insertOne(configDoc);
    const configId = result.insertedId.toString();

    console.log(`${LOG_PREFIX} Pipeline config created:`, configId);

    return toPipelineConfig({ ...configDoc, _id: result.insertedId }, configId);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error creating pipeline config:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get pipeline configuration by ID
 */
export const getPipelineConfig = async (
  request: GetPipelineConfigRequest
): Promise<PipelineConfig | null> => {
  try {
    console.log(
      `${LOG_PREFIX} Getting pipeline config:`,
      request.params.configId
    );
    const db = await getDb();

    const filter = idFilter(request.params.configId);
    if (!filter) {
      return null;
    }

    const configDoc = await db
      .collection(PROXIM8_COLLECTIONS.PIPELINE_CONFIGS)
      .findOne(filter);
    if (!configDoc) {
      return null;
    }

    return toPipelineConfig(configDoc, request.params.configId);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting pipeline config:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get pipeline configurations with pagination and filtering
 */
export const getPipelineConfigs = async (
  request: GetPipelineConfigsRequest,
  userId?: string
): Promise<PipelineConfigListResponse> => {
  try {
    console.log(`${LOG_PREFIX} Getting pipeline configs`);
    const db = await getDb();

    const limit = request.query?.limit || 20;
    const offset = request.query?.offset || 0;

    // Build query
    const query: any = {};
    if (request.query?.isSystem !== undefined) {
      query.isSystem = request.query.isSystem;
    }
    if (request.query?.createdBy) {
      query.createdBy = request.query.createdBy;
    } else if (userId && !request.query?.isSystem) {
      // If no specific creator specified and not looking for system configs, show user's configs
      query.createdBy = userId;
    }
    if (request.query?.name) {
      query.name = new RegExp(request.query.name, 'i');
    }

    // Get total count
    const total = await db
      .collection(PROXIM8_COLLECTIONS.PIPELINE_CONFIGS)
      .countDocuments(query);

    // Get paginated results
    const configDocs = await db
      .collection(PROXIM8_COLLECTIONS.PIPELINE_CONFIGS)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const configs = configDocs.map((doc) =>
      toPipelineConfig(doc, doc._id.toString())
    );

    return {
      configs,
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting pipeline configs:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Update pipeline configuration
 */
export const updatePipelineConfig = async (
  request: UpdatePipelineConfigRequest,
  userId: string
): Promise<PipelineConfig> => {
  try {
    console.log(
      `${LOG_PREFIX} Updating pipeline config:`,
      request.params.configId
    );
    const db = await getDb();

    // Get existing config
    const filter = idFilter(request.params.configId);
    if (!filter) {
      throw new ApiError(404, 'Pipeline config not found');
    }

    const existingDoc = await db
      .collection(PROXIM8_COLLECTIONS.PIPELINE_CONFIGS)
      .findOne(filter);
    if (!existingDoc) {
      throw new ApiError(404, 'Pipeline config not found');
    }

    // Verify ownership (unless admin)
    if (!existingDoc.isSystem && existingDoc.createdBy !== userId) {
      throw new ApiError(403, 'Not authorized to update this pipeline config');
    }

    // Validate updated configuration if structure fields are being changed
    if (request.body.middlewares || request.body.steps || request.body.output) {
      const validationResult = await validatePipelineConfigInternal({
        middlewares: request.body.middlewares || existingDoc.middlewares,
        steps: request.body.steps || existingDoc.steps,
        output: request.body.output || existingDoc.output,
      });

      if (!validationResult.valid) {
        throw new ApiError(
          400,
          `Invalid pipeline configuration: ${validationResult.errors[0]?.message}`
        );
      }
    }

    const now = new Date();
    const updateData: any = {
      updatedAt: now,
    };

    // Add fields that are being updated
    if (request.body.name) updateData.name = request.body.name;
    if (request.body.description !== undefined)
      updateData.description = request.body.description;
    if (request.body.middlewares)
      updateData.middlewares = request.body.middlewares;
    if (request.body.defaultOptions)
      updateData.defaultOptions = request.body.defaultOptions;
    if (request.body.steps) updateData.steps = request.body.steps;
    if (request.body.output) updateData.output = request.body.output;

    // Update config
    await db
      .collection(PROXIM8_COLLECTIONS.PIPELINE_CONFIGS)
      .updateOne(filter, { $set: updateData });

    // Get updated config
    const updatedDoc = await db
      .collection(PROXIM8_COLLECTIONS.PIPELINE_CONFIGS)
      .findOne(filter);
    return toPipelineConfig(updatedDoc, request.params.configId);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error updating pipeline config:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Delete pipeline configuration
 */
export const deletePipelineConfig = async (
  request: DeletePipelineConfigRequest,
  userId: string
): Promise<boolean> => {
  try {
    console.log(
      `${LOG_PREFIX} Deleting pipeline config:`,
      request.params.configId
    );
    const db = await getDb();

    // Get config first to verify ownership
    const filter = idFilter(request.params.configId);
    if (!filter) {
      throw new ApiError(404, 'Pipeline config not found');
    }

    const configDoc = await db
      .collection(PROXIM8_COLLECTIONS.PIPELINE_CONFIGS)
      .findOne(filter);
    if (!configDoc) {
      throw new ApiError(404, 'Pipeline config not found');
    }

    // Verify ownership (system configs cannot be deleted by users)
    if (configDoc.isSystem) {
      throw new ApiError(403, 'Cannot delete system pipeline config');
    }
    if (configDoc.createdBy !== userId) {
      throw new ApiError(403, 'Not authorized to delete this pipeline config');
    }

    // Delete config
    const result = await db
      .collection(PROXIM8_COLLECTIONS.PIPELINE_CONFIGS)
      .deleteOne(filter);

    return result.deletedCount > 0;
  } catch (error) {
    console.error(`${LOG_PREFIX} Error deleting pipeline config:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Clone existing pipeline configuration
 */
export const clonePipelineConfig = async (
  request: ClonePipelineConfigRequest,
  userId: string
): Promise<PipelineConfig> => {
  try {
    console.log(
      `${LOG_PREFIX} Cloning pipeline config:`,
      request.params.configId
    );
    const db = await getDb();

    // Get source config
    const filter = idFilter(request.params.configId);
    if (!filter) {
      throw new ApiError(404, 'Pipeline config not found');
    }

    const sourceDoc = await db
      .collection(PROXIM8_COLLECTIONS.PIPELINE_CONFIGS)
      .findOne(filter);
    if (!sourceDoc) {
      throw new ApiError(404, 'Pipeline config not found');
    }

    const now = new Date();

    // Create cloned config
    const clonedDoc: Omit<PipelineConfigDocument, 'id'> = {
      name: request.body.name,
      description: request.body.description || `Cloned from ${sourceDoc.name}`,
      isSystem: false,
      createdBy: userId,
      middlewares: sourceDoc.middlewares,
      defaultOptions: sourceDoc.defaultOptions,
      steps: sourceDoc.steps,
      output: sourceDoc.output,
      createdAt: now,
      updatedAt: now,
    };

    // Insert cloned config
    const result = await db
      .collection(PROXIM8_COLLECTIONS.PIPELINE_CONFIGS)
      .insertOne(clonedDoc);
    const clonedId = result.insertedId.toString();

    console.log(`${LOG_PREFIX} Pipeline config cloned:`, clonedId);

    return toPipelineConfig({ ...clonedDoc, _id: result.insertedId }, clonedId);
  } catch (error) {
    console.error(`${LOG_PREFIX} Error cloning pipeline config:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Validate pipeline configuration
 */
export const validatePipelineConfig = async (
  request: ValidatePipelineConfigRequest
): Promise<PipelineValidationResponse> => {
  try {
    console.log(`${LOG_PREFIX} Validating pipeline config`);

    return await validatePipelineConfigInternal({
      middlewares: request.body.middlewares,
      steps: request.body.steps,
      output: request.body.output,
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} Error validating pipeline config:`, error);
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Get system pipeline configurations
 */
export const getSystemPipelineConfigs = async (
  request: GetSystemPipelineConfigsRequest
): Promise<SystemPipelineConfigsResponse> => {
  try {
    console.log(`${LOG_PREFIX} Getting system pipeline configs`);
    const db = await getDb();

    // Get all system configs
    const configDocs = await db
      .collection(PROXIM8_COLLECTIONS.PIPELINE_CONFIGS)
      .find({ isSystem: true })
      .sort({ name: 1 })
      .toArray();

    const configs = configDocs.map((doc) =>
      toPipelineConfig(doc, doc._id.toString())
    );

    // TODO: Determine default config ID from system settings
    const defaultConfig = configs.length > 0 ? configs[0].id : '';

    return {
      configs,
      defaultConfig,
    };
  } catch (error) {
    console.error(
      `${LOG_PREFIX} Error getting system pipeline configs:`,
      error
    );
    throw ApiError.from(error, 500, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

/**
 * Internal validation helper
 */
const validatePipelineConfigInternal = async (config: {
  middlewares: any[];
  steps: any[];
  output?: any;
}): Promise<PipelineValidationResponse> => {
  const errors: Array<{ field: string; message: string; code: string }> = [];
  const warnings: Array<{ field: string; message: string; code: string }> = [];

  // Validate middlewares
  if (!Array.isArray(config.middlewares)) {
    errors.push({
      field: 'middlewares',
      message: 'Middlewares must be an array',
      code: 'INVALID_TYPE',
    });
  } else {
    config.middlewares.forEach((middleware, index) => {
      if (!middleware.id || !middleware.name) {
        errors.push({
          field: `middlewares[${index}]`,
          message: 'Middleware must have id and name',
          code: 'MISSING_REQUIRED_FIELD',
        });
      }
    });
  }

  // Validate steps
  if (!Array.isArray(config.steps)) {
    errors.push({
      field: 'steps',
      message: 'Steps must be an array',
      code: 'INVALID_TYPE',
    });
  } else if (config.steps.length === 0) {
    warnings.push({
      field: 'steps',
      message: 'Pipeline has no steps defined',
      code: 'EMPTY_STEPS',
    });
  } else {
    config.steps.forEach((step, index) => {
      if (!step.id || !step.type) {
        errors.push({
          field: `steps[${index}]`,
          message: 'Step must have id and type',
          code: 'MISSING_REQUIRED_FIELD',
        });
      }
    });
  }

  // Validate output configuration
  if (config.output) {
    if (!config.output.resolution) {
      warnings.push({
        field: 'output.resolution',
        message: 'No resolution specified, using default',
        code: 'MISSING_OPTIONAL_FIELD',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Execute pipeline (internal use by video generation system)
 */
export const executePipeline = async (
  context: PipelineExecutionContext
): Promise<PipelineExecutionResult> => {
  try {
    console.log(`${LOG_PREFIX} Executing pipeline:`, context.configId);
    const db = await getDb();

    const startTime = Date.now();

    // Get pipeline config
    const filter = idFilter(context.configId);
    if (!filter) {
      throw new Error('Invalid pipeline config ID');
    }

    const configDoc = await db
      .collection(PROXIM8_COLLECTIONS.PIPELINE_CONFIGS)
      .findOne(filter);
    if (!configDoc) {
      throw new Error('Pipeline config not found');
    }

    // TODO: Implement actual pipeline execution
    // This would involve running each step in sequence with the provided context

    const executionTime = Date.now() - startTime;

    // Record execution
    const executionDoc = {
      jobId: context.jobId,
      configId: context.configId,
      userId: context.userId,
      context,
      result: {
        jobId: context.jobId,
        success: true,
        outputs: {
          imagePath: '/tmp/generated-image.jpg',
          videoPath: '/tmp/generated-video.mp4',
          thumbnailPath: '/tmp/generated-thumbnail.jpg',
        },
        executionTime,
        stepsExecuted: configDoc.steps.map((step: any) => step.id),
      },
      createdAt: new Date(),
    };

    await db
      .collection(PROXIM8_COLLECTIONS.PIPELINE_EXECUTIONS)
      .insertOne(executionDoc);

    console.log(
      `${LOG_PREFIX} Pipeline executed successfully in ${executionTime}ms`
    );

    return executionDoc.result;
  } catch (error) {
    console.error(`${LOG_PREFIX} Error executing pipeline:`, error);
    const executionTime = Date.now();

    return {
      jobId: context.jobId,
      success: false,
      outputs: {},
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime,
      stepsExecuted: [],
    };
  }
};

// Export collection constants
export { PROXIM8_COLLECTIONS };
