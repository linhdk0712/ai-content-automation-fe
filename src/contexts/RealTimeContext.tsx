// RealTimeContext - cleaned version
// This file can be removed or used for alternative realtime implementation

import React, { createContext, ReactNode, useContext, useMemo } from 'react';

interface RealTimeContextType {
  // Placeholder for future realtime implementation
}

const RealTimeContext = createContext<RealTimeContextType | null>(null);

export const useSupabase = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useSupabase must be used within a RealTimeProvider');
  }
  return context;
};

export const RealTimeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const contextValue = useMemo(() => ({}), []);
  
  return (
    <RealTimeContext.Provider value={contextValue}>
      {children}
    </RealTimeContext.Provider>
  );
};

// Backward compatibility aliases
export { RealTimeContext as SupabaseContext, RealTimeProvider as SupabaseProvider, useSupabase as useRealTimeContext };
