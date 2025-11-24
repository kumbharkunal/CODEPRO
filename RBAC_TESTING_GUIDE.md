# RBAC Testing Guide

## Pre-Deployment Checklist

### 1. Database Migration
Before deploying to production, run the migration script:

```bash
# Navigate to backend directory
cd BackEnd

# Run migration script (BACKUP DATABASE FIRST!)
npx ts-node scripts/migrate-to-team-structure.ts
```

**What the migration does:**
- Creates teams for existing admin users
- Assigns `teamId` to all existing repositories
- Assigns `teamId` to all existing reviews
- Identifies orphaned developer users that need team assignment

### 2. Environment Variables
Ensure all environment variables are set correctly:

**Backend (.env):**
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GITHUB_TOKEN=your_github_token
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:4000  # or your production URL
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api  # or your production backend URL
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## Manual Testing Scenarios

### Scenario 1: Admin Signup & Team Creation

**Test Steps:**
1. Clear your browser cookies/local storage
2. Sign up with a new email address (first user)
3. **Expected Result:**
   - User is created with `role='admin'`
   - Team is auto-created with name "{Username}'s Team"
   - User's `teamId` is set to the new team
   - Team `members` array includes the user

**Verification:**
```javascript
// In MongoDB or via API
GET /api/users/:userId
// Should return: { role: 'admin', teamId: '...' }

GET /api/team
// Should return: { name: "...'s Team", adminId: '...', members: [...] }
```

### Scenario 2: Admin Connects Repository

**Test Steps:**
1. Log in as admin
2. Navigate to `/repositories`
3. Click "Connect Repository"
4. Complete GitHub OAuth flow
5. Select a repository to connect

**Expected Result:**
- Repository is created with admin's `teamId`
- Only the admin sees the "Connect Repository" button
- Repository appears in the list

**Verification:**
```javascript
GET /api/repositories
// Should return repositories with teamId matching admin's team
```

### Scenario 3: Admin Invites Developer

**Test Steps:**
1. Log in as admin
2. Navigate to `/team`
3. Enter developer's email
4. Click "Send Invitation"
5. **Expected Result:**
   - Invitation is created with status='pending'
   - Invitation link is generated and copied to clipboard
   - Invitation appears in "Pending Invitations" list

**Verification:**
```javascript
GET /api/invitations
// Should return invitation with status='pending', token, expiresAt (7 days)
```

### Scenario 4: Developer Accepts Invitation

**Test Steps:**
1. Copy the invitation link from admin's view
2. Open link in incognito/different browser
3. If not logged in, sign up/sign in with Clerk
4. **Expected Result:**
   - Invitation page shows team name and inviter
   - After accepting:
     - User's `role` is set to 'developer'
     - User's `teamId` is set to the team
     - User is added to team's `members` array
     - Invitation status changes to 'accepted'
     - Redirect to dashboard

**Verification:**
```javascript
GET /api/users/:userId
// Should return: { role: 'developer', teamId: '...' }

GET /api/team/members
// Should include the new developer
```

### Scenario 5: Developer Read-Only Access

**Test Steps (as developer):**
1. Log in as developer
2. Navigate to `/repositories`
   - **Expected:** Can view all team repositories
   - **Expected:** NO "Connect Repository" button visible
   - **Expected:** NO "Disconnect" button on repository cards

3. Navigate to `/reviews`
   - **Expected:** Can view all team reviews
   - **Expected:** NO create/edit/delete buttons

4. Click on a specific review
   - **Expected:** Can view full review details
   - **Expected:** All content is read-only

5. Navigate to `/settings`
   - **Expected:** "Read Only" badge visible
   - **Expected:** Profile image upload is disabled
   - **Expected:** Name input is disabled
   - **Expected:** NO "Save Changes" button
   - **Expected:** "Manage Billing" button replaced with message

6. Try to access `/team`
   - **Expected:** Redirected or see "Admin only" message

