// Interactive Diagonal Lines with Audio
// Extracted from lines.html and adapted for embedding
// Assumes markup exists inside <section id="interactive-lines"> ... </section>

(function () {
    // Disable interactive lines & audio on mobile (<=768px)
    if (window.innerWidth <= 768) {
        const section = document.getElementById('interactive-lines');
        if (section) {
            section.style.display = 'none';
        }
        const ctrls = document.getElementById('controls');
        const beats = document.getElementById('beatControls');
        if (ctrls) ctrls.style.display = 'none';
        if (beats) beats.style.display = 'none';
        return; // Skip initializing heavy logic
    }

    // Elements
    const container = document.getElementById('interactive-lines');
    if (!container) return; // Safeguard if section is missing

    const canvas = container.querySelector('#patternCanvas');
    const ctx = canvas.getContext('2d');
    let audioCtx;

    // Defaults
    const DEFAULTS = {
        maxLength: 400,
        maxSpacing: 20,
        maxStagger: 20,
        duration: 600,
        maxAmplitude: 4,
        vibFreq: 20
    };

    // Music theory helpers
    let pentatonic = [];
    const C3_FREQ = 130.81;
    const PENTATONIC_INTERVALS = [0, 2, 4, 7, 9];

    function generatePentatonicScale(rootNoteOffset) {
        pentatonic = PENTATONIC_INTERVALS.map(interval => {
            const semitones = rootNoteOffset + interval;
            return C3_FREQ * Math.pow(2, semitones / 12);
        });
    }

    // DOM controls
    const playPauseBtn = container.querySelector('#playPauseBtn');
    const playIconEl = playPauseBtn.querySelector('img');
    const beatDots = container.querySelectorAll('.beatDot');
    const clickPrompt = container.querySelector('#clickPrompt');
    const ALWAYS_REVERSE = true;  // Hard-coded ON
    const ALWAYS_DOUBLETIME = true; // Hard-coded ON
    const PATTERN_VALUE = '1'; // Fixed pattern (Pattern 1)

    // Utility
    function randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    /* ==== Drawing & Interaction Logic ==== */
    const patterns = {
        1: [0, 2],
        2: [1, 0, 2, 5, 3],
        3: [0, 3, 2, 1, 1, 4, 3, 2]
    };

    let lines = [],
        playIdx = 0,
        patOffset = 0,
        isPlaying = false,
        patTimer = null,
        beatTimer = null,
        beatIdx = 0,
        beatOn = [];

    function resizeCanvas() {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }

    function randomizeBeats() {
        beatDots.forEach((dot, i) => {
            const isOn = Math.random() < 0.5;
            beatOn[i] = isOn;
            dot.classList.toggle('active', isOn);
        });
    }

    function randomizeKey() {
        const rootNote = Math.floor(Math.random() * 12);
        generatePentatonicScale(rootNote);
    }

    function generateLines() {
        resizeCanvas();
        lines = [];

        const lineCount = 9;
        const spacing = randomRange(15, 40); // Random spacing between 10-30px each run

        /*
         * Always slant to the right (down-right). We vary steepness by selecting
         * an angle between 50° (shallow) to 85° (near-vertical) in canvas coords
         * (0° points right, 90° points down).
         */
        const angleDeg = randomRange(95, 130);
        const a = angleDeg * Math.PI / 180;
        const cosA = Math.cos(a);
        const sinA = Math.sin(a);

        // Place starting points in the right half of the viewport
        const totalWidth = spacing * (lineCount - 1);
        let startX0 = canvas.width * 0.75; // default to mid-screen
        const maxStart = canvas.width - totalWidth - 20; // 20px right margin
        if (startX0 > maxStart) {
            startX0 = Math.max(canvas.width * 0.5, maxStart);
        }

        for (let i = 0; i < lineCount; i++) {
            // Starting point along the top edge
            const x1 = startX0 + i * spacing;
            const y1 = 0;

            /*
             * To reach the bottom edge (y = canvas.height), calculate parameter t such that
             * y1 + sinA * t = canvas.height  =>  t = (canvas.height - y1) / sinA
             */
            const tToBottom = (canvas.height) / sinA;
            const x2 = x1 + cosA * tToBottom;
            const y2 = canvas.height;

            lines.push({ x1, y1, x2, y2, i, activated: false });
        }

        playIdx = 0;
        patOffset = 0;
    }

    function playNote(freq) {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + DEFAULTS.duration / 1000);
        osc.start(now);
        osc.stop(now + DEFAULTS.duration / 1000);
    }

    function activateLine(baseIndex) {
        const N = lines.length;
        const idx = ((baseIndex + patOffset) % N + N) % N;
        const line = lines[idx];
        if (line) {
            line.activated = true;
            line.time = performance.now();
            line.duration = DEFAULTS.duration;
            line.maxAmplitude = DEFAULTS.maxAmplitude;
            const deg = line.i % pentatonic.length;
            const oct = Math.floor(line.i / pentatonic.length);
            playNote(pentatonic[deg] * Math.pow(2, oct));
        }
    }

    function playPattern() {
        const pat = patterns[PATTERN_VALUE];
        if (!pat || !lines.length) return;

        const fwdBase = pat[playIdx];
        activateLine(fwdBase);

        if (ALWAYS_REVERSE && pat.length > 0) {
            const startNote = pat[0];
            const revBase = (2 * startNote) - fwdBase;
            if (revBase !== fwdBase) {
                activateLine(revBase);
            }
        }

        playIdx++;
        if (playIdx >= pat.length) { playIdx = 0; patOffset++; }
    }

    function playBeat() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (beatOn[beatIdx]) {
            const now = audioCtx.currentTime;
            const d = 0.05;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.frequency.value = 440;
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.exponentialRampToValueAtTime(0.5, now + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.001, now + d);
            osc.start(now);
            osc.stop(now + d);
        }

        // Animate the corresponding beat dot
        const currentDot = beatDots[beatIdx];
        if (currentDot) {
            currentDot.classList.add('playing');
            setTimeout(() => currentDot.classList.remove('playing'), 120);
        }

        beatIdx = (beatIdx + 1) % 8;
    }

    function startPlayback() {
        if (isPlaying) return;

        // Generate a fresh set of lines with new spacing for each run
        generateLines();

        isPlaying = true;
        playPauseBtn.classList.add('playing');
        if (playIconEl) playIconEl.src = 'assets/simple_play.svg'; // red arrow icon
        const FIXED_BPM = 220; // Hard-coded tempo
        const baseInterval = 60000 / FIXED_BPM;
        const patInterval = ALWAYS_DOUBLETIME ? baseInterval / 2 : baseInterval;
        patTimer = setInterval(playPattern, patInterval);
        beatIdx = 0;
        beatTimer = setInterval(playBeat, baseInterval / 2);
        // Randomize musical key on each new playback start
        randomizeKey();
    }

    function stopPlayback() {
        if (!isPlaying) return;
        isPlaying = false;
        playPauseBtn.classList.remove('playing');
        if (playIconEl) playIconEl.src = 'assets/simple_play.svg'; // grey stop icon
        clearInterval(patTimer);
        clearInterval(beatTimer);
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const now = performance.now();
        for (const ln of lines) {
            let col = 'black', sx = 0;
            if (ln.activated) {
                const e = now - ln.time;
                if (e < ln.duration) {
                    col = 'red';
                    const t = e / 1000;
                    const ang = 2 * Math.PI * DEFAULTS.vibFreq * t;
                    const damp = 1 - e / ln.duration;
                    sx = ln.maxAmplitude * damp * Math.sin(ang);
                } else {
                    ln.activated = false;
                }
            }
            ctx.strokeStyle = col;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(ln.x1 + sx, ln.y1);
            ctx.lineTo(ln.x2 + sx, ln.y2);
            ctx.stroke();
        }
        requestAnimationFrame(draw);
    }

    /* ==== Event Bindings ==== */

    // Beat dot toggles
    beatDots.forEach(dot => {
        const idx = parseInt(dot.dataset.index, 10);
        dot.addEventListener('click', () => {
            beatOn[idx] = !beatOn[idx];
            dot.classList.toggle('active', beatOn[idx]);
        });
    });

    // Canvas interaction
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', () => {
        generateLines();
        randomizeBeats();
        randomizeKey();
    });

    function onMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const P = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        for (const ln of lines) {
            if (ln.activated) continue;
            const A = { x: ln.x1, y: ln.y1 };
            const B = { x: ln.x2, y: ln.y2 };
            const AB = { x: B.x - A.x, y: B.y - A.y };
            const AP = { x: P.x - A.x, y: P.y - A.y };
            const mag2 = AB.x * AB.x + AB.y * AB.y;
            const t = Math.max(0, Math.min(1, (AP.x * AB.x + AP.y * AB.y) / mag2));
            const C = { x: A.x + AB.x * t, y: A.y + AB.y * t };
            const dist = Math.hypot(P.x - C.x, P.y - C.y);
            if (dist < 5) {
                ln.activated = true;
                ln.time = performance.now();
                ln.duration = DEFAULTS.duration;
                ln.maxAmplitude = DEFAULTS.maxAmplitude;
                const deg = ln.i % pentatonic.length;
                const oct = Math.floor(ln.i / pentatonic.length);
                playNote(pentatonic[deg] * Math.pow(2, oct));
                break;
            }
        }
    }

    // UI Bindings
    playPauseBtn.addEventListener('click', () => {
        isPlaying ? stopPlayback() : startPlayback();
        if (clickPrompt) {
            clickPrompt.style.display = 'none';
        }
    });

    window.addEventListener('resize', generateLines);

    // Keyboard shortcut (spacebar) to toggle play / pause
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            isPlaying ? stopPlayback() : startPlayback();
            if (clickPrompt) {
                clickPrompt.style.display = 'none';
            }
        }
    });

    // Background clicks (outside any element) trigger a new line pattern
    document.body.addEventListener('click', (e) => {
        // If the click landed directly on <body> or <html>, treat as background
        if (e.target === document.body || e.target === document.documentElement) {
            generateLines();
            randomizeBeats();
            randomizeKey();
        }
    });

    /* ==== Initialization ==== */
    randomizeKey();
    generateLines();
    randomizeBeats();
    draw();

    // ---- Audio Warm-Up -------------------------------------------------------
    // Some browsers take noticeable time to spin-up AudioContext the first time a
    // sound is played. We prime it on the very first user gesture (click / touch)
    // so later hover events respond instantly.
    function warmUpAudio() {
        if (audioCtx) return; // already initialised
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            // Create a silent oscillator for a few ms just to initialise the graph
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            gain.gain.value = 0; // silence
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.02);
        } catch (e) {
            console.warn('Audio warm-up failed', e);
        }
    }

    // Attempt warm-up immediately on page load
    warmUpAudio();

    // If autoplay policy suspends the context, resume on first user gesture
    if (!audioCtx || audioCtx.state === 'suspended') {
        const resumeAudio = () => {
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            window.removeEventListener('pointerdown', resumeAudio);
        };
        window.addEventListener('pointerdown', resumeAudio, { once: true });
    }
    // -------------------------------------------------------------------------

    // Hide the prompt after the first user click on the page
    window.addEventListener('click', () => {
        if (clickPrompt) {
            clickPrompt.style.display = 'none';
        }
    }, { once: true });
})(); 