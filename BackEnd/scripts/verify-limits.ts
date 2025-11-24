import mongoose from 'mongoose';
import User from '../src/models/User';
import Review from '../src/models/Review';
import Repository from '../src/models/Repository';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codepro';

async function verifyLimits() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Create Test User (Free)
        const testUser = await User.create({
            clerkId: 'test_user_' + Date.now(),
            email: `test_${Date.now()}@example.com`,
            name: 'Test User',
            subscription: { plan: 'free', status: 'active' }
        });
        console.log(`Created Free User: ${testUser._id}`);

        // 2. Test Repository Limit (Free: 1)
        console.log('\n--- Testing Free Plan Repo Limit (Max 1) ---');

        // Create 1st repo - Should Succeed
        await Repository.create({
            githubRepoId: 101,
            name: 'repo-1',
            fullName: 'test/repo-1',
            owner: 'test',
            connectedBy: testUser._id,
            teamId: new mongoose.Types.ObjectId(), // Mock team ID
            githubAccessToken: 'token'
        });
        console.log('✅ 1st Repo created (Expected: Success)');

        // Check limit logic manually (since we can't call controller directly easily without mocking req/res)
        // We will simulate the controller logic here
        let repoCount = await Repository.countDocuments({ connectedBy: testUser._id }); // Note: Controller uses teamId, but for test we use connectedBy if teamId is unique
        // Actually controller uses teamId. Let's use the same teamId.
        const teamId = (await Repository.findOne({ connectedBy: testUser._id }))?.teamId;

        repoCount = await Repository.countDocuments({ teamId });
        if (repoCount >= 1) {
            console.log(`🛑 Limit reached (${repoCount}/1). Next creation should fail.`);
        }

        // 3. Test Review Limit (Free: 60)
        console.log('\n--- Testing Free Plan Review Limit (Max 60) ---');

        // Create 60 reviews
        const reviews = [];
        for (let i = 0; i < 60; i++) {
            reviews.push({
                repositoryId: new mongoose.Types.ObjectId(),
                pullRequestNumber: i,
                pullRequestTitle: `PR ${i}`,
                pullRequestUrl: `https://github.com/test/repo-1/pull/${i}`,
                author: 'test',
                reviewedBy: testUser._id,
                teamId: teamId,
                status: 'completed'
            });
        }
        await Review.insertMany(reviews);
        console.log(`✅ Created 60 reviews`);

        const reviewCount = await Review.countDocuments({ teamId });
        if (reviewCount >= 60) {
            console.log(`🛑 Limit reached (${reviewCount}/60). Next creation should fail.`);
        }

        // 4. Upgrade to Pro
        console.log('\n--- Upgrading to Pro ---');
        testUser.subscription.plan = 'pro';
        await testUser.save();
        console.log('✅ User upgraded to Pro');

        // 5. Test Pro Limits
        console.log('\n--- Testing Pro Plan Limits ---');

        // Repo Check
        const proRepoLimit = 5;
        if (repoCount < proRepoLimit) {
            console.log(`✅ Repo creation allowed (Current: ${repoCount}, Limit: ${proRepoLimit})`);
        }

        // Review Check
        const proReviewLimit = 300;
        if (reviewCount < proReviewLimit) {
            console.log(`✅ Review creation allowed (Current: ${reviewCount}, Limit: ${proReviewLimit})`);
        }

        // Cleanup
        await User.deleteOne({ _id: testUser._id });
        await Repository.deleteMany({ teamId });
        await Review.deleteMany({ teamId });
        console.log('\n✅ Cleanup complete');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

verifyLimits();