**Verification:**
- Developer can GET all team data
- Developer CANNOT POST/PUT/DELETE any resources
- All admin-only UI elements are hidden

### Scenario 6: Team Isolation

**Test Steps:**
1. Create two admin accounts (Admin A and Admin B)
2. Each admin connects a repository
3. Admin A tries to access Admin B's resources

**Expected Result:**
- Admin A cannot see Admin B's repositories
- Admin A cannot see Admin B's reviews
- Admin A cannot see Admin B's team members
- All API calls return 404 (not 403) for resources from other teams

**Verification:**
```javascript
// As Admin A
GET /api/repositories
// Should ONLY return Admin A's team repositories

GET /api/reviews
// Should ONLY return Admin A's team reviews

GET /api/team/members
// Should ONLY return Admin A's team members
```

### Scenario 7: Permission Enforcement

**Test API Endpoints with curl or Postman:**

```bash
# As Developer, try to connect repository (should fail)
POST /api/repositories
Authorization: Bearer {developer_token}
# Expected: 403 Forbidden

# As Developer, try to delete review (should fail)
DELETE /api/reviews/:id
Authorization: Bearer {developer_token}
# Expected: 403 Forbidden

# As Developer, try to update review (should fail)
PUT /api/reviews/:id
Authorization: Bearer {developer_token}
# Expected: 403 Forbidden

# As Admin from Team A, try to access Team B's repository (should fail)
GET /api/repositories/:teamB_repo_id
Authorization: Bearer {teamA_admin_token}
# Expected: 404 Not Found (for security, don't reveal it exists)
```

### Scenario 8: Invitation Expiry

**Test Steps:**
1. Admin creates invitation
2. Manually update invitation's `expiresAt` to past date in DB:
   ```javascript
   db.invitations.updateOne(
     { _id: ObjectId('...') },
     { $set: { expiresAt: new Date('2023-01-01') } }
   )
   ```
3. Try to accept the invitation

**Expected Result:**
- Invitation page shows "expired" message
- Cannot accept invitation
- Invitation status is updated to 'expired'

### Scenario 9: Multiple Team Members

**Test Steps:**
1. Admin invites 3 developers
2. All 3 accept invitations
3. Admin navigates to `/team`

**Expected Result:**
- Team page shows 4 members total (1 admin + 3 developers)
- Each member has correct role badge
- Admin can remove developers (but not self)
- Removing a developer:
  - Removes user from team
  - User's `teamId` is cleared
  - User loses access to team resources

### Scenario 10: Role Badge Display

**Test Steps:**
1. Log in as admin
2. Check navigation bar

**Expected Result:**
- Role badge shows "ADMIN" with crown icon in purple/yellow
- Badge is visible in:
  - Navbar user dropdown
  - Team management page

3. Log in as developer

**Expected Result:**
- Role badge shows "DEVELOPER" with code icon in blue
- Badge is visible in navbar user dropdown

## API Testing Checklist

Use this checklist to verify all endpoints:

### User Routes
- [ ] `GET /api/users` - Admin only, returns team members
- [ ] `PATCH /api/users/:id/role` - Admin only, can change developer roles
- [ ] `GET /api/users/:id` - Any authenticated user

### Repository Routes  
- [ ] `POST /api/repositories` - Admin only, creates with teamId
- [ ] `GET /api/repositories` - Returns team repos only
- [ ] `GET /api/repositories/:id` - Returns if belongs to team
- [ ] `DELETE /api/repositories/:id` - Admin only, team-scoped

### Review Routes
- [ ] `POST /api/reviews` - Admin only (auto-assigns teamId)
- [ ] `GET /api/reviews` - Returns team reviews only
- [ ] `GET /api/reviews/:id` - Returns if belongs to team
- [ ] `PUT /api/reviews/:id` - Admin only, team-scoped (CRITICAL!)
- [ ] `DELETE /api/reviews/:id` - Admin only, team-scoped
- [ ] `GET /api/reviews/stats` - Returns team stats only

