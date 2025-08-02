#!/usr/bin/env node

/**
 * Migration CLI Tool
 * 
 * Simple command-line interface for running database migrations
 * Usage: node migrate.js [command]
 * 
 * Commands:
 *   run      - Run all migrations (default)
 *   status   - Show migration status
 *   validate - Validate migration results
 *   rollback - Rollback all migrations
 *   help     - Show this help message
 */

import mongoose from "mongoose";
import { MigrationRunner } from "./migrationRunner.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env") });

class MigrationCLI {
  constructor() {
    this.runner = new MigrationRunner();
  }

  /**
   * Connect to database
   */
  async connectDatabase() {
    try {
      const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/mda_system";
      
      console.log("Connecting to database...");
      await mongoose.connect(mongoUri);
      console.log("Database connected successfully");
      
    } catch (error) {
      console.error("Database connection failed:", error.message);
      process.exit(1);
    }
  }

  /**
   * Disconnect from database
   */
  async disconnectDatabase() {
    try {
      await mongoose.disconnect();
      console.log("Database disconnected");
    } catch (error) {
      console.error("Error disconnecting from database:", error.message);
    }
  }

  /**
   * Show help message
   */
  showHelp() {
    console.log(`
MDA System Database Migration Tool

Usage: node migrate.js [command]

Commands:
  run      Run all migrations (default)
  status   Show migration status
  validate Validate migration results
  rollback Rollback all migrations
  help     Show this help message

Examples:
  node migrate.js              # Run all migrations
  node migrate.js run          # Run all migrations
  node migrate.js status       # Check migration status
  node migrate.js validate     # Validate migrations
  node migrate.js rollback     # Rollback all migrations

Environment Variables:
  MONGO_URI    MongoDB connection string (default: mongodb://localhost:27017/mda_system)

Note: Always backup your database before running migrations!
    `);
  }

  /**
   * Run migrations
   */
  async runMigrations() {
    console.log("=".repeat(60));
    console.log("Starting MDA System Database Migration");
    console.log("=".repeat(60));
    
    try {
      const result = await this.runner.runAllMigrations();
      
      if (result.success) {
        console.log("\n" + "=".repeat(60));
        console.log("✅ All migrations completed successfully!");
        console.log("=".repeat(60));
        
        if (result.migrations) {
          console.log("\nMigration Summary:");
          result.migrations.forEach(migration => {
            const status = migration.success ? "✅ SUCCESS" : "❌ FAILED";
            const duration = migration.duration ? `(${migration.duration}ms)` : "";
            console.log(`  ${migration.name}: ${status} ${duration}`);
          });
        }
        
        if (result.performanceMetrics) {
          console.log(`\nTotal Duration: ${result.performanceMetrics.totalDuration}ms`);
        }
        
      } else {
        console.log("\n" + "=".repeat(60));
        console.log("❌ Migration failed!");
        console.log("=".repeat(60));
        console.log(`Error: ${result.error}`);
        process.exit(1);
      }
      
    } catch (error) {
      console.error("\n❌ Migration process failed:", error.message);
      process.exit(1);
    }
  }

  /**
   * Show migration status
   */
  async showStatus() {
    console.log("Checking migration status...\n");
    
    try {
      const result = await this.runner.getMigrationStatus();
      
      if (result.success) {
        console.log("Migration Status:");
        console.log("-".repeat(80));
        
        Object.entries(result.status).forEach(([name, info]) => {
          const status = info.completed ? "✅ COMPLETED" : "⏳ PENDING";
          const date = info.executed_at ? new Date(info.executed_at).toLocaleString() : "N/A";
          const duration = info.duration_ms ? `${info.duration_ms}ms` : "N/A";
          
          console.log(`${name}:`);
          console.log(`  Status: ${status}`);
          console.log(`  Description: ${info.description}`);
          console.log(`  Executed: ${date}`);
          console.log(`  Duration: ${duration}`);
          console.log("");
        });
        
        console.log(`Summary: ${result.completedMigrations}/${result.totalMigrations} migrations completed`);
        
      } else {
        console.error("❌ Failed to get migration status:", result.error);
        process.exit(1);
      }
      
    } catch (error) {
      console.error("❌ Error checking migration status:", error.message);
      process.exit(1);
    }
  }

  /**
   * Validate migrations
   */
  async validateMigrations() {
    console.log("Validating migration results...\n");
    
    try {
      const result = await this.runner.validateAllMigrations();
      
      if (result.valid) {
        console.log("✅ All migrations validated successfully!");
        
        console.log("\nValidation Details:");
        console.log("-".repeat(50));
        
        Object.entries(result.details).forEach(([collection, details]) => {
          console.log(`${collection.toUpperCase()} Collection:`);
          Object.entries(details).forEach(([key, value]) => {
            if (key !== 'valid') {
              console.log(`  ${key}: ${value}`);
            }
          });
          console.log(`  Status: ${details.valid ? "✅ VALID" : "❌ INVALID"}`);
          console.log("");
        });
        
      } else {
        console.log("❌ Migration validation failed!");
        console.log("\nValidation Details:");
        console.log("-".repeat(50));
        
        Object.entries(result.details).forEach(([collection, details]) => {
          console.log(`${collection.toUpperCase()} Collection: ${details.valid ? "✅ VALID" : "❌ INVALID"}`);
          if (!details.valid) {
            Object.entries(details).forEach(([key, value]) => {
              if (key !== 'valid') {
                console.log(`  ${key}: ${value}`);
              }
            });
          }
          console.log("");
        });
        
        process.exit(1);
      }
      
    } catch (error) {
      console.error("❌ Error validating migrations:", error.message);
      process.exit(1);
    }
  }

  /**
   * Rollback migrations
   */
  async rollbackMigrations() {
    console.log("⚠️  WARNING: This will rollback all migrations!");
    console.log("Make sure you have a database backup before proceeding.\n");
    
    // In a real CLI, you might want to add a confirmation prompt here
    console.log("Starting rollback process...\n");
    
    try {
      const result = await this.runner.rollbackAllMigrations();
      
      if (result.success) {
        console.log("✅ All migrations rolled back successfully!");
        
        if (result.rollbacks) {
          console.log("\nRollback Summary:");
          result.rollbacks.forEach(rollback => {
            const status = rollback.success ? "✅ SUCCESS" : "❌ FAILED";
            console.log(`  ${rollback.name}: ${status}`);
            if (rollback.error) {
              console.log(`    Error: ${rollback.error}`);
            }
          });
        }
        
      } else {
        console.log("❌ Rollback failed!");
        console.log(`Error: ${result.error}`);
        process.exit(1);
      }
      
    } catch (error) {
      console.error("❌ Rollback process failed:", error.message);
      process.exit(1);
    }
  }

  /**
   * Main CLI entry point
   */
  async run() {
    const command = process.argv[2] || "run";
    
    try {
      await this.connectDatabase();
      
      switch (command.toLowerCase()) {
        case "run":
          await this.runMigrations();
          break;
          
        case "status":
          await this.showStatus();
          break;
          
        case "validate":
          await this.validateMigrations();
          break;
          
        case "rollback":
          await this.rollbackMigrations();
          break;
          
        case "help":
        case "--help":
        case "-h":
          this.showHelp();
          break;
          
        default:
          console.error(`Unknown command: ${command}`);
          this.showHelp();
          process.exit(1);
      }
      
    } catch (error) {
      console.error("❌ CLI error:", error.message);
      process.exit(1);
    } finally {
      await this.disconnectDatabase();
    }
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new MigrationCLI();
  cli.run().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { MigrationCLI };