import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const Navbar: React.FC = () => {
  return (
    <nav className="border-b border-dark-border bg-dark-surface">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3">
            <Image 
              src="/formlab-logo.png" 
              alt="FormLab logo" 
              width={56} 
              height={56} 
              className="h-12 w-auto md:h-14 md:w-auto"
            />
            <span className="text-xl font-semibold text-white">FormLab</span>
          </Link>
          <div className="flex space-x-6">
            <Link
              href="/"
              className="text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors duration-200"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
