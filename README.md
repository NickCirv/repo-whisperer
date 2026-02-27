![Banner](banner.svg)

# repo-whisperer

> Talk to any codebase in plain English

Drop into a repo you've never seen. Ask questions. Get answers. Zero onboarding required.

## Quick Start

```bash
# Explore a local project
npx repo-whisperer ./some-project

# Explore a GitHub repo
npx repo-whisperer https://github.com/expressjs/express
```

Then just ask:

```
whisper> How does authentication work?
whisper> Where are the database queries?
whisper> What would break if I deleted src/middleware/auth.js?
whisper> Explain the data flow from API request to database
```

## Example Session

```
$ npx repo-whisperer ./my-api

📂 Scanning my-api...
   Stack: Node.js (Express + TypeScript)
   Files: 47 source, 12 tests
   Entry: src/index.ts

whisper> How does auth work?

Authentication uses JWT tokens with refresh rotation:

1. Login: POST /api/auth/login → validates credentials → returns
   access token (15min) + refresh token (7d)
   📄 src/routes/auth.ts:23-45

2. Middleware: Every protected route passes through authMiddleware
   which validates the JWT and attaches user to req
   📄 src/middleware/auth.ts:8-22

3. Refresh: POST /api/auth/refresh → validates refresh token →
   issues new pair (old refresh token is revoked)
   📄 src/routes/auth.ts:47-68

whisper>
```

## Commands

| Command | What It Does |
|---------|-------------|
| Any question | AI-powered answer with file references |
| `tree` | Show project file tree |
| `read <file>` | Display file contents |
| `exit` | Quit |

## Requirements

- Node.js 18+
- `ANTHROPIC_API_KEY` environment variable

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## How It Works

1. Scans the codebase — file tree, stack detection, entry points, dependencies
2. Builds a codebase summary automatically
3. For each question, finds the most relevant files via keyword matching
4. Sends question + relevant context to Claude
5. Returns answers with specific file references

Works on any language: Node.js, Python, Rust, Go, Ruby, Java, and more.

## Related

- [blame-ai](https://github.com/NickCirv/blame-ai) — AI git archaeology
- [ai-code-roast](https://github.com/NickCirv/ai-code-roast) — Brutal code reviews

## License

MIT — NickCirv
