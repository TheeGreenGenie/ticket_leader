// ttsService.js — calls the backend /api/tts endpoint and plays audio.

let currentAudio = null;

export async function speak(text) {
  if (!text || !text.trim()) return;

  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.error('TTS request failed:', response.status);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;

    audio.addEventListener('ended', () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
    });

    await audio.play();
  } catch (err) {
    console.error('TTS error:', err);
  }
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}
