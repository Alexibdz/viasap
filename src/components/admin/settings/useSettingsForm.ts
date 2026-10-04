"use client";

import { useState } from "react";
import type { ActionResult } from "@/app/admin/actions";
import { useToast } from "@/components/store/ToastProvider";
import { withoutErrors, type FieldErrors } from "@/lib/admin-forms";

/** Estado de un formulario de ajustes: valores, errores por campo y guardado. */
export function useSettingsForm<T extends object>(
  initial: T,
  action: (value: T) => Promise<ActionResult>,
  successMessage = "Cambios guardados",
) {
  const notify = useToast();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const result = await action(value);
    setSaving(false);
    if (result.ok) {
      setSaved(value);
      setErrors({});
      notify(successMessage);
    } else {
      setErrors(result.errors ?? {});
      notify(result.error ?? "Revisá los campos marcados.");
    }
  }

  return {
    value,
    setValue,
    /** Cambia campos y borra sus errores ("address" también borra "address.street"). */
    update: (patch: Partial<T>) => {
      setValue((current) => ({ ...current, ...patch }));
      setErrors((current) => withoutErrors(current, Object.keys(patch)));
    },
    errors,
    saving,
    dirty: JSON.stringify(value) !== JSON.stringify(saved),
    save,
  };
}
