import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { GestaoProvider } from './GestaoContext';
import { SessaoAtivaProvider } from './SessaoAtivaContext';

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <GestaoProvider>
        <SessaoAtivaProvider>
          {children}
        </SessaoAtivaProvider>
      </GestaoProvider>
    </AuthProvider>
  );
};
