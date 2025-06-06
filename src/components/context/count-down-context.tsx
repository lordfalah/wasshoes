import { createContext, ReactNode, useContext } from "react";

// Definisikan tipe untuk Context Value
interface CountdownContextType {
  countdownFromDate: Date;
}

// Buat Context
const CountdownContext = createContext<CountdownContextType | undefined>(
  undefined,
);

// Buat Provider Component
interface CountdownProviderProps {
  children: ReactNode;
  countdownFromDate: Date; // Ini akan menerima fullDate dari ShiftingCountdown
}

export const CountdownProvider: React.FC<CountdownProviderProps> = ({
  children,
  countdownFromDate,
}) => {
  return (
    <CountdownContext.Provider value={{ countdownFromDate }}>
      {children}
    </CountdownContext.Provider>
  );
};

// Buat custom hook untuk menggunakan Context
export const useCountdown = () => {
  const context = useContext(CountdownContext);
  if (context === undefined) {
    throw new Error("useCountdown must be used within a CountdownProvider");
  }
  return context;
};
