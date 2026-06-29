# MessyOut

**Paste the mess → get clean output.** A 100% client-side tool that auto-detects and peels apart multi-layered encoded output, then prettifies and syntax-highlights the result.

You pull `/etc/passwd` through a PHP filter wrapper and get base64 wrapped in HTML wrapped in a URL-encoded parameter. You hit an SSRF endpoint and the response is a JSON-escaped string holding an `nginx.conf`. MessyOut sees through all the layers automatically, shows you each one in a **Decode Tree**, and hands you clean, highlighted output — and tells you *what* it is (`/etc/passwd`, nginx config, PHP source, JWT, …).

> **Nothing leaves your browser.** No server, no network calls, no telemetry. Safe to paste internal configs, tokens, and keys. That's the whole point: exam takers (OSCP, CWES, CPTS) and anyone handling sensitive output can't send it to an AI — so MessyOut does the parsing locally.

## Why not just CyberChef?

CyberChef is a manual workbench — *you* build the recipe step by step. MessyOut **auto-detects** the encoding stack and decodes it in one paste, then identifies the underlying format. Different tool for a different moment: paste-and-go vs. craft-a-recipe.

## Features

- **Auto multi-layer decode** — base64, base64url, base32, URL, HTML entities, JSON string escapes, Unicode `\uXXXX`, hex, `\xNN`/octal escaped bytes, quoted-printable, charcode arrays (`String.fromCharCode`/`chr()`/`[72,105]`), gzip (base64), Data URIs, JWT, ROT13, plus an ANSI-color strip pre-pass. Loops until stable, with cycle detection.
- **Decode Tree** — every layer is visible and clickable; inspect the intermediate state at any step.
- **25+ format detectors** with confidence scores — nginx, Apache, `/etc/passwd`, `/etc/shadow`, PHP, JS, Python, SQL, Bash, Java, Ruby, JSON, XML/HTML, YAML, INI, PEM/SSH keys, HTTP requests & responses, cookies, URLs (incl. `file://`/`gopher://`/`dict://` SSRF schemes), Dockerfiles, K8s manifests, crontab, cloud metadata.
- **Hash identifier** — recognizes MD5/NTLM, SHA-1/224/256/384/512, bcrypt, md5crypt/sha256crypt/sha512crypt (`$1$`/`$5$`/`$6$`), yescrypt, Argon2, PBKDF2, MySQL, secretsdump dumps — with hashcat `-m` modes and john formats.
- **Secret & token scanner** — flags AWS keys (`AKIA`/`ASIA`), GitHub/Slack/Google/Stripe/OpenAI tokens, private keys, JWTs, Bearer tokens, and decodes HTTP **Basic** auth to `user:pass` inline.
- **Embedded-token decoding** — finds and decodes base64/hex/JWT tokens buried inside otherwise-plaintext output, not just whole-string input.
- **Syntax highlighting** via Prism for the detected language.
- **Explain panel** — local, AI-free annotations of what fields/directives mean (passwd columns, nginx `proxy_pass`, cookie flags, JWT claims, …).
- **Entropy indicator** — spot encrypted/compressed blobs at a glance.
- **Manual format override**, **word-wrap toggle**, **copy / export**, and **shareable links** (content compressed into the URL hash — still never hits a server).
- **Plugin architecture** — adding a decoder or detector is ~20 lines.

## Architecture

```
Raw input
  → pipeline: pick highest-confidence Decoder, decode, repeat (≤12 layers)
  → detectors: score the final output, pick the best format
  → prettify + highlight + explain
```

Decoders implement `{ name, detect(input): number, decode(input): string }`.
Detectors implement `{ detect(input): DetectResult | null }`.
Register in `src/lib/decoders/index.ts` / `src/lib/detectors/index.ts` — done.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle to dist/
```

Stack: React 19 · Vite · TypeScript · Tailwind v4 · prism-react-renderer · lz-string.

## License

MIT — open source, contributions welcome.
