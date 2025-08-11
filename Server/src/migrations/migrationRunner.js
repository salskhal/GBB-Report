import mongoose from "mongoose";
import {
  UserMigration,
  rollback as userRollback,
} from "./001_migrate_user_collection.js";
import {
  MDAMigration,
  rollback as mdaRollback,
} from "./002_migrate_mda_collection.js";
import {
  AdminMigration,
  rollback as adminRollback,
} from "./003_migrate_admin_collection.js";

/**
 * Migration Runner and Validation Script
 *
 * This script provides comprehensive migration management including:
 * - Running all migrations in sequence
 * - Validation of migration success and data integrity
 * - Rollback capabilities for each migration step
 * - Performance monitoring and progress tracking for large datasets
 * - Comprehensive error handling and logging
 *
 * Requirements: 6.1, 6.2, 5.5, 3.1
 */

class MigrationRunner {
  constructor() {
    this.migrations = [
      {
        name: "001_migrate_user_collection",
        class: UserMigration,
        rollback: userRollback,
        description: "Migrate User collection to username-based authentication",
      },
      {
        name: "002_migrate_mda_collection",
        class: MDAMigration,
        rollback: mdaRollback,
        description: "Migrate MDA collection to support multiple reports",
      },
      {
        name: "003_migrate_admin_collection",
        class: AdminMigration,
        rollback: adminRollback,
        description: "Migrate Admin collection for hierarchical roles",
      },
    ];
    this.migrationLog = [];
    this.performanceMetrics = {};
  }

  /**
   * Log migration progress and actions
   */
  log(message, level = "info") {
    const logEntry = {
      timestamp: new Date(),
      level,
      message,
      runner: "MigrationRunner",
    };
    this.migrationLog.push(logEntry);
    console.log(
      `[${level.toUpperCase()}] ${new Date().toISOString()} - ${message}`
    );
  }

  /**
   * Connect to database if not already connected
   */
  async ensureConnection() {
    if (mongoose.connection.readyState === 0) {
      this.log(
        "Database not connected. Please ensure database connection before running migrations.",
        "error"
      );
      throw new Error("Database connection required");
    }

    if (mongoose.connection.readyState !== 1) {
      this.log("Waiting for database connection...");
      await new Promise((resolve, reject) => {
        mongoose.connection.once("connected", resolve);
        mongoose.connection.once("error", reject);
        setTimeout(
          () => reject(new Error("Database connection timeout")),
          10000
        );
      });
    }

    this.log("Database connection confirmed");
  }

  /**
   * Create migration tracking collection
   */
  async initializeMigrationTracking() {
    const db = mongoose.connection.db;
    const migrationCollection = db.collection("migration_history");

    // Create index for migration tracking
    await migrationCollection.createIndex(
      { migration_name: 1 },
      { unique: true }
    );

    this.log("Migration tracking initialized");
    return migrationCollection;
  }

  /**
   * Check if migration has been completed
   */
  async isMigrationCompleted(migrationName) {
    const db = mongoose.connection.db;
    const migrationCollection = db.collection("migration_history");

    const record = await migrationCollection.findOne({
      migration_name: migrationName,
      status: "completed",
    });

    return !!record;
  }

  /**
   * Record migration completion
   */
  async recordMigrationCompletion(migrationName, result) {
    const db = mongoose.connection.db;
    const migrationCollection = db.collection("migration_history");

    const record = {
      migration_name: migrationName,
      status: result.success ? "completed" : "failed",
      executed_at: new Date(),
      duration_ms: result.duration,
      results: result.results,
      error: result.error || null,
      logs: result.logs || [],
    };

    await migrationCollection.replaceOne(
      { migration_name: migrationName },
      record,
      { upsert: true }
    );
  }

  /**
   * Validate system state before migrations
   */
  async validateSystemState() {
    this.log("Validating system state before migrations...");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    // Check required collections exist
    const requiredCollections = ["users", "mdas", "admins"];
    const missingCollections = requiredCollections.filter(
      (name) => !collectionNames.includes(name)
    );

    if (missingCollections.length > 0) {
      throw new Error(
        `Missing required collections: ${missingCollections.join(", ")}`
      );
    }

    // Check collection sizes for performance planning
    const collectionStats = {};
    for (const collectionName of requiredCollections) {
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments({});
      collectionStats[collectionName] = count;
      this.log(`Collection ${collectionName}: ${count} documents`);
    }

    this.performanceMetrics.collectionStats = collectionStats;
    this.log("System state validation completed");

    return collectionStats;
  }

