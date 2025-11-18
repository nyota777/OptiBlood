# 🩸 OptiBlood Backend API

Complete Node.js + Express + PostgreSQL backend for OptiBlood - Blood Donation and Shortage Prediction System.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [ML Model Integration](#ml-model-integration)
- [Email Alerts](#email-alerts)
- [Frontend Integration](#frontend-integration)

## ✨ Features

- ✅ **Full CRUD Operations** for donors, donations, inventory, predictions, and alerts
- 🔐 **JWT Authentication** with bcrypt password hashing
- 🤖 **Machine Learning Integration** for blood shortage predictions
- 📧 **Email Notifications** for low stock and expiring inventory
- ⏰ **Scheduled Tasks** using node-cron for automatic alerts
- 📊 **PostgreSQL Database** with Sequelize ORM
- 🔄 **Real-time Updates** ready for React frontend
- 🌐 **CORS Enabled** for seamless frontend integration

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT + bcrypt
- **Email**: Nodemailer
- **Scheduling**: node-cron
- **ML**: Python (for predictions)

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js                 # Database configuration
├── models/
│   ├── User.js               # Hospital staff user model
│   ├── Donor.js              # Blood donor model
│   ├── DonationRecord.js     # Donation history model
│   ├── Inventory.js          # Blood inventory model
│   ├── Prediction.js         # ML prediction results model
│   ├── Alert.js              # System alerts model
│   └── index.js              # Model associations
├── routes/
│   ├── authRoutes.js         # Authentication endpoints
│   ├── donorRoutes.js        # Donor CRUD endpoints
│   ├── donationRoutes.js     # Donation CRUD endpoints
│   ├── inventoryRoutes.js    # Inventory CRUD endpoints
│   ├── predictionRoutes.js   # ML prediction endpoints
│   └── alertRoutes.js        # Alert management endpoints
├── middleware/
│   └── authMiddleware.js     # JWT authentication middleware
├── utils/
│   ├── emailService.js       # Email notification service
│   └── runPythonModel.js     # Python ML model integration
├── scheduler/
│   └── alertScheduler.js     # Scheduled alert checks
├── ml/
│   └── predict_shortage.py   # Python ML prediction model
├── .env                       # Environment variables (create from .env.example)
├── package.json              # Dependencies
├── server.js                 # Main server file
└── README.md                 # This file
```

## 📦 Installation

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Python 3 (for ML model)
- npm or yarn

### Steps

1. **Clone or navigate to the backend directory**

```bash
cd backend
```

2. **Install Node.js dependencies**

```bash
npm install
```

3. **Install Python (if not already installed)**

Make sure Python 3 is installed and accessible via `python` or `python3` command.

## ⚙️ Configuration

1. **Create environment file**

Create a `.env` file in the backend root directory:

```bash
# Copy from example (if exists) or create manually
cp .env.example .env
```

2. **Configure environment variables**

Edit `.env` file with your settings:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=optiblood_db
DB_USER=optiblood_user
DB_PASSWORD=optiblood_pass

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Email Configuration (Gmail)
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=yourapppassword
EMAIL_FROM=OptiBlood System <noreply@optiblood.com>

# Alert Configuration
ALERT_LOW_THRESHOLD=10
ALERT_EXPIRY_DAYS=3
ALERT_CRON_SCHEDULE=0 */6 * * *

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 📧 Gmail Setup for Email Notifications

To use Gmail for sending emails:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account Settings → Security
   - Under "2-Step Verification", click on "App passwords"
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASS` variable

## 🗄️ Database Setup

### Option 1: Quick Setup (PostgreSQL running locally)

1. **Create database and user**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE optiblood_db;

# Create user
CREATE USER optiblood_user WITH PASSWORD 'optiblood_pass';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE optiblood_db TO optiblood_user;

# Exit
\q
```

2. **Tables will be created automatically** when you start the server (Sequelize auto-sync)

### Option 2: Using existing PostgreSQL database

Update the database credentials in `.env` file to match your existing setup.

## 🚀 Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:5000` (or the PORT specified in .env)

### Verify Server is Running

Visit `http://localhost:5000` in your browser. You should see:

```json
{
  "success": true,
  "message": "🩸 OptiBlood API is running",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new hospital staff | No |
| POST | `/api/auth/login` | Login and get JWT token | No |

### Donors

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/donors` | Fetch all donors | Yes |
| POST | `/api/donors` | Add new donor | Yes |
| PUT | `/api/donors/:id` | Update donor info | Yes |
| DELETE | `/api/donors/:id` | Remove donor | Yes |

### Donations

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/donations` | View donation history | Yes |
| POST | `/api/donations` | Record new donation | Yes |

### Inventory

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/inventory` | Get inventory | Yes |
| POST | `/api/inventory` | Add inventory | Yes |
| PUT | `/api/inventory/:id` | Update inventory | Yes |
| DELETE | `/api/inventory/:id` | Delete inventory | Yes |

### Predictions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/predictions` | Get prediction history | Yes |
| POST | `/api/predict-shortage` | Run ML prediction | Yes |

### Alerts

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/alerts` | Fetch alerts | Yes |
| POST | `/api/alerts` | Create alert | Yes |
| PUT | `/api/alerts/:id` | Mark as notified | Yes |
| DELETE | `/api/alerts/:id` | Delete alert | Yes |

### Example API Requests

**Register User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@hospital.com",
    "password": "password123",
    "hospital_name": "City General Hospital",
    "role": "admin"
  }'
```

**Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@hospital.com",
    "password": "password123"
  }'
```

**Add Donor (with JWT token)**
```bash
curl -X POST http://localhost:5000/api/donors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Jane Smith",
    "blood_type": "O+",
    "contact": "555-1234"
  }'
```

## 🤖 ML Model Integration

The Python ML model (`ml/predict_shortage.py`) uses inventory and donor data to predict blood shortages.

### How it Works

1. Backend calls `/api/predict-shortage` endpoint
2. System gathers current inventory and donor data
3. Data is passed to Python script via `child_process.spawn`
4. Python model analyzes data and returns predictions
5. Results are saved to database and alerts are created
6. Email notifications are sent for predicted shortages

### Prediction Algorithm

Current implementation uses rule-based logic:
- Critical shortage: < 5 units (95% probability)
- Low stock: 5-10 units (75% probability)
- Moderate risk: 10-20 units with few donors (60% probability)

**This can be replaced with actual ML models** (scikit-learn, TensorFlow, etc.)

## 📧 Email Alerts

The system automatically sends email alerts for:

1. **Low Stock**: When inventory falls below threshold (default: 10 units)
2. **Expiring Blood**: Items expiring within specified days (default: 3 days)
3. **Predicted Shortages**: When ML model predicts shortage

### Alert Schedule

- Checks run every 6 hours by default
- Configurable via `ALERT_CRON_SCHEDULE` in .env
- Format: Cron expression (e.g., `0 */6 * * *`)

### Manual Alert Check

You can trigger manual checks by calling the scheduler function directly.

## 🌐 Frontend Integration

### React + Axios Setup

**1. Install Axios in your React project**

```bash
npm install axios
```

**2. Create API service file** (`src/services/api.js`)

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
```

**3. Use in React components**

```javascript
import api from './services/api';

// Login
const handleLogin = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', res.data.data.token);
};

// Get Donors
const fetchDonors = async () => {
  const res = await api.get('/donors');
  setDonors(res.data.data);
};

// Add Donation
const addDonation = async (donationData) => {
  await api.post('/donations', donationData);
};

// Run Prediction
const runPrediction = async () => {
  const res = await api.post('/predict-shortage');
  alert(res.data.message);
};
```

## 🐛 Troubleshooting

### Database Connection Error

- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

### Email Not Sending

- Verify Gmail credentials
- Check if App Password is used (not regular password)
- Ensure 2FA is enabled on Google account

### Python Model Error

- Verify Python is installed: `python --version` or `python3 --version`
- Check Python script path in `utils/runPythonModel.js`
- Update spawn command if using `python3` instead of `python`

### Port Already in Use

Change PORT in `.env` file or kill process using the port:

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill
```

## 📝 License

MIT License - Feel free to use this project for your needs.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📞 Support

For issues or questions, please create an issue in the repository.

---

**Made with ❤️ for better blood donation management**

