# 15. Content Security (XSS)

> Section 20 of the architecture doc.

---

## Threat

Entry content is Markdown. When rendered to HTML on the web, it can contain malicious scripts if not sanitized.

## Defense Layers

```
Layer 1: Input validation
  - zod schema limits entry content to max 50,000 characters
  - Reject content containing <script>, <iframe>, on* attributes
    (defense in depth, not primary protection)

Layer 2: Sanitization at render time (PRIMARY)
  - Web: Use DOMPurify to sanitize HTML output from Markdown parser
  - Never use dangerouslySetInnerHTML without DOMPurify

  import DOMPurify from 'dompurify';
  import { marked } from 'marked';

  function renderMarkdown(md: string): string {
    const rawHtml = marked.parse(md);
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'del', 'h1', 'h2', 'h3',
                     'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a',
                     'img', 'hr'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
      ALLOW_DATA_ATTR: false,
    });
  }

Layer 3: Content Security Policy (CSP)
  - Next.js response headers:
    Content-Security-Policy:
      default-src 'self';
      script-src 'self';
      style-src 'self' 'unsafe-inline';    // Tamagui needs inline styles
      img-src 'self' https://*.r2.cloudflarestorage.com;
      connect-src 'self' https://api.innera.app wss://api.innera.app;
      frame-src 'none';
      object-src 'none';

Layer 4: Mobile (React Native)
  - RN does not have a DOM → no XSS risk from Markdown rendering
  - Use react-native-markdown-display or tiptap RN (renders to native views)
  - Attachment URLs are validated against allowed storage domains
```

**Comment content** follows the same sanitization pipeline.

---

## HTTP Security Headers — @fastify/helmet

The API registers `@fastify/helmet` globally to set secure HTTP headers:

```typescript
import helmet from '@fastify/helmet';
await app.register(helmet, { global: true });
```

Helmet sets headers including:
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `X-Frame-Options: DENY` — prevents clickjacking
- `Strict-Transport-Security` — enforces HTTPS
- `X-DNS-Prefetch-Control` — controls DNS prefetching
- `X-Download-Options` — prevents IE file execution
- `X-Permitted-Cross-Domain-Policies` — restricts Adobe cross-domain policies

---

## CSRF Protection

The web client stores the refresh token in an `httpOnly secure SameSite=Lax` cookie. The `SameSite=Lax` attribute is the primary CSRF defense — cross-origin POST requests from attacker sites will not include the cookie. CORS (`credentials: true` with explicit allowed origins) provides an additional layer. See [Auth doc](./02-auth.md) for token strategy details.
