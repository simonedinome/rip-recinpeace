# CLAUDE.md — Focus Tool

Questo file è il contesto persistente del progetto. Leggilo integralmente prima di ogni sessione di lavoro.

---

## Descrizione progetto

Applicazione web personale per la concentrazione e produttività. Vanilla JS, zero dipendenze esterne (no framework, no npm packages salvo strumenti di build se strettamente necessari). Deploy su Vercel.

Il sito ha due aree:

**Area pubblica** — visibile a chiunque apra il sito:
- Player audio per frequenze generative (white/brown/pink noise, rain, binaural beats, 432Hz tone) generate via Web Audio API
- Player per tracce audio locali (file MP3/OGG in `/public/tracks/`)
- Pomodoro timer configurabile con notifiche browser, log sessioni, suoni di notifica

**Area segreta** — accessibile solo cliccando sul logo + inserendo password:
- Trascrizione in tempo reale dal microfono del PC
- Riassunto AI della trascrizione via OpenRouter (Gemini 2.5 Flash di default)
- Salvataggio trascrizione + riassunto su database Notion

---

## Stack tecnico

- **Frontend**: HTML5, CSS3, JavaScript ES6+ (moduli nativi via `type="module"`)
- **Audio**: Web Audio API nativa (no librerie)
- **Trascrizione default**: Web Speech API nativa
- **Trascrizione alternativa**: Whisper via OpenAI API o Gemini via OpenRouter (configurabile)
- **Riassunto AI**: OpenRouter API — modello default `google/gemini-2.5-flash`
- **Salvataggio**: Notion API via Vercel Serverless Functions
- **Hosting**: Vercel
- **Autenticazione sezione segreta**: SHA-256 lato client (nessuna password viaggia in rete)

---

## Struttura cartelle

```
/
├── CLAUDE.md                   ← questo file
├── index.html                  ← entry point unico
├── vercel.json                 ← routing e config Vercel
├── .env.example                ← variabili d'ambiente (mai con valori reali)
├── .gitignore
├── README.md
├── public/
│   ├── tracks/                 ← file audio locali (MP3/OGG)
│   └── sounds/                 ← suoni notifica pomodoro
├── src/
│   ├── app.js                  ← entry point JS, importa tutti i moduli
│   ├── style.css               ← design system glassmorphism
│   ├── config.js               ← costanti configurabili (engine trascrizione, modello AI, ecc.)
│   ├── audio/
│   │   ├── noiseGenerator.js   ← white/brown/pink noise, rain, 432Hz, binaural
│   │   ├── trackPlayer.js      ← player per file audio locali
│   │   └── audioMixer.js       ← mixer centrale, volumi individuali + master
│   ├── components/
│   │   ├── frequencyPanel.js   ← UI griglia frequenze con toggle e slider
│   │   ├── trackPanel.js       ← UI lista tracce
│   │   ├── pomodoroTimer.js    ← logica e UI timer con SVG circolare
│   │   └── settingsPanel.js    ← pannello impostazioni (config pomodoro, audio, notifiche)
│   └── secret/
│       ├── auth.js             ← modal password, hash SHA-256, sessionStorage
│       ├── transcriber.js      ← wrapper Web Speech API
│       ├── whisperTranscriber.js
│       ├── geminiTranscriber.js
│       ├── transcriberFactory.js ← seleziona engine da config.js
│       └── secretUI.js         ← UI sezione segreta completa
└── api/                        ← Vercel Serverless Functions (Node.js)
    ├── transcribe-whisper.js
    ├── transcribe-gemini.js
    ├── summarize.js
    └── save-to-notion.js
```

---

## Variabili d'ambiente

Definite in `.env` locale e su Vercel Dashboard. Mai committare valori reali.

```
OPENROUTER_API_KEY=        # chiave OpenRouter per riassunto + trascrizione Gemini
OPENAI_API_KEY=             # chiave OpenAI per trascrizione Whisper (opzionale)
NOTION_API_KEY=             # integration token Notion
NOTION_DATABASE_ID=         # ID del database Notion dove salvare le trascrizioni
APP_PASSWORD_HASH=          # SHA-256 della password per la sezione segreta
SUMMARY_MODEL=google/gemini-2.5-flash  # modello OpenRouter per i riassunti
```

