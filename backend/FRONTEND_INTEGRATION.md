# 🔗 Frontend Integration Guide

Complete guide for integrating OptiBlood backend with your React frontend.

## 📦 Installation

In your React project, install Axios:

```bash
npm install axios
```

## 🔧 Setup API Service

Create `src/services/api.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## 🔐 Authentication

### Login Component

```javascript
import { useState } from 'react';
import api from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Store token
      localStorage.setItem('token', response.data.data.token);
      
      // Store user info
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
```

### Register Component

```javascript
import { useState } from 'react';
import api from '../services/api';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    hospital_name: '',
    role: 'staff'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/register', formData);
      
      // Auto-login after registration
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Full Name"
        required
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Password"
        required
      />
      <input
        type="text"
        value={formData.hospital_name}
        onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
        placeholder="Hospital Name"
        required
      />
      <button type="submit">Register</button>
    </form>
  );
}
```

## 🧍 Donors Management

```javascript
import { useState, useEffect } from 'react';
import api from '../services/api';

function DonorsList() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch donors
  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      const response = await api.get('/donors');
      setDonors(response.data.data);
    } catch (err) {
      console.error('Failed to fetch donors:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new donor
  const addDonor = async (donorData) => {
    try {
      await api.post('/donors', donorData);
      fetchDonors(); // Refresh list
    } catch (err) {
      console.error('Failed to add donor:', err);
    }
  };

  // Update donor
  const updateDonor = async (id, updates) => {
    try {
      await api.put(`/donors/${id}`, updates);
      fetchDonors(); // Refresh list
    } catch (err) {
      console.error('Failed to update donor:', err);
    }
  };

  // Delete donor
  const deleteDonor = async (id) => {
    if (!window.confirm('Delete this donor?')) return;
    
    try {
      await api.delete(`/donors/${id}`);
      fetchDonors(); // Refresh list
    } catch (err) {
      console.error('Failed to delete donor:', err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Donors ({donors.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Blood Type</th>
            <th>Contact</th>
            <th>Total Donations</th>
            <th>Available</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {donors.map(donor => (
            <tr key={donor.id}>
              <td>{donor.name}</td>
              <td>{donor.blood_type}</td>
              <td>{donor.contact}</td>
              <td>{donor.total_donations}</td>
              <td>{donor.available ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => updateDonor(donor.id, { available: !donor.available })}>
                  Toggle Available
                </button>
                <button onClick={() => deleteDonor(donor.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## 💉 Donations

```javascript
import { useState, useEffect } from 'react';
import api from '../services/api';

function AddDonation() {
  const [donors, setDonors] = useState([]);
  const [formData, setFormData] = useState({
    donor_id: '',
    blood_type: 'A+',
    quantity: 450
  });

  useEffect(() => {
    // Fetch available donors
    api.get('/donors?available=true').then(res => {
      setDonors(res.data.data);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/donations', formData);
      alert('Donation recorded successfully!');
      
      // Reset form
      setFormData({ donor_id: '', blood_type: 'A+', quantity: 450 });
    } catch (err) {
      alert('Failed to record donation: ' + err.response?.data?.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <select
        value={formData.donor_id}
        onChange={(e) => setFormData({ ...formData, donor_id: e.target.value })}
        required
      >
        <option value="">Select Donor</option>
        {donors.map(donor => (
          <option key={donor.id} value={donor.id}>
            {donor.name} ({donor.blood_type})
          </option>
        ))}
      </select>

      <select
        value={formData.blood_type}
        onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
        required
      >
        <option value="A+">A+</option>
        <option value="A-">A-</option>
        <option value="B+">B+</option>
        <option value="B-">B-</option>
        <option value="AB+">AB+</option>
        <option value="AB-">AB-</option>
        <option value="O+">O+</option>
        <option value="O-">O-</option>
      </select>

      <input
        type="number"
        value={formData.quantity}
        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
        placeholder="Quantity (ml)"
        min="1"
        required
      />

      <button type="submit">Record Donation</button>
    </form>
  );
}
```

## 🩸 Inventory

```javascript
import { useState, useEffect } from 'react';
import api from '../services/api';

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory');
      setInventory(response.data.data);
      setSummary(response.data.summary);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    }
  };

  return (
    <div>
      <h2>Blood Inventory</h2>
      
      {/* Summary */}
      <div className="summary">
        {summary.map(item => (
          <div key={item.blood_type} className="blood-type-card">
            <h3>{item.blood_type}</h3>
            <p>Available: {item.available_units} units</p>
            <p>Reserved: {item.reserved_units} units</p>
            <p>Total: {item.total_units} units</p>
          </div>
        ))}
      </div>

      {/* Detailed List */}
      <table>
        <thead>
          <tr>
            <th>Blood Type</th>
            <th>Units</th>
            <th>Status</th>
            <th>Expiry Date</th>
            <th>Hospital</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map(item => (
            <tr key={item.id}>
              <td>{item.blood_type}</td>
              <td>{item.units}</td>
              <td>{item.status}</td>
              <td>{new Date(item.expiry_date).toLocaleDateString()}</td>
              <td>{item.hospital?.hospital_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## 🔮 Predictions

```javascript
import { useState } from 'react';
import api from '../services/api';

function PredictionButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const runPrediction = async () => {
    setLoading(true);
    try {
      const response = await api.post('/predict-shortage');
      setResult(response.data);
      alert(`Prediction Complete! ${response.data.data.summary.shortages_predicted} shortages predicted.`);
    } catch (err) {
      alert('Prediction failed: ' + err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={runPrediction} disabled={loading}>
        {loading ? 'Running Prediction...' : '🔮 Run Shortage Prediction'}
      </button>

      {result && (
        <div className="prediction-result">
          <h3>Prediction Results</h3>
          {result.data.predictions.map(pred => (
            <div key={pred.id} className={pred.predicted_shortage ? 'shortage' : 'ok'}>
              <strong>{pred.blood_type}</strong>: 
              {pred.predicted_shortage 
                ? ` ⚠️ SHORTAGE PREDICTED (${(pred.probability * 100).toFixed(1)}%)`
                : ` ✅ Sufficient Stock`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## ⚠️ Alerts

```javascript
import { useState, useEffect } from 'react';
import api from '../services/api';

function AlertsList() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchAlerts();
    
    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/alerts');
      setAlerts(response.data.data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  const getAlertIcon = (type) => {
    switch(type) {
      case 'low_stock': return '🚨';
      case 'expiry': return '⏰';
      case 'shortage': return '🔮';
      default: return '⚠️';
    }
  };

  return (
    <div className="alerts-container">
      <h2>Active Alerts ({alerts.length})</h2>
      
      {alerts.length === 0 ? (
        <p>No active alerts</p>
      ) : (
        <div className="alerts-list">
          {alerts.map(alert => (
            <div key={alert.id} className={`alert alert-${alert.type}`}>
              <span className="alert-icon">{getAlertIcon(alert.type)}</span>
              <div className="alert-content">
                <strong>{alert.blood_type}</strong>
                <p>{alert.message}</p>
                <small>{new Date(alert.createdAt).toLocaleString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 🎨 Complete Dashboard Example

```javascript
import { useState, useEffect } from 'react';
import api from '../services/api';
import AlertsList from './AlertsList';
import Inventory from './Inventory';
import PredictionButton from './PredictionButton';

function Dashboard() {
  const [stats, setStats] = useState({
    totalDonors: 0,
    totalDonations: 0,
    totalAlerts: 0
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const [donorsRes, donationsRes, alertsRes] = await Promise.all([
        api.get('/donors'),
        api.get('/donations'),
        api.get('/alerts')
      ]);

      setStats({
        totalDonors: donorsRes.data.count,
        totalDonations: donationsRes.data.count,
        totalAlerts: alertsRes.data.count
      });
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  };

  return (
    <div className="dashboard">
      <h1>OptiBlood Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.totalDonors}</h3>
          <p>Total Donors</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalDonations}</h3>
          <p>Total Donations</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalAlerts}</h3>
          <p>Active Alerts</p>
        </div>
      </div>

      {/* Alerts */}
      <AlertsList />

      {/* Inventory */}
      <Inventory />

      {/* Prediction */}
      <PredictionButton />
    </div>
  );
}

export default Dashboard;
```

## 🔒 Protected Routes

```javascript
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Usage in App.js
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

## 🌐 Environment Variables

Create `.env` file in your React project root:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## ✅ Ready to Use!

Your React frontend is now fully integrated with the OptiBlood backend! 🎉

All CRUD operations, authentication, predictions, and alerts are connected and ready to use.

