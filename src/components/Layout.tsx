import React from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-dark-bg dark bg-background">
      <Navbar />
      <main className="w-full">
        {children}
      </main>
    </div>
  );
};






