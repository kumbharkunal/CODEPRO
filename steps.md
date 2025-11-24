# CodePro User Guide - Step by Step

Welcome to CodePro! This guide will walk you through how to use the application based on your role (Admin or Developer).

## Table of Contents

1. [Getting Started](#getting-started)
2. [For Admins - Complete Workflow](#for-admins---complete-workflow)
3. [For Developers - Complete Workflow](#for-developers---complete-workflow)
4. [Common Features](#common-features)
5. [Troubleshooting](#troubleshooting)

---

## Getting Started

### First Time Users

**What is CodePro?**
CodePro is an AI-powered GitHub Pull Request reviewer that helps your team maintain code quality by automatically reviewing PRs and providing intelligent feedback.

**Roles in CodePro:**
- **Admin**: Full control - can connect repositories, manage team, invite developers, and configure all settings
- **Developer**: Read-only access - can view repositories, PRs, and AI reviews but cannot make changes

---

## For Admins - Complete Workflow

### Step 1: Sign Up & Create Your Account

1. **Visit CodePro** and click "Sign Up"
2. **Choose your signup method:**
   - Google Account
   - GitHub Account
   - Email & Password
3. **Complete the authentication process**
4. **Automatic Team Creation**: When you sign up, a team is automatically created with you as the admin

**What happens behind the scenes:**
- You're assigned the "Admin" role
- A team is created with a default name (e.g., "Your Name's Team")
- You're ready to start connecting repositories!

---

### Step 2: Connect Your GitHub Repositories

1. **Navigate to Repositories Page**
   - Click "Repositories" in the navigation menu

2. **Connect a Repository**
   - Click the "Connect Repository" button
   - Authenticate with GitHub (if not already done)
   - Select the repositories you want CodePro to review
   - Click "Connect"

3. **Configure Repository Settings**
   - Enable/disable AI reviews for specific repos
   - Set review preferences (review depth, focus areas, etc.)
   - Configure webhook for automatic PR detection

**What CodePro does:**
- Sets up webhooks to listen for new PRs
- Monitors connected repositories
- Automatically triggers AI reviews when PRs are created/updated

---

### Step 3: Invite Team Members (Developers)

1. **Go to Team Management**
   - Click "Team" in the navigation menu
   - You'll see your team name and current members

2. **Send an Invitation**
   - Click "Invite Developer"
   - Enter the developer's email address
   - Click "Send Invitation"

3. **Share the Invitation Link**
   - Copy the invitation link that appears
   - Send it to your developer via:
     - Email
     - Slack
     - Microsoft Teams
     - Or any other communication tool

**Important Notes:**
- Invitation links expire in 7 days
- Each link can only be used once
- Developers will join your team with "Developer" role (read-only)

---

### Step 4: Manage Your Team

**View Team Members:**
1. Go to "Team" page
2. See all members with their:
   - Name
   - Email
   - Role (Admin/Developer)
   - Join date

**Remove a Team Member:**
1. Find the member you want to remove
2. Click the "Remove" button next to their name
3. Confirm the removal
4. They will lose access to your team's repositories and reviews

**Edit Team Name:**
1. Go to "Team" page
2. Click "Edit Team Name"
3. Enter new team name
4. Click "Save"

**Manage Pending Invitations:**
1. View all pending invitations in the "Team" page
2. See who hasn't accepted yet
3. Revoke invitations if needed (click "Revoke")

---

### Step 5: Monitor AI Reviews

**View All Reviews:**
1. Navigate to "Reviews" page
2. See all AI-generated reviews for your team's PRs

**Review Details:**
- PR title and description
- Repository name
- Review status (Pending/Complete)
- AI feedback and suggestions
- Code quality score
- Detected issues

**Manage Reviews (Admin Only):**
- **Edit Review**: Modify AI feedback or add custom notes
- **Regenerate Review**: Ask AI to re-analyze the PR
- **Delete Review**: Remove a review completely
- **Export Review**: Download review as PDF or markdown

---

### Step 6: Configure Settings

1. **Navigate to Settings Page**
   - Click "Settings" in the navigation menu

2. **Profile Settings:**
   - Update your name
   - Change email
   - Upload profile picture

3. **Notification Preferences:**
   - Email notifications for new reviews
   - Slack integration
   - Webhook URLs for custom notifications

4. **AI Review Configuration:**
   - Review frequency (every PR, daily digest, etc.)
   - Focus areas (security, performance, style, etc.)
   - Review depth (quick scan, thorough analysis, deep dive)

5. **Billing & Subscription (Admin Only):**
   - View current plan
   - Upgrade/downgrade subscription
   - Payment methods
   - Billing history

---

### Step 7: Daily Admin Workflow

**Your typical day as an admin:**

1. **Morning Check:**
   - Review overnight AI feedback on PRs
   - Check team activity
   - Respond to developer questions

2. **Repository Management:**
   - Connect new repositories as projects grow
   - Adjust review settings based on team needs
   - Monitor webhook health

3. **Team Management:**
   - Onboard new developers (send invitations)
   - Remove former team members
   - Review team permissions

4. **Review Management:**
   - Verify AI review quality
   - Regenerate reviews if needed
   - Export important reviews for documentation

---

## For Developers - Complete Workflow

### Step 1: Accept Your Invitation

1. **Receive Invitation Link**
   - Your admin will send you an invitation link
   - Check your email, Slack, or other communication channels

2. **Click the Invitation Link**
   - Opens CodePro invitation page
   - Shows team name and admin who invited you

3. **Accept the Invitation**
   - If you don't have an account:
     - Click "Sign Up & Accept"
     - Choose signup method (Google/GitHub/Email)
     - Complete authentication
   - If you already have an account:
     - Click "Sign In & Accept"
     - Log in with your existing credentials

4. **Welcome to the Team!**
   - You're now a member with "Developer" role
   - You can view all team repositories and reviews

**Important:**
- Invitation links expire in 7 days
- You can only use each link once
- You'll automatically be assigned to your admin's team

---

### Step 2: Explore Your Dashboard

1. **Login to CodePro**
   - Use the same method you used to accept the invitation

2. **Dashboard Overview:**
   - See your role badge: "Developer" in the navigation
   - View summary of team repositories
   - See recent AI reviews
   - Check notifications

**What you can see:**
- All repositories connected by your admin
- All PRs and their AI reviews
- Team members (read-only)
- Notification history

---

### Step 3: View Repositories

1. **Navigate to Repositories Page**
   - Click "Repositories" in the navigation menu

2. **Browse Connected Repositories:**
   - See all repos your admin has connected
   - View repository details:
     - Repository name
     - Last review date
     - Number of PRs reviewed
     - Review status

3. **Repository Details:**
   - Click on a repository to see:
     - All PRs for that repository
     - AI review history
     - Repository settings (view only)

**As a Developer, you CANNOT:**
- Connect new repositories
- Disconnect repositories
- Change repository settings
- Enable/disable AI reviews

---

### Step 4: View AI Reviews

1. **Navigate to Reviews Page**
   - Click "Reviews" in the navigation menu

2. **Browse All Reviews:**
   - See all AI-generated reviews for your team's PRs
   - Filter by:
     - Repository
     - Date range
     - Review status
     - PR author

3. **Read Review Details:**
   - Click on any review to see:
     - Full AI analysis
     - Code suggestions
     - Security issues
     - Performance recommendations
     - Style improvements
   - View code snippets with suggested changes
   - See quality scores and metrics

**As a Developer, you CANNOT:**
- Edit reviews
- Delete reviews
- Regenerate reviews
- Export reviews

---

### Step 5: Manage Notifications

1. **View Notifications:**
   - Click the notification icon
   - See all notifications for:
     - New AI reviews
     - Team updates
     - PR mentions

2. **Notification Preferences:**
   - Go to Settings page
   - View notification settings (read-only)
   - You cannot change notification preferences
   - Ask your admin to adjust settings for you

---

### Step 6: View Settings (Read-Only)

1. **Navigate to Settings Page**
   - Click "Settings" in the navigation menu

2. **What you can see:**
   - Your profile information
   - Team notification settings
   - AI review configuration
   - Billing information (view only)

3. **Read-Only Indicators:**
   - You'll see lock icons 🔒 next to fields
   - "Read Only" badges throughout the page
   - All input fields are disabled
   - No save buttons available

4. **What you can do:**
   - View all settings
   - Understand team configuration
   - Take note of what you need to ask admin to change

**Need to change something?**
- Contact your team admin
- They can update settings on your behalf

---

### Step 7: Daily Developer Workflow

**Your typical day as a developer:**

1. **Morning Routine:**
   - Check CodePro dashboard
   - Review new AI feedback on your PRs
   - Read suggestions and recommendations

2. **PR Review:**
   - See AI reviews on PRs you're reviewing
   - Use AI insights to inform your code review
   - Share AI findings with PR authors

3. **Code Improvements:**
   - Apply AI suggestions to your code
   - Learn from AI feedback patterns
   - Improve code quality over time

4. **Team Collaboration:**
   - Discuss AI reviews with team members
   - Ask admin for access changes if needed
   - Stay updated on team repositories

---

## Common Features

### Features Available to Both Admins & Developers

#### 1. Viewing Dashboard

**How to use:**
1. Login to CodePro
2. Dashboard shows:
   - Recent activity
   - Repository summary
   - Review statistics
   - Quick links

**Available to:**
- ✅ Admin - Full view with management options
- ✅ Developer - Read-only view

---

#### 2. Searching Reviews

**How to use:**
1. Go to Reviews page
2. Use search bar to find:
   - PRs by title
   - Reviews by repository
   - Code by filename
3. Apply filters:
   - Date range
   - Repository
   - Review status

**Available to:**
- ✅ Admin - Can search and manage
- ✅ Developer - Can search and view

---

#### 3. Notifications

**How to use:**
1. Click notification icon (bell)
2. See real-time updates:
   - New PR reviews
   - Team changes
   - System updates
3. Mark notifications as read
4. View notification history

**Available to:**
- ✅ Admin - Full notification management
- ✅ Developer - View notifications only

---

#### 4. Profile Management

**How to update profile:**
1. Go to Settings > Profile
2. Update:
   - Display name
   - Avatar
   - Email (admin only)
3. Save changes

**Available to:**
- ✅ Admin - Full profile editing
- ❌ Developer - View only (cannot edit)

---

## Troubleshooting

### For Admins

#### Issue: Cannot Connect Repository

**Solutions:**
1. Verify GitHub authentication is active
2. Check repository permissions (need admin access)
3. Ensure CodePro GitHub App is installed
4. Try disconnecting and reconnecting GitHub account

---

#### Issue: Invitation Link Not Working

**Solutions:**
1. Check if invitation has expired (7 days)
2. Generate a new invitation
3. Verify email address is correct
4. Check if user already has an account

---

#### Issue: Team Member Cannot See Repositories

**Solutions:**
1. Verify team member accepted invitation
2. Check if they're logged in to correct account
3. Confirm they're part of your team (check Team page)
4. Try removing and re-inviting them

---

#### Issue: AI Reviews Not Generating

**Solutions:**
1. Check webhook configuration
2. Verify repository is enabled for AI reviews
3. Ensure PRs are being detected
4. Check notification logs for errors

---

### For Developers

#### Issue: Cannot Accept Invitation

**Solutions:**
1. Check if invitation link has expired
2. Try different browser or incognito mode
3. Verify you're using correct email
4. Contact your admin for new invitation

---

#### Issue: Cannot See Repositories

**Solutions:**
1. Verify you accepted the invitation
2. Check you're logged in to correct account
3. Confirm with admin you're on the team
4. Try logging out and back in

---

#### Issue: Getting "Access Denied" Errors

**Solutions:**
1. This is expected - you have Developer (read-only) role
2. You cannot:
   - Connect repositories
   - Edit reviews
   - Manage team
   - Change settings
3. Contact admin if you need different permissions

---

#### Issue: Cannot Change Settings

**Solutions:**
1. This is normal - developers have read-only access
2. Settings can only be changed by admin
3. Contact your team admin to:
   - Update notification preferences
   - Change team settings
   - Modify review configuration

---

## Permission Quick Reference

### Admin Permissions ✅

| Feature | View | Create | Edit | Delete |
|---------|------|--------|------|--------|
| Repositories | ✅ | ✅ | ✅ | ✅ |
| Reviews | ✅ | ✅ | ✅ | ✅ |
| Team Members | ✅ | ✅ (invite) | ❌ | ✅ (remove) |
| Invitations | ✅ | ✅ | ❌ | ✅ (revoke) |
| Settings | ✅ | N/A | ✅ | N/A |
| Billing | ✅ | N/A | ✅ | N/A |
| Notifications | ✅ | N/A | ✅ | ✅ |

### Developer Permissions 👁️

| Feature | View | Create | Edit | Delete |
|---------|------|--------|------|--------|
| Repositories | ✅ | ❌ | ❌ | ❌ |
| Reviews | ✅ | ❌ | ❌ | ❌ |
| Team Members | ✅ | ❌ | ❌ | ❌ |
| Invitations | ❌ | ❌ | ❌ | ❌ |
| Settings | ✅ | N/A | ❌ | N/A |
| Billing | ✅ | N/A | ❌ | N/A |
| Notifications | ✅ | N/A | ❌ | ❌ |

---

## Tips for Success

### For Admins

1. **Onboard team members promptly** - Send invitations as soon as they join
2. **Set clear expectations** - Explain to developers what they can/cannot do
3. **Monitor AI review quality** - Regularly check that reviews are helpful
4. **Keep team updated** - Share important repository or setting changes
5. **Regular cleanup** - Remove inactive members and revoke old invitations

### For Developers

1. **Understand your limitations** - You have read-only access
2. **Communicate with admin** - Need changes? Ask your admin
3. **Leverage AI insights** - Use reviews to improve your code
4. **Stay informed** - Check dashboard regularly for updates
5. **Report issues** - Let admin know if something doesn't look right

---

## Getting Help

### Need More Help?

**For Admins:**
- Check `RBAC_IMPLEMENTATION_SUMMARY.md` for technical details
- Review `RBAC_TESTING_GUIDE.md` for testing scenarios
- Contact CodePro support for billing or technical issues

**For Developers:**
- Contact your team admin first
- Review this guide for common questions
- Check notification settings with your admin

### Quick Contact

- **Team Admin**: Check "Team" page for admin contact
- **CodePro Support**: support@codepro.com
- **Documentation**: Check `/docs` folder in project

---

## Summary

**As an Admin, you:**
- Sign up → Team created automatically
- Connect GitHub repositories
- Invite developers to your team
- Manage all reviews and settings
- Have full control over everything

**As a Developer, you:**
- Accept invitation from admin
- View all team repositories
- Read AI reviews and feedback
- Access read-only settings
- Contact admin for any changes

**Both roles:**
- Get real-time notifications
- Search and filter reviews
- View dashboard and statistics
- Collaborate on code quality

---

**Welcome to CodePro! Happy reviewing! 🚀**
