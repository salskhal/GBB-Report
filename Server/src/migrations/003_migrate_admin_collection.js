import mongoose from "mongoose";

/**
 * Migration Script: Admin Collection Updates
 * 
 * This script migrates the Admin collection from the old structure to the new structure:
 * - Adds canBeDeleted field to existing admins
 * - Sets canBeDeleted to false for super admin accounts
 * - Adds createdBy field where applicable and updates role enum
 * - Validates admin data and ensures proper role assignments
 * 
 * Requirements: 3.1
 */

const MIGRATION_NAME = "003_migrate_admin_collection";
const BATCH_SIZE = 50;

class AdminMigration {
  constructor() {
    this.db = mongoose.connection.db;
    this.collection = this.db.collection('admins');
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
    
    // Check if admins collection exists
    const collections = await this.db.listCollections({ name: 'admins' }).toArray();
    if (collections.length === 0) {
      throw new Error("Admins collection does not exist");
    }

    // Check if migration has already been run
    const sampleAdmin = await this.collection.findOne({});
    if (sampleAdmin && sampleAdmin.hasOwnProperty('canBeDeleted')) {
      this.log("Migration appears to have already been run - admins have canBeDeleted field", 'warning');
      return false;
    }

    this.log("Prerequisites validated successfully");
    return true;
  }

  /**
   * Identify super admin accounts
   */
  async identifySuperAdmins() {
    this.log("Identifying super admin accounts...");
    
    // Look for admins with role 'superadmin' or similar indicators
    const superAdmins = await this.collection.find({
      $or: [
        { role: 'superadmin' },
        { role: 'super_admin' },
        { role: 'super-admin' },
        { email: { $regex: /super|admin@|root@/i } }, // Common super admin email patterns
        { name: { $regex: /super|root/i } } // Common super admin name patterns
      ]
    }).toArray();

    // If no explicit super admins found, consider the first admin as super admin
    if (superAdmins.length === 0) {
      const firstAdmin = await this.collection.findOne({}, { sort: { createdAt: 1 } });
      if (firstAdmin) {
        superAdmins.push(firstAdmin);
        this.log(`No explicit super admin found, treating first admin (${firstAdmin.email}) as super admin`);
      }
    }

    this.log(`Found ${superAdmins.length} potential super admin(s)`);
    superAdmins.forEach(admin => {
      this.log(`  Super admin: ${admin.email} (${admin.name})`);
    });

    return superAdmins;
  }

  /**
   * Migrate admins in batches
   */
  async migrateAdmins() {
    this.log("Starting admin migration...");
    
    const superAdmins = await this.identifySuperAdmins();
    const superAdminIds = new Set(superAdmins.map(admin => admin._id.toString()));
    
    const totalAdmins = await this.collection.countDocuments({});
    let processedAdmins = 0;
    let migratedAdmins = 0;
    let skippedAdmins = 0;
    let errorAdmins = 0;

    this.log(`Found ${totalAdmins} admins to migrate`);

    // Process admins in batches
    let skip = 0;
    while (skip < totalAdmins) {
      const admins = await this.collection
        .find({})
        .skip(skip)
        .limit(BATCH_SIZE)
        .toArray();

      for (const admin of admins) {
        try {
          processedAdmins++;
          
          // Skip if admin already has new structure
          if (admin.hasOwnProperty('canBeDeleted')) {
            skippedAdmins++;
            continue;
          }

          // Prepare update operations
          const updateOps = {};
          const isSuperAdmin = superAdminIds.has(admin._id.toString());

          // 1. Add canBeDeleted field
          updateOps.canBeDeleted = !isSuperAdmin;

          // 2. Update role to proper enum value
          if (isSuperAdmin) {
            updateOps.role = 'superadmin';
          } else {
            // Ensure regular admins have 'admin' role
            updateOps.role = 'admin';
          }

          // 3. Add createdBy field for regular admins
          if (!isSuperAdmin && superAdmins.length > 0) {
            // Set createdBy to the first super admin
            updateOps.createdBy = superAdmins[0]._id;
          }

          // Apply updates
          await this.collection.updateOne(
            { _id: admin._id },
            { $set: updateOps }
          );

          migratedAdmins++;
          
          this.log(`Migrated admin ${admin.email}: role=${updateOps.role}, canBeDeleted=${updateOps.canBeDeleted}`);

          // Log progress every 5 admins
          if (processedAdmins % 5 === 0) {
            this.log(`Progress: ${processedAdmins}/${totalAdmins} admins processed`);
          }

        } catch (error) {
          errorAdmins++;
          this.log(`Error migrating admin ${admin._id}: ${error.message}`, 'error');
        }
      }

      skip += BATCH_SIZE;
    }

    this.log(`Admin migration completed: ${migratedAdmins} migrated, ${skippedAdmins} skipped, ${errorAdmins} errors`);
    return { migratedAdmins, skippedAdmins, errorAdmins, totalAdmins, superAdminCount: superAdmins.length };
  }

