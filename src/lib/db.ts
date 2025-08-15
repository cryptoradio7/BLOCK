import { Pool } from 'pg'

const pool = new Pool({
  user: 'egx',
  password: 'Luxembourg1978',
  host: 'localhost',
  database: 'block_app',
  port: 5432,
})

export default pool 