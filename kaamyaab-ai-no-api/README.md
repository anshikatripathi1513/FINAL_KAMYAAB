# KaamYaab AI — No API Key Edition

A browser-based multilingual interview practice app built with Next.js 14. It uses:
- Browser camera preview (`getUserMedia`)
- Browser speech-to-text (`SpeechRecognition` / `webkitSpeechRecognition`)
- Browser text-to-speech (`speechSynthesis`)
- Local heuristic answer feedback and scoring
- Print-to-PDF report

## Important capability note

This version requires **no API key and no backend AI service**. That means answer analysis is local rule/keyword-based coaching, not generative AI. Browser speech recognition support and language availability vary by browser, operating system, and installed speech services. Current Chrome/Edge generally offer the best support. If speech recognition is unavailable, users can type answers.

Camera/microphone permissions require `localhost` or HTTPS. The camera preview is not recorded or uploaded by this app.

## Run on Windows

1. Install Node.js LTS.
2. Extract this ZIP.
3. Open the extracted `kaamyaab-ai-no-api` folder in VS Code.
4. Open Terminal → New Terminal.
5. Run:

```bash
npm install
npm run dev
```

6. Open http://localhost:3000
7. Allow camera and microphone permissions when prompted.

## Build for deployment

```bash
npm run build
npm start
```

Deploy the folder to Vercel as a Next.js project. No environment variables are needed.

## Files

- `app/page.tsx` — complete interview app and browser interactions
- `app/layout.tsx` — root layout and metadata
- `app/globals.css` — responsive dark UI
- `package.json` — dependencies and commands
- `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs` — project config
