/**
 * Database Migration Script: RBAC Team Structure
 * 
 * This script migrates existing data to the new team-based RBAC system:
 * 1. Creates teams for existing admins
 * 2. Assigns teamId to existing repositories
 * 3. Assigns teamId to existing reviews
 * 4. Updates users without teams
 * 
 * IMPORTANT: Backup your database before running this script!
 * 
 * Usage:
 *   npx ts-node scripts/migrate-to-team-structure.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User';
import Team from '../src/models/Team';
import Repository from '../src/models/Repository';
import Review from '../src/models/Review';

dotenv.config();

async function migrateToTeamStructure() {
  try {
    console.log('🚀 Starting RBAC Team Structure Migration...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get statistics before migration
    const userCount = await User.countDocuments();
    const repoCount = await Repository.countDocuments();
    const reviewCount = await Review.countDocuments();

    console.log('📊 Current Database Statistics:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Repositories: ${repoCount}`);
    console.log(`   Reviews: ${reviewCount}\n`);

    // Step 1: Find users without teamId
    console.log('🔍 Step 1: Finding users without teams...');
    const usersWithoutTeam = await User.find({ teamId: { $exists: false } });
    console.log(`   Found ${usersWithoutTeam.length} users without teams\n`);

    // Step 2: Create teams for admin users
    console.log('👥 Step 2: Creating teams for admin users...');
    let teamsCreated = 0;

    for (const user of usersWithoutTeam) {
      if (user.role === 'admin') {
        // Create team for this admin
        const team = new Team({
          name: `${user.name}'s Team`,
          adminId: user._id,
          members: [user._id],
        });

        await team.save();
        console.log(`   ✓ Created team "${team.name}" for admin ${user.email}`);

        // Update user with teamId
        user.teamId = team._id;
        await user.save();
        console.log(`   ✓ Updated user ${user.email} with teamId`);

        teamsCreated++;
      }
    }
    console.log(`   Created ${teamsCreated} teams for admins\n`);

    // Step 3: Handle developer users without teams
    console.log('🛠️  Step 3: Handling developer users without teams...');
    const developersWithoutTeam = usersWithoutTeam.filter(u => u.role !== 'admin');
    
    if (developersWithoutTeam.length > 0) {
      console.log(`   ⚠️  Warning: Found ${developersWithoutTeam.length} developers without teams:`);
      for (const dev of developersWithoutTeam) {
        console.log(`      - ${dev.email} (ID: ${dev._id})`);
      }
      console.log('   💡 These users should either:');
      console.log('      a) Be invited to a team by an admin');
      console.log('      b) Be manually assigned to a team');
      console.log('      c) Be deleted if they are test/invalid users\n');
    } else {
      console.log('   ✓ No orphaned developers found\n');
    }

    // Step 4: Assign teamId to repositories
    console.log('📦 Step 4: Assigning teamId to repositories...');
    const repositoriesWithoutTeam = await Repository.find({ 
      teamId: { $exists: false } 
    }).populate('connectedBy');

    let reposUpdated = 0;
    let reposSkipped = 0;

    for (const repo of repositoriesWithoutTeam) {
      const connectedByUser = await User.findById(repo.connectedBy);
      
      if (connectedByUser && connectedByUser.teamId) {
        repo.teamId = connectedByUser.teamId;
        await repo.save();
        console.log(`   ✓ Updated repository "${repo.fullName}" with teamId`);
        reposUpdated++;
      } else {
        console.log(`   ⚠️  Skipped repository "${repo.fullName}" - connectedBy user has no team`);
        reposSkipped++;
      }
    }
    console.log(`   Updated ${reposUpdated} repositories`);
    if (reposSkipped > 0) {
      console.log(`   ⚠️  Skipped ${reposSkipped} repositories (no team found)\n`);
    } else {
      console.log('');
    }

    // Step 5: Assign teamId to reviews
    console.log('📝 Step 5: Assigning teamId to reviews...');
    const reviewsWithoutTeam = await Review.find({ 
      teamId: { $exists: false } 
    }).populate('repositoryId');

    let reviewsUpdated = 0;
    let reviewsSkipped = 0;

    for (const review of reviewsWithoutTeam) {
      const repository = await Repository.findById(review.repositoryId);
      
      if (repository && repository.teamId) {
        review.teamId = repository.teamId;
        await review.save();
        console.log(`   ✓ Updated review for PR #${review.pullRequestNumber} with teamId`);
        reviewsUpdated++;
      } else {
        console.log(`   ⚠️  Skipped review for PR #${review.pullRequestNumber} - repository has no team`);
        reviewsSkipped++;
      }
    }
    console.log(`   Updated ${reviewsUpdated} reviews`);
    if (reviewsSkipped > 0) {
      console.log(`   ⚠️  Skipped ${reviewsSkipped} reviews (no team found)\n`);
    } else {
      console.log('');
    }

    // Final statistics
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Teams created: ${teamsCreated}`);
    console.log(`   ✅ Repositories updated: ${reposUpdated}`);
    console.log(`   ✅ Reviews updated: ${reviewsUpdated}`);
    
    if (developersWithoutTeam.length > 0 || reposSkipped > 0 || reviewsSkipped > 0) {
      console.log('\n⚠️  Manual Actions Required:');
      if (developersWithoutTeam.length > 0) {
        console.log(`   - ${developersWithoutTeam.length} developers need team assignment`);
      }
      if (reposSkipped > 0) {
        console.log(`   - ${reposSkipped} repositories couldn't be updated`);
      }
      if (reviewsSkipped > 0) {
        console.log(`   - ${reviewsSkipped} reviews couldn't be updated`);
      }
    } else {
      console.log('\n✅ All data migrated successfully!');
    }

    console.log('\n✨ Migration completed!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Confirmation prompt
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  WARNING: This script will modify your database!');
console.log('   Make sure you have backed up your database before proceeding.\n');

readline.question('Do you want to continue? (yes/no): ', (answer: string) => {
  readline.close();
  
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    migrateToTeamStructure();
  } else {
    console.log('\n❌ Migration cancelled');
    process.exit(0);
  }
});
