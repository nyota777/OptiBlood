# 🩸 Donor Registration Flow - Visual Guide

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    HOSPITAL STAFF LOGIN                       │
│                                                               │
│  POST /api/auth/login                                         │
│  {                                                             │
│    "email": "staff@hospital.com",                            │
│    "password": "staffpassword123"                             │
│  }                                                             │
│                                                               │
│  ✅ Response: { token: "JWT_TOKEN_HERE" }                    │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ Save Token
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              PREPARE DONOR INFORMATION                       │
│                                                               │
│  Required Fields:                                             │
│  ✅ name: "Sarah Johnson"                                    │
│  ✅ email: "sarah@email.com" (UNIQUE)                        │
│  ✅ blood_type: "O+" (A+, A-, B+, B-, AB+, AB-, O+, O-)     │
│  ✅ contact: "+1234567890"                                   │
│                                                               │
│  Optional Fields:                                            │
│  ⚪ city: "New York"                                          │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              REGISTER DONOR                                  │
│                                                               │
│  POST /api/donors                                            │
│  Headers:                                                    │
│    Authorization: Bearer JWT_TOKEN_HERE                      │
│    Content-Type: application/json                           │
│                                                               │
│  Body:                                                       │
│  {                                                           │
│    "name": "Sarah Johnson",                                 │
│    "email": "sarah@email.com",                             │
│    "blood_type": "O+",                                      │
│    "contact": "+1234567890",                                │
│    "city": "New York"                                        │
│  }                                                           │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              VALIDATION & CREATION                          │
│                                                               │
│  ✅ Check email uniqueness                                   │
│  ✅ Validate all required fields                            │
│  ✅ Validate blood_type enum                                │
│  ✅ Create donor in database                                 │
│  ✅ Set defaults:                                           │
│     - total_donations: 0                                     │
│     - total_donated_ml: 0                                   │
│     - available: true                                       │
│     - last_donation_date: null                              │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              SUCCESS RESPONSE                                │
│                                                               │
│  {                                                           │
│    "success": true,                                          │
│    "message": "Donor added successfully",                    │
│    "data": {                                                 │
│      "id": "uuid-here",                                      │
│      "name": "Sarah Johnson",                               │
│      "email": "sarah@email.com",                            │
│      "blood_type": "O+",                                    │
│      "contact": "+1234567890",                              │
│      "city": "New York",                                     │
│      "total_donations": 0,                                  │
│      "total_donated_ml": 0,                                 │
│      "available": true,                                     │
│      "createdAt": "2024-01-15T10:30:00.000Z"                │
│    }                                                         │
│  }                                                           │
│                                                               │
│  🎉 Donor is now registered and ready!                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start Commands

### Using cURL:

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@hospital.com","password":"staffpassword123"}' \
  | jq -r '.data.token')

# 2. Register Donor
curl -X POST http://localhost:5001/api/donors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Sarah Johnson",
    "email": "sarah@email.com",
    "blood_type": "O+",
    "contact": "+1234567890",
    "city": "New York"
  }'
```

### Using Node.js Test Script:

```bash
# Update credentials in test-donor-registration.js first
node backend/test-donor-registration.js
```

---

## Field Validation Rules

| Field | Rules | Example |
|-------|-------|---------|
| **name** | 2-100 characters, required | "Sarah Johnson" |
| **email** | Valid email, unique, required | "sarah@email.com" |
| **blood_type** | Must be: A+, A-, B+, B-, AB+, AB-, O+, O- | "O+" |
| **contact** | Required, any string | "+1234567890" |
| **city** | Optional, max 100 chars | "New York" |

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `400: Missing required fields` | Missing name, email, blood_type, or contact | Provide all required fields |
| `400: Email already exists` | Donor with this email is already registered | Use different email or update existing donor |
| `400: Invalid blood type` | blood_type not in allowed list | Use: A+, A-, B+, B-, AB+, AB-, O+, O- |
| `401: Unauthorized` | Missing or invalid token | Login again to get new token |
| `404: Route not found` | Backend server not running | Start server: `cd backend && npm run dev` |

---

## What Happens After Registration?

Once a donor is registered:

1. ✅ **They can receive donation requests** when their blood type is needed
2. ✅ **You can record donations** using `POST /api/donations`
3. ✅ **They'll receive email alerts** when their blood type has a predicted shortage
4. ✅ **You can update their info** using `PUT /api/donors/:id`
5. ✅ **You can mark them unavailable** if needed

---

## Next Steps

After registering a donor, you might want to:

1. **Record their first donation** → `POST /api/donations`
2. **View all donors** → `GET /api/donors`
3. **Filter by blood type** → `GET /api/donors?blood_type=O+`
4. **Update donor info** → `PUT /api/donors/:id`

---

**Ready to register your first donor? Follow the steps above! 🎉**





