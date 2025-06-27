// blog_tts.js – auto-generates speech for blog summaries via ElevenLabs

(() => {
  const audioEl = document.getElementById('ttsAudio');
  const summaryEl = document.querySelector('.blog-summary');

  // Bail early if player or text is missing (e.g., other pages)
  if (!audioEl || !summaryEl) return;

  // ==== CONFIGURATION ====
  const API_KEY = 'sk_e0cc0550547e8292567ff46fe85f9ae24c7f9464443c0d12';
  const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // "Rachel" – reliable default

  // Trim text to a safe length (ElevenLabs hard-limit 5k chars)
  const textToSpeak = summaryEl.innerText.trim().slice(0, 4900);

  // Provide quick visual feedback while we fetch audio
  audioEl.setAttribute('disabled', 'disabled');
  const loadingMsg = document.createElement('span');
  loadingMsg.textContent = 'Generating audio…';
  loadingMsg.style.fontStyle = 'italic';
  loadingMsg.style.marginLeft = '8px';
  audioEl.parentElement.appendChild(loadingMsg);

  // Build request
  fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    body: JSON.stringify({
      text: textToSpeak,
      model_id: 'eleven_monolingual_v1',
      voice_settings: { stability: 0.5, similarity_boost: 0.5 }
    })
  })
  .then(res => {
    if (!res.ok) throw new Error(`TTS request failed (status ${res.status})`);
    return res.blob();
  })
  .then(blob => {
    // Attach the audio source & enable controls
    const objectUrl = URL.createObjectURL(blob);
    audioEl.src = objectUrl;
    audioEl.removeAttribute('disabled');
    loadingMsg.remove();
  })
  .catch(err => {
    console.error('ElevenLabs TTS error:', err);
    loadingMsg.textContent = 'Audio unavailable';
  });
})(); 