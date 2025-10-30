// Test file with security issue
function getUserData(userId) {
    // SQL injection vulnerability
    const query = "SELECT * FROM users WHERE id = " + userId;
    return database.query(query);
}

// Potential null pointer
function processUser(user) {
    return user.name.toUpperCase(); // No null check!
}

// Hardcoded secret
const API_KEY = "sk_live_abc123secretkey456";