  /**
   * Run all migrations in sequence
   */
  async runAllMigrations() {
    const startTime = Date.now();
    this.log("Starting complete migration process...");

    try {
      await this.ensureConnection();
      await this.initializeMigrationTracking();
      await this.validateSystemState();

      const results = [];

      for (const migration of this.migrations) {
        this.log(`\n=== Starting ${migration.name} ===`);
        this.log(`Description: ${migration.description}`);

        // Check if migration already completed
        const isCompleted = await this.isMigrationCompleted(migration.name);
        if (isCompleted) {
          this.log(
            `Migration ${migration.name} already completed, skipping...`
          );
          results.push({
            name: migration.name,
            success: true,
            skipped: true,
            message: "Already completed",
          });
          continue;
        }

        // Run migration
        const migrationStartTime = Date.now();
        const migrationInstance = new migration.class();
        const result = await migrationInstance.migrate();

        // Record result
        await this.recordMigrationCompletion(migration.name, result);

        results.push({
          name: migration.name,
          success: result.success,
          duration: result.duration,
          results: result.results,
          error: result.error,
        });

        if (!result.success) {
          this.log(
            `Migration ${migration.name} failed: ${result.error}`,
            "error"
          );
          throw new Error(
            `Migration ${migration.name} failed: ${result.error}`
          );
        }

        this.log(
          `=== Completed ${migration.name} in ${result.duration}ms ===\n`
        );
      }

      const totalDuration = Date.now() - startTime;
      this.performanceMetrics.totalDuration = totalDuration;

      this.log(`All migrations completed successfully in ${totalDuration}ms`);

      // Run final validation
      const validationResult = await this.validateAllMigrations();

      return {
        success: true,
        duration: totalDuration,
        migrations: results,
        validation: validationResult,
        performanceMetrics: this.performanceMetrics,
        logs: this.migrationLog,
      };
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      this.log(
        `Migration process failed after ${totalDuration}ms: ${error.message}`,
        "error"
      );

      return {
        success: false,
        error: error.message,
        duration: totalDuration,
        logs: this.migrationLog,
      };
    }
  }

  /**
   * Validate all migrations have been completed successfully
   */
  async validateAllMigrations() {
    this.log("Running comprehensive migration validation...");

    const db = mongoose.connection.db;
    const validationResults = {};

    // Validate User collection
    const userValidation = await this.validateUserMigration(db);
    validationResults.users = userValidation;

    // Validate MDA collection
    const mdaValidation = await this.validateMDAMigration(db);
    validationResults.mdas = mdaValidation;

    // Validate Admin collection
    const adminValidation = await this.validateAdminMigration(db);
    validationResults.admins = adminValidation;

    // Overall validation
    const allValid =
      userValidation.valid && mdaValidation.valid && adminValidation.valid;

    this.log(`Migration validation ${allValid ? "PASSED" : "FAILED"}`);

    return {
      valid: allValid,
      details: validationResults,
    };
  }

  /**
   * Validate User collection migration
   */
  async validateUserMigration(db) {
    const collection = db.collection("users");

    const total = await collection.countDocuments({});
    const withUsername = await collection.countDocuments({
      username: { $exists: true },
    });
    const withContactEmail = await collection.countDocuments({
      contactEmail: { $exists: true },
    });
    const withMdaReference = await collection.countDocuments({
      mdaReference: { $exists: true },
    });
    const withOldEmail = await collection.countDocuments({
      email: { $exists: true },
    });
    const withOldMdaId = await collection.countDocuments({
      mdaId: { $exists: true },
    });

    const valid =
      total === withUsername &&
      total === withContactEmail &&
      total === withMdaReference &&
      withOldEmail === 0 &&
      withOldMdaId === 0;

    return {
      valid,
      total,
      withUsername,
      withContactEmail,
      withMdaReference,
      withOldEmail,
      withOldMdaId,
    };
  }

  /**
   * Validate MDA collection migration
   */
  async validateMDAMigration(db) {
    const collection = db.collection("mdas");

    const total = await collection.countDocuments({});
    const withReports = await collection.countDocuments({
      reports: { $exists: true, $type: "array" },
    });
    const withOldReportUrl = await collection.countDocuments({
      reportUrl: { $exists: true },
    });

    const valid = total === withReports && withOldReportUrl === 0;

    return {
      valid,
      total,
      withReports,
      withOldReportUrl,
    };
  }

