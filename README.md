# Focus Tool

App web personale per la concentrazione e produttività. Audio generativo, timer pomodoro e sezione segreta con trascrizione + riassunto AI.

## Setup locale

```bash
npx serve . --listen 3000
```

Apri `http://localhost:3000`.

Per le Serverless Functions (auth, trascrizione, riassunto, Notion) serve Vercel CLI:

```bash
npx vercel dev
```

## Deploy su Vercel

1. Collega il repo a Vercel
2. Configura le variabili d'ambiente (vedi sotto)
3. Deploy automatico su ogni push a `main`

## Variabili d'ambiente

| Variabile | Descrizione |
|-----------|-------------|
| `APP_PASSWORD_HASH` | SHA-256 della password per la sezione segreta |
| `OPENROUTER_API_KEY` | Chiave OpenRouter per riassunto e trascrizione Gemini |
| `OPENAI_API_KEY` | Chiave OpenAI per trascrizione Whisper (opzionale) |
| `NOTION_API_KEY` | Integration token Notion |
| `NOTION_DATABASE_ID` | ID del database Notion dove salvare le trascrizioni |
| `SUMMARY_MODEL` | Modello OpenRouter per i riassunti (default: `google/gemini-2.5-flash`) |

### Generare APP_PASSWORD_HASH

Incolla nel browser console:

```javascript
const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('LA_TUA_PASSWORD'));
console.log(Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join(''));
```

Copia l'output e impostalo come `APP_PASSWORD_HASH` su Vercel.

## Aggiungere tracce audio

Aggiungi file MP3 o OGG nella cartella `/public/tracks/`, poi aggiorna l'array `TRACKS` in `src/config.js`:

```js
export const TRACKS = [
  { title: 'Nome traccia', src: '/public/tracks/nome-file.mp3' },
];
```

## Cambiare engine di trascrizione

In `src/config.js`, modifica `TRANSCRIPTION_ENGINE`:

| Valore | Engine | Requisiti |
|--------|--------|-----------|
| `'webspeech'` | Web Speech API (default) | Browser con supporto Speech Recognition |
| `'whisper'` | OpenAI Whisper | `OPENAI_API_KEY` |
| `'gemini'` | Gemini 2.5 Flash | `OPENROUTER_API_KEY` |

## Accesso sezione segreta

Clicca sul logo ◈ cinque volte in rapida successione. Inserisci la password configurata.

## Struttura

```
src/
  audio/          # noiseGenerator, trackPlayer, audioMixer
  components/     # frequencyPanel, trackPanel, pomodoroTimer, settingsPanel
  secret/         # auth, transcriber*, transcriberFactory, secretUI
  app.js          # entry point
  config.js       # tutte le costanti configurabili
api/              # Vercel Serverless Functions
public/           # tracks/, sounds/, manifest.json, sw.js
```
