# 🩸 Step-by-Step Guide: Registering Donors

## Overview
This guide walks you through the complete process of registering a new donor in the OptiBlood system, from hospital staff login to successful donor registration.

---

## Prerequisites
1. ✅ Hospital staff account must be registered
2. ✅ Backend server must be running on `http://localhost:5001`
3. ✅ Database must be connected and synced
4. ✅ JWT token from staff login

---

## Step-by-Step Process

### **Step 1: Hospital Staff Login**

First, the hospital staff member needs to log in to get an authentication token.

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "staff@hospital.com",
  "password": "staffpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "name": "John Staff",
      "email": "staff@hospital.com",
      "hospital_name": "City General Hospital",
      "role": "staff"
    }
  }
}
```

**Action:** Save the `token` from the response. You'll need it for all subsequent API calls.

---

### **Step 2: Prepare Donor Information**

Before registering a donor, gather the following information:

**Required Fields:**
- ✅ **name** - Full name of the donor (2-100 characters)
- ✅ **email** - Valid email address (must be unique)
- ✅ **blood_type** - One of: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`
- ✅ **contact** - Contact number/phone

**Optional Fields:**
- ⚪ **city** - City where donor is located (max 100 characters)

**Example Donor Data:**
```json
{
  "name": "Sarah Johnson",
  "email": "sarah.johnson@email.com",
  "blood_type": "O+",
  "contact": "+1234567890",
  "city": "New York"
}
```

---

### **Step 3: Register the Donor**

**Endpoint:** `POST /api/donors`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Sarah Johnson",
  "email": "sarah.johnson@email.com",
  "blood_type": "O+",
  "contact": "+1234567890",
  "city": "New York"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Donor added successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Sarah Johnson",
    "email": "sarah.johnson@email.com",
    "blood_type": "O+",
    "contact": "+1234567890",
    "city": "New York",
    "last_donation_date": null,
    "total_donations": 0,
    "total_donated_ml": 0,
    "available": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**What Happens:**
- ✅ Donor is created in the database
- ✅ Email uniqueness is validated
- ✅ All fields are validated
- ✅ Donor is marked as `available: true`
- ✅ Initial stats set: `total_donations: 0`, `total_donated_ml: 0`

---

### **Step 4: Handle Possible Errors**

#### **Error 1: Missing Required Fields (400)**
```json
{
  "success": false,
  "message": "Please provide all required fields: name, email, blood_type, contact"
}
```
**Solution:** Ensure all required fields are provided.

#### **Error 2: Duplicate Email (400)**
```json
{
  "success": false,
  "message": "Donor with this email already exists"
}
```
**Solution:** Use a different email or update the existing donor instead.

#### **Error 3: Invalid Blood Type (400)**
```json
{
  "success": false,
  "message": "Validation error",
  "error": "blood_type must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-"
}
```
**Solution:** Use a valid blood type from the allowed list.

#### **Error 4: Unauthorized (401)**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```
**Solution:** 
- Check if token is included in headers
- Verify token is valid (not expired)
- Login again to get a new token

---

## Complete Example: Using cURL

```bash
# Step 1: Login as staff
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@hospital.com",
    "password": "staffpassword123"
  }'

# Save the token from response, then:

# Step 2: Register a donor
curl -X POST http://localhost:5001/api/donors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Sarah Johnson",
    "email": "sarah.johnson@email.com",
    "blood_type": "O+",
    "contact": "+1234567890",
    "city": "New York"
  }'
```

---

## Complete Example: Using JavaScript/Frontend

```javascript
// Step 1: Login
const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'staff@hospital.com',
    password: 'staffpassword123'
  })
});

const loginData = await loginResponse.json();
const token = loginData.data.token;

// Step 2: Register donor
const donorResponse = await fetch('http://localhost:5001/api/donors', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    blood_type: 'O+',
    contact: '+1234567890',
    city: 'New York'
  })
});

const donorData = await donorResponse.json();
console.log('Donor registered:', donorData);
```

---

## Complete Example: Using Postman

1. **Create Login Request:**
   - Method: `POST`
   - URL: `http://localhost:5001/api/auth/login`
   - Body (raw JSON):
     ```json
     {
       "email": "staff@hospital.com",
       "password": "staffpassword123"
     }
     ```
   - Click "Send"
   - Copy the `token` from response

2. **Create Register Donor Request:**
   - Method: `POST`
   - URL: `http://localhost:5001/api/donors`
   - Headers:
     - `Authorization`: `Bearer YOUR_TOKEN_HERE`
     - `Content-Type`: `application/json`
   - Body (raw JSON):
     ```json
     {
       "name": "Sarah Johnson",
       "email": "sarah.johnson@email.com",
       "blood_type": "O+",
       "contact": "+1234567890",
       "city": "New York"
     }
     ```
   - Click "Send"

---

## Verification: View Registered Donors

After registration, you can verify the donor was added:

**Endpoint:** `GET /api/donors`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Sarah Johnson",
      "email": "sarah.johnson@email.com",
      "blood_type": "O+",
      "contact": "+1234567890",
      "city": "New York",
      "last_donation_date": null,
      "total_donations": 0,
      "total_donated_ml": 0,
      "available": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## Next Steps After Registration

Once a donor is registered, you can:

1. **Record a Donation** - `POST /api/donations`
2. **Update Donor Info** - `PUT /api/donors/:id`
3. **Mark Donor Unavailable** - `PUT /api/donors/:id` with `"available": false`
4. **View Donor History** - `GET /api/donations?donor_id=UUID`

---

## Quick Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ Yes | Full name (2-100 chars) |
| `email` | String | ✅ Yes | Unique email address |
| `blood_type` | Enum | ✅ Yes | A+, A-, B+, B-, AB+, AB-, O+, O- |
| `contact` | String | ✅ Yes | Contact number |
| `city` | String | ⚪ Optional | City (max 100 chars) |

**Default Values Set Automatically:**
- `total_donations`: 0
- `total_donated_ml`: 0
- `available`: true
- `last_donation_date`: null

---

## Troubleshooting

**Q: I get "Route not found" error**
- ✅ Check backend server is running on port 5001
- ✅ Verify the endpoint URL is correct: `/api/donors`

**Q: I get "Unauthorized" error**
- ✅ Check token is included in Authorization header
- ✅ Verify token format: `Bearer YOUR_TOKEN`
- ✅ Token might be expired - login again

**Q: Email already exists error**
- ✅ Check if donor was already registered
- ✅ Use `GET /api/donors` to find existing donor
- ✅ Use `PUT /api/donors/:id` to update instead

**Q: Invalid blood type error**
- ✅ Use only: A+, A-, B+, B-, AB+, AB-, O+, O-
- ✅ Case sensitive - use uppercase letters

---

## Summary

1. ✅ Staff logs in → Gets JWT token
2. ✅ Prepare donor information (name, email, blood_type, contact, city)
3. ✅ Send POST request to `/api/donors` with token in header
4. ✅ Donor is registered and ready for donations!

**That's it! The donor is now in the system and can receive donation requests when their blood type is needed.** 🎉