### Team Routes
- [ ] `GET /api/team` - Returns user's team
- [ ] `PATCH /api/team` - Admin only, updates team name
- [ ] `GET /api/team/members` - Returns team members
- [ ] `DELETE /api/team/members/:id` - Admin only, removes member

### Invitation Routes
- [ ] `POST /api/invitations` - Admin only
- [ ] `GET /api/invitations` - Admin only, returns team invitations
- [ ] `GET /api/invitations/token/:token` - Public
- [ ] `POST /api/invitations/:token/accept` - Authenticated
- [ ] `DELETE /api/invitations/:id` - Admin only

## Security Testing

### Test for Common Vulnerabilities

1. **SQL Injection** (MongoDB NoSQL Injection)
   ```javascript
   // Try malicious payloads in API calls
   POST /api/invitations
   { "email": {"$ne": null} }
   // Should be rejected by validation
   ```

2. **Privilege Escalation**
   ```javascript
   // Developer tries to set their own role to admin
   PATCH /api/users/:self_id/role
   { "role": "admin" }
   // Should be rejected (403 or team check fails)
   ```

3. **Cross-Team Access**
   ```javascript
   // User from Team A tries to access Team B's review
   GET /api/reviews/:teamB_review_id
   // Should return 404, not 403 (don't reveal existence)
   ```

4. **Token Manipulation**
   - Try using expired Clerk tokens
   - Try using tokens from different environments
   - Expected: 401 Unauthorized

## Performance Testing

### Load Test Scenarios

1. **Multiple Concurrent Reviews**
   - Create 10 reviews simultaneously
   - Verify all are assigned correct teamId
   - Verify team isolation is maintained

2. **Large Team**
   - Invite 50 developers to one team
   - Verify `/api/team/members` response time
   - Verify pagination if implemented

## Post-Deployment Verification

After deploying to production:

1. **Check Logs**
   - Monitor for 403 errors (permission denied)
   - Monitor for 404 errors on cross-team access attempts
   - Check for any authentication failures

2. **Database Integrity**
   ```javascript
   // Verify all users have teamId
   db.users.find({ teamId: { $exists: false } }).count()
   // Should be 0

   // Verify all repositories have teamId
   db.repositories.find({ teamId: { $exists: false } }).count()
   // Should be 0

   // Verify all reviews have teamId
   db.reviews.find({ teamId: { $exists: false } }).count()
   // Should be 0
   ```

3. **User Feedback**
   - Confirm admins can perform all admin actions
   - Confirm developers see read-only UI correctly
   - Confirm invitation flow works end-to-end

## Rollback Plan

If issues are discovered post-deployment:

1. **Code Rollback**
   - Revert to previous git commit
   - Redeploy previous version

2. **Database Rollback**
   - Restore from backup taken before migration
   - Remove new Team and Invitation collections:
     ```javascript
     db.teams.drop()
     db.invitations.drop()
     ```

3. **Clear Client Cache**
   - Ask users to hard refresh (Ctrl+Shift+R)
   - Clear localStorage if needed

## Support & Troubleshooting

### Common Issues

**Issue:** User can't accept invitation
- Check invitation hasn't expired
- Verify email matches exactly
- Check user isn't already in a team

**Issue:** Developer sees admin buttons
- Hard refresh browser (Ctrl+Shift+R)
- Check Redux state has correct user.role
- Verify API returns correct role

**Issue:** Admin can't see team members
- Verify admin's teamId is set correctly
- Check team.members array includes admin
- Verify API route authentication

**Issue:** Reviews not showing up
- Verify review.teamId matches user.teamId
- Check API filters are applied correctly
- Verify WebSocket room names use correct format

## Success Criteria

✅ All test scenarios pass
✅ No 500 errors in logs
✅ All team data is properly isolated
✅ Developers cannot perform admin actions
✅ Admins can manage their teams
✅ Invitation flow works end-to-end
✅ Database migration completed successfully
✅ Performance is acceptable (< 500ms API responses)
