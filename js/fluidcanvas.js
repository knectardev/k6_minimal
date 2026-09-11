// Same-origin Navier–Stokes dye sim for blog heroes/tiles.
// Visual homage to Jonas Wagner's 2012 canvas experiment (29a.ch);
// this is an original implementation so it can auto-stir without an iframe.
(function (global) {
    function mount(canvas, options) {
        if (!canvas || !canvas.getContext) return;
        const opts = options || {};
        const isTile = !!opts.tile;
        const interactive = opts.interactive !== false;
        const N = isTile ? 48 : 64;
        const size = N + 2;
        const iter = isTile ? 4 : 8;
        const dt = 0.08;
        const visc = 0.00005;
        const diff = 0.000002;
        const vmax = 0.12;
        const ctx = canvas.getContext('2d', { alpha: false });

        function arr() { return new Float32Array(size * size); }
        function IX(i, j) { return i + size * j; }

        const u = arr(), v = arr(), u0 = arr(), v0 = arr();
        const r = arr(), g = arr(), b = arr(), r0 = arr(), g0 = arr(), b0 = arr();
        const p = arr(), div = arr();

        function addSource(x, s, a) {
            for (let i = 0; i < x.length; i++) x[i] += a * s[i];
        }

        function setBounds(bound, x) {
            for (let i = 1; i <= N; i++) {
                x[IX(0, i)] = bound === 1 ? -x[IX(1, i)] : x[IX(1, i)];
                x[IX(N + 1, i)] = bound === 1 ? -x[IX(N, i)] : x[IX(N, i)];
                x[IX(i, 0)] = bound === 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
                x[IX(i, N + 1)] = bound === 2 ? -x[IX(i, N)] : x[IX(i, N)];
            }
            x[IX(0, 0)] = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
            x[IX(0, N + 1)] = 0.5 * (x[IX(1, N + 1)] + x[IX(0, N)]);
            x[IX(N + 1, 0)] = 0.5 * (x[IX(N, 0)] + x[IX(N + 1, 1)]);
            x[IX(N + 1, N + 1)] = 0.5 * (x[IX(N, N + 1)] + x[IX(N + 1, N)]);
        }

        function linSolve(bound, x, x0, a, c) {
            const inv = 1 / c;
            for (let k = 0; k < iter; k++) {
                for (let j = 1; j <= N; j++) {
                    for (let i = 1; i <= N; i++) {
                        x[IX(i, j)] = (x0[IX(i, j)] + a * (
                            x[IX(i - 1, j)] + x[IX(i + 1, j)] +
                            x[IX(i, j - 1)] + x[IX(i, j + 1)]
                        )) * inv;
                    }
                }
                setBounds(bound, x);
            }
        }

        function diffuse(bound, x, x0, d) {
            const a = dt * d * N * N;
            linSolve(bound, x, x0, a, 1 + 4 * a);
        }

        function advect(bound, d, d0, uu, vv) {
            const dt0 = dt * N;
            for (let j = 1; j <= N; j++) {
                for (let i = 1; i <= N; i++) {
                    let x = i - dt0 * uu[IX(i, j)];
                    let y = j - dt0 * vv[IX(i, j)];
                    if (x < 0.5) x = 0.5;
                    if (x > N + 0.5) x = N + 0.5;
                    if (y < 0.5) y = 0.5;
                    if (y > N + 0.5) y = N + 0.5;
                    const i0 = Math.floor(x);
                    const i1 = i0 + 1;
                    const j0 = Math.floor(y);
                    const j1 = j0 + 1;
                    const s1 = x - i0;
                    const s0 = 1 - s1;
                    const t1 = y - j0;
                    const t0 = 1 - t1;
                    d[IX(i, j)] =
                        s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) +
                        s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
                }
            }
            setBounds(bound, d);
        }

        function project(uu, vv, pp, dv) {
            const h = 1 / N;
            for (let j = 1; j <= N; j++) {
                for (let i = 1; i <= N; i++) {
                    dv[IX(i, j)] = -0.5 * h * (
                        uu[IX(i + 1, j)] - uu[IX(i - 1, j)] +
                        vv[IX(i, j + 1)] - vv[IX(i, j - 1)]
                    );
                    pp[IX(i, j)] = 0;
                }
            }
            setBounds(0, dv);
            setBounds(0, pp);
            linSolve(0, pp, dv, 1, 4);
            for (let j = 1; j <= N; j++) {
                for (let i = 1; i <= N; i++) {
                    uu[IX(i, j)] -= 0.5 * (pp[IX(i + 1, j)] - pp[IX(i - 1, j)]) / h;
                    vv[IX(i, j)] -= 0.5 * (pp[IX(i, j + 1)] - pp[IX(i, j - 1)]) / h;
                }
            }
            setBounds(1, uu);
            setBounds(2, vv);
        }

        function clampVel(uu, vv) {
            for (let i = 0; i < uu.length; i++) {
                if (uu[i] > vmax) uu[i] = vmax;
                else if (uu[i] < -vmax) uu[i] = -vmax;
                if (vv[i] > vmax) vv[i] = vmax;
                else if (vv[i] < -vmax) vv[i] = -vmax;
            }
        }

        function velStep() {
            addSource(u, u0, 1);
            addSource(v, v0, 1);
            u0.fill(0);
            v0.fill(0);
            diffuse(1, u0, u, visc);
            diffuse(2, v0, v, visc);
            project(u0, v0, p, div);
            advect(1, u, u0, u0, v0);
            advect(2, v, v0, u0, v0);
            clampVel(u, v);
            project(u, v, p, div);
        }

        function densStep() {
            addSource(r, r0, dt);
            addSource(g, g0, dt);
            addSource(b, b0, dt);
            r0.fill(0); g0.fill(0); b0.fill(0);
            diffuse(0, r0, r, diff);
            diffuse(0, g0, g, diff);
            diffuse(0, b0, b, diff);
            advect(0, r, r0, u, v);
            advect(0, g, g0, u, v);
            advect(0, b, b0, u, v);
            for (let i = 0; i < r.length; i++) {
                const mass = r[i] + g[i] + b[i];
                const fade = mass > 2.0 ? 0.94 : 0.984;
                r[i] = Math.min(r[i] * fade, 1.55);
                g[i] = Math.min(g[i] * fade, 1.55);
                b[i] = Math.min(b[i] * fade, 1.55);
            }
        }

        function hsv(h) {
            const s = 0.85, vv = 1;
            const i = Math.floor(h * 6);
            const f = h * 6 - i;
            const p0 = vv * (1 - s);
            const q = vv * (1 - f * s);
            const t = vv * (1 - (1 - f) * s);
            switch (i % 6) {
                case 0: return [vv, t, p0];
                case 1: return [q, vv, p0];
                case 2: return [p0, vv, t];
                case 3: return [p0, q, vv];
                case 4: return [t, p0, vv];
                default: return [vv, p0, q];
            }
        }

        function splat(nx, ny, dx, dy, hueVal, velScale, dye) {
            const i = Math.max(1, Math.min(N, Math.floor(nx * N) + 1));
            const j = Math.max(1, Math.min(N, Math.floor(ny * N) + 1));
            const rgb = hsv(hueVal);
            const rad = 2;
            const dyeAmt = dye == null ? 2.1 : dye;
            const vs = velScale == null ? 8 : velScale;
            for (let y = -rad; y <= rad; y++) {
                for (let x = -rad; x <= rad; x++) {
                    const ii = i + x, jj = j + y;
                    if (ii < 1 || ii > N || jj < 1 || jj > N) continue;
                    const w = Math.exp(-(x * x + y * y) * 0.28);
                    const idx = IX(ii, jj);
                    r0[idx] += rgb[0] * w * dyeAmt;
                    g0[idx] += rgb[1] * w * dyeAmt;
                    b0[idx] += rgb[2] * w * dyeAmt;
                    u0[idx] += dx * w * vs;
                    v0[idx] += dy * w * vs;
                }
            }
        }

        function clientToNorm(e) {
            const rect = canvas.getBoundingClientRect();
            const src = e.touches ? e.touches[0] : e;
            return {
                x: (src.clientX - rect.left) / Math.max(rect.width, 1),
                y: (src.clientY - rect.top) / Math.max(rect.height, 1)
            };
        }

        let pointer = null;
        let lastUser = -1e9;
        let hue = 0.08;
        let time = 0;
        const agents = [
            { x: 0.18, y: 0.22 },
            { x: 0.82, y: 0.28 },
            { x: 0.22, y: 0.78 }
        ];

        if (interactive) {
            function onDown(e) {
                pointer = clientToNorm(e);
                lastUser = performance.now();
            }
            function onMove(e) {
                if (!pointer && !(e.buttons || (e.touches && e.touches.length))) return;
                if (e.preventDefault) e.preventDefault();
                const pt = clientToNorm(e);
                if (pointer) {
                    hue = (hue + 0.012) % 1;
                    splat(pt.x, pt.y, pt.x - pointer.x, pt.y - pointer.y, 0.08 + (hue % 0.2), 14, 3.5);
                }
                pointer = pt;
                lastUser = performance.now();
            }
            function onUp() { pointer = null; }

            canvas.addEventListener('mousedown', onDown);
            canvas.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
            canvas.addEventListener('touchstart', onDown, { passive: true });
            canvas.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('touchend', onUp);
        }

        function agentPos(t, k) {
            if (k === 0) {
                return {
                    x: 0.5 + 0.44 * Math.sin(t * 0.84),
                    y: 0.5 + 0.44 * Math.sin(t * 0.53 + 1.3)
                };
            }
            if (k === 1) {
                return {
                    x: 0.5 + 0.44 * Math.sin(t * 0.61 + 2.2),
                    y: 0.5 + 0.44 * Math.cos(t * 0.97 + 0.4)
                };
            }
            const sweep = t * 0.065;
            return {
                x: sweep - Math.floor(sweep),
                y: 0.5 + 0.42 * Math.sin(t * 1.08 + 0.7)
            };
        }

        function autoStir(now) {
            time += 0.05;
            if (now - lastUser < 900) return;
            hue = (hue + 0.005) % 0.2;
            for (let k = 0; k < 3; k++) {
                const pos = agentPos(time, k);
                const prev = agents[k];
                let dx = pos.x - prev.x;
                let dy = pos.y - prev.y;
                if (dx > 0.5) dx -= 1;
                if (dx < -0.5) dx += 1;
                splat(pos.x, pos.y, dx, dy, 0.07 + hue + k * 0.06, 8, 2.0);
                agents[k] = pos;
            }
        }

        for (let n = 0; n < 16; n++) {
            autoStir(1e12);
            velStep();
            densStep();
        }

        const buffer = document.createElement('canvas');
        buffer.width = N;
        buffer.height = N;
        const bctx = buffer.getContext('2d');
        const img = bctx.createImageData(N, N);
        const px = img.data;

        function draw() {
            let p = 0;
            for (let j = 1; j <= N; j++) {
                for (let i = 1; i <= N; i++) {
                    const idx = IX(i, j);
                    px[p++] = Math.max(0, Math.min(255, 12 + r[idx] * 70));
                    px[p++] = Math.max(0, Math.min(255, 90 + g[idx] * 48));
                    px[p++] = Math.max(0, Math.min(255, 95 + b[idx] * 52));
                    px[p++] = 255;
                }
            }
            bctx.putImageData(img, 0, 0);
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(buffer, 0, 0, canvas.width, canvas.height);
        }

        function frame(now) {
            autoStir(now);
            velStep();
            densStep();
            draw();
            requestAnimationFrame(frame);
        }

        function fit() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = Math.max(1, canvas.clientWidth || canvas.offsetWidth || 340);
            const h = Math.max(1, canvas.clientHeight || canvas.offsetHeight || 200);
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
        }

        fit();
        window.addEventListener('resize', fit);
        requestAnimationFrame(function start() {
            fit();
            requestAnimationFrame(frame);
        });
    }

    global.KnectarFluid = { mount: mount };
})(window);