  /**
   * Validate Admin collection migration
   */
  async validateAdminMigration(db) {
    const collection = db.collection("admins");

    const total = await collection.countDocuments({});
    const withCanBeDeleted = await collection.countDocuments({
      canBeDeleted: { $exists: true },
    });
    const superAdmins = await collection.countDocuments({
      role: "superadmin",
      canBeDeleted: false,
    });
    const regularAdmins = await collection.countDocuments({ role: "admin" });

    const valid = total === withCanBeDeleted && superAdmins > 0;

    return {
      valid,
      total,
      withCanBeDeleted,
      superAdmins,
      regularAdmins,
    };
  }

  /**
   * Rollback all migrations in reverse order
   */
  async rollbackAllMigrations() {
    this.log("Starting complete rollback process...");

    try {
      await this.ensureConnection();

      const results = [];

      // Rollback in reverse order
      for (let i = this.migrations.length - 1; i >= 0; i--) {
        const migration = this.migrations[i];
        this.log(`\n=== Rolling back ${migration.name} ===`);

        try {
          const result = await migration.rollback();
          results.push({
            name: migration.name,
            success: result.success,
            error: result.error,
          });

          if (!result.success) {
            this.log(
              `Rollback ${migration.name} failed: ${result.error}`,
              "error"
            );
          } else {
            this.log(`=== Rollback ${migration.name} completed ===\n`);
          }
        } catch (error) {
          this.log(
            `Rollback ${migration.name} failed: ${error.message}`,
            "error"
          );
          results.push({
            name: migration.name,
            success: false,
            error: error.message,
          });
        }
      }

      // Clear migration history
      const db = mongoose.connection.db;
      const migrationCollection = db.collection("migration_history");
      await migrationCollection.deleteMany({});

      this.log("Complete rollback process finished");

      return {
        success: true,
        rollbacks: results,
        logs: this.migrationLog,
      };
    } catch (error) {
      this.log(`Rollback process failed: ${error.message}`, "error");
      return {
        success: false,
        error: error.message,
        logs: this.migrationLog,
      };
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus() {
    try {
      await this.ensureConnection();

      const db = mongoose.connection.db;
      const migrationCollection = db.collection("migration_history");

      const completedMigrations = await migrationCollection.find({}).toArray();
      const status = {};

      for (const migration of this.migrations) {
        const record = completedMigrations.find(
          (m) => m.migration_name === migration.name
        );
        status[migration.name] = {
          description: migration.description,
          completed: !!record,
          status: record?.status || "not_started",
          executed_at: record?.executed_at || null,
          duration_ms: record?.duration_ms || null,
        };
      }

      return {
        success: true,
        status,
        totalMigrations: this.migrations.length,
        completedMigrations: completedMigrations.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export the runner class
export { MigrationRunner };

// CLI execution support
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const runner = new MigrationRunner();

  switch (command) {
    case "rollback":
      runner
        .rollbackAllMigrations()
        .then((result) => {
          console.log("Rollback result:", JSON.stringify(result, null, 2));
          process.exit(result.success ? 0 : 1);
        })
        .catch((error) => {
          console.error("Rollback error:", error);
          process.exit(1);
        });
      break;

    case "status":
      runner
        .getMigrationStatus()
        .then((result) => {
          console.log("Migration status:", JSON.stringify(result, null, 2));
          process.exit(result.success ? 0 : 1);
        })
        .catch((error) => {
          console.error("Status error:", error);
          process.exit(1);
        });
      break;

    case "validate":
      runner
        .ensureConnection()
        .then(() => runner.validateAllMigrations())
        .then((result) => {
          console.log("Validation result:", JSON.stringify(result, null, 2));
          process.exit(result.valid ? 0 : 1);
        })
        .catch((error) => {
          console.error("Validation error:", error);
          process.exit(1);
        });
      break;

    default:
      runner
        .runAllMigrations()
        .then((result) => {
          console.log("Migration result:", JSON.stringify(result, null, 2));
          process.exit(result.success ? 0 : 1);
        })
        .catch((error) => {
          console.error("Migration error:", error);
          process.exit(1);
        });
  }
}
