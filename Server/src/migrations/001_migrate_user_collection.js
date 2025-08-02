import mongoose from "mongoose";
import MDA from "../models/MDA.js";

/**
 * Migration Script: User Collection Updates
 * 
 * This script migrates the User collection from the old structure to the new structure:
 * - Adds username field to existing users
 * - Renames email field to contactEmail while preserving data
 * - Adds mdaReference field and populates from existing mdaId relationships
 * - Removes mdaId ObjectId references and updates indexes accordingly
 * 
 * Requirements: 6.1, 6.2
 */

const MIGRATION_NAME = "001_migrate_user_collection";
const BATCH_SIZE = 100;

class UserMigration {
  constructor() {
    this.db = mongoose.connection.db;
    this.collection = this.db.collection('users');
    this.mdaCollection = this.db.collection('mdas');
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
    
    // Check if users collection exists
    const collections = await this.db.listCollections({ name: 'users' }).toArray();
    if (collections.length === 0) {
      throw new Error("Users collection does not exist");
    }

    // Check if MDAs collection exists
    const mdaCollections = await this.db.listCollections({ name: 'mdas' }).toArray();
    if (mdaCollections.length === 0) {
      throw new Error("MDAs collection does not exist - required for mdaReference mapping");
    }

    // Check if migration has already been run
    const sampleUser = await this.collection.findOne({});
    if (sampleUser && sampleUser.username && sampleUser.contactEmail && sampleUser.mdaReference) {
      this.log("Migration appears to have already been run - users have new structure", 'warning');
      return false;
    }

    this.log("Prerequisites validated successfully");
    return true;
  }

  /**
   * Create MDA lookup map for mdaId to name conversion
   */
  async createMdaLookupMap() {
    this.log("Creating MDA lookup map...");
    
    const mdas = await this.mdaCollection.find({}).toArray();
    const mdaMap = new Map();
    
    mdas.forEach(mda => {
      mdaMap.set(mda._id.toString(), mda.name);
    });

    this.log(`Created MDA lookup map with ${mdaMap.size} entries`);
    return mdaMap;
  }

  /**
   * Generate username from user data and MDA reference
   */
  generateUsername(user, mdaName) {
    // Create username based on MDA name and user name/email
    const mdaPrefix = mdaName.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10);
    
