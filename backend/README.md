# MenuSphere Backend API

Production-grade backend for MenuSphere - Smart QR-Based 3D Menu, Ordering & Kitchen System.

## 🚀 Features

- ✅ **Multi-tenant SaaS Architecture** - Complete restaurant isolation
- ✅ **JWT Authentication** with refresh tokens
- ✅ **Role-based Access Control** (Owner, Chef, Admin)
- ✅ **Real-time WebSocket Events** for orders and KDS
- ✅ **QR Code Generation** for tables
- ✅ **Voice Ordering** with NLP parsing
- ✅ **Payment Integration** (Stripe)
- ✅ **Kitchen Display System** (KDS)
- ✅ **Reviews & Ratings**
- ✅ **Comprehensive Analytics**

## 📋 Prerequisites

- Node.js >= 16.x
- MongoDB >= 5.x
- Stripe Account (for payments)

## 🛠️ Installation

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and configure:
- MongoDB connection string
- JWT secrets
- Stripe API keys
- Other settings

4. **Start MongoDB** (if running locally):
```bash
mongod
```

5. **Run the server:**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will run on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/             # Business logic
│   ├── auth.controller.js
│   ├── restaurant.controller.js
│   ├── table.controller.js
│   ├── menu.controller.js
│   ├── order.controller.js
│   ├── voice.controller.js
│   ├── payment.controller.js
│   ├── kds.controller.js
│   ├── review.controller.js
│   └── analytics.controller.js
├── middleware/              # Express middleware
│   ├── auth.js
│   ├── errorHandler.js
│   └── rateLimiter.js
├── models/                  # Mongoose schemas
│   ├── User.js
│   ├── Restaurant.js
│   ├── Table.js
│   ├── MenuItem.js
│   ├── Order.js
│   ├── Payment.js
│   └── Review.js
├── routes/                  # API routes
│   ├── auth.routes.js
│   ├── restaurant.routes.js
│   ├── table.routes.js
│   ├── menu.routes.js
│   ├── order.routes.js
│   ├── voice.routes.js
│   ├── payment.routes.js
│   ├── kds.routes.js
│   ├── review.routes.js
│   └── analytics.routes.js
├── utils/
│   └── logger.js            # Winston logger
├── .env.example
├── .gitignore
├── package.json
└── server.js                # Entry point
```

## 🔐 User Roles

| Role | Permissions |
|------|-------------|
| **OWNER** | Full restaurant management, analytics, settings |
| **CHEF** | View orders, update order status, KDS access |
| **ADMIN** | Platform-wide access (optional) |
| **Customer** | No login required - place orders, reviews |

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login
POST   /api/auth/refresh       - Refresh access token
POST   /api/auth/logout        - Logout
GET    /api/auth/me            - Get current user
```

### Restaurant Management
```
POST   /api/restaurant         - Create restaurant
GET    /api/restaurant/:id     - Get restaurant
PATCH  /api/restaurant/:id     - Update restaurant
PATCH  /api/restaurant/:id/settings - Update settings
GET    /api/restaurant/my-restaurants - Get owner's restaurants
DELETE /api/restaurant/:id     - Delete restaurant
```

### Table Management
```
POST   /api/tables             - Create table
GET    /api/tables             - Get tables
GET    /api/tables/:id         - Get single table
GET    /api/tables/:id/qr      - Download QR code
PATCH  /api/tables/:id         - Update table
DELETE /api/tables/:id         - Delete table
```

### Menu Management
```
POST   /api/menu               - Create menu item
GET    /api/menu               - Get menu items
GET    /api/menu/categories/:restaurantId - Get categories
GET    /api/menu/:id           - Get menu item
PATCH  /api/menu/:id           - Update menu item
PATCH  /api/menu/:id/availability - Toggle availability
DELETE /api/menu/:id           - Delete menu item
```

### Order Management
```
POST   /api/orders             - Create order
GET    /api/orders             - Get orders
GET    /api/orders/stats/:restaurantId - Get statistics
GET    /api/orders/:id         - Get single order
PATCH  /api/orders/:id/status  - Update order status
DELETE /api/orders/:id         - Cancel order
```

### Voice Ordering
```
POST   /api/voice/order        - Process voice order
```

### Payment
```
POST   /api/payments/create    - Create payment intent
POST   /api/payments/webhook   - Stripe webhook
POST   /api/payments/verify    - Verify payment
GET    /api/payments/history/:restaurantId - Payment history
```

### Kitchen Display System
```
GET    /api/kds/orders         - Get active kitchen orders
GET    /api/kds/stats          - Get KDS statistics
```

### Reviews
```
POST   /api/reviews            - Create review
GET    /api/reviews            - Get reviews
POST   /api/reviews/:id/reply  - Owner reply
PATCH  /api/reviews/:id/spam   - Mark as spam
DELETE /api/reviews/:id        - Delete review
```

### Analytics
```
GET    /api/analytics/orders/:restaurantId      - Orders analytics
GET    /api/analytics/revenue/:restaurantId     - Revenue analytics
GET    /api/analytics/peak-hours/:restaurantId  - Peak hours
GET    /api/analytics/top-items/:restaurantId   - Top menu items
GET    /api/analytics/table-usage/:restaurantId - Table usage
GET    /api/analytics/dashboard/:restaurantId   - Dashboard summary
```

## 🔌 WebSocket Events

### Client → Server
```javascript
socket.emit('join:restaurant', restaurantId);
socket.emit('join:kds', restaurantId);
socket.emit('join:order', orderId);
```

### Server → Client
```javascript
socket.on('order:created', (data) => { /* New order */ });
socket.on('order:status-changed', (data) => { /* Status update */ });
socket.on('order:updated', (data) => { /* Order updated */ });
socket.on('order:cancelled', (data) => { /* Order cancelled */ });
socket.on('kds:new-order', (data) => { /* New order for kitchen */ });
socket.on('kds:order-updated', (data) => { /* KDS order update */ });
socket.on('payment:success', (data) => { /* Payment successful */ });
socket.on('payment:confirmed', (data) => { /* Payment confirmed */ });
```

## 🧪 Testing

Run tests:
```bash
npm test
```

## 🚢 Deployment

1. Set `NODE_ENV=production` in environment
2. Configure production MongoDB URI
3. Set secure JWT secrets
4. Configure Stripe production keys
5. Set up SSL/TLS certificates
6. Use process manager (PM2):

```bash
npm install -g pm2
pm2 start server.js --name menusphere-backend
pm2 save
pm2 startup
```

## 📝 Environment Variables

See `.env.example` for all required environment variables.

## 🔒 Security Features

- Helmet.js for security headers
- Rate limiting on sensitive endpoints
- JWT token expiration
- Password hashing with bcrypt
- Multi-tenant data isolation
- Input validation
- CORS configuration

## 📊 Database Indexes

All models include optimized indexes for:
- Restaurant-scoped queries
- Status filtering
- Date range queries
- Full-text search ready

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

ISC

## 👨‍💻 Support

For issues and questions, please create an issue in the repository.