Per generare `APP_PASSWORD_HASH` dalla password scelta, usa questa riga in browser console:
```javascript
const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('LA_TUA_PASSWORD'));
console.log(Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join(''));
```

---

## Regole operative per Claude Code

### File che puoi modificare liberamente
Tutto il contenuto di `/src/` e `/api/` e i file `/public/` (no i file audio).

### File che richiedono conferma esplicita prima di modificare
- `vercel.json`
- `index.html` (struttura principale)
- `.env.example`
- `CLAUDE.md` (questo file)

### File che non devi mai toccare
- `.env` (non esiste nel repo, non crearlo mai)
- File audio in `/public/tracks/` e `/public/sounds/`
- `.gitignore`

### Regole di codice
- Nessun framework JS, nessun npm package runtime — solo Web APIs native
- Moduli ES6 nativi (`import/export`), non CommonJS
- Nessun commento inline ovvio — solo commenti dove la logica non è autoevidente
- CSS: usa sempre variabili CSS (`--var-name`) per colori, blur, spacing — mai valori hardcoded sparsi
- Async/await ovunque, mai callback hell
- Gestisci sempre gli errori nelle chiamate API con try/catch e feedback visivo all'utente
- Le Serverless Functions in `/api/` usano Node.js — non usare `fetch` globale senza verificare la versione Node target di Vercel (usa `node-fetch` se necessario o specifica `"runtime": "nodejs18.x"` in `vercel.json`)

### Pattern da rispettare
- `config.js` è l'unico posto dove cambiano le costanti configurabili — non spargerle nei file
- `audioMixer.js` è l'unico punto di accesso all'`AudioContext` — non crearne altri
- `transcriberFactory.js` è l'unico punto che decide quale engine di trascrizione usare
- `auth.js` gestisce tutto il ciclo di autenticazione — non duplicare logica di sessione altrove

---

## Design system — Glassmorphism

Estetica: **dark glassmorphism**. Sfondo profondo (quasi nero con leggera tinta viola/indaco), card con `backdrop-filter: blur()`, bordi semitrasparenti, testi chiari.

Variabili CSS base da definire in `:root` in `style.css`:

```css
--bg-primary: #0a0a12;
--bg-secondary: #111122;
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-border: rgba(255, 255, 255, 0.1);
--glass-blur: blur(16px);
--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
--accent-primary: #7c6af7;
--accent-secondary: #4fc3f7;
--text-primary: rgba(255, 255, 255, 0.92);
--text-secondary: rgba(255, 255, 255, 0.55);
--radius-card: 16px;
--radius-btn: 8px;
--secret-tint: rgba(60, 0, 80, 0.15);  /* tinta diversa per area segreta */
```

---

## Todo list — stato avanzamento

Aggiorna questa sezione man mano che i task vengono completati. Metti ✅ davanti ai task completati.

### FASE 0 — Setup progetto
- ✅ 1. Struttura cartelle e file vuoti
- ✅ 2. `vercel.json` con routing base e runtime Node 18
- ✅ 3. `.env.example` con tutte le variabili
- ✅ 4. `index.html` base con struttura sezioni e meta tag
- ✅ 5. `style.css` con design system glassmorphism completo
- ✅ 6. `app.js` entry point con import moduli

### FASE 1 — Audio Engine
- ✅ 7. White Noise (`noiseGenerator.js`)
- ✅ 8. Brown Noise
- ✅ 9. Pink Noise
- ✅ 10. Rain Loop (white noise filtrato con BiquadFilterNode)
- ✅ 11. 432Hz Tone (OscillatorNode con fade)
- ✅ 12. Binaural Beats (due oscillatori + StereoPannerNode, preset alpha/theta/delta)
- ✅ 13. `trackPlayer.js` per file audio locali
- ✅ 14. `audioMixer.js` mixer centrale
- ✅ 15. Placeholder `/public/tracks/` con README su come aggiungere tracce

