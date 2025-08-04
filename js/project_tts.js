// project_tts.js – auto-generates speech for project descriptions via ElevenLabs

(() => {
  const audioEl = document.getElementById('ttsAudio');
  if (!audioEl) return; // not on project page

  // Collapse whitespace helper
  const extractText = el => el.innerText.replace(/\s+/g, ' ').trim();

  // Prevent multiple TTS attempts
  let ttsInitialized = false;

  // Wait until injectPageData has added the pageSummary content (or 1s timeout)
  function waitForContent(attempts = 0) {
    if (ttsInitialized) return; // Prevent duplicate execution
    
    // Target specifically the .description div which contains pageSummary
    const descriptionEl = document.querySelector('.project-info .description');
    
    if (!descriptionEl) {
      console.log(`TTS Debug - Attempt ${attempts}: Description element not found yet`);
      if (attempts < 20) {
        setTimeout(() => waitForContent(attempts + 1), 50);
      } else {
        console.log('TTS Debug - Timeout: Description element never appeared');
      }
      return;
    }
    
    const txt = extractText(descriptionEl);
    console.log(`TTS Debug - Attempt ${attempts}: Found description with ${txt.length} characters`);
    console.log(`TTS Debug - Content preview:`, txt.slice(0, 200));
    
    if (txt.length > 50 || attempts > 20) { // Lower threshold since we're only reading description
      console.log(`TTS Debug - Starting TTS with ${txt.length} characters`);
      ttsInitialized = true; // Mark as initialized to prevent duplicates
      startTTS(txt);
    } else {
      setTimeout(() => waitForContent(attempts + 1), 50);
    }
  }

  function startTTS(fullText) {
    // First try with very simple text to test the connection
    const testMode = localStorage.getItem('tts_test_mode');
    let textToSpeak;
    
    if (testMode) {
      textToSpeak = "This is a test of the text to speech system.";
      console.log('TTS Debug - Test mode: using simple test text');
    } else {
      // Clean the text more aggressively
      let cleanText = fullText
        .replace(/<[^>]*>/g, ' ')  // remove any HTML tags
        .replace(/&[a-zA-Z0-9#]+;/g, ' ')  // remove HTML entities
        .replace(/[^\w\s\.\,\!\?\-\(\)]/g, ' ')  // remove special characters
        .replace(/\s+/g, ' ')  // normalize whitespace
        .trim();
      
      textToSpeak = cleanText.slice(0, 500); // Even more conservative for testing
    }
    
    console.log(`TTS Debug - Final text length: ${textToSpeak.length}`);
    console.log(`TTS Debug - Final text:`, textToSpeak);
    
    // Log the exact JSON that will be sent
    const payload = JSON.stringify({ text: textToSpeak });
    console.log(`TTS Debug - JSON payload length: ${payload.length}`);
    console.log(`TTS Debug - JSON payload:`, payload);
    
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

    console.log('TTS Debug - About to send request');
    
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
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