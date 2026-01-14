# 🎙️ Whisper Transcription App

App web minimalista per trascrizione audio usando **OpenAI Whisper-1**.

## 🚀 Stack Tecnologico

- **Frontend**: React 18 + Vite
- **Backend**: Express.js (porta 3001)
- **Storage**: Browser localStorage
- **API**: OpenAI Whisper-1

## ✨ Funzionalità

- ✅ Dropzone drag-and-drop per file audio (mp3, m4a, wav)
- ✅ Supporto lingue: Italiano (default) e Inglese
- ✅ Trascrizione con timing dettagliato
- ✅ Progresso in tempo reale
- ✅ Output salvato in localStorage con timestamp
- ✅ Storico trascrizioni con opzione elimina
- ✅ Download file TXT con trascrizione
- ✅ Copia testo negli appunti
- ✅ Validazione file lato client e server (max 25MB)
- ✅ Gestione errori OpenAI (timeout, quota)

## 📋 Prerequisiti

- Node.js 18+
- Account OpenAI con accesso API
- API Key OpenAI

## 🛠️ Installazione

### 1. Clone del repository

```bash
git clone <repository-url>
cd rip-recinpeace
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Crea file `.env` nella cartella `backend/`:

```env
OPENAI_API_KEY=sk-your-api-key-here
PORT=3001
```

### 3. Setup Frontend

```bash
cd frontend
npm install
```

## 🎬 Avvio Applicazione

### Opzione 1: Terminali separati

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Opzione 2: Script combinato (da creare)

```bash
npm run dev
```

L'app sarà disponibile su: **http://localhost:3000**

## 📖 Come Usare

1. **Carica audio**: Trascina un file audio (mp3, m4a, wav) nell'area dropzone o clicca per selezionare
2. **Configura opzioni**:
   - Seleziona lingua (Italiano/Inglese)
   - Abilita timing nei paragrafi (opzionale)
   - Visualizza stima costo
3. **Avvia trascrizione**: Clicca su "Inizia trascrizione"
4. **Visualizza risultato**: Una volta completata, puoi:
   - Copiare il testo
   - Scaricare file TXT
   - Iniziare nuova trascrizione
5. **Storico**: Accedi alle trascrizioni precedenti dalla lista in fondo

## 📂 Struttura Progetto

```
rip-recinpeace/
├── backend/
│   ├── server.js          # Server Express
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dropzone.jsx
│   │   │   ├── Options.jsx
│   │   │   ├── Progress.jsx
│   │   │   ├── TranscriptionResult.jsx
│   │   │   └── History.jsx
│   │   ├── utils/
│   │   │   └── localStorage.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## 🔧 API Endpoint

### POST `/api/transcribe`

**Request:**
- `Content-Type`: `multipart/form-data`
- `audioFile`: File audio (mp3, m4a, wav)
- `language`: Codice lingua (`it` o `en`)

**Response:**
```json
{
  "text": "Testo trascritto con timing...",
  "segments": [
    {
      "start": 0.0,
      "end": 5.5,
      "text": "Segmento di testo"
    }
  ],
  "duration": 125.5,
  "timestamp": "2025-01-14T10:30:00.000Z",
  "language": "it"
}
```

### GET `/api/health`

Health check endpoint.

## 💾 Formato Output

```
[00:00:00] Primo segmento di testo trascritto

[00:05:30] Secondo segmento di testo trascritto

---
Durata totale: 15:45
Lingua: Italiano
Data: 14/01/2025, 14:32:15
```

## 💰 Costi

OpenAI Whisper-1 costa **$0.006 per minuto** di audio.

Esempi:
- 5 minuti: ~$0.03
- 30 minuti: ~$0.18
- 60 minuti: ~$0.36

## ⚠️ Limitazioni

- **Dimensione massima file**: 25MB
- **Formati supportati**: mp3, m4a, wav
- **Timeout**: Dipende dalla lunghezza del file
- **Quota API**: Soggetta ai limiti del piano OpenAI

## 🐛 Troubleshooting

### Errore "OPENAI_API_KEY non configurata"
- Verifica che il file `.env` esista in `backend/`
- Controlla che la chiave API sia valida

### Errore "File troppo grande"
- Il file supera i 25MB
- Comprimi l'audio o dividi in parti più piccole

### Errore 429 (Quota superata)
- Hai esaurito la quota API mensile
- Verifica il tuo piano su OpenAI

### Trascrizione non accurata
- Verifica qualità audio (rumore di fondo, volume)
- Prova a specificare la lingua corretta
- Per audio lunghi, considera di dividere in segmenti

## 🔐 Sicurezza

- **API Key**: Mai committare `.env` su repository pubblici
- **Validazione**: Doppia validazione file (client + server)
- **Limiti**: Max 25MB per prevenire abusi
- **Pulizia**: File temporanei eliminati dopo elaborazione

## 🚀 Deployment

### Backend (es. Railway, Render)
1. Deploy cartella `backend/`
2. Imposta variabile ambiente `OPENAI_API_KEY`
3. Verifica porta (variabile `PORT`)

### Frontend (es. Vercel, Netlify)
1. Build: `npm run build` in `frontend/`
2. Deploy cartella `dist/`
3. Configura proxy per `/api/*` verso backend

## 📝 Licenza

MIT

## 👨‍💻 Sviluppo

Per contribuire:
1. Fork del progetto
2. Crea branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

## 📞 Supporto

Per problemi o domande, apri un issue su GitHub.

---

Creato con ❤️ usando OpenAI Whisper