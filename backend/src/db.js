const fs = require('node:fs/promises')
const path = require('node:path')
const mysql = require('mysql2/promise')

const rootDir = path.resolve(__dirname, '..')
const migrationsDir = path.join(rootDir, 'migrations')
const seedsDir = path.join(rootDir, 'seeds')

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'carautos',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  multipleStatements: true,
}

let pool

async function createDatabaseIfMissing() {
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    multipleStatements: true,
  })

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`)
  await connection.end()
}

async function getPool() {
  if (!pool) {
    await createDatabaseIfMissing()
    pool = mysql.createPool(dbConfig)
  }

  return pool
}

async function query(sql, params = []) {
  const db = await getPool()
  const [rows] = await db.query(sql, params)
  return rows
}

async function run(sql, params = []) {
  const db = await getPool()
  const [result] = await db.query(sql, params)
  return result
}

async function runMigrations() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  const appliedRows = await query('SELECT filename FROM schema_migrations;')
  const applied = new Set(appliedRows.map((row) => row.filename))
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort()

  for (const file of files) {
    if (applied.has(file)) {
      continue
    }

    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8')
    await query('START TRANSACTION;')
    try {
      await query(sql)
      await query('INSERT INTO schema_migrations (filename) VALUES (?);', [file])
      await query('COMMIT;')
    } catch (error) {
      await query('ROLLBACK;')
      throw error
    }
  }
}

async function seedDatabase() {
  await runMigrations()

  const itemRows = await query('SELECT COUNT(*) AS count FROM auction_items;')
  const walletRows = await query('SELECT COUNT(*) AS count FROM crypto_wallets;')
  const userRows = await query('SELECT COUNT(*) AS count FROM users;')

  if (Number(itemRows[0].count) === 0) {
    await query(await fs.readFile(path.join(seedsDir, '001_seed_auction_items.sql'), 'utf8'))
  }

  if (Number(walletRows[0].count) === 0) {
    await query(await fs.readFile(path.join(seedsDir, '002_seed_crypto_wallets.sql'), 'utf8'))
  }

  if (Number(userRows[0].count) === 0) {
    await query(await fs.readFile(path.join(seedsDir, '003_seed_users.sql'), 'utf8'))
  }
}

async function closePool() {
  if (pool) {
    await pool.end()
    pool = null
  }
}

module.exports = {
  closePool,
  dbConfig,
  query,
  run,
  runMigrations,
  seedDatabase,
}
