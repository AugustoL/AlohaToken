import React, { createContext, useState, ReactNode } from 'react';

interface IAppContext {
  loadingNavbar: boolean;
  loadingApp: boolean;
  setLoadingNavbar: (value: boolean) => void;
  setLoadingApp: (value: boolean) => void;
}

export const AppContext = createContext<IAppContext>({
  loadingNavbar: true,
  loadingApp: true,
  setLoadingNavbar: () => {},
  setLoadingApp: () => {},
});

export const ContextProvider = ({ children }: { children: ReactNode }) => {
  const [loadingNavbar, setLoadingNavbar] = useState<boolean>(true);
  const [loadingApp, setLoadingApp] = useState<boolean>(true);

  return (
    <AppContext.Provider value={{ loadingNavbar, loadingApp, setLoadingNavbar, setLoadingApp }}>
      {children}
    </AppContext.Provider>
  );
};
