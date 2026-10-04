"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Camera, Upload } from "react-bootstrap-icons";
import { uploadImage } from "@/app/admin/actions";
import { shrinkImage } from "@/lib/image-resize";

interface ImageFieldProps {
  value: string;
  onChange: (url: string) => void;
  /** square: productos y logo; wide: portada. */
  shape?: "square" | "wide";
  label?: string;
}

export default function ImageField({ value, onChange, shape = "square", label = "foto" }: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("file", await shrinkImage(file), "foto");
      const result = await uploadImage(data);
      if (result.ok) onChange(result.url);
      else setError(result.error);
    } catch {
      setError("No pudimos procesar la foto. Probá con otra.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={`adm-image adm-image--${shape}`}>
      <div className="adm-image-preview">
        {value ? (
          <Image src={value} alt="" fill sizes="(max-width: 600px) 60vw, 280px" />
        ) : (
          <span className="adm-image-empty">
            <Camera size={22} aria-hidden />
            Sin {label}
          </span>
        )}
      </div>
      <div className="adm-image-actions">
        <button type="button" className="adm-btn" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload aria-hidden /> {uploading ? "Subiendo…" : value ? "Cambiar" : `Subir ${label}`}
        </button>
        {value && (
          <button type="button" className="adm-btn adm-btn--ghost-danger" onClick={() => onChange("")} disabled={uploading}>
            Quitar
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
      </div>
      {error && (
        <p className="adm-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
