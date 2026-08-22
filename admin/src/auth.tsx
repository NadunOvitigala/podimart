import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { getToken, setToken } from "./api";

type AuthCtx = {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};

const Ctx = createContext<AuthCtx>({
  token: null,
  login: () => undefined,
  logout: () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTok] = useState<string | null>(getToken());
  const value = useMemo(
    () => ({
      token,
      login: (next: string) => {
        setToken(next);
        setTok(next);
      },
      logout: () => {
        setToken(null);
        setTok(null);
      },
    }),
    [token],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
