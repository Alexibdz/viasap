"use client";

import { createContext, use, useMemo, useState, type ReactNode } from "react";
import type { SearchEntry } from "@/lib/types";
import InfoSheet from "./InfoSheet";
import SearchSheet from "./SearchSheet";

interface StoreUi {
  openSearch: () => void;
  openInfo: () => void;
}

const StoreUiContext = createContext<StoreUi | null>(null);

interface StoreUiProviderProps {
  children: ReactNode;
  searchIndex: SearchEntry[];
  categories: { id: string; name: string }[];
}

/** Buscador e información del local: se abren desde cualquier parte de la tienda. */
export function StoreUiProvider({ children, searchIndex, categories }: StoreUiProviderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const value = useMemo(() => ({ openSearch: () => setSearchOpen(true), openInfo: () => setInfoOpen(true) }), []);

  return (
    <StoreUiContext value={value}>
      {children}
      <SearchSheet
        show={searchOpen}
        onHide={() => setSearchOpen(false)}
        index={searchIndex}
        categories={categories}
      />
      <InfoSheet show={infoOpen} onHide={() => setInfoOpen(false)} />
    </StoreUiContext>
  );
}

export function useStoreUi(): StoreUi {
  const ui = use(StoreUiContext);
  if (!ui) throw new Error("useStoreUi tiene que usarse dentro de <StoreUiProvider>.");
  return ui;
}
