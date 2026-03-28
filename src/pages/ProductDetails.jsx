import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { api } from '../services/api.js';
import { useCart } from '../CartContext.jsx';
import { toast } from 'react-hot-toast';

export const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const data = await api.getProduct(id);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Product not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-indigo-600 mb-8 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to shop
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex flex-col">
          <div className="mb-6">
            <span className="text-indigo-600 font-bold text-sm uppercase tracking-widest mb-2 block">
              {product.category}
            </span>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              {product.name}
            </h1>
            <p className="text-3xl font-bold text-indigo-600 mb-6">
              ₹{product.price}
            </p>
            <p className="text-gray-600 leading-relaxed mb-8 text-lg">
              {product.description}
            </p>
          </div>

          <div className="space-y-6 mt-auto">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  addToCart(product);
                  toast.success('Added to cart!');
                }}
                className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-gray-100">
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-gray-50">
                <Truck className="w-6 h-6 text-indigo-600 mb-2" />
                <span className="text-xs font-bold text-gray-900">Free Shipping</span>
                <span className="text-[10px] text-gray-500">On orders over ₹1000</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-gray-50">
                <RotateCcw className="w-6 h-6 text-indigo-600 mb-2" />
                <span className="text-xs font-bold text-gray-900">30 Days Return</span>
                <span className="text-[10px] text-gray-500">No questions asked</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-gray-50">
                <ShieldCheck className="w-6 h-6 text-indigo-600 mb-2" />
                <span className="text-xs font-bold text-gray-900">Secure Payment</span>
                <span className="text-[10px] text-gray-500">100% encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
