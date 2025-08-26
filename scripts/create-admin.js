const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');

const USERS_FILE = path.join(__dirname, '../data/users.json');
const saltRounds = 10;

async function createInitialAdmin() {
    const password = '123456'; // Change this to your desired password
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const adminUser = {
        username: 'admin',
        password: hashedPassword
    };
    
    const users = [adminUser];
    
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    console.log('Admin user created successfully');
}

createInitialAdmin().catch(console.error);