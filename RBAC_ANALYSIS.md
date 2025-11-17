# Role-Based Access Control (RBAC) Analysis

## Executive Summary

This application implements a **basic RBAC system** with three roles (`admin`, `developer`, `viewer`), but has several critical gaps and areas for improvement. The current implementation provides authentication and some authorization, but lacks comprehensive permission management, role-based UI controls, and proper resource-level access control.

---

## Current Implementation

### 1. **Role Definition**

**Location:** `BackEnd/src/models/User.ts`, `BackEnd/src/types/user.interface.ts`

- **Roles Defined:**
  - `admin` - Full system access
  - `developer` - Can create/manage repositories and reviews
  - `viewer` - Read-only access (default role)

**Issues:**
- ✅ Roles are properly typed and validated
- ❌ No clear documentation of what each role can do
- ❌ No hierarchical role system
- ❌ No custom roles or permissions

### 2. **Authentication Middleware**

**Location:** `BackEnd/src/middlewares/auth.ts`

**Implementation:**
- `authenticateClerk()` - Verifies Clerk JWT tokens and loads user into `req.user`
- `authorize(...roles)` - Checks if user's role is in the allowed roles list

**Strengths:**
- ✅ Proper token verification
- ✅ User object attached to request
- ✅ Clear error messages with error codes

**Weaknesses:**
- ❌ No permission-based authorization (only role-based)
- ❌ No resource-level ownership checks in middleware
- ❌ No audit logging for authorization failures

### 3. **Backend Route Protection**

#### Routes with Role-Based Authorization:

1. **User Routes** (`BackEnd/src/routes/userRoutes.ts`)
   - `GET /api/users` - **Admin only** ✅
   - `GET /api/users/:id` - **Authenticated only** (no role check) ⚠️
   - `POST /api/users` - **No authentication** ❌ **CRITICAL**

2. **Repository Routes** (`BackEnd/src/routes/repositoryRoutes.ts`)
   - `DELETE /api/repositories/:id` - **Admin or Developer** ✅
   - Other routes - **Authenticated only** (ownership checked in controller) ✅

3. **Review Routes** (`BackEnd/src/routes/reviewRoutes.ts`)
   - All routes - **Authenticated only** (ownership checked in controller) ✅
   - `PUT /api/reviews/:id` - **No authentication** ❌ **CRITICAL**

4. **Other Routes:**
   - Most routes use `authenticateClerk` ✅
   - Webhook routes are unprotected (by design) ✅

**Critical Issues:**
- ❌ `POST /api/users` allows anyone to create users with any role
- ❌ `PUT /api/reviews/:id` has no authentication (allows unauthorized updates)
- ⚠️ `GET /api/users/:id` allows any authenticated user to view any user's data

### 4. **Resource-Level Authorization**

**Location:** Controllers (e.g., `repositoryController.ts`, `reviewController.ts`)

**Implementation:**
- Repositories: Ownership checked via `connectedBy` field ✅
- Reviews: Ownership checked via `reviewedBy` field ✅
- User data: **No ownership checks** ❌

**Strengths:**
- ✅ Good ownership verification for repositories and reviews
- ✅ Proper error messages when access denied

**Weaknesses:**
- ❌ No admin override for resource access
- ❌ No shared repository access model
- ❌ No team/organization-level permissions

### 5. **Frontend Authorization**

**Location:** `FrontEnd/src/components/auth/ProtectedRoute.tsx`

**Implementation:**
- Only checks if user is signed in (Clerk authentication)
- **No role-based route protection** ❌

**Issues:**
- ❌ All authenticated users can access all routes
- ❌ No role-based UI element hiding
- ❌ No permission-based component rendering
- ❌ No admin dashboard or user management UI

### 6. **User Management**

**Location:** `BackEnd/src/controllers/userController.ts`, `BackEnd/src/controllers/clerkController.ts`

