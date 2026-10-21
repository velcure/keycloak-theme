import { readFile } from "node:fs/promises";
import accountPages from "./account-pages.json";

export type PageEntry = { type: "login" | "email" | "account"; id: string };
export const errorPages = new Set([
  "login",
  "register",
  "login-reset-password",
  "login-update-password",
  "login-otp",
]);
const names: Record<string, string> = {
  "frontchannel-logout": "Alle Anwendungen abmelden",
  "idp-review-user-profile": "Externes Profil prüfen",
  "link-idp-action": "Externes Konto verbinden",
  "login-idp-link-confirm": "Kontoverknüpfung bestätigen",
  "login-idp-link-confirm-override": "Kontoverknüpfung ersetzen",
  "login-idp-link-email": "Kontoverknüpfung per E-Mail",
  "login-oauth2-device-verify-user-code": "Gerätecode bestätigen",
  "login-oid4vp": "Mit Wallet anmelden",
  "login-passkeys-conditional-authenticate": "Passkey automatisch erkennen",
  "login-x509-info": "Zertifikatsanmeldung",
  "oid4vc-credential-offer": "Nachweis zur Wallet hinzufügen",
  "saml-post-form": "SAML-Weiterleitung",
  "verifiable-credential-offer": "Digitalen Nachweis übernehmen",

  code: "Anmeldecode",
  login: "Anmelden · kombiniert",
  register: "Konto erstellen",
  "login-reset-password": "Passwort vergessen",
  "login-update-password": "Neues Passwort",
  "login-verify-email": "E-Mail bestätigen",
  "login-username": "1 · E-Mail eingeben",
  "login-password": "2 · Mit Passwort anmelden",
  "login-otp": "Sicherheitscode",
  "login-config-totp": "Authenticator einrichten",
  "login-recovery-authn-code-config": "Wiederherstellungscodes einrichten",
  "login-recovery-authn-code-input": "Wiederherstellungscode eingeben",
  "webauthn-register": "Passkey einrichten",
  "webauthn-authenticate": "Mit Passkey anmelden",
  "webauthn-error": "Passkey-Fehler",
  "select-authenticator": "Anmeldemethode wählen",
  "login-update-profile": "Profil vervollständigen",
  "update-email": "E-Mail ändern",
  "login-page-expired": "Sitzung abgelaufen",
  "logout-confirm": "Abmelden bestätigen",
  "delete-account-confirm": "Konto löschen",
  "delete-credential": "Zugangsmittel entfernen",
  "login-reset-otp": "Authenticator zurücksetzen",
  "login-oauth-grant": "Zugriff erlauben",
  "select-organization": "Organisation wählen",
  terms: "Nutzungsbedingungen",
  info: "Bestätigung",
  error: "Fehlermeldung",
  "email-verification": "E-Mail bestätigen",
  "email-verification-with-code": "Bestätigungscode",
  "password-reset": "Passwort zurücksetzen",
  executeActions: "Konto aktualisieren",
  "email-update-confirmation": "Neue E-Mail bestätigen",
  "identity-provider-link": "Konto verknüpfen",
  "org-invite": "Organisationseinladung",
  "email-test": "Test-E-Mail",
  "event-login_error": "Fehlgeschlagene Anmeldung",
  "event-update_password": "Passwort geändert",
  "event-update_totp": "Authenticator geändert",
  "event-remove_totp": "Authenticator entfernt",
  "event-update_credential": "Zugangsmittel geändert",
  "event-remove_credential": "Zugangsmittel entfernt",
  "event-user_disabled_by_permanent_lockout": "Konto gesperrt",
  "event-user_disabled_by_temporary_lockout": "Konto vorübergehend gesperrt",
  "workflow-notification": "Kontobenachrichtigung",
};
export function label(entry: PageEntry) {
  if (entry.type === "account")
    return accountPages.find((page) => page.id === entry.id)?.label ?? entry.id;
  return names[entry.id] ?? entry.id.replaceAll("-", " ");
}
export async function catalog(): Promise<PageEntry[]> {
  const entries: PageEntry[] = JSON.parse(
    await readFile(".cache/manifest.json", "utf8"),
  );
  entries.push(
    ...accountPages.map((page) => ({ type: "account" as const, id: page.id })),
  );
  const priority = [
    "login-username",
    "login-password",
    "select-authenticator",
    "login",
    "register",
    "login-reset-password",
    "login-verify-email",
    "login-otp",
    "login-config-totp",
    "password-reset",
    "email-verification",
  ];
  return entries.sort(
    (a, b) =>
      (priority.includes(a.id) ? priority.indexOf(a.id) : 99) -
        (priority.includes(b.id) ? priority.indexOf(b.id) : 99) ||
      label(a).localeCompare(label(b), "de"),
  );
}
