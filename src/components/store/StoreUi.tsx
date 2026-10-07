"use client";

import { createContext, use, useMemo, useState, type ReactNode } from "react";
import type { SearchEntry } from "@/lib/types";
import InfoSheet, { type InfoSection } from "./InfoSheet";
import SearchSheet from "./SearchSheet";

interface StoreUi {
  openSearch: () => void;
  /** Abre la hoja de horarios o la de envíos. */
  openInfo: (section: InfoSection) => void;
}

const StoreUiContext = createContext<StoreUi | null>(null);

interface StoreUiProviderProps {
  children: ReactNode;
  searchIndex: SearchEntry[];
  categories: { id: string; name: string }[];
}

/** Buscador, horarios y envíos: se abren desde cualquier parte de la tienda. */
export function StoreUiProvider({ children, searchIndex, categories }: StoreUiProviderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoSection, setInfoSection] = useState<InfoSection>("hours");
  const value = useMemo(
    () => ({
      openSearch: () => setSearchOpen(true),
      openInfo: (section: InfoSection) => {
        setInfoSection(section);
        setInfoOpen(true);
      },
    }),
    [],
  );

  return (
    <StoreUiContext value={value}>
      {children}
      <SearchSheet
        show={searchOpen}
        onHide={() => setSearchOpen(false)}
        index={searchIndex}
        categories={categories}
      />
      <InfoSheet show={infoOpen} onHide={() => setInfoOpen(false)} section={infoSection} />
    </StoreUiContext>
  );
}

export function useStoreUi(): StoreUi {
  const ui = use(StoreUiContext);
  if (!ui) throw new Error("useStoreUi tiene que usarse dentro de <StoreUiProvider>.");
  return ui;
}