    const userSuffix = user.name ? 
      user.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10) :
      user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
    
    return `${mdaPrefix}.${userSuffix}`;
  }

  /**
   * Ensure username uniqueness
   */
  async ensureUniqueUsername(baseUsername, excludeId = null) {
    let username = baseUsername;
    let counter = 1;
    
    while (true) {
      const query = { username };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }
      
      const existing = await this.collection.findOne(query);
      if (!existing) {
        return username;
      }
      
      username = `${baseUsername}${counter}`;
      counter++;
      
      if (counter > 100) {
        throw new Error(`Could not generate unique username for base: ${baseUsername}`);
      }
    }
  }

  /**
   * Migrate users in batches
   */
  async migrateUsers() {
    this.log("Starting user migration...");
    
    const mdaMap = await this.createMdaLookupMap();
    const totalUsers = await this.collection.countDocuments({});
    let processedUsers = 0;
    let migratedUsers = 0;
    let skippedUsers = 0;
    let errorUsers = 0;

    this.log(`Found ${totalUsers} users to migrate`);

    // Process users in batches
    let skip = 0;
    while (skip < totalUsers) {
      const users = await this.collection
        .find({})
        .skip(skip)
        .limit(BATCH_SIZE)
        .toArray();

      for (const user of users) {
        try {
          processedUsers++;
          
          // Skip if user already has new structure
          if (user.username && user.contactEmail && user.mdaReference) {
            skippedUsers++;
            continue;
          }

          // Prepare update operations
          const updateOps = {};
          const unsetOps = {};

          // 1. Add username field
          if (!user.username) {
            const mdaName = user.mdaId ? mdaMap.get(user.mdaId.toString()) : 'unknown';
            if (!mdaName || mdaName === 'unknown') {
              this.log(`Warning: Could not find MDA for user ${user._id}`, 'warning');
            }
            
            const baseUsername = this.generateUsername(user, mdaName || 'unknown');
            const uniqueUsername = await this.ensureUniqueUsername(baseUsername, user._id);
            updateOps.username = uniqueUsername;
          }

          // 2. Rename email to contactEmail
          if (user.email && !user.contactEmail) {
            updateOps.contactEmail = user.email;
            unsetOps.email = "";
          }

          // 3. Add mdaReference field
          if (user.mdaId && !user.mdaReference) {
            const mdaName = mdaMap.get(user.mdaId.toString());
            if (mdaName) {
              updateOps.mdaReference = mdaName;
              unsetOps.mdaId = "";
            } else {
              this.log(`Error: Could not find MDA name for mdaId ${user.mdaId} for user ${user._id}`, 'error');
              errorUsers++;
              continue;
            }
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
              { _id: user._id },
              updateQuery
            );
            migratedUsers++;
          }

          // Log progress every 10 users
          if (processedUsers % 10 === 0) {
            this.log(`Progress: ${processedUsers}/${totalUsers} users processed`);
          }

        } catch (error) {
          errorUsers++;
          this.log(`Error migrating user ${user._id}: ${error.message}`, 'error');
        }
      }

      skip += BATCH_SIZE;
    }

    this.log(`User migration completed: ${migratedUsers} migrated, ${skippedUsers} skipped, ${errorUsers} errors`);
    return { migratedUsers, skippedUsers, errorUsers, totalUsers };
  }

  /**
   * Update database indexes
   */
  async updateIndexes() {
    this.log("Updating database indexes...");
    
    try {
      // Drop old indexes if they exist
      try {
        await this.collection.dropIndex("email_1");
        this.log("Dropped old email index");
      } catch (error) {
        this.log("Email index not found or already dropped", 'warning');
      }

      try {
        await this.collection.dropIndex("mdaId_1");
        this.log("Dropped old mdaId index");
      } catch (error) {
        this.log("mdaId index not found or already dropped", 'warning');
      }

      // Create new indexes
      await this.collection.createIndex({ username: 1 }, { unique: true });
      this.log("Created unique username index");

      await this.collection.createIndex({ contactEmail: 1 });
      this.log("Created contactEmail index");

      await this.collection.createIndex({ mdaReference: 1 });
      this.log("Created mdaReference index");

      await this.collection.createIndex({ username: 1, mdaReference: 1 });
      this.log("Created compound username-mdaReference index");

      await this.collection.createIndex({ isActive: 1 });
      this.log("Created isActive index");

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
    
    const totalUsers = await this.collection.countDocuments({});
    const usersWithUsername = await this.collection.countDocuments({ username: { $exists: true } });
    const usersWithContactEmail = await this.collection.countDocuments({ contactEmail: { $exists: true } });
    const usersWithMdaReference = await this.collection.countDocuments({ mdaReference: { $exists: true } });
    const usersWithOldEmail = await this.collection.countDocuments({ email: { $exists: true } });
    const usersWithOldMdaId = await this.collection.countDocuments({ mdaId: { $exists: true } });

    this.log(`Validation results:`);
    this.log(`  Total users: ${totalUsers}`);
    this.log(`  Users with username: ${usersWithUsername}`);
    this.log(`  Users with contactEmail: ${usersWithContactEmail}`);
    this.log(`  Users with mdaReference: ${usersWithMdaReference}`);
    this.log(`  Users with old email field: ${usersWithOldEmail}`);
    this.log(`  Users with old mdaId field: ${usersWithOldMdaId}`);

    const isValid = usersWithUsername === totalUsers && 
                   usersWithContactEmail === totalUsers && 
                   usersWithMdaReference === totalUsers &&
                   usersWithOldEmail === 0 &&
                   usersWithOldMdaId === 0;

    if (isValid) {
      this.log("Migration validation passed successfully", 'info');
    } else {
      this.log("Migration validation failed - some users may not have been migrated correctly", 'error');
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
      const migrationResults = await this.migrateUsers();
      
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
  const migration = new UserMigration();
  migration.log("Starting rollback for user collection migration...");

  try {
    const collection = migration.collection;
    
    // Find users that have been migrated (have new structure)
    const migratedUsers = await collection.find({
      username: { $exists: true },
      contactEmail: { $exists: true },
      mdaReference: { $exists: true }
    }).toArray();

    migration.log(`Found ${migratedUsers.length} users to rollback`);

    // Create MDA lookup map (name to ObjectId)
    const mdas = await migration.mdaCollection.find({}).toArray();
    const mdaNameToIdMap = new Map();
    mdas.forEach(mda => {
      mdaNameToIdMap.set(mda.name, mda._id);
    });

    let rolledBackUsers = 0;
    let errorUsers = 0;

    for (const user of migratedUsers) {
      try {
        const updateOps = {};
        const unsetOps = {};

        // Restore email field from contactEmail
        if (user.contactEmail) {
          updateOps.email = user.contactEmail;
          unsetOps.contactEmail = "";
        }

        // Restore mdaId from mdaReference
        if (user.mdaReference) {
          const mdaId = mdaNameToIdMap.get(user.mdaReference);
          if (mdaId) {
            updateOps.mdaId = mdaId;
            unsetOps.mdaReference = "";
          }
        }

        // Remove username field
        unsetOps.username = "";

        // Apply rollback
        const updateQuery = {};
        if (Object.keys(updateOps).length > 0) {
          updateQuery.$set = updateOps;
        }
        if (Object.keys(unsetOps).length > 0) {
          updateQuery.$unset = unsetOps;
        }

        await collection.updateOne({ _id: user._id }, updateQuery);
        rolledBackUsers++;

      } catch (error) {
        errorUsers++;
        migration.log(`Error rolling back user ${user._id}: ${error.message}`, 'error');
      }
    }

    // Restore old indexes
    try {
      await collection.dropIndex("username_1");
      await collection.dropIndex("contactEmail_1");
      await collection.dropIndex("mdaReference_1");
      await collection.dropIndex("username_1_mdaReference_1");
    } catch (error) {
      migration.log("Some new indexes could not be dropped", 'warning');
    }

    // Recreate old indexes
    await collection.createIndex({ email: 1 }, { unique: true });
    await collection.createIndex({ mdaId: 1 });

    migration.log(`Rollback completed: ${rolledBackUsers} users rolled back, ${errorUsers} errors`);
    return { success: true, rolledBackUsers, errorUsers };

  } catch (error) {
    migration.log(`Rollback failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Export migration functions
export { UserMigration, rollback };

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
    const migration = new UserMigration();
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