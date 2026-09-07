import React from 'react';

export function VaultIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <img 
      src="/TackleVault.svg" 
      alt="Tackle Vault Logo" 
      className={className} 
    />
  );
}