import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ProductMenuActions = {
  shopHref: string;
  shopLabel: string;
  chatHref?: string;
  orderHref: string;
};

type ProductActionsContextValue = {
  actions: ProductMenuActions | null;
  setActions: (actions: ProductMenuActions | null) => void;
};

const ProductActionsContext = createContext<ProductActionsContextValue | null>(null);

export function ProductActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ProductMenuActions | null>(null);
  const value = useMemo(() => ({ actions, setActions }), [actions]);
  return (
    <ProductActionsContext.Provider value={value}>{children}</ProductActionsContext.Provider>
  );
}

export function useProductActions() {
  const ctx = useContext(ProductActionsContext);
  if (!ctx) {
    throw new Error("useProductActions must be used within ProductActionsProvider");
  }
  return ctx;
}

/** Register product Shop / Chat / Order links in the site menu while this page is open. */
export function useRegisterProductActions(actions: ProductMenuActions | null) {
  const { setActions } = useProductActions();
  const shopHref = actions?.shopHref ?? "";
  const shopLabel = actions?.shopLabel ?? "";
  const chatHref = actions?.chatHref ?? "";
  const orderHref = actions?.orderHref ?? "";
  const active = Boolean(actions);

  useEffect(() => {
    if (!active) {
      setActions(null);
      return;
    }
    setActions({
      shopHref,
      shopLabel,
      chatHref: chatHref || undefined,
      orderHref,
    });
    return () => setActions(null);
  }, [active, shopHref, shopLabel, chatHref, orderHref, setActions]);
}
