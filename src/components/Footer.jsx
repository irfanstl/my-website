import React from 'react';
import { ShoppingBag, Github, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-indigo-600 p-2 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-gray-900 tracking-tighter">NEXUS</span>
            </Link>
            <p className="text-gray-500 leading-relaxed">
              Experience the future of shopping with Nexus. We bring you the most curated collection of premium products with a seamless experience.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-gray-900 font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-gray-500 hover:text-indigo-600 transition-colors">Home</Link></li>
              <li><Link to="/cart" className="text-gray-500 hover:text-indigo-600 transition-colors">Cart</Link></li>
              <li><Link to="/admin" className="text-gray-500 hover:text-indigo-600 transition-colors">Admin Dashboard</Link></li>
              <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-gray-900 font-bold mb-6">Categories</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Electronics</a></li>
              <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Fashion</a></li>
              <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Home & Living</a></li>
              <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Beauty & Health</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-gray-900 font-bold mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-center text-gray-500">
                <Mail className="w-5 h-5 mr-3 text-indigo-600" />
                support@nexus.com
              </li>
              <li className="flex items-center text-gray-500">
                <Phone className="w-5 h-5 mr-3 text-indigo-600" />
                +1 (555) 000-0000
              </li>
              <li className="flex items-center text-gray-500">
                <MapPin className="w-5 h-5 mr-3 text-indigo-600" />
                123 Innovation Way, Tech City
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Nexus E-Commerce. All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4 opacity-50 grayscale hover:grayscale-0 transition-all" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4 opacity-50 grayscale hover:grayscale-0 transition-all" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6 opacity-50 grayscale hover:grayscale-0 transition-all" />
          </div>
        </div>
      </div>
    </footer>
  );
};
