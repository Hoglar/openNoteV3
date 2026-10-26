import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type DemoSession = {
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
};

const DemoSessionContext = createContext<DemoSession | null>(null);

// Prototype only: this state grants no access and is deliberately not persisted.
export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);

  return (
    <DemoSessionContext.Provider value={{
      isSignedIn,
      signIn: () => setIsSignedIn(true),
      signOut: () => setIsSignedIn(false),
    }}>
      {children}
    </DemoSessionContext.Provider>
  );
}

export function useDemoSession() {
  const session = useContext(DemoSessionContext);
  if (!session) throw new Error('DemoSessionProvider is missing');
  return session;
}
