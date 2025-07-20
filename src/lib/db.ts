import { Pool } from 'pg'

const pool = new Pool({
  user: 'egx',
  host: 'localhost',
  database: 'block_app',
  port: 5432,
  // Pas de password du tout
})

export default pool 