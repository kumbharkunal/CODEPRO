import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Repository from '../src/models/Repository';
import User from '../src/models/User';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function fixRepositories() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    // Find all repositories without teamId
    const reposWithoutTeam = await Repository.find({ teamId: { $exists: false } });
    
    if (reposWithoutTeam.length === 0) {
      console.log('✅ All repositories already have teamId set\n');
      process.exit(0);
    }

    console.log(`⚠️  Found ${reposWithoutTeam.length} repository/repositories without teamId:`);
    
    for (const repo of reposWithoutTeam) {
      console.log(`   - ${repo.name} (connected by: ${repo.connectedBy})`);
      
      // Find the user who connected this repo
      const user = await User.findById(repo.connectedBy);
      
      if (user && user.teamId) {
        // Update the repository with the user's teamId
        (repo as any).teamId = user.teamId;
        await repo.save();
        console.log(`     ✅ Updated with teamId: ${user.teamId}`);
      } else {
        console.log(`     ⚠️  Could not determine teamId (user not found or has no team)`);
      }
    }

    console.log('\n📊 Final Summary:');
    const totalRepos = await Repository.countDocuments();
    const reposWithTeam = await Repository.countDocuments({ teamId: { $exists: true } });
    
    console.log(`   Total repositories: ${totalRepos}`);
    console.log(`   Repositories with teamId: ${reposWithTeam}`);
    
    console.log('\n✅ Fix completed successfully!\n');

  } catch (error) {
    console.error('❌ Error during fix:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

fixRepositories();
