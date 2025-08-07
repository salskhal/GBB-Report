# Database Migration Scripts

This directory contains migration scripts for transitioning the MDA system from the old data structure to the new enhanced structure with username-based authentication, multi-report support, and hierarchical admin management.

## Overview

The migration process consists of three main migrations:

1. **001_migrate_user_collection.js** - Migrates User collection to username-based authentication
2. **002_migrate_mda_collection.js** - Migrates MDA collection to support multiple reports
3. **003_migrate_admin_collection.js** - Migrates Admin collection for hierarchical roles
4. **migrationRunner.js** - Orchestrates all migrations with validation and rollback capabilities

## Migration Details

### User Collection Migration (001)

**Purpose**: Transition from email-based to username-based authentication

**Changes**:
- Adds `username` field (unique identifier for login)
- Renames `email` field to `contactEmail`
- Adds `mdaReference` field (string reference to MDA name)
- Removes `mdaId` ObjectId references
- Updates database indexes accordingly

**Requirements**: 6.1, 6.2

### MDA Collection Migration (002)

**Purpose**: Support multiple reports per MDA with titles

**Changes**:
- Converts single `reportUrl` field to `reports` array
- Creates report objects with `title`, `url`, and `isActive` fields
- Generates default titles for existing reports
- Validates all report URLs
- Updates database indexes for reports array

**Requirements**: 5.5

### Admin Collection Migration (003)

**Purpose**: Implement hierarchical admin roles

**Changes**:
- Adds `canBeDeleted` field (false for super admin)
- Updates role enum to include 'superadmin' and 'admin'
- Adds `createdBy` field for tracking admin creation
- Identifies and properly configures super admin accounts
- Updates database indexes for new fields

**Requirements**: 3.1

## Usage

### Prerequisites

1. Ensure MongoDB connection is established
2. Backup your database before running migrations
3. Ensure Node.js environment is properly configured

### Running Migrations

#### Option 1: Run All Migrations (Recommended)

```bash
# Navigate to the migrations directory
cd Server/src/migrations

# Run all migrations in sequence
node migrationRunner.js
```

#### Option 2: Run Individual Migrations

```bash
# User collection migration
node 001_migrate_user_collection.js

# MDA collection migration
node 002_migrate_mda_collection.js

# Admin collection migration
node 003_migrate_admin_collection.js
```

### Migration Status

Check the status of all migrations:

```bash
node migrationRunner.js status
```

### Validation

Validate that all migrations completed successfully:

```bash
node migrationRunner.js validate
```

### Rollback

If you need to rollback all migrations:

```bash
# Rollback all migrations (in reverse order)
node migrationRunner.js rollback

# Or rollback individual migrations
node 001_migrate_user_collection.js rollback
node 002_migrate_mda_collection.js rollback
node 003_migrate_admin_collection.js rollback
```

## Migration Process Flow

1. **Validation**: Check prerequisites and system state
2. **Backup**: Ensure database backup exists (manual step)
3. **Migration**: Run migrations in sequence
4. **Index Updates**: Update database indexes for optimal performance
5. **Validation**: Verify migration success and data integrity
6. **Monitoring**: Track performance metrics and progress

## Error Handling

The migration scripts include comprehensive error handling:

- **Batch Processing**: Large datasets are processed in batches to prevent memory issues
- **Progress Tracking**: Regular progress updates during migration
- **Error Logging**: Detailed logging of all errors and warnings
- **Rollback Support**: Ability to reverse migrations if issues occur
- **Data Validation**: Extensive validation before, during, and after migration

## Performance Considerations

- **Batch Size**: Configurable batch sizes for processing large collections
- **Indexing**: Optimized index creation and removal
- **Memory Management**: Efficient memory usage for large datasets
- **Progress Monitoring**: Real-time progress tracking and performance metrics

## Migration Tracking

The system maintains a `migration_history` collection to track:

- Migration execution status
- Execution timestamps
- Duration metrics
- Results and error details
- Complete migration logs

## Data Integrity

Each migration includes validation to ensure:

- All records are properly migrated
- No data loss occurs
- Indexes are correctly updated
- Foreign key relationships are maintained
- Data types and constraints are preserved

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure MongoDB is running and accessible
2. **Permissions**: Verify database user has necessary permissions
3. **Memory**: For large datasets, consider increasing Node.js memory limit
4. **Indexes**: If index creation fails, check for existing conflicting indexes

### Recovery Procedures

1. **Partial Migration Failure**: Use individual migration rollbacks
2. **Complete Migration Failure**: Use full rollback and restore from backup
3. **Data Corruption**: Restore from backup and investigate issues
4. **Performance Issues**: Adjust batch sizes and retry

### Logging

All migration activities are logged with:

- Timestamp
- Log level (INFO, WARNING, ERROR)
- Detailed messages
- Migration context
- Performance metrics

## Post-Migration Steps

After successful migration:

1. **Verify Application**: Test all application functionality
2. **Update Documentation**: Update any relevant documentation
3. **Monitor Performance**: Watch for any performance issues
4. **User Communication**: Inform users of any changes
5. **Backup**: Create a new backup of the migrated database

## Support

For issues or questions regarding migrations:

1. Check the migration logs for detailed error information
2. Verify database state using validation commands
3. Review this documentation for troubleshooting steps
4. Consider rollback if critical issues are encountered

## Migration History

The migration system maintains a complete history of all executed migrations, including:

- Execution timestamps
- Success/failure status
- Performance metrics
- Detailed logs
- Rollback information

This history is stored in the `migration_history` collection and can be queried for audit purposes.