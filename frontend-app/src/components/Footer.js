// src/components/Footer.js

import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white text-center py-12 mt-20 border-t border-blue-800">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
            N
          </div>
          <span className="text-xl font-bold text-white">
            NextGen Doctor
          </span>
        </div>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full mx-auto mb-6"></div>
        <p className="text-blue-200 mb-4 max-w-md mx-auto">
          Transforming healthcare with innovative technology and compassionate
          care.
        </p>
        <p className="text-sm text-blue-300">
          © {new Date().getFullYear()} NextGen Doctor. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
