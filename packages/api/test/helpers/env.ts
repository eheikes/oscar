export const setEnvVars = () => {
  // Set app env vars.
  process.env.DB_HOST = 'localhost'
  process.env.DB_PORT = '5432'
  process.env.DB_USER = 'db_user'
  process.env.DB_PASSWORD = 'db_password'
  process.env.DB_NAME = 'db_name'
  process.env.DB_SSL = '1'
}
