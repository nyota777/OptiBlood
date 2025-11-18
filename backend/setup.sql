-- OptiBlood Database Setup Script
-- Run this script to create the database and user for OptiBlood

-- Connect to PostgreSQL as superuser (postgres)
-- psql -U postgres -f setup.sql

-- Create database
CREATE DATABASE optiblood_db;

-- Create user
CREATE USER optiblood_user WITH PASSWORD 'optiblood_pass';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE optiblood_db TO optiblood_user;

-- Grant schema privileges (PostgreSQL 15+)
\c optiblood_db
GRANT ALL ON SCHEMA public TO optiblood_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO optiblood_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO optiblood_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO optiblood_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO optiblood_user;

-- Confirm
\echo 'Database setup completed successfully!'
\echo 'Database: optiblood_db'
\echo 'User: optiblood_user'
\echo 'Password: optiblood_pass'
\echo ''
\echo 'Next steps:'
\echo '1. Update backend/.env with these credentials'
\echo '2. Run: cd backend && npm install'
\echo '3. Run: npm run dev'