### FASE 2 — UI Player
- ✅ 16. `frequencyPanel.js` — griglia card con toggle e slider volume
- ✅ 17. `trackPanel.js` — lista tracce con progress bar
- ✅ 18. Tab switcher Frequencies / Tracks con transizione CSS
- ✅ 19. Master volume slider + VU meter visivo
- ✅ 20. Indicatore animato (pulse/waveform) quando frequenza attiva

### FASE 3 — Pomodoro Timer
- ✅ 21. `pomodoroTimer.js` — logica stati work/short_break/long_break/idle
- ✅ 22. Configurazione durate (lavoro, pausa corta, pausa lunga, n. sessioni)
- ✅ 23. Contatore sessioni con visualizzazione progress dots
- ✅ 24. Auto-start pausa successiva (toggle)
- ✅ 25. Notifica browser push con richiesta permesso
- ✅ 26. Suoni notifica: preset campana/beep/chime via OscillatorNode
- ✅ 27. Log sessioni in localStorage con visualizzazione storico
- ✅ 28. UI timer SVG circolare animato

### FASE 4 — Settings Panel
- ✅ 29. Pannello impostazioni con tutte le config
- ✅ 30. Persistenza impostazioni in localStorage (`focustool_settings`)
- ✅ 31. Reset alle impostazioni default

### FASE 5 — Accesso sezione segreta
- ✅ 32. Logo cliccabile nel header (senza hint visivi)
- ✅ 33. Modal autenticazione con hash SHA-256 lato client
- ✅ 34. Documentazione generazione hash in README
- ✅ 35. Salvataggio sessione in sessionStorage dopo login

### FASE 6 — Trascrizione microfono
- ✅ 36. `transcriber.js` — Web Speech API con reconnect automatico
- ✅ 37. Buffer trascrizione con timestamp per chunk
- ✅ 38. `whisperTranscriber.js` + endpoint `/api/transcribe-whisper.js`
- ✅ 39. `geminiTranscriber.js` + endpoint `/api/transcribe-gemini.js`
- ✅ 40. `transcriberFactory.js` — selezione engine da `config.js`

### FASE 7 — Riassunto AI
- ✅ 41. Endpoint `/api/summarize.js` — OpenRouter, modello da env `SUMMARY_MODEL`
- ✅ 42. Variabile `SUMMARY_MODEL` in `config.js` e `.env.example`
- ✅ 43. Prompt sistema: estrai argomenti, decisioni, action items, domande aperte — output italiano Markdown

### FASE 8 — Salvataggio Notion
- ✅ 44. Endpoint `/api/save-to-notion.js` — crea pagina con trascrizione + riassunto + metadati
- ✅ 45. Proprietà pagina Notion: titolo (data+ora), trascrizione (blocco testo), riassunto (callout), durata
- ✅ 46. Retry con exponential backoff su errore 429

### FASE 9 — UI sezione segreta
- ✅ 47. Layout sezione segreta con tinta glassmorphism viola scuro
- ✅ 48. Pulsante REC con stato visivo pulsante rosso
- ✅ 49. Live transcript scrollabile in tempo reale
- ✅ 50. Pulsante "Genera Riassunto" con loader
- ✅ 51. Card riassunto editabile prima del salvataggio
- ✅ 52. Pulsante "Salva su Notion" con feedback successo/errore
- ✅ 53. Indicatore engine trascrizione attivo
- ✅ 54. Pulsante logout (cancella sessionStorage)

### FASE 10 — Polish e deploy
- ✅ 55. Responsive layout mobile
- ✅ 56. `manifest.json` + service worker base per PWA
- ✅ 57. Gestione `visibilitychange` (pausa audio/timer in background se configurato)
- [ ] 58. Test su Vercel preview branch
- [ ] 59. Config variabili d'ambiente su Vercel Dashboard
- ✅ 60. `README.md` con setup, variabili, come aggiungere tracce, come cambiare engine

---

## Come usare questo file durante lo sviluppo

All'inizio di ogni sessione Claude Code legge questo file automaticamente. Per aggiornare lo stato di avanzamento, chiedi esplicitamente:

> "Segna come completati i task 7, 8, 9 nel CLAUDE.md"

Se cambia qualcosa nell'architettura durante lo sviluppo, aggiorna le sezioni rilevanti prima di procedere con i task successivi.
