const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

// Password to hash
const password = 'password123'
const passwordHash = bcrypt.hashSync(password, 10)

console.log('Password: password123')
console.log('Hash:', passwordHash)

// Instructions to add to mock-data.ts
const newUser = `      {
        id: 3,
        email: 'test@example.com',
        password_hash: '${passwordHash}',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }`

const newProfile = `      {
        id: 3,
        user_id: 3,
        first_name: 'Test',
        last_name: 'User',
        avatar_url: undefined,
        phone: '+1-555-0125',
        timezone: 'UTC',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }`

console.log('\nAdd this user to the users array in mock-data.ts:')
console.log(newUser)
console.log('\nAdd this profile to the profiles array:')
console.log(newProfile)