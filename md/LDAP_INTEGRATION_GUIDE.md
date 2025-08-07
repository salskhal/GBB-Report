# LDAP Integration Guide for MDA Report System

## Table of Contents
1. [Overview](#overview)
2. [Current Authentication Flow](#current-authentication-flow)
3. [LDAP Authentication Architecture](#ldap-authentication-architecture)
4. [Implementation Strategy](#implementation-strategy)
5. [Server-Side Changes](#server-side-changes)
6. [Client-Side Changes](#client-side-changes)
7. [Configuration](#configuration)
8. [Security Considerations](#security-considerations)
9. [Migration Strategy](#migration-strategy)
10. [Testing Strategy](#testing-strategy)
11. [Troubleshooting](#troubleshooting)

## Overview

LDAP (Lightweight Directory Access Protocol) integration will allow your MDA Report System to authenticate users against an existing organizational directory service (like Active Directory, OpenLDAP, etc.) instead of maintaining separate user credentials in your database.

### Benefits of LDAP Integration:
- **Single Sign-On (SSO)**: Users can use their existing organizational credentials
- **Centralized User Management**: User accounts are managed in one place
- **Enhanced Security**: Leverage existing security policies and password requirements
- **Reduced Administrative Overhead**: No need to manage separate passwords
- **Compliance**: Meet organizational security and audit requirements

## Current Authentication Flow

### Existing System:
```
1. User enters email/password + MDA selection
2. Server validates credentials against MongoDB User collection
3. JWT token generated and returned
4. Client stores token and uses for subsequent requests
```

### Current Database Schema:
```javascript
// User Model
{
  name: String,
  email: String,
  password: String (hashed), // This will change with LDAP
  role: String,
  mdaId: ObjectId,
  isActive: Boolean,
  lastLogin: Date
}
```

## LDAP Authentication Architecture

### New Authentication Flow:
```
1. User enters username/password + MDA selection
2. Server attempts LDAP bind with provided credentials
3. If LDAP authentication succeeds:
   - Check if user exists in local database
   - If not, create user record (without password)
   - Update user information from LDAP attributes
   - Generate JWT token
4. Return token to client
```

### LDAP Integration Points:
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │───▶│   Your Server    │───▶│  LDAP Server    │
│                 │    │                  │    │ (Active Dir/    │
│ Login Form      │    │ Auth Controller  │    │  OpenLDAP)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   MongoDB        │
                       │ (User Profiles)  │
                       └──────────────────┘
```

## Implementation Strategy

### Phase 1: Hybrid Authentication
- Support both LDAP and local authentication
- Gradual migration of users
- Fallback to local auth if LDAP fails

### Phase 2: LDAP-Only Authentication
- Disable local password authentication
- All users authenticate via LDAP
- Remove password fields from database

### Phase 3: Advanced Features
- Group-based role mapping
- Automatic user provisioning
- LDAP attribute synchronization

## Server-Side Changes

### 1. Dependencies
Add LDAP client library to your project:

```bash
npm install ldapjs
npm install @types/ldapjs  # For TypeScript support
```

### 2. LDAP Configuration
Create LDAP configuration file:

```javascript
// Server/src/config/ldap.js
export const ldapConfig = {
  url: process.env.LDAP_URL || 'ldap://your-ldap-server:389',
  baseDN: process.env.LDAP_BASE_DN || 'dc=company,dc=com',
  bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=company,dc=com',
  bindPassword: process.env.LDAP_BIND_PASSWORD,
  userSearchBase: process.env.LDAP_USER_SEARCH_BASE || 'ou=users,dc=company,dc=com',
  userSearchFilter: process.env.LDAP_USER_SEARCH_FILTER || '(uid={{username}})',
  attributes: {
    username: 'uid',
    email: 'mail',
    firstName: 'givenName',
    lastName: 'sn',
    displayName: 'displayName',
    department: 'department',
    title: 'title'
  },
  timeout: 5000,
  connectTimeout: 10000
};
```

### 3. LDAP Service
Create LDAP authentication service:

```javascript
// Server/src/service/ldapService.js
import ldap from 'ldapjs';
import { ldapConfig } from '../config/ldap.js';

class LDAPService {
  constructor() {
    this.client = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.client = ldap.createClient({
        url: ldapConfig.url,
        timeout: ldapConfig.timeout,
        connectTimeout: ldapConfig.connectTimeout
      });

      this.client.on('connect', () => {
        console.log('LDAP client connected');
        resolve();
      });

      this.client.on('error', (err) => {
        console.error('LDAP connection error:', err);
        reject(err);
      });
    });
  }

  async authenticate(username, password) {
    try {
      await this.connect();
      
      // First, bind with admin credentials to search for user
      await this.bind(ldapConfig.bindDN, ldapConfig.bindPassword);
      
      // Search for user
      const userDN = await this.findUserDN(username);
      if (!userDN) {
        throw new Error('User not found in LDAP');
      }

      // Attempt to bind with user credentials
      await this.bind(userDN, password);
      
      // Get user attributes
      const userAttributes = await this.getUserAttributes(userDN);
      
      return {
        success: true,
        user: userAttributes
      };
    } catch (error) {
      console.error('LDAP authentication failed:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.disconnect();
    }
  }

  async bind(dn, password) {
    return new Promise((resolve, reject) => {
      this.client.bind(dn, password, (err) => {
        if (err) {
          reject(new Error(`LDAP bind failed: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  async findUserDN(username) {
    return new Promise((resolve, reject) => {
      const searchFilter = ldapConfig.userSearchFilter.replace('{{username}}', username);
      const opts = {
        filter: searchFilter,
        scope: 'sub',
        attributes: ['dn']
      };

      this.client.search(ldapConfig.userSearchBase, opts, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        let userDN = null;
        res.on('searchEntry', (entry) => {
          userDN = entry.dn.toString();
        });

        res.on('error', (err) => {
          reject(err);
        });

        res.on('end', () => {
          resolve(userDN);
        });
      });
    });
  }

  async getUserAttributes(userDN) {
    return new Promise((resolve, reject) => {
      const opts = {
        filter: '(objectclass=*)',
        scope: 'base',
        attributes: Object.values(ldapConfig.attributes)
      };

      this.client.search(userDN, opts, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        let userAttributes = {};
        res.on('searchEntry', (entry) => {
          const attrs = entry.attributes;
          userAttributes = {
            username: this.getAttributeValue(attrs, ldapConfig.attributes.username),
            email: this.getAttributeValue(attrs, ldapConfig.attributes.email),
            firstName: this.getAttributeValue(attrs, ldapConfig.attributes.firstName),
            lastName: this.getAttributeValue(attrs, ldapConfig.attributes.lastName),
            displayName: this.getAttributeValue(attrs, ldapConfig.attributes.displayName),
            department: this.getAttributeValue(attrs, ldapConfig.attributes.department),
            title: this.getAttributeValue(attrs, ldapConfig.attributes.title)
          };
        });

        res.on('error', (err) => {
          reject(err);
        });

        res.on('end', () => {
          resolve(userAttributes);
        });
      });
    });
  }

  getAttributeValue(attributes, attributeName) {
    const attr = attributes.find(a => a.type === attributeName);
    return attr ? attr.values[0] : null;
  }

  disconnect() {
    if (this.client) {
      this.client.unbind();
      this.client = null;
    }
  }
}

export default new LDAPService();
```

### 4. Updated User Model
Modify the User model to support LDAP users:

```javascript
// Server/src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // Allow null values but ensure uniqueness when present
      trim: true,
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
      required: function() {
        return !this.isLDAPUser; // Password required only for non-LDAP users
      }
    },
    isLDAPUser: {
      type: Boolean,
      default: false,
    },
    ldapDN: {
      type: String,
      select: false, // Don't include in queries by default
    },
    role: {
      type: String,
      enum: ["user"],
      default: "user",
    },
    mdaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MDA",
      required: [true, "MDA assignment is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    // LDAP-specific fields
    department: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    ldapLastSync: {
      type: Date,
    }
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ mdaId: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isLDAPUser: 1 });

// Hash password before saving (only for non-LDAP users)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isLDAPUser) return next();

  this.password = await bcrypt.hash(
    this.password,
    parseInt(process.env.BCRYPT_SALT_ROUNDS)
  );
  next();
});

// Method to check password (only for non-LDAP users)
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (this.isLDAPUser) {
    throw new Error('LDAP users should authenticate via LDAP');
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to sync user data from LDAP
userSchema.methods.syncFromLDAP = function(ldapAttributes) {
  this.name = `${ldapAttributes.firstName} ${ldapAttributes.lastName}`.trim() || ldapAttributes.displayName;
  this.email = ldapAttributes.email;
  this.username = ldapAttributes.username;
  this.department = ldapAttributes.department;
  this.title = ldapAttributes.title;
  this.ldapLastSync = new Date();
};

const User = mongoose.model("User", userSchema);

export default User;
```

### 5. Updated Authentication Service
Modify the authentication service to support LDAP:

```javascript
// Server/src/service/authService.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import MDA from '../models/MDA.js';
import ldapService from './ldapService.js';

class AuthService {
  // LDAP User Login
  async loginUserLDAP(username, password, mdaId) {
    try {
      // Validate MDA exists
      const mda = await MDA.findById(mdaId);
      if (!mda || !mda.isActive) {
        throw new Error('Invalid MDA selected');
      }

      // Attempt LDAP authentication
      const ldapResult = await ldapService.authenticate(username, password);
      
      if (!ldapResult.success) {
        throw new Error('Invalid credentials');
      }

      // Find or create user in local database
      let user = await User.findOne({ 
        $or: [
          { username: username },
          { email: ldapResult.user.email }
        ]
      }).populate('mdaId');

      if (!user) {
        // Create new user from LDAP data
        user = new User({
          username: ldapResult.user.username,
          email: ldapResult.user.email,
          name: `${ldapResult.user.firstName} ${ldapResult.user.lastName}`.trim() || ldapResult.user.displayName,
          mdaId: mdaId,
          isLDAPUser: true,
          department: ldapResult.user.department,
          title: ldapResult.user.title,
          isActive: true
        });
        await user.save();
        await user.populate('mdaId');
      } else {
        // Update existing user with LDAP data
        user.syncFromLDAP(ldapResult.user);
        user.lastLogin = new Date();
        await user.save();
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is inactive');
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role,
          mdaId: user.mdaId._id
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      return {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mda: {
            id: user.mdaId._id,
            name: user.mdaId.name,
            reportUrl: user.mdaId.reportUrl
          }
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Local User Login (fallback)
  async loginUserLocal(email, password, mdaId) {
    try {
      // Find user by email
      const user = await User.findOne({ 
        email: email.toLowerCase(),
        isLDAPUser: false // Only allow local users
      }).select('+password').populate('mdaId');

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Validate MDA
      if (user.mdaId._id.toString() !== mdaId) {
        throw new Error('Invalid MDA for this user');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is inactive');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role,
          mdaId: user.mdaId._id
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      return {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mda: {
            id: user.mdaId._id,
            name: user.mdaId.name,
            reportUrl: user.mdaId.reportUrl
          }
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Hybrid login method
  async loginUser(identifier, password, mdaId) {
    // Try LDAP first if enabled
    if (process.env.LDAP_ENABLED === 'true') {
      try {
        return await this.loginUserLDAP(identifier, password, mdaId);
      } catch (ldapError) {
        console.log('LDAP authentication failed, trying local auth:', ldapError.message);
        
        // If LDAP fails and fallback is enabled, try local auth
        if (process.env.LDAP_FALLBACK_ENABLED === 'true') {
          try {
            return await this.loginUserLocal(identifier, password, mdaId);
          } catch (localError) {
            throw new Error('Authentication failed');
          }
        } else {
          throw ldapError;
        }
      }
    } else {
      // LDAP disabled, use local authentication
      return await this.loginUserLocal(identifier, password, mdaId);
    }
  }

  // Admin login (remains unchanged)
  async loginAdmin(email, password) {
    try {
      const admin = await Admin.findOne({ 
        email: email.toLowerCase() 
      }).select('+password');

      if (!admin) {
        throw new Error('Invalid credentials');
      }

      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      if (!admin.isActive) {
        throw new Error('Account is inactive');
      }

      admin.lastLogin = new Date();
      await admin.save();

      const token = jwt.sign(
        {
          adminId: admin._id,
          email: admin.email,
          role: admin.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      return {
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get MDAs (unchanged)
  async getMDAs() {
    try {
      const mdas = await MDA.find({ isActive: true }).select('name reportUrl');
      return mdas;
    } catch (error) {
      throw new Error('Failed to fetch MDAs');
    }
  }
}

export default new AuthService();
```

### 6. Updated Authentication Controller
Modify the controller to handle the new authentication flow:

```javascript
// Server/src/controller/auth.controller.js
import authService from '../service/authService.js';

// User login with LDAP support
export const loginUser = async (req, res) => {
  try {
    const { identifier, password, mdaId } = req.body; // Changed from 'email' to 'identifier'
    const result = await authService.loginUser(identifier, password, mdaId);
    res.status(200).json({ 
      success: true, 
      message: 'Login successful', 
      data: result 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Admin login (unchanged)
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginAdmin(email, password);
    res.status(200).json({ 
      success: true, 
      message: 'Admin login successful', 
      data: result 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get MDAs (unchanged)
export const getMDAs = async (req, res) => {
  try {
    const mdas = await authService.getMDAs();
    res.status(200).json({ 
      success: true, 
      data: mdas 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
```

### 7. Environment Variables
Add LDAP configuration to your `.env` file:

```bash
# LDAP Configuration
LDAP_ENABLED=true
LDAP_FALLBACK_ENABLED=true
LDAP_URL=ldap://your-ldap-server:389
LDAP_BASE_DN=dc=company,dc=com
LDAP_BIND_DN=cn=admin,dc=company,dc=com
LDAP_BIND_PASSWORD=your-admin-password
LDAP_USER_SEARCH_BASE=ou=users,dc=company,dc=com
LDAP_USER_SEARCH_FILTER=(uid={{username}})

# For Active Directory, you might use:
# LDAP_URL=ldap://your-ad-server:389
# LDAP_BASE_DN=dc=company,dc=local
# LDAP_BIND_DN=cn=service-account,ou=service-accounts,dc=company,dc=local
# LDAP_USER_SEARCH_BASE=ou=users,dc=company,dc=local
# LDAP_USER_SEARCH_FILTER=(sAMAccountName={{username}})
```

## Client-Side Changes

### 1. Updated Login Form
Modify the login form to accept username instead of email:

```typescript
// Client/src/components/login/login-form.tsx
interface LoginFormData {
  identifier: string; // Changed from 'email' to support username or email
  password: string;
  mdaId: string;
}

// Update form field
<Input
  id="identifier"
  type="text"
  placeholder="Username or Email"
  {...register('identifier', {
    required: 'Username or email is required',
  })}
/>
```

### 2. Updated Auth Service
Modify the authentication service:

```typescript
// Client/src/services/authService.ts
export interface LoginRequest {
  identifier: string; // Changed from 'email'
  password: string;
  mdaId: string;
}

export const authService = {
  // User login
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  // ... rest remains the same
};
```

### 3. User Profile Updates
Update profile display to show LDAP-specific information:

```typescript
// Client/src/pages/dashboard/Profile.tsx
// Add fields to display LDAP information
{profile?.isLDAPUser && (
  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
    <p className="text-sm text-blue-800">
      <strong>LDAP User:</strong> This account is managed by your organization's directory service.
      Password changes must be made through your organization's system.
    </p>
  </div>
)}

// Conditionally show password change section
{!profile?.isLDAPUser && (
  <Card className="p-6">
    {/* Password change form */}
  </Card>
)}
```

## Configuration

### LDAP Server Configuration Examples

#### Active Directory:
```bash
LDAP_URL=ldap://ad.company.com:389
LDAP_BASE_DN=dc=company,dc=local
LDAP_BIND_DN=cn=ldap-service,ou=service-accounts,dc=company,dc=local
LDAP_BIND_PASSWORD=service-account-password
LDAP_USER_SEARCH_BASE=ou=employees,dc=company,dc=local
LDAP_USER_SEARCH_FILTER=(sAMAccountName={{username}})
```

#### OpenLDAP:
```bash
LDAP_URL=ldap://ldap.company.com:389
LDAP_BASE_DN=dc=company,dc=com
LDAP_BIND_DN=cn=admin,dc=company,dc=com
LDAP_BIND_PASSWORD=admin-password
LDAP_USER_SEARCH_BASE=ou=people,dc=company,dc=com
LDAP_USER_SEARCH_FILTER=(uid={{username}})
```

#### LDAPS (Secure LDAP):
```bash
LDAP_URL=ldaps://ldap.company.com:636
# Add SSL/TLS configuration
LDAP_TLS_ENABLED=true
LDAP_TLS_REJECT_UNAUTHORIZED=false  # Set to true in production
```

## Security Considerations

### 1. Connection Security
- **Use LDAPS**: Always use encrypted connections in production
- **Certificate Validation**: Properly validate SSL certificates
- **Network Security**: Ensure LDAP traffic is on a secure network

### 2. Credential Management
- **Service Account**: Use a dedicated service account for LDAP binding
- **Least Privilege**: Grant minimal permissions to the service account
- **Password Rotation**: Regularly rotate service account passwords

### 3. Error Handling
- **Information Disclosure**: Don't expose LDAP errors to end users
- **Logging**: Log authentication attempts for security monitoring
- **Rate Limiting**: Implement rate limiting to prevent brute force attacks

### 4. Fallback Strategy
- **Graceful Degradation**: Handle LDAP server unavailability
- **Local Admin Access**: Ensure admin accounts can still access the system
- **Emergency Access**: Maintain emergency access procedures

## Migration Strategy

### Phase 1: Preparation
1. **LDAP Server Setup**: Ensure LDAP server is accessible
2. **Service Account**: Create and configure LDAP service account
3. **Testing Environment**: Set up test environment with LDAP integration
4. **User Communication**: Inform users about upcoming changes

### Phase 2: Hybrid Deployment
1. **Deploy LDAP Support**: Deploy with both LDAP and local auth enabled
2. **User Migration**: Gradually migrate users to LDAP authentication
3. **Testing**: Extensive testing with real users
4. **Monitoring**: Monitor authentication success rates

### Phase 3: LDAP-Only
1. **Disable Local Auth**: Turn off local password authentication
2. **Cleanup**: Remove password fields from user interface
3. **Documentation**: Update user documentation
4. **Training**: Provide user training if needed

### Migration Script Example:
```javascript
// Server/scripts/migrateLDAPUsers.js
import User from '../src/models/User.js';
import ldapService from '../src/service/ldapService.js';

async function migrateLDAPUsers() {
  const users = await User.find({ isLDAPUser: false });
  
  for (const user of users) {
    try {
      // Try to find user in LDAP by email
      const ldapUser = await ldapService.findUserByEmail(user.email);
      if (ldapUser) {
        user.username = ldapUser.username;
        user.isLDAPUser = true;
        user.password = undefined; // Remove local password
        await user.save();
        console.log(`Migrated user: ${user.email}`);
      }
    } catch (error) {
      console.error(`Failed to migrate user ${user.email}:`, error.message);
    }
  }
}
```

## Testing Strategy

### 1. Unit Tests
```javascript
// Test LDAP authentication
describe('LDAP Authentication', () => {
  test('should authenticate valid LDAP user', async () => {
    const result = await ldapService.authenticate('testuser', 'password');
    expect(result.success).toBe(true);
    expect(result.user.email).toBeDefined();
  });

  test('should reject invalid credentials', async () => {
    const result = await ldapService.authenticate('testuser', 'wrongpassword');
    expect(result.success).toBe(false);
  });
});
```

### 2. Integration Tests
```javascript
// Test full authentication flow
describe('User Login with LDAP', () => {
  test('should login LDAP user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'testuser',
        password: 'password',
        mdaId: 'valid-mda-id'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

### 3. Load Testing
- Test LDAP server performance under load
- Monitor connection pooling and timeouts
- Test failover scenarios

## Troubleshooting

### Common Issues and Solutions

#### 1. LDAP Connection Failures
**Symptoms**: "LDAP connection error" messages
**Solutions**:
- Check LDAP server URL and port
- Verify network connectivity
- Check firewall rules
- Validate SSL/TLS configuration

#### 2. Authentication Failures
**Symptoms**: Valid users cannot log in
**Solutions**:
- Verify LDAP search filter
- Check user search base DN
- Validate service account permissions
- Test with LDAP browser tool

#### 3. User Not Found
**Symptoms**: "User not found in LDAP" errors
**Solutions**:
- Check username format (uid vs sAMAccountName)
- Verify user exists in specified search base
- Check LDAP attribute mapping

#### 4. Performance Issues
**Symptoms**: Slow login times
**Solutions**:
- Implement connection pooling
- Optimize LDAP search filters
- Add caching for user attributes
- Monitor LDAP server performance

### Debugging Tools

#### 1. LDAP Browser
Use tools like Apache Directory Studio or JXplorer to browse LDAP structure

#### 2. Command Line Testing
```bash
# Test LDAP connection
ldapsearch -x -H ldap://your-server:389 -D "cn=admin,dc=company,dc=com" -W -b "dc=company,dc=com" "(uid=testuser)"

# Test LDAPS connection
ldapsearch -x -H ldaps://your-server:636 -D "cn=admin,dc=company,dc=com" -W -b "dc=company,dc=com" "(uid=testuser)"
```

#### 3. Application Logging
```javascript
// Add detailed logging to LDAP service
console.log('LDAP Config:', {
  url: ldapConfig.url,
  baseDN: ldapConfig.baseDN,
  userSearchBase: ldapConfig.userSearchBase,
  searchFilter: searchFilter
});
```

### Monitoring and Alerting

#### 1. Health Checks
```javascript
// Add LDAP health check endpoint
app.get('/health/ldap', async (req, res) => {
  try {
    await ldapService.connect();
    res.json({ status: 'healthy', ldap: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', ldap: 'disconnected', error: error.message });
  }
});
```

#### 2. Metrics to Monitor
- LDAP connection success rate
- Authentication success/failure rates
- Response times
- Error rates by type
- User login patterns

#### 3. Alerting Rules
- LDAP server unavailable
- High authentication failure rate
- Slow response times
- Service account lockout

## Conclusion

LDAP integration provides significant benefits for enterprise environments by centralizing authentication and reducing administrative overhead. The implementation requires careful planning, thorough testing, and proper monitoring to ensure a smooth transition.

Key success factors:
1. **Proper Planning**: Understand your LDAP structure and requirements
2. **Gradual Migration**: Use hybrid approach for smooth transition
3. **Comprehensive Testing**: Test all scenarios including failures
4. **Monitoring**: Implement proper monitoring and alerting
5. **Documentation**: Maintain clear documentation for troubleshooting

This integration will enhance your MDA Report System's security posture while providing a better user experience through single sign-on capabilities.