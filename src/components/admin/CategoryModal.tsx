"use client";

import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import { PlusLg, Trash3 } from "react-bootstrap-icons";
import { deleteCategory, saveCategory } from "@/app/admin/actions";
import { useToast } from "@/components/store/ToastProvider";
import { withoutErrors, type CategoryDraft, type FieldErrors } from "@/lib/admin-forms";
import ImageField from "./ImageField";
import { Field, Switch } from "./ui";

/** Los más comunes en una rotisería, para elegir con un toque. */
const EMOJI_PICKS = ["🍕", "🍔", "🥖", "🥟", "🍗", "🍳", "🥩", "🍟", "🥗", "🍝", "🍮", "🔥"];

function CategoryForm({ initial, onDone }: { initial: CategoryDraft; onDone: () => void }) {
  const notify = useToast();
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const isNew = !initial.id;

  // Al editar un campo se borra su error (agregar o quitar grupos borra los de todos).
  const update = (patch: Partial<CategoryDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setErrors((current) => withoutErrors(current, Object.keys(patch)));
  };
  const setGroup = (index: number, name: string) => {
    setDraft((d) => ({ ...d, groups: d.groups.map((g, i) => (i === index ? { ...g, name } : g)) }));
    setErrors((current) => withoutErrors(current, [`groups.${index}.name`]));
  };

  async function save() {
    setSaving(true);
    const result = await saveCategory(draft);
    setSaving(false);
    if (result.ok) {
      notify(isNew ? "Categoría creada" : "Categoría guardada");
      onDone();
    } else {
      setErrors(result.errors ?? {});
      if (result.error) notify(result.error);
    }
  }

  async function remove() {
    if (!initial.id || !window.confirm(`¿Borrar la categoría "${initial.name}"?`)) return;
    const result = await deleteCategory(initial.id);
    if (result.ok) {
      notify("Categoría borrada");
      onDone();
    } else {
      notify(result.error ?? "No se pudo borrar.");
    }
  }

  return (
    <>
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="adm-modal-title">
          {isNew ? "Nueva categoría" : "Editar categoría"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="adm-modal-body">
        <div className="adm-grid-emoji">
          <Field label="Emoji" htmlFor="cat-emoji" error={errors.emoji}>
            <input
              id="cat-emoji"
              className="adm-input adm-input--emoji"
              value={draft.emoji}
              maxLength={24}
              placeholder="🥟"
              onChange={(e) => update({ emoji: e.target.value })}
            />
          </Field>
          <Field label="Nombre" htmlFor="cat-name" error={errors.name}>
            <input
              id="cat-name"
              className="adm-input"
              value={draft.name}
              maxLength={40}
              placeholder="Ej: Empanadas"
              onChange={(e) => update({ name: e.target.value })}
            />
          </Field>
        </div>
        <div className="adm-chips adm-emoji-picks" aria-label="Emojis sugeridos">
          {EMOJI_PICKS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={`adm-chip${draft.emoji === emoji ? " is-on" : ""}`}
              aria-label={`Usar ${emoji}`}
              onClick={() => update({ emoji: draft.emoji === emoji ? "" : emoji })}
            >
              {emoji}
            </button>
          ))}
        </div>
        <Field label="Foto de la categoría" hint="Opcional. Se ve en la lista del menú del panel.">
          <ImageField value={draft.imageUrl} onChange={(imageUrl) => update({ imageUrl })} shape="wide" />
        </Field>
        <div className="adm-switches">
          <Switch
            checked={draft.expanded}
            onChange={(expanded) => update({ expanded })}
            label="Desplegada al entrar"
            description="La tienda la muestra abierta, con los productos a la vista. Si no, arranca cerrada."
          />
          <Switch
            checked={draft.offers}
            onChange={(offers) => update({ offers })}
            label="Categoría de ofertas"
            description="No se muestra como categoría: sus productos van arriba, en el carrusel de ofertas, y se arman con el armador de ofertas."
          />
          <Switch
            checked={draft.hideNotes}
            onChange={(hideNotes) => update({ hideNotes })}
            label="Sin aclaraciones"
            description="El cliente no ve el campo «¿Alguna aclaración?» en estos productos. Ideal para bebidas."
          />
        </div>
        <Field
          label="Grupos"
          hint="Opcional: separan la categoría en subtítulos (por ejemplo, De carne / De pollo). Con un solo grupo no se muestra ningún subtítulo."
          error={errors.groups}
        >
          <div className="adm-rows">
            {draft.groups.map((group, index) => (
              <div key={group.id ?? `nuevo-${index}`} className="adm-row">
                <input
                  className="adm-input"
                  aria-label={`Grupo ${index + 1}`}
                  placeholder={draft.groups.length === 1 ? "Opcional" : "Ej: De pollo"}
                  value={group.name}
                  maxLength={40}
                  onChange={(e) => setGroup(index, e.target.value)}
                />
                <button
                  type="button"
                  className="adm-icon-btn"
                  aria-label="Quitar grupo"
                  disabled={draft.groups.length === 1}
                  onClick={() => update({ groups: draft.groups.filter((_, i) => i !== index) })}
                >
                  <Trash3 />
                </button>
                {errors[`groups.${index}.name`] && <p className="adm-error adm-row-error">{errors[`groups.${index}.name`]}</p>}
              </div>
            ))}
            <button
              type="button"
              className="adm-btn adm-btn--dashed"
              onClick={() => update({ groups: [...draft.groups, { id: null, name: "" }] })}
            >
              <PlusLg aria-hidden /> Agregar grupo
            </button>
          </div>
        </Field>
      </Modal.Body>
      <Modal.Footer className="adm-modal-foot">
        {!isNew && (
          <button type="button" className="adm-btn adm-btn--ghost-danger me-auto" onClick={remove}>
            <Trash3 aria-hidden /> Borrar
          </button>
        )}
        <button type="button" className="adm-btn adm-btn--primary" onClick={save} disabled={saving}>
          {saving ? "Guardando…" : isNew ? "Crear categoría" : "Guardar"}
        </button>
      </Modal.Footer>
    </>
  );
}

export default function CategoryModal({ draft, onClose }: { draft: CategoryDraft | null; onClose: () => void }) {
  return (
    <Modal show={draft !== null} onHide={onClose} centered className="adm-modal">
      {draft && <CategoryForm key={draft.id ?? "nueva"} initial={draft} onDone={onClose} />}
    </Modal>
  );
}
