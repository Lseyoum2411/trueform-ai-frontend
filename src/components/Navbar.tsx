import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const Navbar: React.FC = () => {
  return (
    <nav className="border-b border-dark-border bg-dark-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/formlab-logo.png" 
              alt="FormLab" 
              width={32} 
              height={32} 
              className="object-contain w-8 h-8 md:w-8 md:h-8 w-7 h-7" 
            />
            <span className="text-xl font-bold text-white">FormLab</span>
          </Link>
          <div className="flex space-x-4">
            <Link
              href="/"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};





