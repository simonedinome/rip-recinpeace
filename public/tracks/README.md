# Aggiungere tracce audio

1. Copia i file MP3 o OGG in questa cartella (`public/tracks/`)
2. Apri `src/config.js` e aggiungi le tracce all'array `TRACKS`:

```js
export const TRACKS = [
  { title: 'Nome traccia', src: '/tracks/nome-file.mp3' },
];
```

3. Ricarica il browser — le tracce appariranno nel tab "Tracce"

**Formati supportati:** MP3, OGG, WAV (dipende dal browser)
**Dimensione consigliata:** file compressi, idealmente sotto i 10 MB per caricamento rapido
