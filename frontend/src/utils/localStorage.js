const STORAGE_KEY = 'whisper_transcriptions';

export const getTranscriptions = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Errore lettura localStorage:', error);
    return [];
  }
};

export const saveTranscription = (transcription) => {
  try {
    const transcriptions = getTranscriptions();
    const newTranscription = {
      id: Date.now().toString(),
      ...transcription,
      createdAt: new Date().toISOString(),
    };
    transcriptions.unshift(newTranscription);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transcriptions));
    return newTranscription;
  } catch (error) {
    console.error('Errore salvataggio localStorage:', error);
    throw error;
  }
};

export const deleteTranscription = (id) => {
  try {
    const transcriptions = getTranscriptions();
    const filtered = transcriptions.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    console.error('Errore eliminazione localStorage:', error);
    throw error;
  }
};

export const clearAllTranscriptions = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Errore pulizia localStorage:', error);
    throw error;
  }
};
