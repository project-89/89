/**
 * Model Control Program (MCP) System
 *
 * This system manages programmable workflows and templates for automation tasks.
 * It initializes the MCP runtime environment and sets up necessary services.
 */

import { COLLECTIONS } from './constants';
import { getDb } from './utils/mongodb';

const LOG_PREFIX = '[MCP System]';

/**
 * Initialize the MCP system
 *
 * This function sets up the MCP runtime environment, loads templates,
 * and prepares the system for executing programmatic workflows.
 */
export async function initializeMCPSystem(): Promise<void> {
  try {
    console.log(`${LOG_PREFIX} Initializing MCP system...`);

    const db = await getDb();

    // Verify MCP collections exist and are accessible
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    const mcpCollections = [
      COLLECTIONS.MCP_PROGRAMS,
      COLLECTIONS.MCP_EXECUTIONS,
      COLLECTIONS.MCP_TEMPLATES,
    ];

    // Check if MCP collections exist
    const missingCollections = mcpCollections.filter(
      (collection) => !collectionNames.includes(collection)
    );

    if (missingCollections.length > 0) {
      console.log(
        `${LOG_PREFIX} Creating missing MCP collections: ${missingCollections.join(', ')}`
      );

      // Create indexes for MCP collections
      await Promise.all([
        // MCP Templates indexes
        db.collection(COLLECTIONS.MCP_TEMPLATES).createIndex({ name: 1 }),
        db.collection(COLLECTIONS.MCP_TEMPLATES).createIndex({ category: 1 }),
        db.collection(COLLECTIONS.MCP_TEMPLATES).createIndex({ createdBy: 1 }),
        db.collection(COLLECTIONS.MCP_TEMPLATES).createIndex({ isSystem: 1 }),

        // MCP Programs indexes
        db.collection(COLLECTIONS.MCP_PROGRAMS).createIndex({ templateId: 1 }),
        db.collection(COLLECTIONS.MCP_PROGRAMS).createIndex({ createdBy: 1 }),
        db.collection(COLLECTIONS.MCP_PROGRAMS).createIndex({ status: 1 }),

        // MCP Executions indexes
        db.collection(COLLECTIONS.MCP_EXECUTIONS).createIndex({ programId: 1 }),
        db.collection(COLLECTIONS.MCP_EXECUTIONS).createIndex({ status: 1 }),
        db
          .collection(COLLECTIONS.MCP_EXECUTIONS)
          .createIndex({ createdAt: -1 }),
        db
          .collection(COLLECTIONS.MCP_EXECUTIONS)
          .createIndex({ completedAt: 1 }),
      ]);
    }

    // Verify templates are seeded (this is done in initDatabases)
    const templateCount = await db
      .collection(COLLECTIONS.MCP_TEMPLATES)
      .countDocuments();
    console.log(`${LOG_PREFIX} Found ${templateCount} MCP templates`);

    // Initialize MCP runtime (placeholder for future runtime system)
    await initializeMCPRuntime();

    console.log(`${LOG_PREFIX} MCP system initialized successfully`);
  } catch (error) {
    console.error(`${LOG_PREFIX} Failed to initialize MCP system:`, error);
    throw error;
  }
}

/**
 * Initialize the MCP runtime environment
 *
 * This is a placeholder for the future MCP runtime system that will
 * execute MCP programs and manage their lifecycle.
 */
async function initializeMCPRuntime(): Promise<void> {
  try {
    console.log(`${LOG_PREFIX} Initializing MCP runtime...`);

    // TODO: Initialize the MCP execution engine
    // - Set up worker processes for executing MCP programs
    // - Initialize the scheduling system for timed executions
    // - Set up monitoring and logging for MCP executions
    // - Initialize security sandbox for safe code execution

    console.log(`${LOG_PREFIX} MCP runtime initialized (basic mode)`);
  } catch (error) {
    console.error(`${LOG_PREFIX} Failed to initialize MCP runtime:`, error);
    throw error;
  }
}

/**
 * Get MCP system status
 *
 * Returns the current status of the MCP system for health checks
 */
export async function getMCPSystemStatus(): Promise<{
  initialized: boolean;
  templatesCount: number;
  programsCount: number;
  activeExecutions: number;
}> {
  try {
    const db = await getDb();

    const [templatesCount, programsCount, activeExecutions] = await Promise.all(
      [
        db.collection(COLLECTIONS.MCP_TEMPLATES).countDocuments(),
        db.collection(COLLECTIONS.MCP_PROGRAMS).countDocuments(),
        db
          .collection(COLLECTIONS.MCP_EXECUTIONS)
          .countDocuments({ status: 'running' }),
      ]
    );

    return {
      initialized: true,
      templatesCount,
      programsCount,
      activeExecutions,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} Error getting MCP system status:`, error);
    return {
      initialized: false,
      templatesCount: 0,
      programsCount: 0,
      activeExecutions: 0,
    };
  }
}
