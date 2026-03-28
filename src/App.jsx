import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider } from './AuthContext.jsx';
import { CartProvider } from './CartContext.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Footer } from './components/Footer.jsx';
import { Home } from './pages/Home.jsx';
import { ProductDetails } from './pages/ProductDetails.jsx';
import { Admin } from './pages/Admin.jsx';
import { Checkout } from './pages/Checkout.jsx';
import { Cart } from './pages/Cart.jsx';
import { Login } from './pages/Login.jsx';
import { Profile } from './pages/Profile.jsx';
import { io } from 'socket.io-client';

const RealTimeNotifications = () => {
  useEffect(() => {
    const socket = io();
    socket.on('newOrder', (data) => {
      toast.success(
        <div className="flex flex-col">
          <span className="font-bold">New Order Placed!</span>
          <span className="text-xs">User: {data.userName}</span>
          <span className="text-xs">Total: ₹{data.total.toFixed(2)}</span>
          <span className="text-xs">Items: {data.items}</span>
        </div>,
        { duration: 5000 }
      );
    });
    return () => socket.disconnect();
  }, []);
  return null;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
              <RealTimeNotifications />
              <Navbar />
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<Admin />} />
                </Routes>
              </main>
              <Footer />
              <Toaster position="bottom-right" />
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
