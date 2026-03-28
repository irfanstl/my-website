import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ShieldCheck, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../CartContext.jsx';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../services/api.js';
import { toast } from 'react-hot-toast';

export const Checkout = () => {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });
  const [saveAddress, setSaveAddress] = useState(true);
  const [hasSavedAddress, setHasSavedAddress] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await api.getProfile();
        if (profile && profile.address) {
          setHasSavedAddress(true);
          setFormData({
            name: profile.displayName || user?.displayName || '',
            email: profile.email || user?.email || '',
            address: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            zip: profile.zip || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to complete your order');
      return;
    }
    

    setIsProcessing(true);
    
    // Razorpay Integration
    try {
      if (total <= 0) {
        toast.error('Cart is empty or total is zero');
        setIsProcessing(false);
        return;
      }

      if (!window.Razorpay) {
        toast.error('Razorpay SDK not loaded. Please check your internet connection.');
        setIsProcessing(false);
        return;
      }

      // 1. Create Order on Backend
      const order = await api.createRazorpayOrder(total);

      const options = {
        key: "rzp_test_SWZrKetZoAPoQQ", // IMPORTANT: User must replace this with a real Razorpay Test Key
        amount: order.amount,
        currency: order.currency,
        name: "Nexus E-Commerce",
        description: "Order Payment",
        image: "https://picsum.photos/seed/nexus/200/200",
        order_id: order.id,
        handler: async function (response) {
          console.log('Razorpay Success Response:', response);
          // 2. Verify Payment on Backend
          try {
            const orderData = {
              items: cart.map(item => ({
                productId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
              })),
              total,
              shippingAddress: `${formData.address}, ${formData.city}, ${formData.state}, ${formData.zip}`
            };

            const verificationResult = await api.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderData
            });

            if (verificationResult.success) {
              if (saveAddress) {
                await api.updateProfile({
                  displayName: formData.name,
                  address: formData.address,
                  city: formData.city,
                  state: formData.state,
                  zip: formData.zip
                });
              }

              if (isMounted.current) {
                setIsSuccess(true);
                clearCart();
                toast.success('Payment Successful!');
              }
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Error verifying payment:', error);
            if (isMounted.current) {
              toast.error('Failed to verify payment. Please contact support.');
            }
          } finally {
            if (isMounted.current) {
              setIsProcessing(false);
            }
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
        },
        notes: {
          address: formData.address
        },
        theme: {
          color: "#4f46e5"
        },
        modal: {
          ondismiss: function() {
            console.log('Razorpay Modal Dismissed');
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response) {
        console.error('Razorpay Payment Failed:', response.error);
        toast.error(`Payment Failed: ${response.error.description}`);
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err) {
      console.error('Razorpay Initialization Error:', err);
      toast.error('Failed to initialize Razorpay. Please ensure you have a valid Key ID.');
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-green-100 p-6 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center"
        >
          <CheckCircle className="w-12 h-12 text-green-600" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Successful!</h1>
        <p className="text-gray-600 mb-8">Thank you for your purchase. Your order has been placed and is being processed.</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={() => navigate('/cart')}
        className="flex items-center text-gray-600 hover:text-indigo-600 mb-8 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to cart
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <form onSubmit={handleCheckout} className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Shipping Information</h3>
                {hasSavedAddress && (
                  <span className="text-[10px] font-bold uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Saved Address Loaded
                  </span>
                )}
              </div>
              <input
                required
                type="text"
                placeholder="Full Name"
                className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
              <input
                required
                type="text"
                placeholder="Address"
                className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  type="text"
                  placeholder="City"
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                />
                <input
                  required
                  type="text"
                  placeholder="State"
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={formData.state}
                  onChange={e => setFormData({...formData, state: e.target.value})}
                />
                <input
                  required
                  type="text"
                  placeholder="ZIP Code"
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={formData.zip}
                  onChange={e => setFormData({...formData, zip: e.target.value})}
                />
              </div>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={saveAddress}
                    onChange={() => setSaveAddress(!saveAddress)}
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${saveAddress ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}>
                    {saveAddress && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>
                <span className="text-sm text-gray-600 font-medium group-hover:text-gray-900 transition-colors">Save address for future orders</span>
              </label>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Payment Method</h3>
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center space-x-4">
                <CreditCard className="w-8 h-8 text-indigo-600" />
                <div>
                  <p className="font-bold text-gray-900">Razorpay Secure Payment</p>
                  <p className="text-xs text-gray-500">Pay securely via Cards, UPI, NetBanking</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1 text-green-500" />
                This is a test payment environment. No real money will be charged.
              </p>
            </div>

            <button
              type="submit"
              disabled={isProcessing || cart.length === 0}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                `Pay ₹${total.toFixed(2)}`
              )}
            </button>

            {/* Simulation Fallback for Testing */}
            <button
              type="button"
              onClick={async () => {
                setIsProcessing(true);
                await new Promise(r => setTimeout(r, 1500));
                try {
                  await api.createOrder({
                    items: cart.map(item => ({
                      productId: item.id,
                      name: item.name,
                      price: item.price,
                      quantity: item.quantity
                    })),
                    total,
                    shippingAddress: `${formData.address}, ${formData.city}, ${formData.state}, ${formData.zip}`
                  });

                  if (saveAddress) {
                    await api.updateProfile({
                      displayName: formData.name,
                      address: formData.address,
                      city: formData.city,
                      state: formData.state,
                      zip: formData.zip
                    });
                  }

                  setIsSuccess(true);
                  clearCart();
                  toast.success('Simulated Payment Successful!');
                } catch (e) {
                  toast.error('Failed to create order');
                } finally {
                  setIsProcessing(false);
                }
              }}
              className="w-full mt-2 text-indigo-600 text-sm font-medium hover:underline"
            >
              Simulate Successful Payment (Demo Mode)
            </button>
          </form>
        </div>

        <div className="bg-gray-50 p-8 rounded-3xl h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
          <div className="space-y-4 mb-6">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.name} x {item.quantity}</span>
                <span className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-indigo-600">₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
