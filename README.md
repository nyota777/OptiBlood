[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/fY9FAi32)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=19909029&assignment_repo_type=AssignmentRepo)
[Git/Github CheatSheet](https://philomatics.com/git-cheatsheet-release)

**Name:** Arthur Nyota  
**Admission Number:** 150830

---

#  OptiBlood - Blood Donation Management System

Complete full-stack blood donation and shortage prediction system with ML integration, admin dashboard, donor management, and real-time predictions.

##  Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [ML Model Integration](#ml-model-integration)
- [Email Alerts](#email-alerts)
- [Frontend Integration](#frontend-integration)

##  Features

### Backend Features
-  **Full CRUD Operations** for donors, donations, inventory, predictions, and alerts
-  **JWT Authentication** with bcrypt password hashing
-  **Machine Learning Integration** for blood shortage predictions
-  **Email Notifications** for low stock and expiring inventory
-  **Scheduled Tasks** using node-cron for automatic alerts
-  **PostgreSQL Database** with Sequelize ORM
-  **Real-time Updates** ready for React frontend
-  **CORS Enabled** for seamless frontend integration
-  **Admin Dashboard** with comprehensive analytics
-  **Donor Availability Prediction** using KNBTS rules

### Frontend Features
- **Modern UI** with React + TypeScript + Vite
- **Fully Responsive** design
- **Dark Mode** support
- **Real-time Charts** and analytics
- **Toast Notifications** for user feedback
- **Protected Routes** with authentication
- **Email Management** interface
- **Donation Scheduling** system
- **Settings & Profile** management

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT + bcrypt
- **Email**: Nodemailer
- **Scheduling**: node-cron
- **ML**: Python (scikit-learn, numpy, pandas)

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Components**: Shadcn/UI
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Routing**: React Router

## Project Structure

```
optiblood-system-ui/
├── backend/
│   ├── config/
│   │   ├── db.js                 # Database configuration
│   │   └── passport.js            # Passport.js config
│   ├── models/
│   │   ├── User.js                # Hospital staff user model
│   │   ├── Donor.js               # Blood donor model
│   │   ├── DonationRecord.js      # Donation history model
│   │   ├── Inventory.js            # Blood inventory model
│   │   ├── Prediction.js          # ML prediction results model
│   │   ├── Alert.js               # System alerts model
│   │   ├── EmailHistory.js        # Email history model
│   │   ├── DonationSchedule.js    # Donation scheduling model
│   │   └── index.js               # Model associations
│   ├── routes/
│   │   ├── authRoutes.js          # Authentication endpoints
│   │   ├── donorRoutes.js         # Donor CRUD endpoints
│   │   ├── donationRoutes.js      # Donation CRUD endpoints
│   │   ├── inventoryRoutes.js     # Inventory CRUD endpoints
│   │   ├── predictionRoutes.js    # ML prediction endpoints
│   │   ├── alertRoutes.js         # Alert management endpoints
│   │   ├── emailRoutes.js         # Email management endpoints
│   │   ├── scheduleRoutes.js      # Donation scheduling endpoints
│   │   ├── dashboardRoutes.js     # Dashboard data endpoints
│   │   ├── reportsRoutes.js       # Reports & analytics endpoints
│   │   └── adminRoutes.js         # Admin dashboard endpoints
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT authentication middleware
│   ├── utils/
│   │   ├── emailService.js        # Email notification service
│   │   ├── runPythonModel.js      # Python ML model integration
│   │   └── runDonorPrediction.js  # Donor availability prediction
│   ├── scheduler/
│   │   └── alertScheduler.js      # Scheduled alert checks
│   ├── ml/
│   │   ├── predict_shortage.py   # Python ML prediction model
│   │   ├── predict_donor_availability.py  # Donor prediction model
│   │   ├── requirements.txt       # Python dependencies
│   │   └── shortage_prediction_model.pkl  # Trained ML model
│   ├── .env                       # Environment variables
│   ├── package.json               # Dependencies
│   └── server.js                  # Main server file
├── src/
│   ├── components/
│   │   ├── auth/                  # Authentication components
│   │   ├── dashboards/            # Dashboard components
│   │   ├── modules/               # Feature modules
│   │   ├── layout/                # Layout components
│   │   └── ui/                    # UI components (Shadcn)
│   ├── services/
│   │   └── api.js                 # API service layer
│   ├── api/
│   │   └── predictions.ts        # Prediction API
│   ├── App.tsx                    # Main app component
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
├── package.json                   # Frontend dependencies
├── vite.config.ts                 # Vite configuration
└── README.md                      # This file
```

## Installation

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Python 3.8+ (for ML model)
- npm or yarn

### Steps

1. **Clone the repository**

```bash
git clone https://github.com/nyota777/OptiBlood.git
cd OptiBlood
```

2. **Install Backend Dependencies**

```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**

```bash
cd ..
npm install
```

4. **Install Python Dependencies**

```bash
cd backend/ml
pip install -r requirements.txt
```

## ⚙️ Configuration

1. **Create backend environment file**

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5001
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

2. **Create frontend environment file (optional)**

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5001/api
```

### Gmail Setup for Email Notifications

To use Gmail for sending emails:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account Settings → Security
   - Under "2-Step Verification", click on "App passwords"
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASS` variable

See `backend/EMAIL_SETUP_GUIDE.md` for detailed instructions.

## Database Setup

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

## Running the Application

### Development Mode

1. **Start Backend Server**

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:5001`

2. **Start Frontend Development Server**

```bash
# From root directory
npm run dev
```

The frontend will start on `http://localhost:3000`

### Production Mode

1. **Build Frontend**

```bash
npm run build
```

2. **Start Backend**

```bash
cd backend
npm start
```

### Default Admin Credentials

- **Email**: `admin@gmail.com`
- **Password**: `admin1234`

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
| GET | `/api/predictions/predict-donor/:id` | Predict donor availability | Yes |

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
| POST | `/api/inventory/withdraw` | Withdraw stock | Yes |

### Predictions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/predictions` | Get prediction history | Yes |
| POST | `/api/predict-shortage` | Run ML prediction | Yes |

### Admin Dashboard

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/kpis` | Get KPI metrics | Yes (Admin) |
| GET | `/api/admin/stock` | Get stock data | Yes (Admin) |
| GET | `/api/admin/forecast` | Get forecast data | Yes (Admin) |
| GET | `/api/admin/donors/available` | Get available donors | Yes (Admin) |
| GET | `/api/admin/shortage-risk` | Get shortage risk | Yes (Admin) |
| POST | `/api/admin/campaign` | Send campaign | Yes (Admin) |

## 🤖 ML Model Integration

The system includes two ML models:

1. **Blood Shortage Prediction** (`ml/predict_shortage.py`)
   - Predicts blood shortages based on inventory and donor data
   - Uses trained model (`shortage_prediction_model.pkl`) or rule-based fallback
   - Returns probability scores for each blood type

2. **Donor Availability Prediction** (`ml/predict_donor_availability.py`)
   - Predicts when donors will be available for next donation
   - Uses KNBTS rules (3 months for men, 4 months for women)
   - Requires minimum 2 donations for prediction

### How it Works

1. Backend calls `/api/predict-shortage` endpoint
2. System gathers current inventory and donor data
3. Data is passed to Python script via `child_process.spawn`
4. Python model analyzes data and returns predictions
5. Results are saved to database and alerts are created
6. Email notifications are sent for predicted shortages

### ML Model Setup

See `ML_MODEL_SETUP.md` for instructions on setting up the ML model.

## 📧 Email Alerts

The system automatically sends email alerts for:

1. **Low Stock**: When inventory falls below threshold (default: 10 units)
2. **Expiring Blood**: Items expiring within specified days (default: 3 days)
3. **Predicted Shortages**: When ML model predicts shortage
4. **Donation Reminders**: Scheduled donation reminders

### Alert Schedule

- Checks run every 6 hours by default
- Configurable via `ALERT_CRON_SCHEDULE` in .env
- Format: Cron expression (e.g., `0 */6 * * *`)

## Frontend Integration

The frontend is built with React + TypeScript and uses:

- **Axios** for API calls
- **React Router** for navigation
- **Shadcn/UI** for components
- **Recharts** for data visualization
- **Sonner** for toast notifications

### Key Features

- **Protected Routes**: Authentication required for all pages
- **Real-time Data**: Fetches live data from backend
- **Responsive Design**: Works on mobile and desktop
- **Dark Mode**: Toggle between light and dark themes
- **Admin Dashboard**: Comprehensive analytics for admins
- **Staff Dashboard**: Simplified view for staff members

## Troubleshooting

### Database Connection Error

- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

### Email Not Sending

- Verify Gmail credentials
- Check if App Password is used (not regular password)
- Ensure 2FA is enabled on Google account
- See `backend/EMAIL_SETUP_GUIDE.md`

### Python Model Error

- Verify Python is installed: `python --version` or `python3 --version`
- Install Python dependencies: `pip install -r backend/ml/requirements.txt`
- Check Python script path in `utils/runPythonModel.js`
- Update spawn command if using `python3` instead of `python`

### Port Already in Use

Change PORT in `.env` file or kill process using the port:

```bash
# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5001 | xargs kill
```

### Frontend Not Loading

- Check if backend is running on port 5001
- Verify `VITE_API_URL` in `.env` matches backend URL
- Check browser console for errors
- Ensure CORS is enabled in backend

## License

MIT License - Feel free to use this project for your needs.

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## Support

For issues or questions, please create an issue in the repository.

---

**Made with ❤️ for better blood donation management**
