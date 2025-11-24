# RBAC Verification Guide

## Issue That Was Fixed

**Problem**: New users were getting "developer" role instead of "admin" when signing up fresh.

**Root Cause**: Old test data in database without RBAC fields (clerkId, role, teamId) was blocking new user creation due to unique email constraints.

**Solution**: 
1. Cleaned up old test data from database
2. Fixed frontend fallback role from 'viewer' to 'developer'
3. All user creation paths now correctly set role to 'admin'

## Verification Steps

### 1. Test Fresh Admin Signup

1. **Clear browser cache and cookies** (important!)
2. Go to your application signup page
3. Sign up with a **completely new email** (not previously used)
4. After signup, verify:

   **Expected Results:**
   - ✅ User is created with `role: 'admin'`
   - ✅ Team is auto-created with format `{Name}'s Team`
   - ✅ User's `teamId` is set to the new team's ID
   - ✅ Team's `members` array includes the user
   - ✅ Team's `adminId` is set to the user's ID

### 2. Verify in Database

Run this MongoDB query to check the new user:

```javascript
// Connect to your database
mongosh "mongodb+srv://kumbharkunaldaulat_db_user:5LcVpPF2fWXP6dXJ@codepro-cluster.i03gca7.mongodb.net/test?retryWrites=true&w=majority"

// Check the user
db.users.findOne({ email: "your-test-email@example.com" })

// Expected output should include:
// {
//   clerkId: "user_xxx...",
//   email: "your-test-email@example.com",
//   name: "Your Name",
//   role: "admin",  // ✅ Should be admin!
//   teamId: ObjectId("..."),
//   ...
// }

// Check the team was created
db.teams.findOne()

// Expected output:
// {
//   name: "Your Name's Team",
//   adminId: ObjectId("user_id"),
//   members: [ObjectId("user_id")],
//   ...
// }
```

### 3. Test Frontend Permissions

After logging in as admin, verify you can:
- ✅ See "Team" link in navbar
- ✅ Access Team Management page
- ✅ Create invitations
- ✅ Connect GitHub repositories
- ✅ Enable/disable AI reviews
- ✅ Edit/delete reviews
- ✅ See "Admin" badge in UI

### 4. Test Developer Invitation Flow

1. As admin, go to Team Management
2. Invite a developer using a different email
3. Copy the invitation link
4. Open in incognito/private window
5. Sign up with the invited email
6. Accept the invitation
7. Verify the developer user:

   **Expected Results:**
   - ✅ User has `role: 'developer'`
   - ✅ User's `teamId` matches admin's team
   - ✅ Team's `members` array includes both users
   - ✅ Developer sees read-only UI
   - ✅ Developer cannot connect repos or manage team

### 5. Test Developer Permissions

As developer, verify you **CANNOT**:
- ❌ Connect new repositories
- ❌ Disconnect repositories
- ❌ Enable/disable AI reviews
- ❌ Edit or delete reviews
- ❌ Regenerate reviews
- ❌ Invite team members
- ❌ Remove team members
- ❌ Update team settings
- ❌ Access billing settings

As developer, verify you **CAN**:
- ✅ View repositories list
- ✅ View PRs and reviews
- ✅ Read review content
- ✅ View notifications
- ✅ View team members
- ✅ See "Developer" badge in UI

## Quick Database Check Commands

```bash
# Check current user count
mongosh "mongodb+srv://..." --quiet --eval "db.users.countDocuments()"

# Check users with their roles
mongosh "mongodb+srv://..." --quiet --eval "db.users.find({}, {email: 1, role: 1, teamId: 1}).pretty()"

# Check all teams
mongosh "mongodb+srv://..." --quiet --eval "db.teams.find().pretty()"

# Check pending invitations
mongosh "mongodb+srv://..." --quiet --eval "db.invitations.find({status: 'pending'}).pretty()"
```

## Troubleshooting

### If user still gets developer role:

1. **Clear Clerk cache**:
   - Sign out completely
   - Clear browser cookies for your domain
   - Clear localStorage
   - Sign up with a DIFFERENT email

2. **Check backend is running**:
   - Verify backend server is running
   - Check console logs for errors
   - Verify Clerk webhook is configured (if using webhooks)

3. **Check database connection**:
   - Verify MONGODB_URI in .env is correct
   - Ensure you're not using cached/old connection

4. **Verify code changes**:
   - Restart backend server after code changes
   - Hard refresh frontend (Ctrl+Shift+R)
   - Check that clerkController.ts has `role: 'admin'` on lines 39 and 112

### If team is not created:

1. Check backend console for errors
2. Verify Team model is imported correctly
3. Check MongoDB connection is successful
4. Verify user has teamId after creation

## Code Paths Verified

All three user creation paths now set `role: 'admin'`:

1. **syncClerkUser** (`clerkController.ts:39`):
   ```typescript
   role: 'admin', // Fresh users are always admin
   ```

2. **handleClerkWebhook** (`clerkController.ts:112`):
   ```typescript
   role: 'admin', // Fresh users are always admin
   ```

3. **createUser** (`userController.ts:22`):
   ```typescript
   role: 'admin', // Fresh users are always admin
   ```

4. **User Model Default** (`User.ts:27`):
   ```typescript
   default: 'admin',
   ```

## Success Criteria

✅ Fresh signup creates admin user with team
✅ Invitation flow creates developer user
✅ Admin has full permissions
✅ Developer has read-only access
✅ Database has clean RBAC structure
✅ No old test data interfering

## Support

If you still encounter issues:
1. Check backend logs for errors
2. Verify Clerk is configured correctly
3. Ensure database connection is working
4. Run cleanup script again if needed: `npx ts-node scripts/cleanup-old-data.ts`
