import React, { useState, useEffect } from 'react';
import { User, MapPin, Package, Clock, CheckCircle, Truck, XCircle, ChevronRight } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../AuthContext.jsx';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [address, setAddress] = useState({
    address: '',
    city: '',
    state: '',
    zip: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prof, ords] = await Promise.all([
          api.getProfile(),
          api.getOrders()
        ]);
        setProfile(prof);
        setOrders(ords);
        setAddress({
          address: prof.address || '',
          city: prof.city || '',
          state: prof.state || '',
          zip: prof.zip || ''
        });
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    try {
      await api.updateProfile(address);
      setProfile({ ...profile, ...address });
      setIsEditingAddress(false);
      toast.success('Address updated successfully');
    } catch (error) {
      toast.error('Failed to update address');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'shipped': return <Truck className="w-4 h-4 text-blue-500" />;
      case 'delivered': return <CheckCircle className="w-4 h-4 text-indigo-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  if (authLoading || loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  if (!user) return <div className="text-center py-20">Please sign in to view your profile.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm"
      >
        <div className="flex items-center space-x-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold border-4 border-white shadow-lg">
            {user.displayName[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.displayName}</h1>
            <p className="text-gray-500">{user.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider">
              {user.role}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-50 pt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
              Saved Shipping Address
            </h2>
            <button 
              onClick={() => setIsEditingAddress(!isEditingAddress)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              {isEditingAddress ? 'Cancel' : 'Edit Address'}
            </button>
          </div>

          {isEditingAddress ? (
            <form onSubmit={handleUpdateAddress} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Street Address</label>
                <input 
                  type="text" 
                  value={address.address}
                  onChange={(e) => setAddress({...address, address: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                <input 
                  type="text" 
                  value={address.city}
                  onChange={(e) => setAddress({...address, city: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State</label>
                <input 
                  type="text" 
                  value={address.state}
                  onChange={(e) => setAddress({...address, state: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ZIP Code</label>
                <input 
                  type="text" 
                  value={address.zip}
                  onChange={(e) => setAddress({...address, zip: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="md:col-span-2 pt-2">
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
                >
                  Save Address
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              {profile?.address ? (
                <div className="space-y-1">
                  <p className="text-gray-900 font-medium">{profile.address}</p>
                  <p className="text-gray-600">{profile.city}, {profile.state} {profile.zip}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No address saved yet. Add one to speed up checkout!</p>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center">
          <Package className="w-6 h-6 mr-2 text-indigo-600" />
          Order History
        </h2>

        {orders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Order ID</p>
                      <p className="text-sm font-mono text-gray-900">#{String(order.id).slice(-8)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Date</p>
                      <p className="text-sm text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total</p>
                      <p className="text-sm font-bold text-indigo-600">₹{order.total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Status</p>
                      <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-gray-50 rounded-full">
                        {getStatusIcon(order.status)}
                        <span className="text-[10px] font-bold uppercase text-gray-700">{order.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  {order.deliveryTime && (
                    <div className="mt-6 pt-6 border-t border-gray-50 flex items-center text-sm text-indigo-600 bg-indigo-50/50 p-4 rounded-xl">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="font-medium">Expected Delivery: {order.deliveryTime}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
