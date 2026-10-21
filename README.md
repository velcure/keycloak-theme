# Velcure Keycloak Theme

[![CI](https://github.com/velcure/keycloak-theme/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/velcure/keycloak-theme/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/velcure/keycloak-theme)](https://github.com/velcure/keycloak-theme/releases)

[Velcure](https://www.velcure.de) · [Container auf GHCR](https://github.com/velcure/keycloak-theme/pkgs/container/keycloak-theme) · [Releases und Theme-JAR](https://github.com/velcure/keycloak-theme/releases)

Native Login-, Account- und E-Mail-Themes im Velcure-Branding. Das Astro-SSR-Studio zeigt 40 serverseitig gerenderte Login-Seiten, 18 E-Mail-Typen und neun native Account-Ansichten mit isolierten Testdaten, Deutsch/Englisch und Mobilansicht. Login-Seiten enthalten außerdem Fehlerzustände.

## Lokal prüfen

Node.js 26, pnpm 12.14.0 und JDK 17+ (CI: JDK 25).

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm render
pnpm dev
```

Studio: <http://127.0.0.1:4321>. Der Einstieg entspricht dem Core-Flow: zuerst E-Mail, danach Passwort oder Passkey, bei Bedarf zusätzliche MFA. Der kombinierte Login bleibt als eigenständige Theme-Seite prüfbar. Die Vorschau führt keine echte Anmeldung aus und versendet keine E-Mails. Einzelansichten verwenden dieselben Templates und Ressourcen wie die eingebettete Vorschau.

## Echte Keycloak-Abläufe und E-Mails

```sh
docker compose up -d --build
```

- Keycloak: <http://127.0.0.1:8082>
- Mailpit: <http://127.0.0.1:8026>
- Anmelden: <http://127.0.0.1:8082/realms/velcure-preview/protocol/openid-connect/auth?client_id=theme-preview&redirect_uri=http%3A%2F%2F127.0.0.1%3A4321%2F&response_type=code&scope=openid&acr_values=1>
- Ausschließlich lokale Testdaten: `alex@beispiel.invalid` / `preview-only-change-me`.
- Test-Administration: `preview-admin` / `preview-only-change-me`.

Die Instanz nutzt ein eigenes Compose-Projekt. Sie verändert keine Core-Instanz. `docker compose down` beendet die Testdienste; das lokale Realm ist danach wieder aus der Fixture reproduzierbar. E-Mails landen ausschließlich im lokalen Mailpit.

## Prüfen und paketieren

```sh
pnpm render
pnpm check
pnpm build
pnpm build:theme
pnpm exec playwright install chromium
pnpm test:e2e
```

- Biome übernimmt Formatierung und Linting. ESLint ist nicht enthalten.
- TypeScript prüft die Server-Routen; Astro kompiliert die Seiten.
- FreeMarker rendert alle Vorlagen mit der von Keycloak verwendeten Engine.
- Tests prüfen Template-Erhalt, Fehlerzustände, Formularfelder und funktionsfähige Text-E-Mail-Links.
- Browser-Tests prüfen SSR ohne JavaScript, Passwortsichtbarkeit, Mobilansicht und E-Mail-Formate.
- CI stellt `artifacts/velcure-keycloak-theme.jar` als Download bereit.

## Kontoverwaltung

Das Account-Theme erweitert die mitgelieferte `keycloak.v3` Account Console. Keycloaks React-Anwendung, Account-API, OIDC-Anmeldung und Berechtigungsprüfungen bleiben unverändert. Das Theme ergänzt Logo, lokale Schriften, Petrol-/Mint-Farben, Navigation, Formulare, Tabellen, Dialoge und responsive Abstände. Die Navigation übernimmt den frei stehenden 28-px-Rahmen und die 12-px-Außenabstände aus den Brand Guidelines. Logo und Navigation bilden auf Desktop eine gemeinsame Petrol-Fläche; auf Mobil öffnet sich ein separat abgerundetes Menü. Native Console und Studio verwenden dafür dieselbe Datei `account-layout.css`. Deutsche Texte verwenden die Du-Ansprache.

Abgedeckt sind persönliche Angaben, Passwort, Authenticator, Passkeys, Wiederherstellungscodes, Geräte und Sitzungen, verknüpfte Konten, Anwendungen, Gruppen, Organisationen, Ressourcen/Freigaben sowie digitale Nachweise. Die Verfügbarkeit hängt von Realm-Funktionen, Required Actions, Rollen und konfigurierten Anbietern ab. Das Theme aktiviert keine zusätzlichen Rechte oder Produktionsfunktionen.

Im Studio: <http://127.0.0.1:4321/preview/account/personal-info>. Die neun Account-Ansichten sind bereinigte DOM-Aufnahmen der echten Console in Deutsch und Englisch. Sie verwenden die offiziellen, prüfsummengeprüften Keycloak-Styles und dasselbe Velcure-CSS wie das produktive Theme. Die Studio-Vorschau speichert keine Änderungen und simuliert keine Anmeldung. Die Navigation und Mobilansicht sind bedienbar; für vollständige Aktionen führt **Im lokalen Keycloak testen** zur echten Console.

```sh
docker compose up -d --build
pnpm test:account
```

Live-Console: <http://127.0.0.1:8082/realms/velcure-preview/account/>. Testkonto: `alex@beispiel.invalid` / `preview-only-change-me`. Der isolierte Realm enthält ausschließlich Testdaten und einen absichtlich nicht erreichbaren SSO-Anbieter unter `sso.example.invalid`. Wallet-Ausstellung und Ressourcenfreigaben benötigen zusätzlich fachliche Testkonfiguration. `oid4vc-vci` und `recovery-codes` sind ausschließlich für diese lokale Vorschau aktiviert.

`pnpm test:account` prüft alle neun nativen Routen, echte Profiländerungen, den Übergang zu Passwort- und OTP-Einrichtung sowie die mobile Navigation. Neue Passkeys oder Passwörter werden nicht automatisch angelegt. Native Einrichtungs- und Bestätigungsseiten sind zusätzlich im Login-Katalog enthalten.

Die Account-Aufnahmen unter `fixtures/account` stammen aus der in `metadata.json` angegebenen Keycloak-Version und enthalten keine Tokens. Bei einem Keycloak-Upgrade müssen sie mit der isolierten Console neu erfasst werden; `scripts/account-fixtures.mjs <captures.json>` bereinigt die Aufnahmen. Erwartetes Format: `[{ "id": "personal-info", "locale": "de", "heading": "Persönliche Angaben", "body": "<div id=...>...</div>" }, ...]` für alle IDs in `src/lib/account-pages.json` und beide Sprachen. `pnpm render` blockiert veraltete Aufnahmen. Das Studio-Skript `public/account-preview.js` wird nicht in das Theme-JAR oder das Keycloak-Image aufgenommen.

Für die Integration lautet die Realm-Konfiguration:

```json
{ "loginTheme": "velcure", "accountTheme": "velcure", "emailTheme": "velcure" }
```

## Im Keycloak Operator verwenden

Es gibt zwei Installationswege:

1. **Theme-JAR** in ein eigenes Keycloak-Image unter `/opt/keycloak/providers/` übernehmen; anschließend den üblichen Keycloak-Image-Build durchführen.
2. **Dieses Dockerfile** verwenden. Es erweitert das offizielle Keycloak-Image und kopiert das native Theme nach `/opt/keycloak/themes/velcure`.

Das gewünschte Image über `spec.image` des Keycloak-Operators setzen. Im betreffenden Realm unter **Realm settings → Themes** **Login theme**, **Account theme** und **Email theme** auf `velcure` stellen. Theme-Änderungen benötigen keine Anpassung der Browser-Flows. SMTP-Konfiguration und produktive Benutzer bleiben beim Realm.

### Container-Tags

Image: `ghcr.io/velcure/keycloak-theme` — vollständiges Keycloak-Image mit installiertem Theme, für **linux/amd64** und **linux/arm64**.

| Tag | Bedeutung |
| --- | --- |
| `main` | Letzter erfolgreicher Build von `main` |
| `sha-<vollständiger Commit-SHA>` | Build eines konkreten Commits |
| `vX.Y.Z` und `X.Y.Z` | Freigegebene Version |
| `X.Y` | Neueste freigegebene Patch-Version dieser Minor-Reihe |
| `latest` | Letzte stabile Freigabe; folgt nicht jedem Commit |

```sh
docker pull ghcr.io/velcure/keycloak-theme:main
```

Falls das GHCR-Package privat ist, ist vorher `docker login ghcr.io` mit einem Token mit `read:packages` nötig. Öffentliche Packages können anonym geladen werden. Die Paket-Sichtbarkeit wird separat von der Repository-Sichtbarkeit verwaltet. [GitHub-Dokumentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).

Produktive Operator-Konfigurationen sollten eine freigegebene Version oder einen Digest verwenden. Das Theme wird im Realm weiterhin über den Namen `velcure` gewählt. Das Bereitstellen eines Images führt keinen Operator-Rollout aus.

### Release-Please-Ablauf

1. Conventional Commits auf `main` starten Typecheck, Biome, FreeMarker-, Browser- und Build-Prüfungen.
2. Erst nach erfolgreichen Prüfungen veröffentlicht CI das Image als `main` und `sha-<Commit>` auf GHCR, einschließlich SBOM und Build-Provenienz.
3. Die bestehende GitHub-App `velcure-release` erstellt oder aktualisiert den Release-PR mit Versionsnummer und Changelog. Ihre PRs starten die regulären Checks.
4. Nach dem Merge des Release-PRs läuft die CI erneut. Release Please erstellt den Git-Tag und das GitHub-Release; anschließend erhalten **dieselben geprüften Image-Bytes** die Versionstags und `latest`. Es wird kein zweites Release-Image gebaut.
5. Das geprüfte Theme-JAR und `SHA256SUMS` werden als Release-Downloads angehängt.

Die App nutzt die Organisationsvariable `RELEASE_APP_CLIENT_ID` und das Organisationssecret `RELEASE_APP_PRIVATE_KEY`, jeweils gezielt für dieses Repository freigegeben. GHCR verwendet das kurzlebige `GITHUB_TOKEN`. Schlüssel gehören nicht in das Repository.

Fehlgeschlagene Veröffentlichungen können über **Re-run failed jobs** wiederholt werden. Ein erneuter vollständiger CI-Lauf am gleichen Release-Commit erkennt dessen vorhandenes Release und vervollständigt die Veröffentlichung. Läuft bereits ein neuerer Commit auf `main`, legt der veraltete Lauf keinen neuen Release-PR an.


## Versionen und Updates

Die getestete Keycloak-Version und die SHA-256-Prüfsummen der offiziellen Artefakte stehen in `keycloak-version.json`. Aktuell: **Keycloak 26.8.1 / FreeMarker 2.3.35**. JavaScript-Pakete und Actions sind auf aktuelle stabile Versionen gepinnt. Die Lockdatei ist eingecheckt.

Dependabot öffnet **einmal monatlich** Updates für npm, GitHub Actions und Docker. Updates werden durch CI geprüft und nicht automatisch gemergt. Bei einer neuen Keycloak-Version müssen Dockerfile, `keycloak-version.json`, die Upstream-Referenzen und gegebenenfalls die Layout-Erweiterungen gemeinsam aktualisiert werden. Die CI blockiert eine abweichende Docker-Version. Ein bewegliches `latest`-Image allein ist kein Kompatibilitätsnachweis.

## Aufbau

```text
themes/velcure/login/   Native Templates, CSS, Texte, Fonts und Logos
themes/velcure/email/   E-Mail-Rahmen, HTML-/Text-Anpassungen und Übersetzungen
themes/velcure/account/ Native keycloak.v3 Account Console im Velcure-Branding
src/                   Astro-SSR-Studio und isolierte Ressourcen-Routen
scripts/               Echter FreeMarker-Renderer und JAR-Paketierung
fixtures/              Lokaler, isolierter Test-Realm
vendor/keycloak/        Versionierte Upstream-Referenzen für die Vorschau
```

Das Login-Theme erweitert `keycloak.v2`, das Account-Theme `keycloak.v3` und das E-Mail-Theme `keycloak`. Nicht überschriebene Seiten bleiben native Keycloak-Seiten und nutzen das gemeinsame Velcure-Layout. `select-authenticator.ftl` verwendet echte Submit-Buttons statt klickbarer Container, damit die Methodenwahl per Tastatur funktioniert. Die Registrierungsseite ergänzt den Datenschutzhinweis. In E-Mails werden PNG-Logos, Tabellen, Inline-Styles und Systemschriften verwendet; Textalternativen bleiben erhalten.

Brand-Quelle: `velcure/lp`, Release `v0.6.0`, Nah + Fokus. Assets und Tokens sind als versionierter Snapshot enthalten. Die Marketing-App und das Core-Projekt sind keine Laufzeitabhängigkeiten und werden durch dieses Repository nicht geändert.

Die HTML-Vorschau ersetzt keinen Test in Outlook, Gmail und Apple Mail. Ebenso simuliert der Katalog keine tatsächliche Passkey-Registrierung, SSO-Weiterleitung oder produktive Realm-Regeln; dafür dient die isolierte Keycloak-Instanz.

## Sichtbarkeit und Lizenz

Dieses Repository ist öffentlich einsehbar. Die ursprünglichen Velcure-Inhalte und Markenassets bleiben unter der bestehenden proprietären Lizenz; öffentliche Sichtbarkeit ist keine Freigabe der Marke oder eine zusätzliche Nutzungslizenz. Die separat mitgelieferten Keycloak- und Font-Lizenzen gelten unverändert. Siehe [LICENSE](LICENSE) und [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Die Zugangsdaten in der lokalen Realm-Fixture sind ausschließlich absichtlich veröffentlichte Testdaten für die isolierte, an Loopback gebundene Entwicklungsumgebung.
