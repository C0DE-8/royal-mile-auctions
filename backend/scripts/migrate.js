require('dotenv').config()

const { closePool, dbConfig, runMigrations } = require('../src/db')

runMigrations()
  .then(async () => {
    console.log(`Migrations applied to MySQL database ${dbConfig.database}`)
    await closePool()
  })
  .catch(async (error) => {
    console.error(error)
    await closePool()
    process.exit(1)
  })
