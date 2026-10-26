import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import MapExplorerPage from './pages/MapExplorerPage';
import RecommendationsPage from './pages/RecommendationsPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import SupplierPortalPage from './pages/SupplierPortalPage';
import AdminPortalPage from './pages/AdminPortalPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Protected Route Wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Đang xác thực...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.vaiTro) && user.vaiTro !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <div style={{ flexGrow: 1 }}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductListPage />} />
                  <Route path="/products/:id" element={<ProductDetailPage />} />
                  <Route path="/map-explorer" element={<MapExplorerPage />} />
                  <Route path="/recommendations" element={<RecommendationsPage />} />
                  <Route path="/cart" element={<CartPage />} />

                  {/* Customer Orders */}
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <OrdersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders/:id"
                    element={
                      <ProtectedRoute>
                        <OrderDetailPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Supplier Portal */}
                  <Route
                    path="/supplier"
                    element={
                      <ProtectedRoute allowedRoles={['Supplier']}>
                        <SupplierPortalPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin & Staff Portal */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
                        <AdminPortalPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Auth */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
              <Footer />
            </div>
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;