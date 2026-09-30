import { createContext, useCallback, useContext, useState } from "react";

const CallContext = createContext(null);

export function CallProvider({ children }) {
  const [incomingCall, setIncomingCallState] = useState(null);
  const [activeCall, setActiveCallState] = useState(null);

  const setIncomingCall = useCallback((data) => setIncomingCallState(data), []);
  const clearIncomingCall = useCallback(() => setIncomingCallState(null), []);
  const setActiveCall = useCallback((data) => setActiveCallState(data), []);
  const clearActiveCall = useCallback(() => setActiveCallState(null), []);

  return (
    <CallContext.Provider
      value={{
        incomingCall,
        activeCall,
        setIncomingCall,
        clearIncomingCall,
        setActiveCall,
        clearActiveCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCallContext() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCallContext must be used inside <CallProvider>");
  return ctx;
}
