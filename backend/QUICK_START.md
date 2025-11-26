# 🚀 OptiBlood Backend - Quick Start Guide

Get your OptiBlood backend running in 5 minutes!

## ⚡ Quick Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Setup PostgreSQL Database

**Option A: Using the SQL script**
```bash
psql -U postgres -f setup.sql
```

**Option B: Manual setup**
```bash
psql -U postgres

CREATE DATABASE optiblood_db;
CREATE USER optiblood_user WITH PASSWORD 'optiblood_pass';
GRANT ALL PRIVILEGES ON DATABASE optiblood_db TO optiblood_user;
\q
```

### Step 3: Configure Environment

The `.env` file is already created with default values. Update if needed:

```bash
# Edit backend/.env
# Update database credentials, email settings, etc.
```

### Step 4: Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## ✅ Verify Installation

1. **Check API is running:**
   - Open browser: `http://localhost:5000`
   - You should see: `"message": "🩸 OptiBlood API is running"`

2. **Create first user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@hospital.com",
    "password": "admin123",
    "hospital_name": "Test Hospital",
    "role": "admin"
  }'
```

3. **Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "admin123"
  }'
```

Save the `token` from the response!

## 📱 Connect Your React Frontend

In your React project:

1. **Install Axios:**
```bash
npm install axios
```

2. **Create API service** (`src/services/api.js`):
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

3. **Use in components:**
```javascript
import api from './services/api';

// Login
const res = await api.post('/auth/login', { email, password });
localStorage.setItem('token', res.data.data.token);

// Fetch data
const donors = await api.get('/donors');
const inventory = await api.get('/inventory');
const alerts = await api.get('/alerts');

// Run prediction
const prediction = await api.post('/predict-shortage');
```

See `FRONTEND_INTEGRATION.md` for complete examples!

## 🔧 Common Issues

### "Database connection failed"
- Ensure PostgreSQL is running
- Check credentials in `.env` file
- Verify database exists

### "Port 5000 already in use"
- Change PORT in `.env` file
- Or kill the process: `lsof -ti:5000 | xargs kill` (Mac/Linux)

### "Python script error"
- Install Python 3: `python --version`
- If using `python3`, update `utils/runPythonModel.js` line 19:
  ```javascript
  const python = spawn('python3', [scriptPath, dataString]);
  ```

## 📚 Next Steps

- **Read full documentation:** `README.md`
- **Frontend integration guide:** `FRONTEND_INTEGRATION.md`
- **Configure email alerts:** Update `EMAIL_USER` and `EMAIL_PASS` in `.env`
- **Customize ML model:** Edit `ml/predict_shortage.py`

## 🎯 Test All Endpoints

See `README.md` for complete API documentation and test commands.

## ✉️ Setup Email Alerts (Optional)

1. Enable 2FA on your Gmail account
2. Generate App Password: Google Account → Security → App Passwords
3. Update `.env`:
```env
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_app_password
```

## 🎉 You're All Set!

Your OptiBlood backend is ready to use. Start building your frontend or test the APIs!

**Happy coding! 🩸**

