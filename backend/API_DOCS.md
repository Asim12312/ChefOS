# MenuSphere API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication using JWT Bearer token.

**Header:**
```
Authorization: Bearer <your_jwt_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

## Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "OWNER"
}
```

### Login
```http
POST /auth/login
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Restaurant Endpoints

### Create Restaurant
```http
POST /restaurant
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "My Restaurant",
  "description": "Best food in town",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "contact": {
    "phone": "+1234567890",
    "email": "restaurant@example.com"
  },
  "businessHours": [
    {
      "day": "Monday",
      "openTime": "09:00",
      "closeTime": "22:00"
    }
  ],
  "features": {
    "orderingEnabled": true,
    "voiceOrderingEnabled": true,
    "onlinePaymentsEnabled": true
  }
}
```

## Order Endpoints

### Create Order
```http
POST /orders
```

**Body:**
```json
{
  "restaurant": "restaurant_id",
  "table": "table_id",
  "items": [
    {
      "menuItem": "menu_item_id",
      "quantity": 2,
      "specialInstructions": "No onions"
    }
  ],
  "customerName": "Jane Doe",
  "customerPhone": "+1234567890",
  "paymentMethod": "CASH"
}
```

### Update Order Status
```http
PATCH /orders/:id/status
Authorization: Bearer <token>
```

**Body:**
```json
{
  "status": "PREPARING"
}
```

**Valid Status Transitions:**
- PENDING → ACCEPTED, CANCELLED
- ACCEPTED → PREPARING, CANCELLED
- PREPARING → READY, CANCELLED
- READY → SERVED

## Voice Ordering

### Process Voice Order
```http
POST /voice/order
```

**Body:**
```json
{
  "transcript": "I want two burgers and one cola",
  "restaurant": "restaurant_id",
  "table": "table_id",
  "customerName": "John Doe"
}
```

## Payment Endpoints

### Create Payment Intent
```http
POST /payments/create
```

**Body:**
```json
{
  "orderId": "order_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentId": "payment_id",
    "amount": 25.50
  }
}
```

## WebSocket Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

// Join restaurant room
socket.emit('join:restaurant', 'restaurant_id');

// Listen for new orders
socket.on('order:created', (data) => {
  console.log('New order:', data);
});

// Listen for status updates
socket.on('order:status-changed', (data) => {
  console.log('Order status changed:', data);
});
```

## Rate Limits

- General API: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes
- Order Creation: 10 requests per 5 minutes

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
