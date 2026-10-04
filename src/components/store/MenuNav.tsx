"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "react-bootstrap-icons";
import { useStoreUi } from "./StoreUi";

const sectionId = (id: string) => `c-${id}`;

/** Pestañas fijas con las categorías; marcan la sección que se está viendo. */
export default function MenuNav({ sections }: { sections: { id: string; name: string }[] }) {
  const { openSearch } = useStoreUi();
  const [active, setActive] = useState(sections[0]?.id);
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollingByClick = useRef(false);
  const scrollTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting));
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // La sección activa es la última cuyo título ya pasó por debajo de las pestañas.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (scrollingByClick.current) return;
      const line = (navRef.current?.getBoundingClientRect().bottom ?? 0) + 24;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = sections[0]?.id;
      for (const section of sections) {
        const element = document.getElementById(sectionId(section.id));
        if (element && (atBottom || element.getBoundingClientRect().top <= line)) current = section.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, [sections]);

  useEffect(() => {
    const tabs = tabsRef.current;
    const tab = tabs?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (!tabs || !tab) return;
    tabs.scrollTo({ left: tab.offsetLeft - tabs.clientWidth / 2 + tab.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  function jump(id: string) {
    setActive(id);
    // Durante el scroll suave no recalculamos la pestaña activa.
    scrollingByClick.current = true;
    window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => {
      scrollingByClick.current = false;
    }, 900);
    document.getElementById(sectionId(id))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <div ref={sentinelRef} aria-hidden />
      <nav ref={navRef} className={`menu-nav${stuck ? " is-stuck" : ""}`} aria-label="Categorías del menú">
        <div className="menu-nav-inner">
          <div className="menu-tabs" ref={tabsRef}>
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                data-tab={section.id}
                className={`menu-tab${active === section.id ? " is-active" : ""}`}
                aria-current={active === section.id ? "true" : undefined}
                onClick={() => jump(section.id)}
              >
                {section.name}
              </button>
            ))}
          </div>
          <button type="button" className="menu-nav-search" aria-label="Buscar en el menú" onClick={openSearch}>
            <Search size={17} />
          </button>
        </div>
      </nav>
    </>
  );
}
