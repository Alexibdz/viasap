"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { Search, XLg } from "react-bootstrap-icons";
import { formatMoney, normalizeText } from "@/lib/format";
import type { SearchEntry } from "@/lib/types";
import { useStore } from "./StoreProvider";

const MAX_RESULTS = 40;

function Highlight({ text, term }: { text: string; term: string }) {
  const start = normalizeText(text).indexOf(term);
  if (start < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, start)}
      <mark>{text.slice(start, start + term.length)}</mark>
      {text.slice(start + term.length)}
    </>
  );
}

interface SearchSheetProps {
  show: boolean;
  onHide: () => void;
  index: SearchEntry[];
  categories: { id: string; name: string }[];
}

export default function SearchSheet({ show, onHide, index, categories }: SearchSheetProps) {
  const { slug } = useStore();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const haystacks = useMemo(
    () => index.map((entry) => normalizeText(`${entry.name} ${entry.description ?? ""} ${entry.categoryName}`)),
    [index],
  );
  const term = normalizeText(query.trim());
  const results = term.length < 2 ? [] : index.filter((_, i) => haystacks[i].includes(term)).slice(0, MAX_RESULTS);

  function jumpTo(categoryId: string) {
    onHide();
    const section = document.getElementById(`c-${categoryId}`);
    if (section) window.setTimeout(() => section.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    else router.push(`/${slug}#c-${categoryId}`);
  }

  return (
    <Modal show={show} onHide={onHide} onExited={() => setQuery("")} fullscreen className="search-modal">
      <div className="search-top">
        <label className="search-field">
          <Search size={18} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="¿Qué tenés ganas de comer?"
            aria-label="Buscar en el menú"
            autoFocus
          />
          {query && (
            <button type="button" aria-label="Borrar búsqueda" onClick={() => setQuery("")}>
              <XLg size={14} />
            </button>
          )}
        </label>
        <button type="button" className="search-cancel" onClick={onHide}>
          Cancelar
        </button>
      </div>

      <div className="search-body">
        {term.length < 2 ? (
          <>
            <p className="eyebrow">Ir a una categoría</p>
            <div className="tags">
              {categories.map((category) => (
                <button key={category.id} type="button" className="tag tag--button" onClick={() => jumpTo(category.id)}>
                  {category.name}
                </button>
              ))}
            </div>
          </>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <Search size={28} aria-hidden />
            <p>
              No encontramos nada para <strong>“{query.trim()}”</strong>.
            </p>
          </div>
        ) : (
          <ul className="search-results">
            {results.map((entry) => (
              <li key={entry.productId}>
                <Link
                  href={`/${slug}/producto/${entry.productId}`}
                  scroll={false}
                  className={`search-result${entry.soldOut ? " is-soldout" : ""}`}
                  onClick={onHide}
                >
                  <span className="search-result-media">
                    {entry.imageUrl ? (
                      <Image src={entry.imageUrl} alt="" fill sizes="52px" />
                    ) : (
                      <span className="product-card-initial" aria-hidden>
                        {entry.name.charAt(0)}
                      </span>
                    )}
                  </span>
                  <span className="search-result-text">
                    <span className="search-result-name">
                      <Highlight text={entry.name} term={term} />
                    </span>
                    <small>{entry.soldOut ? "Agotado" : entry.categoryName}</small>
                  </span>
                  <span className="search-result-price">
                    {entry.hasVariants && <small>desde </small>}
                    {formatMoney(entry.priceFrom)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
