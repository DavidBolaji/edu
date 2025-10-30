import { createContext, PropsWithChildren, useState, useContext } from 'react';

const WalletContext = createContext<{
  isAmountVisible: boolean;
  toggleVisible: () => void;
}>({
  isAmountVisible: false,
  toggleVisible() {
    return null;
  },
});

export const WalletProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [isAmountVisible, setIsAmountVisible] = useState(false);
  const toggleVisible = () => setIsAmountVisible((prev) => !prev);

  return (
    <WalletContext.Provider value={{ isAmountVisible, toggleVisible }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => useContext(WalletContext);