  /**
   * Update database indexes
   */
  async updateIndexes() {
    this.log("Updating database indexes...");
    
    try {
      // Create new indexes for the new fields
      await this.collection.createIndex({ role: 1 });
      this.log("Created/ensured role index");

      await this.collection.createIndex({ canBeDeleted: 1 });
      this.log("Created canBeDeleted index");

      await this.collection.createIndex({ createdBy: 1 });
      this.log("Created createdBy index");

      // Ensure existing indexes are still present
      await this.collection.createIndex({ email: 1 }, { unique: true });
      this.log("Ensured unique email index exists");

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
    
    const totalAdmins = await this.collection.countDocuments({});
    const adminsWithCanBeDeleted = await this.collection.countDocuments({ 
      canBeDeleted: { $exists: true } 
    });
    const superAdmins = await this.collection.countDocuments({ 
      role: 'superadmin',
      canBeDeleted: false 
    });
    const regularAdmins = await this.collection.countDocuments({ 
      role: 'admin',
      canBeDeleted: true 
    });
    const adminsWithCreatedBy = await this.collection.countDocuments({ 
      createdBy: { $exists: true } 
    });
    const adminsWithValidRoles = await this.collection.countDocuments({
      role: { $in: ['superadmin', 'admin'] }
    });

    this.log(`Validation results:`);
    this.log(`  Total admins: ${totalAdmins}`);
    this.log(`  Admins with canBeDeleted field: ${adminsWithCanBeDeleted}`);
    this.log(`  Super admins (canBeDeleted=false): ${superAdmins}`);
    this.log(`  Regular admins (canBeDeleted=true): ${regularAdmins}`);
    this.log(`  Admins with createdBy field: ${adminsWithCreatedBy}`);
    this.log(`  Admins with valid roles: ${adminsWithValidRoles}`);

    const isValid = adminsWithCanBeDeleted === totalAdmins && 
                   adminsWithValidRoles === totalAdmins &&
                   superAdmins > 0; // Must have at least one super admin

    if (isValid) {
      this.log("Migration validation passed successfully", 'info');
    } else {
      this.log("Migration validation failed - some admins may not have been migrated correctly", 'error');
    }

    // Additional validation warnings
    if (superAdmins === 0) {
      this.log("Warning: No super admin accounts found after migration", 'error');
    }
    if (superAdmins > 1) {
      this.log(`Warning: Multiple super admin accounts found (${superAdmins}). Consider reviewing if this is intended.`, 'warning');
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
      const migrationResults = await this.migrateAdmins();
      
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
  const migration = new AdminMigration();
  migration.log("Starting rollback for admin collection migration...");

  try {
    const collection = migration.collection;
    
    // Find admins that have been migrated (have canBeDeleted field)
    const migratedAdmins = await collection.find({
      canBeDeleted: { $exists: true }
    }).toArray();

    migration.log(`Found ${migratedAdmins.length} admins to rollback`);

    let rolledBackAdmins = 0;
    let errorAdmins = 0;

    for (const admin of migratedAdmins) {
      try {
        const unsetOps = {};

        // Remove new fields
        unsetOps.canBeDeleted = "";
        if (admin.createdBy) {
          unsetOps.createdBy = "";
        }

        // Reset role to generic 'admin' if it was 'superadmin'
        const updateOps = {};
        if (admin.role === 'superadmin') {
          updateOps.role = 'admin';
        }

        // Apply rollback
        const updateQuery = {};
        if (Object.keys(updateOps).length > 0) {
          updateQuery.$set = updateOps;
        }
        if (Object.keys(unsetOps).length > 0) {
          updateQuery.$unset = unsetOps;
        }

        if (Object.keys(updateQuery).length > 0) {
          await collection.updateOne({ _id: admin._id }, updateQuery);
          rolledBackAdmins++;
        }

      } catch (error) {
        errorAdmins++;
        migration.log(`Error rolling back admin ${admin._id}: ${error.message}`, 'error');
      }
    }

    // Remove new indexes
    try {
      await collection.dropIndex("canBeDeleted_1");
      await collection.dropIndex("createdBy_1");
    } catch (error) {
      migration.log("Some new indexes could not be dropped", 'warning');
    }

    migration.log(`Rollback completed: ${rolledBackAdmins} admins rolled back, ${errorAdmins} errors`);
    return { success: true, rolledBackAdmins, errorAdmins };

  } catch (error) {
    migration.log(`Rollback failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Export migration functions
export { AdminMigration, rollback };

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
    const migration = new AdminMigration();
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