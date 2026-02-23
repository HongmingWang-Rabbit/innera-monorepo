# 4. Entry Content Format

> Section 6 of the architecture doc.

---

## Format: Markdown

All entry content is stored as **Markdown** (plaintext with Markdown syntax). This choice affects search, export, rendering, and editor selection.

```
┌──────────────────────────────────────────────────┐
│  Content Lifecycle                                │
│                                                   │
│  Editor (Markdown) → plain string                 │
│    → encrypt(markdownString) → store in DB        │
│    → decrypt → parse Markdown → render            │
│    → decrypt → strip Markdown → search            │
│    → decrypt → export as .md / .json              │
└──────────────────────────────────────────────────┘
```

## Editor Selection

| Platform | Library | Notes |
|----------|---------|-------|
| Mobile | `@10play/tentap-editor` (Tiptap RN wrapper) | Markdown input/output mode, native keyboard toolbar |
| Web | `@tiptap/react` with `StarterKit` | Markdown serialization via `tiptap-markdown` extension |

Both editors render rich text visually but serialize to/from Markdown strings. The stored format is always raw Markdown, never HTML or proprietary JSON.

## Markdown Subset (MVP)

Supported syntax for rendering and editing:
- Headings (`# ## ###`)
- Bold, italic, strikethrough
- Unordered and ordered lists
- Blockquotes
- Inline code and code blocks
- Links
- Images (as `![alt](attachment-url)` referencing attachment storage keys)
- Horizontal rules

Not supported at MVP: tables, footnotes, LaTeX math, embedded HTML.

## Search Integration — Markdown Stripping

Before matching search queries, strip Markdown syntax to get plain text.

**MVP approach (regex):**

```typescript
function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s/g, '')          // headings
    .replace(/[*_~`]/g, '')            // emphasis markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // links → text only
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // images → alt text
    .replace(/>\s/g, '')               // blockquotes
    .replace(/[-*+]\s/g, '')           // list markers
    .replace(/\d+\.\s/g, '')           // ordered list markers
    .trim();
}
```

**Recommended for production: use `remark` parser instead of regex.**

The regex approach above is fragile — it fails on nested syntax, fenced code blocks with backticks, and multi-line constructs. For production, use the `remark` ecosystem:

```typescript
import { remark } from 'remark';
import strip from 'strip-markdown';

async function stripMarkdown(md: string): Promise<string> {
  const result = await remark().use(strip).process(md);
  return String(result).trim();
}
```

`strip-markdown` is a well-tested remark plugin that correctly handles all Markdown edge cases including fenced code blocks, nested emphasis, and HTML entities. The async cost is negligible compared to the decrypt-per-entry cost in the search pipeline.
