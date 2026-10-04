"use client";

import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import { PlusLg, Trash3 } from "react-bootstrap-icons";
import { deleteCategory, saveCategory } from "@/app/admin/actions";
import { useToast } from "@/components/store/ToastProvider";
import type { CategoryDraft, FieldErrors } from "@/lib/admin-forms";
import ImageField from "./ImageField";
import { Field } from "./ui";

function CategoryForm({ initial, onDone }: { initial: CategoryDraft; onDone: () => void }) {
  const notify = useToast();
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const isNew = !initial.id;

  const setGroup = (index: number, name: string) =>
    setDraft((d) => ({ ...d, groups: d.groups.map((g, i) => (i === index ? { ...g, name } : g)) }));

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
        <Field label="Nombre" htmlFor="cat-name" error={errors.name}>
          <input
            id="cat-name"
            className="adm-input"
            value={draft.name}
            maxLength={40}
            placeholder="Ej: Empanadas"
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </Field>
        <Field label="Foto de la categoría" hint="Se usa en el buscador y al compartir.">
          <ImageField value={draft.imageUrl} onChange={(imageUrl) => setDraft((d) => ({ ...d, imageUrl }))} shape="wide" />
        </Field>
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
                  value={group.name}
                  maxLength={40}
                  onChange={(e) => setGroup(index, e.target.value)}
                />
                <button
                  type="button"
                  className="adm-icon-btn"
                  aria-label="Quitar grupo"
                  disabled={draft.groups.length === 1}
                  onClick={() => setDraft((d) => ({ ...d, groups: d.groups.filter((_, i) => i !== index) }))}
                >
                  <Trash3 />
                </button>
                {errors[`groups.${index}.name`] && <p className="adm-error adm-row-error">{errors[`groups.${index}.name`]}</p>}
              </div>
            ))}
            <button
              type="button"
              className="adm-btn adm-btn--dashed"
              onClick={() => setDraft((d) => ({ ...d, groups: [...d.groups, { id: null, name: "" }] }))}
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