**Issues:**
- ❌ No endpoint to update user roles (admins can't promote users)
- ❌ No endpoint to delete users
- ❌ No role assignment during user creation (always defaults to 'viewer')
- ❌ No admin UI for user management

---

## Security Vulnerabilities

### 🔴 **CRITICAL**

1. **Unprotected User Creation**
   - `POST /api/users` has no authentication
   - Anyone can create users with any role
   - **Fix:** Require admin authentication or remove this endpoint (use Clerk webhooks)

2. **Unprotected Review Updates**
   - `PUT /api/reviews/:id` has no authentication
   - Anyone can update any review
   - **Fix:** Add `authenticateClerk` middleware and ownership check

3. **User Data Exposure**
   - `GET /api/users/:id` allows any authenticated user to view any user's data
   - **Fix:** Add ownership check or admin-only access

### 🟡 **HIGH PRIORITY**

4. **No Frontend Role Protection**
   - All authenticated users see all UI elements
   - Users can attempt API calls even if UI is hidden
   - **Fix:** Implement role-based route guards and UI components

5. **No Role Management**
   - Admins cannot change user roles
   - No way to promote/demote users
   - **Fix:** Add admin endpoints and UI for role management

6. **No Permission Granularity**
   - Only role-based, no fine-grained permissions
   - Cannot assign specific capabilities to users
   - **Fix:** Implement permission-based system

### 🟢 **MEDIUM PRIORITY**

7. **No Audit Logging**
   - No tracking of authorization failures
   - No audit trail for role changes
   - **Fix:** Add audit logging middleware

8. **No Resource Sharing**
   - Users can only access their own resources
   - No team/organization model
   - **Fix:** Implement resource sharing with proper permissions

---

## Recommended Improvements

### 1. **Immediate Fixes (Security)**

```typescript
// Fix 1: Protect user creation
router.post('/', authenticateClerk, authorize('admin'), validate(createUserSchema), createUser);

// Fix 2: Protect review updates
router.put('/:id', authenticateClerk, updateReview);

// Fix 3: Protect user data access
router.get('/:id', authenticateClerk, authorize('admin'), getUserById);
// OR add ownership check in controller
```

### 2. **Permission-Based System**

**Create Permission Model:**
```typescript
// BackEnd/src/models/Permission.ts
const PermissionSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  resource: String, // 'repository', 'review', 'user', etc.
  action: String,   // 'create', 'read', 'update', 'delete'
});

// BackEnd/src/models/Role.ts
const RoleSchema = new Schema({
  name: { type: String, required: true, unique: true },
  permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
  isSystem: { type: Boolean, default: false },
});
```

**Update User Model:**
```typescript
role: { type: Schema.Types.ObjectId, ref: 'Role' },
permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }], // Override permissions
```

### 3. **Enhanced Authorization Middleware**

```typescript
// BackEnd/src/middlewares/auth.ts
export const requirePermission = (resource: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(req.user._id).populate('role');
    const hasPermission = await checkPermission(user, resource, action);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        message: `Permission denied: ${action} ${resource}` 
      });
    }
    
    next();
  };
};

export const requireOwnership = (resourceModel: string, userIdField: string = 'userId') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Check if user owns resource OR is admin
    const resource = await mongoose.model(resourceModel).findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    if (resource[userIdField].toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    next();
  };
};
```

### 4. **Frontend Role-Based Components**

```typescript
// FrontEnd/src/components/auth/RoleGuard.tsx
interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const user = useAppSelector(state => state.auth.user);
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// FrontEnd/src/components/auth/PermissionGuard.tsx
interface PermissionGuardProps {
  resource: string;
  action: string;
  children: React.ReactNode;
}

export function PermissionGuard({ resource, action, children }: PermissionGuardProps) {
  const user = useAppSelector(state => state.auth.user);
  const hasPermission = checkUserPermission(user, resource, action);
  
  if (!hasPermission) return null;
  return <>{children}</>;
}
```

### 5. **Role-Based Routes**

```typescript
// FrontEnd/src/App.tsx
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/reviews" element={<ReviewsPage />} />
  
  <Route element={<RoleGuard allowedRoles={['admin', 'developer']} />}>
    <Route path="/repositories/connect" element={<ConnectRepositoryPage />} />
  </Route>
  
  <Route element={<RoleGuard allowedRoles={['admin']} />}>
    <Route path="/admin/users" element={<AdminUsersPage />} />
    <Route path="/admin/settings" element={<AdminSettingsPage />} />
  </Route>
</Route>
```

### 6. **Admin User Management**

**Backend:**
```typescript
// BackEnd/src/controllers/userController.ts
export const updateUserRole = async (req: any, res: Response) => {
  // Only admins can change roles
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  const { id } = req.params;
  const { role } = req.body;
  
  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true }
  );
  
  res.json(user);
};

export const deleteUser = async (req: any, res: Response) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
};
```

**Frontend:**
- Create `AdminUsersPage.tsx` with user list
- Add role change UI
- Add user deletion (with confirmation)

### 7. **Audit Logging**

```typescript
// BackEnd/src/middlewares/audit.ts
export const auditLog = (action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.json;
    res.json = function(data) {
      // Log authorization events
      if (res.statusCode === 403 || res.statusCode === 401) {
        AuditLog.create({
          userId: req.user?._id,
          action,
          resource: req.path,
          status: 'denied',
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      return originalSend.call(this, data);
    };
    next();
  };
};
```

### 8. **Resource Sharing Model**

```typescript
// BackEnd/src/models/RepositoryAccess.ts
const RepositoryAccessSchema = new Schema({
  repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, enum: ['owner', 'admin', 'developer', 'viewer'] },
  grantedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  grantedAt: { type: Date, default: Date.now },
});
```

---

## Implementation Priority

### Phase 1: Security Fixes (Week 1)
1. ✅ Fix unprotected endpoints (`POST /api/users`, `PUT /api/reviews/:id`)
2. ✅ Add ownership checks to user data access
3. ✅ Add role-based route guards in frontend

### Phase 2: Basic RBAC Enhancement (Week 2)
4. ✅ Add role management endpoints
5. ✅ Create admin user management UI
6. ✅ Add role-based UI components

### Phase 3: Permission System (Week 3-4)
7. ✅ Implement permission model
8. ✅ Create permission-based middleware
9. ✅ Update all routes to use permissions

### Phase 4: Advanced Features (Week 5+)
10. ✅ Add audit logging
11. ✅ Implement resource sharing
12. ✅ Add team/organization model

---

## Testing Checklist

- [ ] Test that unauthenticated users cannot access protected routes
- [ ] Test that viewers cannot perform admin actions
- [ ] Test that users cannot access other users' resources
- [ ] Test that admins can access all resources
- [ ] Test role changes (admin can change roles)
- [ ] Test permission overrides
- [ ] Test audit logging captures authorization failures
- [ ] Test frontend role guards hide/show correct UI
- [ ] Test API calls from frontend respect role restrictions

---

## Conclusion

The current RBAC implementation provides a **basic foundation** but has **critical security gaps** that need immediate attention. The system needs:

1. **Immediate fixes** for unprotected endpoints
2. **Enhanced authorization** with permission-based system
3. **Frontend role guards** to prevent unauthorized access
4. **Admin tools** for user and role management
5. **Audit logging** for security monitoring

With these improvements, the application will have a robust, scalable RBAC system suitable for production use.

