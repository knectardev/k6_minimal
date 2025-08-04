// project_tts.js – auto-generates speech for project descriptions via ElevenLabs

(() => {
  const audioEl = document.getElementById('ttsAudio');
  const projectEl = document.querySelector('.project-info');
  if (!audioEl || !projectEl) return; // not on project page

  // Collapse whitespace helper
  const extractText = el => el.innerText.replace(/\s+/g, ' ').trim();

  // Wait until injectPageData has added body copy (or 1s timeout)
  function waitForContent(attempts = 0) {
    const txt = extractText(projectEl);
    console.log(`TTS Debug - Attempt ${attempts}: Content length = ${txt.length}, Content preview:`, txt.slice(0, 200));
    if (txt.length > 80 || attempts > 20) { // ~ >10 words
      console.log(`TTS Debug - Starting TTS with ${txt.length} characters`);
      startTTS(txt);
    } else {
      setTimeout(() => waitForContent(attempts + 1), 50);
    }
  }

  function startTTS(fullText) {
    // Clean the text and limit length more conservatively
    let cleanText = fullText
      .replace(/\s+/g, ' ')  // normalize whitespace
      .replace(/[^\w\s\.\,\!\?\-\(\)]/g, ' ')  // remove special characters that might cause issues
      .trim();
    
    const textToSpeak = cleanText.slice(0, 2000); // More conservative limit
    
    console.log(`TTS Debug - Clean text length: ${textToSpeak.length}`);
    console.log(`TTS Debug - Text preview:`, textToSpeak.slice(0, 200));
    
    if (localStorage.getItem('tts_debug')) {
      console.log(`TTS payload (chars): ${textToSpeak.length}`, textToSpeak.slice(0,120)+'…');
    }

    // UI feedback
    audioEl.setAttribute('disabled', 'disabled');
    const loadingMsg = document.createElement('span');
    loadingMsg.textContent = 'Generating audio…';
    loadingMsg.style.fontStyle = 'italic';
    loadingMsg.style.marginLeft = '8px';
    audioEl.parentElement.appendChild(loadingMsg);

    console.log('TTS Debug - About to send request with text:', JSON.stringify({ text: textToSpeak }).length, 'bytes');
    
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
        const objectUrl = URL.createObjectURL(blob);
        audioEl.src = objectUrl;
        audioEl.removeAttribute('disabled');
        loadingMsg.remove();
      })
      .catch(err => {
        console.error('ElevenLabs TTS error:', err);
        console.error('TTS Debug - Full error details:', err.message);
        loadingMsg.textContent = 'Audio unavailable';
      });
  }

  // Kick off after DOM ready + microtask
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => waitForContent(), 0));
})();