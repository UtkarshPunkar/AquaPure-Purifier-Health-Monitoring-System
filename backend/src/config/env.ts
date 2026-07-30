import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 5000,
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: process.env.JWT_SECRET || 'smart_water_jwt_secret_key_2026_secure_retrofit',
  SIMULATION_INTERVAL_MS: process.env.SIMULATION_INTERVAL_MS ? parseInt(process.env.SIMULATION_INTERVAL_MS) : 3000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};
