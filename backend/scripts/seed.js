require('dotenv').config()

const { closePool, dbConfig, seedDatabase } = require('../src/db')

seedDatabase()
  .then(async () => {
    console.log(`Seed data ready in MySQL database ${dbConfig.database}`)
    await closePool()
  })
  .catch(async (error) => {
    console.error(error)
    await closePool()
    process.exit(1)
  })
