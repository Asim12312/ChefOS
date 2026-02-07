import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Landing from './pages/Landing';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Owner Pages
import OwnerDashboard from './pages/owner/Dashboard';
import {
  RestaurantSettings,
  TableManagement,
  MenuManagement,
  InventoryManagement,
  OrderManagement,
  Analytics,
  Reviews,
  ServiceRequests,
  Reservations,
  Complaints,
  RestaurantOnboarding
} from './pages/owner';

// Customer Pages
import { Menu, Cart, Checkout, OrderTracking, VoiceOrder, CustomerLayout } from './pages/customer';

// KDS
import { KitchenDisplay } from './pages/kds';
import { useAuth } from './context/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Guard component for owners who haven't set up a restaurant
const OwnerGuard = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  // If owner doesn't have a restaurant, redirect to onboarding
  if (user?.role === 'OWNER' && !user?.restaurant) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Landing Page */}
              <Route path="/" element={<Landing />} />

              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Customer Routes - Public */}
              <Route element={<CustomerLayout />}>
                <Route path="/menu/:restaurantId" element={<Menu />} />
                <Route path="/menu/:restaurantId/:tableId" element={<Menu />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order/:orderId" element={<OrderTracking />} />
                <Route path="/voice-order/:restaurantId" element={<VoiceOrder />} />
              </Route>

              {/* Owner Routes - Protected */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute roles={['OWNER']}>
                    <RestaurantOnboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute roles={['OWNER', 'ADMIN']}>
                    <OwnerGuard>
                      <OwnerDashboard />
                    </OwnerGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute roles={['OWNER', 'ADMIN']}>
                    <OwnerGuard>
                      <RestaurantSettings />
                    </OwnerGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tables"
                element={
                  <ProtectedRoute roles={['OWNER', 'ADMIN']}>
                    <OwnerGuard>
                      <TableManagement />
                    </OwnerGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/menu-management"
                element={
                  <ProtectedRoute roles={['OWNER', 'ADMIN']}>
                    <OwnerGuard>
                      <MenuManagement />
                    </OwnerGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute roles={['OWNER', 'CHEF', 'ADMIN']}>
                    <OwnerGuard>
                      <InventoryManagement />
                    </OwnerGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute roles={['OWNER', 'CHEF', 'ADMIN']}>
                    <OwnerGuard>
                      <OrderManagement />
                    </OwnerGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute roles={['OWNER', 'ADMIN']}>
                    <OwnerGuard>
                      <Analytics />
                    </OwnerGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reviews"
                element={
                  <ProtectedRoute roles={['OWNER', 'ADMIN']}>
                    <OwnerGuard>
                      <Reviews />
                    </OwnerGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/service-requests"
                element={
                  <ProtectedRoute roles={['OWNER', 'ADMIN']}>
                    <OwnerGuard>
                      <ServiceRequests />
                    </OwnerGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reservations"
                element={
                  <ProtectedRoute roles={['OWNER', 'ADMIN']}>
                    <OwnerGuard>
                      <Reservations />
                    </OwnerGuard>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/complaints"
                element={
                  <ProtectedRoute roles={['OWNER', 'ADMIN']}>
                    <OwnerGuard>
                      <Complaints />
                    </OwnerGuard>
                  </ProtectedRoute>
                }
              />

              {/* KDS Route - Protected */}
              <Route
                path="/kds"
                element={
                  <ProtectedRoute roles={['CHEF', 'OWNER', 'ADMIN']}>
                    <KitchenDisplay />
                  </ProtectedRoute>
                }
              />


            </Routes>

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
