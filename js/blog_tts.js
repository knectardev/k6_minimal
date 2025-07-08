// blog_tts.js – auto-generates speech for blog summaries via ElevenLabs

(() => {
  const audioEl = document.getElementById('ttsAudio');
  const articleEl = document.querySelector('.blog-post');
  if (!audioEl || !articleEl) return; // not on blog page

  // Collapse whitespace helper
  const extractText = el => el.innerText.replace(/\s+/g, ' ').trim();

  // Wait until injectPageData has added body copy (or 1s timeout)
  function waitForContent(attempts = 0) {
    const txt = extractText(articleEl);
    if (txt.length > 80 || attempts > 20) { // ~ >10 words
      startTTS(txt);
    } else {
      setTimeout(() => waitForContent(attempts + 1), 50);
    }
  }

  function startTTS(fullText) {
    const textToSpeak = fullText.slice(0, 4900); // ElevenLabs limit

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
        loadingMsg.textContent = 'Audio unavailable';
      });
  }

  // Kick off after DOM ready + microtask
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => waitForContent(), 0));
})(); 