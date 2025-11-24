import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function cleanupOldData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db!;
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Current collections:', collections.map(c => c.name).join(', '), '\n');

    // Check if there are old users without clerkId
    const oldUsers = await db.collection('users').find({ clerkId: { $exists: false } }).toArray();
    
    if (oldUsers.length > 0) {
      console.log(`⚠️  Found ${oldUsers.length} old user(s) without clerkId:`);
      oldUsers.forEach((user: any) => {
        console.log(`   - ${user.email} (${user.name})`);
      });
      
      console.log('\n🗑️  Deleting old users without clerkId...');
      const deleteResult = await db.collection('users').deleteMany({ clerkId: { $exists: false } });
      console.log(`✅ Deleted ${deleteResult.deletedCount} old user(s)\n`);
    } else {
      console.log('✅ No old users found without clerkId\n');
    }

    // Check for users without role or teamId
    const usersWithoutRBAC = await db.collection('users').find({
      $or: [
        { role: { $exists: false } },
        { teamId: { $exists: false } }
      ]
    }).toArray();

    if (usersWithoutRBAC.length > 0) {
      console.log(`⚠️  Found ${usersWithoutRBAC.length} user(s) without RBAC fields:`);
      usersWithoutRBAC.forEach((user: any) => {
        console.log(`   - ${user.email} (${user.name}) - clerkId: ${user.clerkId || 'MISSING'}`);
      });
      
      console.log('\n🗑️  Deleting users without RBAC fields...');
      const deleteResult = await db.collection('users').deleteMany({
        $or: [
          { role: { $exists: false } },
          { teamId: { $exists: false } }
        ]
      });
      console.log(`✅ Deleted ${deleteResult.deletedCount} user(s) without RBAC fields\n`);
    } else {
      console.log('✅ All users have RBAC fields\n');
    }

    // Clean up orphaned repositories (without teamId)
    const reposWithoutTeam = await db.collection('repositories').find({ teamId: { $exists: false } }).toArray();
    if (reposWithoutTeam.length > 0) {
      console.log(`⚠️  Found ${reposWithoutTeam.length} repository/repositories without teamId`);
      console.log('🗑️  Deleting orphaned repositories...');
      const deleteResult = await db.collection('repositories').deleteMany({ teamId: { $exists: false } });
      console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned repository/repositories\n`);
    }

    // Clean up orphaned reviews (without teamId)
    const reviewsWithoutTeam = await db.collection('reviews').find({ teamId: { $exists: false } }).toArray();
    if (reviewsWithoutTeam.length > 0) {
      console.log(`⚠️  Found ${reviewsWithoutTeam.length} review(s) without teamId`);
      console.log('🗑️  Deleting orphaned reviews...');
      const deleteResult = await db.collection('reviews').deleteMany({ teamId: { $exists: false } });
      console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned review(s)\n`);
    }

    // Final summary
    console.log('📊 Final Summary:');
    const finalUserCount = await db.collection('users').countDocuments();
    const finalRepoCount = await db.collection('repositories').countDocuments();
    const finalReviewCount = await db.collection('reviews').countDocuments();
    const teamCount = await db.collection('teams').countDocuments();
    const invitationCount = await db.collection('invitations').countDocuments();

    console.log(`   Users: ${finalUserCount}`);
    console.log(`   Teams: ${teamCount}`);
    console.log(`   Repositories: ${finalRepoCount}`);
    console.log(`   Reviews: ${finalReviewCount}`);
    console.log(`   Invitations: ${invitationCount}`);
    
    console.log('\n✅ Cleanup completed successfully!');
    console.log('💡 You can now sign up with a fresh account and it will be assigned admin role automatically.\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

cleanupOldData();
