# 🚀 Quick Start Guide

Guida rapida per avviare l'app Whisper Transcription in 5 minuti.

## 1️⃣ Prerequisiti

Assicurati di avere installato:
- Node.js 18+ ([Download](https://nodejs.org/))
- Account OpenAI con API Key ([Ottieni qui](https://platform.openai.com/api-keys))

## 2️⃣ Installazione Rapida

```bash
# 1. Installa tutte le dipendenze
npm run install:all

# 2. Configura API Key OpenAI
cd backend
cp .env.example .env
# Apri .env e inserisci la tua OPENAI_API_KEY
```

## 3️⃣ Avvio

Apri **DUE terminali** nella cartella del progetto:

### Terminal 1 - Backend
```bash
npm run dev:backend
```
Attendi il messaggio: `🚀 Server avviato su http://localhost:3001`

### Terminal 2 - Frontend
```bash
npm run dev:frontend
```
Attendi il messaggio con l'URL (solitamente `http://localhost:3000`)

## 4️⃣ Usa l'App

1. Apri il browser su http://localhost:3000
2. Trascina un file audio (mp3, m4a, wav)
3. Seleziona la lingua
4. Clicca "Inizia trascrizione"
5. Attendi il risultato!

## ⚙️ Configurazione API Key

Modifica il file `backend/.env`:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx
PORT=3001
```

## ✅ Verifica Funzionamento

Testa il backend:
```bash
curl http://localhost:3001/api/health
```

Risposta attesa:
```json
{"status":"ok","timestamp":"2025-01-14T..."}
```

## 🐛 Problemi Comuni

### Port già in uso
```bash
# Cambia porta nel file backend/.env
PORT=3002
```

### Dipendenze mancanti
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### API Key non valida
- Verifica su https://platform.openai.com/api-keys
- Controlla che inizi con `sk-`
- Assicurati di avere credito disponibile

## 📚 Documentazione Completa

Leggi il [README.md](./README.md) per informazioni dettagliate su:
- Struttura progetto
- API endpoints
- Deployment
- Troubleshooting avanzato

---

Buona trascrizione! 🎙️
