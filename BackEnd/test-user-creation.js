// Test script to verify user creation logic
// Run with: node test-user-creation.js

const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    profileImage: { type: String, default: '' },
    role: {
        type: String,
        enum: ['admin', 'developer'],
        default: 'admin',
    },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: false },
    repositories: { type: [String], default: [] },
}, { timestamps: true });

const TeamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Team = mongoose.model('Team', TeamSchema);

async function testUserCreation() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Generate unique test data
        const timestamp = Date.now();
        const testClerkId = `test_clerk_${timestamp}`;
        const testEmail = `test_${timestamp}@example.com`;
        const testName = `Test User ${timestamp}`;

        console.log('📝 Creating test user...');
        console.log('  ClerkId:', testClerkId);
        console.log('  Email:', testEmail);
        console.log('  Name:', testName);
        console.log('');

        // Create user with explicit role='admin'
        const user = new User({
            clerkId: testClerkId,
            email: testEmail,
            name: testName,
            profileImage: 'https://example.com/avatar.png',
            role: 'admin', // Explicitly setting admin
        });

        await user.save();
        console.log('✅ User created!');
        console.log('  User ID:', user._id);
        console.log('  Role:', user.role);
        console.log('');

        if (user.role !== 'admin') {
            console.log('❌ ERROR: User role is NOT admin!');
            console.log('   Expected: admin');
            console.log('   Got:', user.role);
            process.exit(1);
        }

        console.log('📝 Creating team...');
        const team = new Team({
            name: `${user.name}'s Team`,
            adminId: user._id,
            members: [user._id],
        });

        await team.save();
        console.log('✅ Team created!');
        console.log('  Team ID:', team._id);
        console.log('  Team Name:', team.name);
        console.log('');

        // Link user to team
        user.teamId = team._id;
        await user.save();

        console.log('✅ User linked to team!');
        console.log('  TeamId:', user.teamId);
        console.log('');

        // Verify final state
        const verifyUser = await User.findById(user._id);
        console.log('🔍 Final verification:');
        console.log('  Role:', verifyUser.role);
        console.log('  TeamId:', verifyUser.teamId);
        console.log('  Has Team:', !!verifyUser.teamId);
        console.log('');

        if (verifyUser.role === 'admin' && verifyUser.teamId) {
            console.log('✅ SUCCESS! User creation works correctly!');
            console.log('   - Role is admin ✓');
            console.log('   - Team created ✓');
            console.log('   - User linked to team ✓');
        } else {
            console.log('❌ FAILED! Something is wrong:');
            if (verifyUser.role !== 'admin') {
                console.log('   - Role is not admin ✗');
            }
            if (!verifyUser.teamId) {
                console.log('   - Team not linked ✗');
            }
        }

        console.log('\n🧹 Cleaning up test data...');
        await User.findByIdAndDelete(user._id);
        await Team.findByIdAndDelete(team._id);
        console.log('✅ Test data cleaned up');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Disconnected from MongoDB');
        process.exit(0);
    }
}

testUserCreation();
