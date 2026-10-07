"use client";

import { createContext, use, useMemo, useState, type ReactNode } from "react";
import InfoSheet, { type InfoSection } from "./InfoSheet";

interface StoreUi {
  /** Abre la hoja de horarios o la de envíos. */
  openInfo: (section: InfoSection) => void;
}

const StoreUiContext = createContext<StoreUi | null>(null);

/** Hojas de horarios y envíos: se abren desde las etiquetas de la portada. */
export function StoreUiProvider({ children }: { children: ReactNode }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoSection, setInfoSection] = useState<InfoSection>("hours");
  const value = useMemo(
    () => ({
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
      <InfoSheet show={infoOpen} onHide={() => setInfoOpen(false)} section={infoSection} />
    </StoreUiContext>
  );
}

export function useStoreUi(): StoreUi {
  const ui = use(StoreUiContext);
  if (!ui) throw new Error("useStoreUi tiene que usarse dentro de <StoreUiProvider>.");
  return ui;
}
