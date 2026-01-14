import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configurazione OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Configurazione Multer per upload file
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/wav', 'audio/x-m4a'];
    const allowedExts = ['.mp3', '.m4a', '.wav'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Formato file non supportato. Usa mp3, m4a o wav.'));
    }
  },
});

// Crea cartella uploads se non esiste
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Funzione per formattare il tempo
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Endpoint principale per trascrizione
app.post('/api/transcribe', upload.single('audioFile'), async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file audio caricato' });
    }

    filePath = req.file.path;
    const { language = 'it' } = req.body;

    console.log(`📝 Trascrizione iniziata: ${req.file.originalname} (${language})`);

    // Verifica dimensione file
    const stats = fs.statSync(filePath);
    if (stats.size > 25 * 1024 * 1024) {
      throw new Error('File troppo grande. Massimo 25MB.');
    }

    // Prepara il prompt basato sulla lingua
    const prompts = {
      it: 'Trascrivi accuratamente questo audio in italiano. Usa ortografia italiana corretta.',
      en: 'Transcribe this audio accurately in English.',
    };

    // Chiamata a OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
      language: language,
      prompt: prompts[language] || prompts.it,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    // Costruisci risposta con segmenti
    const segments = transcription.segments || [];
    const text = transcription.text;
    const duration = transcription.duration || 0;

    // Formatta output con timing
    let formattedText = '';
    if (segments.length > 0) {
      segments.forEach((segment) => {
        const timestamp = formatTime(segment.start);
        formattedText += `[${timestamp}] ${segment.text.trim()}\n\n`;
      });
    } else {
      formattedText = text;
    }

    // Aggiungi metadata
    formattedText += `\n---\nDurata totale: ${formatTime(duration)}\n`;
    formattedText += `Lingua: ${language === 'it' ? 'Italiano' : 'Inglese'}\n`;
    formattedText += `Data: ${new Date().toLocaleString('it-IT')}\n`;

    console.log(`✅ Trascrizione completata: ${duration.toFixed(2)}s`);

    res.json({
      text: formattedText,
      segments: segments.map((s) => ({
        start: s.start,
        end: s.end,
        text: s.text.trim(),
      })),
      duration,
      timestamp: new Date().toISOString(),
      language,
    });
  } catch (error) {
    console.error('❌ Errore trascrizione:', error);

    // Gestione errori specifici OpenAI
    if (error.status === 429) {
      return res.status(429).json({
        error: 'Quota API superata. Riprova più tardi.',
      });
    }

    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      return res.status(504).json({
        error: 'Timeout: il file è troppo lungo o la connessione è lenta.',
      });
    }

    res.status(500).json({
      error: error.message || 'Errore durante la trascrizione',
    });
  } finally {
    // Pulisci file temporaneo
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gestione errori multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File troppo grande. Massimo 25MB.',
      });
    }
  }
  res.status(500).json({ error: error.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
  console.log(`📡 Endpoint: POST /api/transcribe`);

  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  ATTENZIONE: OPENAI_API_KEY non configurata nel file .env');
  }
});
