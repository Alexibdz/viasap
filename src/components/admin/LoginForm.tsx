"use client";

import { useActionState, useState } from "react";
import { BellFill, ChatDots, Eye, EyeSlash, JournalText, Receipt } from "react-bootstrap-icons";
import { login, type LoginState } from "@/app/admin/actions";

export default function LoginForm({ showDemo }: { showDemo: boolean }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="adm-login">
      <section className="adm-login-brand">
        <span className="adm-brand">
          <ChatDots aria-hidden /> viasap
        </span>
        <h1 className="adm-login-title">El panel de tu local</h1>
        <ul className="adm-login-points">
          <li>
            <BellFill aria-hidden /> Te avisa cuando entra un pedido
          </li>
          <li>
            <Receipt aria-hidden /> Confirmás y avisás por WhatsApp en un toque
          </li>
          <li>
            <JournalText aria-hidden /> Cambiás precios y marcás lo agotado al instante
          </li>
        </ul>
      </section>

      <section className="adm-login-card">
        <h2 className="adm-login-heading">Ingresá</h2>
        <form action={formAction} className="adm-login-form">
          <div className="adm-field">
            <label className="adm-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="adm-input"
              autoComplete="username"
              defaultValue={state.email}
              required
            />
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor="password">
              Contraseña
            </label>
            <div className="adm-password">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="adm-input"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeSlash /> : <Eye />}
              </button>
            </div>
          </div>
          {state.error && (
            <p className="adm-error" role="alert">
              {state.error}
            </p>
          )}
          <button type="submit" className="adm-btn adm-btn--primary adm-btn--block" disabled={pending}>
            {pending ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
        {showDemo && (
          <p className="adm-login-demo">
            Para probar: <strong>admin@doblequeso.demo</strong> o <strong>admin@laesquina.demo</strong>, contraseña{" "}
            <strong>demo1234</strong>.
          </p>
        )}
      </section>
    </div>
  );
}
