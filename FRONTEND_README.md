# MenuSphere Frontend

Modern React frontend for MenuSphere restaurant management system.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_STRIPE_PUBLIC_KEY=your_stripe_key
```

### 3. Run Development Server

```bash
npm run dev
```

Frontend runs on: **http://localhost:5173**

## 📦 Features Implemented

### ✅ Core Infrastructure
- React Router v6 for navigation
- Authentication context with JWT
- Protected routes with role-based access
- WebSocket integration for real-time updates
- Modern CSS design system with glassmorphism
- Responsive layouts

### ✅ Authentication
- Login page with beautiful gradient UI
- Registration with role selection (Owner/Chef)
- Automatic token refresh
- Persistent authentication state

### ✅ Owner Dashboard
- Navigation to all management pages
- Quick stats display
- Modern card-based UI

### 🚧 Pages (Placeholders Created)
- Restaurant Settings
- Table Management
- Menu Management
- Order Management
- Analytics
- Reviews
- Customer Menu
- Cart & Checkout
- Order Tracking
- Voice Ordering
- Kitchen Display System (KDS)

## 🎨 Design System

### Colors
- **Primary**: #FF6B6B (Red-Orange)
- **Secondary**: #4ECDC4 (Teal)
- **Accent**: #FFE66D (Yellow)
- **Dark**: #1a1a2e
- **Success**: #4ade80
- **Error**: #ef4444

### Components
- Glassmorphism cards
- Gradient buttons
- Smooth animations
- Modern input fields
- Badge components
- Loading spinners

## 📁 Project Structure

```
src/
├── components/
│   ├── PlaceholderPage.jsx
│   └── ProtectedRoute.jsx
├── config/
│   └── api.js
├── context/
│   └── AuthContext.jsx
├── hooks/
│   └── useSocket.js
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── owner/
│   │   ├── Dashboard.jsx
│   │   └── [other pages...]
│   ├── customer/
│   └── kds/
├── App.jsx
├── main.jsx
└── index.css
```

## 🔌 API Integration

The frontend is configured to connect to the backend at `http://localhost:5000/api`.

All API calls use the axios instance from `src/config/api.js` which:
- Automatically adds JWT tokens
- Handles token refresh
- Shows error toasts

## 🎯 Next Steps for Full Implementation

### Priority 1: Core Features
1. **Restaurant Settings Page**
   - Create/edit restaurant profile
   - Business hours configuration
   - Feature toggles

2. **Table Management**
   - Create tables
   - Generate & download QR codes
   - Table list with status

3. **Menu Management**
   - Add/edit menu items
   - Upload images
   - 3D model URL input
   - Category management

### Priority 2: Customer Experience
4. **Customer Menu**
   - Browse menu items
   - 3D model viewer (React Three Fiber)
   - Add to cart
   - Category filtering

5. **Cart & Checkout**
   - Cart management
   - Stripe payment integration
   - Order placement

6. **Order Tracking**
   - Real-time status updates via WebSocket
   - Progress indicator

### Priority 3: Advanced Features
7. **Voice Ordering**
   - Web Speech API integration
   - Voice-to-text
   - Order confirmation

8. **Kitchen Display System**
   - Real-time order display
   - Priority indicators
   - Status updates

9. **Analytics Dashboard**
   - Charts using Recharts
   - Revenue reports
   - Peak hours visualization

10. **Reviews System**
    - Review submission
    - Owner replies
    - Rating display

## 🛠️ Development Tips

### Adding New Pages

1. Create component in appropriate folder
2. Import in `App.jsx`
3. Add route

### Using WebSocket

```javascript
import { useSocket } from '../hooks/useSocket';

const { socket, joinRestaurant } = useSocket();

useEffect(() => {
  joinRestaurant(restaurantId);
  
  socket?.on('order:created', (data) => {
    // Handle new order
  });
}, [socket]);
```

### API Calls

```javascript
import api from '../config/api';

const fetchData = async () => {
  const response = await api.get('/endpoint');
  return response.data;
};
```

## 📱 Responsive Design

The app is mobile-first and responsive:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🎨 Styling

Uses custom CSS with utility classes:
- `.btn`, `.btn-primary`, `.btn-secondary`
- `.card`, `.glass`
- `.input`, `.label`
- `.badge`, `.badge-success`
- Grid and flex utilities

## 🚀 Build for Production

```bash
npm run build
```

Output in `dist/` folder.

## 📝 License

ISC
