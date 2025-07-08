// blog_tts.js – auto-generates speech for blog summaries via ElevenLabs

(() => {
  const audioEl = document.getElementById('ttsAudio');
  const summaryEl = document.querySelector('.blog-summary');

  // Bail early if player or text is missing (e.g., other pages)
  if (!audioEl || !summaryEl) return;

  // ==== CONFIGURATION ====
  // All secrets now stored server-side. The front-end calls our secure proxy
  // at /api/tts which returns an audio/mpeg blob.

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
  fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: textToSpeak })
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