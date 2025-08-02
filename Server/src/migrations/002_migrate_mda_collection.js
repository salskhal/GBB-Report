import mongoose from "mongoose";

/**
 * Migration Script: MDA Collection Updates
 * 
 * This script migrates the MDA collection from the old structure to the new structure:
 * - Converts single reportUrl to reports array
 * - Creates report objects with title and url from existing reportUrl data
 * - Sets default titles for existing reports where titles are not available
 * - Validates all report URLs and ensures proper data structure
 * 
 * Requirements: 5.5
 */

const MIGRATION_NAME = "002_migrate_mda_collection";
const BATCH_SIZE = 50;

class MDAMigration {
  constructor() {
    this.db = mongoose.connection.db;
    this.collection = this.db.collection('mdas');
    this.migrationLog = [];
  }

  /**
   * Log migration progress and actions
   */
  log(message, level = 'info') {
    const logEntry = {
      timestamp: new Date(),
      level,
      message,
      migration: MIGRATION_NAME
    };
    this.migrationLog.push(logEntry);
    console.log(`[${level.toUpperCase()}] ${new Date().toISOString()} - ${message}`);
  }

  /**
   * Validate migration prerequisites
   */
  async validatePrerequisites() {
    this.log("Validating migration prerequisites...");
    
    // Check if MDAs collection exists
    const collections = await this.db.listCollections({ name: 'mdas' }).toArray();
    if (collections.length === 0) {
      throw new Error("MDAs collection does not exist");
    }

    // Check if migration has already been run
    const sampleMDA = await this.collection.findOne({});
    if (sampleMDA && sampleMDA.reports && Array.isArray(sampleMDA.reports)) {
      this.log("Migration appears to have already been run - MDAs have reports array structure", 'warning');
      return false;
    }

    this.log("Prerequisites validated successfully");
    return true;
  }

