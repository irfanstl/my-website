import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, LogOut, Menu, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import { useCart } from '../CartContext.jsx';

export const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const { cart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-indigo-600 tracking-tight">
              NEXUS
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Shop</Link>
            {isAdmin && (
              <Link to="/admin" className="flex items-center text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                <ShieldCheck className="w-4 h-4 mr-1" />
                Admin
              </Link>
            )}
            <div className="relative group">
              <Link to="/cart" className="p-2 text-gray-600 hover:text-indigo-600 transition-colors relative">
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200 hover:bg-indigo-200 transition-colors">
                  {user.displayName[0]}
                </Link>
                <button onClick={logout} className="p-2 text-gray-600 hover:text-red-600 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-700 transition-all shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-6 space-y-4">
          <Link to="/" className="block text-gray-600 font-medium" onClick={() => setIsMenuOpen(false)}>Shop</Link>
          {isAdmin && (
            <Link to="/admin" className="block text-gray-600 font-medium" onClick={() => setIsMenuOpen(false)}>Admin Dashboard</Link>
          )}
          <Link to="/cart" className="block text-gray-600 font-medium" onClick={() => setIsMenuOpen(false)}>
            Cart ({cartCount})
          </Link>
          {user && (
            <Link to="/profile" className="block text-gray-600 font-medium" onClick={() => setIsMenuOpen(false)}>My Profile</Link>
          )}
          {user ? (
            <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block text-red-600 font-medium">Sign Out</button>
          ) : (
            <Link to="/login" className="block text-indigo-600 font-medium" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
};
