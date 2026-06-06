# Templates de email (Supabase Auth)

## ¿Para qué sirven?

O2 PRODE manda 2 mails automáticos desde Supabase:

1. **Confirmar cuenta** — cuando un socio se registra, le llega un mail con un botón
   para activar la cuenta. Hasta que no lo confirma, no puede entrar (esto evita
   registros con mails truchos / spam).
2. **Recuperar contraseña** — cuando un socio toca "¿Olvidaste tu contraseña?",
   le llega un mail con un botón para elegir una nueva.

Los dos botones apuntan a la ruta `/auth/confirm` de la app, que valida el token
y deja entrar (o manda a elegir contraseña nueva). Por eso el `href` del botón
**no se puede cambiar** — el diseño del resto sí.

## Cómo cargarlos (una sola vez)

1. Supabase → tu proyecto → **Authentication** → **URL Configuration**:
   - **Site URL**: tu dominio de Vercel (ej. `https://o2-prode.vercel.app`).
   - **Redirect URLs**: agregá `https://o2-prode.vercel.app/**`.
2. **Authentication** → **Emails** → **Templates**:
   - Pestaña **Confirm signup** → pegá el Subject + HTML de abajo.
   - Pestaña **Reset Password** → pegá el Subject + HTML de abajo.

> `{{ .SiteURL }}` y `{{ .TokenHash }}` los reemplaza Supabase solo. No hace falta
> escribir tu dominio dentro del HTML.

---

## 1) Confirm signup

**Subject:**

```
Confirmá tu cuenta — O2 PRODE
```

**Message body (HTML):**

```html
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0a0a0c;margin:0;padding:24px 0;font-family:Helvetica,Arial,sans-serif;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:480px;background:#141417;border:1px solid #26262b;border-radius:16px;overflow:hidden;">
      <tr><td style="padding:32px 32px 0;">
        <span style="font-size:34px;font-weight:800;color:#FF6A00;">O2</span><span style="font-size:13px;color:#888;letter-spacing:3px;font-weight:700;"> PRODE</span>
      </td></tr>
      <tr><td style="padding:16px 32px 0;">
        <h1 style="margin:0;font-size:24px;line-height:1.25;color:#ffffff;font-weight:800;">Bienvenido a O2 PRODE</h1>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.55;color:#b4b4b8;">Activá tu cuenta para empezar a predecir el Mundial 2026 y competir con los socios del club.</p>
      </td></tr>
      <tr><td style="padding:28px 32px 0;">
        <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup" style="display:block;background:#D9FF3F;color:#0a0a0c;font-size:16px;font-weight:800;text-decoration:none;text-align:center;padding:16px;border-radius:12px;">Confirmar mi cuenta</a>
      </td></tr>
      <tr><td style="padding:20px 32px 32px;">
        <p style="margin:0;font-size:12px;line-height:1.5;color:#6b6b70;">Si no te registraste en O2 PRODE, ignorá este mail.</p>
        <p style="margin:16px 0 0;font-size:11px;color:#FFB300;letter-spacing:1px;font-weight:700;">#PRODEMUNDIALO2</p>
      </td></tr>
    </table>
  </td></tr>
</table>
```

---

## 2) Reset Password

**Subject:**

```
Recuperá tu contraseña — O2 PRODE
```

**Message body (HTML):**

```html
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0a0a0c;margin:0;padding:24px 0;font-family:Helvetica,Arial,sans-serif;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:480px;background:#141417;border:1px solid #26262b;border-radius:16px;overflow:hidden;">
      <tr><td style="padding:32px 32px 0;">
        <span style="font-size:34px;font-weight:800;color:#FF6A00;">O2</span><span style="font-size:13px;color:#888;letter-spacing:3px;font-weight:700;"> PRODE</span>
      </td></tr>
      <tr><td style="padding:16px 32px 0;">
        <h1 style="margin:0;font-size:24px;line-height:1.25;color:#ffffff;font-weight:800;">Recuperar contraseña</h1>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.55;color:#b4b4b8;">Pediste cambiar tu contraseña. Tocá el botón para elegir una nueva. El link vence en 1 hora.</p>
      </td></tr>
      <tr><td style="padding:28px 32px 0;">
        <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password" style="display:block;background:#D9FF3F;color:#0a0a0c;font-size:16px;font-weight:800;text-decoration:none;text-align:center;padding:16px;border-radius:12px;">Cambiar mi contraseña</a>
      </td></tr>
      <tr><td style="padding:20px 32px 32px;">
        <p style="margin:0;font-size:12px;line-height:1.5;color:#6b6b70;">Si no pediste esto, ignorá este mail: tu contraseña sigue igual.</p>
        <p style="margin:16px 0 0;font-size:11px;color:#FFB300;letter-spacing:1px;font-weight:700;">#PRODEMUNDIALO2</p>
      </td></tr>
    </table>
  </td></tr>
</table>
```