  /**
   * Validate URL format
   */
  isValidUrl(url) {
    try {
      const urlPattern = /^https?:\/\/.+/;
      return urlPattern.test(url);
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate default title from URL or MDA name
   */
  generateDefaultTitle(url, mdaName) {
    if (!url) return `${mdaName} Report`;
    
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Extract meaningful part from hostname
      const parts = hostname.split('.');
      const mainPart = parts.length > 2 ? parts[parts.length - 2] : parts[0];
      
      // Capitalize first letter
      const title = mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
      return `${mdaName} ${title} Report`;
    } catch (error) {
      return `${mdaName} Report`;
    }
  }

  /**
   * Migrate MDAs in batches
   */
  async migrateMDAs() {
    this.log("Starting MDA migration...");
    
    const totalMDAs = await this.collection.countDocuments({});
    let processedMDAs = 0;
    let migratedMDAs = 0;
    let skippedMDAs = 0;
    let errorMDAs = 0;

    this.log(`Found ${totalMDAs} MDAs to migrate`);

    // Process MDAs in batches
    let skip = 0;
    while (skip < totalMDAs) {
      const mdas = await this.collection
        .find({})
        .skip(skip)
        .limit(BATCH_SIZE)
        .toArray();

      for (const mda of mdas) {
        try {
          processedMDAs++;
          
          // Skip if MDA already has new structure
          if (mda.reports && Array.isArray(mda.reports)) {
            skippedMDAs++;
            continue;
          }

          // Prepare update operations
          const updateOps = {};
          const unsetOps = {};

          // Convert single reportUrl to reports array
          if (mda.reportUrl) {
            // Validate the existing URL
            if (!this.isValidUrl(mda.reportUrl)) {
              this.log(`Warning: Invalid URL found for MDA ${mda.name}: ${mda.reportUrl}`, 'warning');
              // Still proceed but mark the URL as potentially problematic
            }

            // Create report object
            const reportTitle = this.generateDefaultTitle(mda.reportUrl, mda.name);
            const reportObject = {
              title: reportTitle,
              url: mda.reportUrl,
              isActive: true
            };

            updateOps.reports = [reportObject];
            unsetOps.reportUrl = "";

            this.log(`Converting MDA ${mda.name}: "${mda.reportUrl}" -> "${reportTitle}"`);
          } else if (!mda.reports) {
            // MDA has no reportUrl and no reports array - create empty array
            this.log(`Warning: MDA ${mda.name} has no reportUrl - creating empty reports array`, 'warning');
            updateOps.reports = [];
          }

          // Apply updates
          const updateQuery = {};
          if (Object.keys(updateOps).length > 0) {
            updateQuery.$set = updateOps;
          }
          if (Object.keys(unsetOps).length > 0) {
            updateQuery.$unset = unsetOps;
          }

          if (Object.keys(updateQuery).length > 0) {
            await this.collection.updateOne(
              { _id: mda._id },
              updateQuery
            );
            migratedMDAs++;
          }

          // Log progress every 5 MDAs
          if (processedMDAs % 5 === 0) {
            this.log(`Progress: ${processedMDAs}/${totalMDAs} MDAs processed`);
          }

        } catch (error) {
          errorMDAs++;
          this.log(`Error migrating MDA ${mda._id}: ${error.message}`, 'error');
        }
      }

      skip += BATCH_SIZE;
    }

    this.log(`MDA migration completed: ${migratedMDAs} migrated, ${skippedMDAs} skipped, ${errorMDAs} errors`);
    return { migratedMDAs, skippedMDAs, errorMDAs, totalMDAs };
  }

  /**
   * Update database indexes
   */
  async updateIndexes() {
    this.log("Updating database indexes...");
    
    try {
      // Drop old reportUrl index if it exists
      try {
        await this.collection.dropIndex("reportUrl_1");
        this.log("Dropped old reportUrl index");
      } catch (error) {
        this.log("reportUrl index not found or already dropped", 'warning');
      }

      // Create new indexes for reports array
      await this.collection.createIndex({ "reports.isActive": 1 });
      this.log("Created reports.isActive index");

      await this.collection.createIndex({ "reports.url": 1 });
      this.log("Created reports.url index");

      // Ensure existing indexes are still present
      await this.collection.createIndex({ name: 1 }, { unique: true });
      this.log("Ensured unique name index exists");

      await this.collection.createIndex({ isActive: 1 });
      this.log("Ensured isActive index exists");

      this.log("Index updates completed successfully");
    } catch (error) {
      this.log(`Error updating indexes: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Validate migration results
   */
  async validateMigration() {
    this.log("Validating migration results...");
    
    const totalMDAs = await this.collection.countDocuments({});
    const mdasWithReports = await this.collection.countDocuments({ reports: { $exists: true } });
    const mdasWithReportsArray = await this.collection.countDocuments({ 
      reports: { $exists: true, $type: "array" } 
    });
    const mdasWithOldReportUrl = await this.collection.countDocuments({ reportUrl: { $exists: true } });
    
    // Check for valid report structure
    const mdasWithValidReports = await this.collection.countDocuments({
      "reports.title": { $exists: true },
      "reports.url": { $exists: true },
      "reports.isActive": { $exists: true }
    });

    // Check for invalid URLs
    const mdasWithInvalidUrls = await this.collection.countDocuments({
      "reports.url": { $exists: true, $not: /^https?:\/\/.+/ }
    });

    this.log(`Validation results:`);
    this.log(`  Total MDAs: ${totalMDAs}`);
    this.log(`  MDAs with reports field: ${mdasWithReports}`);
    this.log(`  MDAs with reports array: ${mdasWithReportsArray}`);
    this.log(`  MDAs with valid report structure: ${mdasWithValidReports}`);
    this.log(`  MDAs with old reportUrl field: ${mdasWithOldReportUrl}`);
    this.log(`  MDAs with invalid URLs: ${mdasWithInvalidUrls}`);

    const isValid = mdasWithReports === totalMDAs && 
                   mdasWithReportsArray === totalMDAs && 
                   mdasWithOldReportUrl === 0;

    if (isValid) {
      this.log("Migration validation passed successfully", 'info');
      if (mdasWithInvalidUrls > 0) {
        this.log(`Warning: ${mdasWithInvalidUrls} MDAs have invalid URLs that may need manual correction`, 'warning');
      }
    } else {
      this.log("Migration validation failed - some MDAs may not have been migrated correctly", 'error');
    }

    return isValid;
  }

  /**
   * Run the complete migration
   */
  async migrate() {
    const startTime = Date.now();
    this.log(`Starting ${MIGRATION_NAME}...`);

    try {
      // Validate prerequisites
      const shouldProceed = await this.validatePrerequisites();
      if (!shouldProceed) {
        this.log("Migration skipped - already completed or prerequisites not met");
        return { success: true, skipped: true };
      }

      // Perform migration
      const migrationResults = await this.migrateMDAs();
      
      // Update indexes
      await this.updateIndexes();
      
      // Validate results
      const isValid = await this.validateMigration();
      
      const duration = Date.now() - startTime;
      this.log(`${MIGRATION_NAME} completed in ${duration}ms`);
      
      return {
        success: isValid,
        duration,
        results: migrationResults,
        logs: this.migrationLog
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`${MIGRATION_NAME} failed after ${duration}ms: ${error.message}`, 'error');
      
      return {
        success: false,
        error: error.message,
        duration,
        logs: this.migrationLog
      };
    }
  }
}

/**
 * Rollback function to reverse the migration
 */
async function rollback() {
  const migration = new MDAMigration();
  migration.log("Starting rollback for MDA collection migration...");

  try {
    const collection = migration.collection;
    
    // Find MDAs that have been migrated (have reports array)
    const migratedMDAs = await collection.find({
      reports: { $exists: true, $type: "array" }
    }).toArray();

    migration.log(`Found ${migratedMDAs.length} MDAs to rollback`);

    let rolledBackMDAs = 0;
    let errorMDAs = 0;

    for (const mda of migratedMDAs) {
      try {
        const updateOps = {};
        const unsetOps = {};

        // Convert reports array back to single reportUrl
        if (mda.reports && mda.reports.length > 0) {
          // Take the first report as the primary report
          const primaryReport = mda.reports[0];
          updateOps.reportUrl = primaryReport.url;
          
          if (mda.reports.length > 1) {
            migration.log(`Warning: MDA ${mda.name} has multiple reports, only keeping the first one in rollback`, 'warning');
          }
        }

        // Remove reports array
        unsetOps.reports = "";

        // Apply rollback
        const updateQuery = {};
        if (Object.keys(updateOps).length > 0) {
          updateQuery.$set = updateOps;
        }
        if (Object.keys(unsetOps).length > 0) {
          updateQuery.$unset = unsetOps;
        }

        if (Object.keys(updateQuery).length > 0) {
          await collection.updateOne({ _id: mda._id }, updateQuery);
          rolledBackMDAs++;
        }

      } catch (error) {
        errorMDAs++;
        migration.log(`Error rolling back MDA ${mda._id}: ${error.message}`, 'error');
      }
    }

    // Restore old indexes
    try {
      await collection.dropIndex("reports.isActive_1");
      await collection.dropIndex("reports.url_1");
    } catch (error) {
      migration.log("Some new indexes could not be dropped", 'warning');
    }

    // Recreate old index
    await collection.createIndex({ reportUrl: 1 });

    migration.log(`Rollback completed: ${rolledBackMDAs} MDAs rolled back, ${errorMDAs} errors`);
    return { success: true, rolledBackMDAs, errorMDAs };

  } catch (error) {
    migration.log(`Rollback failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Export migration functions
export { MDAMigration, rollback };

// CLI execution support
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  if (command === 'rollback') {
    rollback()
      .then(result => {
        console.log('Rollback result:', result);
        process.exit(result.success ? 0 : 1);
      })
      .catch(error => {
        console.error('Rollback error:', error);
        process.exit(1);
      });
  } else {
    const migration = new MDAMigration();
    migration.migrate()
      .then(result => {
        console.log('Migration result:', result);
        process.exit(result.success ? 0 : 1);
      })
      .catch(error => {
        console.error('Migration error:', error);
        process.exit(1);
      });
  }
}