// Navier–Stokes particle fluid after Amanda Ghassaei's gpu-io example
// (MIT, https://github.com/amandaghassaei/gpu-io/tree/main/examples/fluid).
// Same-origin so the blog can auto-stir without a mouse.

(function () {
    const params = new URLSearchParams(window.location.search);
    const isTile = params.get('tile') === '1';
    const interactive = params.get('interactive') !== '0' && !isTile;
    const autoStir = params.get('stir') !== '0';

    if (isTile) document.body.classList.add('tile');

    function fail(message) {
        document.body.classList.add('fallback');
        const el = document.getElementById('fallback');
        if (el && message) el.textContent = message;
    }

    const GPUIO = window.GPUIO;
    if (!GPUIO) {
        fail('Could not load the GPU simulation library.');
        return;
    }

    const {
        GPUComposer,
        GPUProgram,
        GPULayer,
        SHORT,
        INT,
        FLOAT,
        REPEAT,
        NEAREST,
        LINEAR,
        WEBGL2,
        GLSL3,
        isWebGL2Supported,
    } = GPUIO;

    if (typeof isWebGL2Supported === 'function' && !isWebGL2Supported()) {
        fail('This Navier–Stokes sketch needs WebGL 2.');
        return;
    }

    const PARAMS = { trailLength: isTile ? 10 : 15 };
    const TOUCH_FORCE_SCALE = 2;
    const PARTICLE_DENSITY = isTile ? 0.06 : 0.1;
    const MAX_NUM_PARTICLES = isTile ? 18000 : 100000;
    const PARTICLE_LIFETIME = 1000;
    const NUM_JACOBI_STEPS = isTile ? 2 : 3;
    const PRESSURE_CALC_ALPHA = -1;
    const PRESSURE_CALC_BETA = 0.25;
    const NUM_RENDER_STEPS = isTile ? 2 : 3;
    const VELOCITY_SCALE_FACTOR = isTile ? 10 : 8;
    const MAX_VELOCITY = 30;
    const POSITION_NUM_COMPONENTS = 4;
    const STIR_AMPLIFY = 10;

    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    let composer;
    try {
        composer = new GPUComposer({ canvas, contextID: WEBGL2, glslVersion: GLSL3 });
    } catch (err) {
        console.error(err);
        fail('This Navier–Stokes sketch needs WebGL 2.');
        return;
    }

    function calcNumParticles(width, height) {
        return Math.min(Math.ceil(width * height * PARTICLE_DENSITY), MAX_NUM_PARTICLES);
    }

    let NUM_PARTICLES = calcNumParticles(canvas.width, canvas.height);
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    const velocityState = new GPULayer(composer, {
        name: 'velocity',
        dimensions: [Math.max(1, Math.ceil(width / VELOCITY_SCALE_FACTOR)), Math.max(1, Math.ceil(height / VELOCITY_SCALE_FACTOR))],
        type: FLOAT,
        filter: LINEAR,
        numComponents: 2,
        wrapX: REPEAT,
        wrapY: REPEAT,
        numBuffers: 2,
    });
    const divergenceState = new GPULayer(composer, {
        name: 'divergence',
        dimensions: [velocityState.width, velocityState.height],
        type: FLOAT,
        filter: NEAREST,
        numComponents: 1,
        wrapX: REPEAT,
        wrapY: REPEAT,
    });
    const pressureState = new GPULayer(composer, {
        name: 'pressure',
        dimensions: [velocityState.width, velocityState.height],
        type: FLOAT,
        filter: NEAREST,
        numComponents: 1,
        wrapX: REPEAT,
        wrapY: REPEAT,
        numBuffers: 2,
    });
    const particlePositionState = new GPULayer(composer, {
        name: 'position',
        dimensions: NUM_PARTICLES,
        type: FLOAT,
        numComponents: POSITION_NUM_COMPONENTS,
        numBuffers: 2,
    });
    const particleInitialState = new GPULayer(composer, {
        name: 'initialPosition',
        dimensions: NUM_PARTICLES,
        type: FLOAT,
        numComponents: POSITION_NUM_COMPONENTS,
        numBuffers: 1,
    });
    const particleAgeState = new GPULayer(composer, {
        name: 'age',
        dimensions: NUM_PARTICLES,
        type: SHORT,
        numComponents: 1,
        numBuffers: 2,
    });
    const trailState = new GPULayer(composer, {
        name: 'trails',
        dimensions: [Math.max(1, canvas.width), Math.max(1, canvas.height)],
        type: FLOAT,
        filter: NEAREST,
        numComponents: 1,
        numBuffers: 2,
    });

    const advection = new GPUProgram(composer, {
        name: 'advection',
        fragmentShader: `
            in vec2 v_uv;
            uniform sampler2D u_state;
            uniform sampler2D u_velocity;
            uniform vec2 u_dimensions;
            out vec2 out_state;
            void main() {
                out_state = texture(u_state, v_uv - texture(u_velocity, v_uv).xy / u_dimensions).xy;
            }`,
        uniforms: [
            { name: 'u_state', value: 0, type: INT },
            { name: 'u_velocity', value: 1, type: INT },
            { name: 'u_dimensions', value: [canvas.width, canvas.height], type: FLOAT },
        ],
    });
    const divergence2D = new GPUProgram(composer, {
        name: 'divergence2D',
        fragmentShader: `
            in vec2 v_uv;
            uniform sampler2D u_vectorField;
            uniform vec2 u_pxSize;
            out float out_divergence;
            void main() {
                float n = texture(u_vectorField, v_uv + vec2(0, u_pxSize.y)).y;
                float s = texture(u_vectorField, v_uv - vec2(0, u_pxSize.y)).y;
                float e = texture(u_vectorField, v_uv + vec2(u_pxSize.x, 0)).x;
                float w = texture(u_vectorField, v_uv - vec2(u_pxSize.x, 0)).x;
                out_divergence = 0.5 * ( e - w + n - s);
            }`,
        uniforms: [
            { name: 'u_vectorField', value: 0, type: INT },
            { name: 'u_pxSize', value: [1 / velocityState.width, 1 / velocityState.height], type: FLOAT },
        ],
    });
    const jacobi = new GPUProgram(composer, {
        name: 'jacobi',
        fragmentShader: `
            in vec2 v_uv;
            uniform float u_alpha;
            uniform float u_beta;
            uniform vec2 u_pxSize;
            uniform sampler2D u_previousState;
            uniform sampler2D u_divergence;
            out vec4 out_jacobi;
            void main() {
                vec4 n = texture(u_previousState, v_uv + vec2(0, u_pxSize.y));
                vec4 s = texture(u_previousState, v_uv - vec2(0, u_pxSize.y));
                vec4 e = texture(u_previousState, v_uv + vec2(u_pxSize.x, 0));
                vec4 w = texture(u_previousState, v_uv - vec2(u_pxSize.x, 0));
                vec4 d = texture(u_divergence, v_uv);
                out_jacobi = (n + s + e + w + u_alpha * d) * u_beta;
            }`,
        uniforms: [
            { name: 'u_alpha', value: PRESSURE_CALC_ALPHA, type: FLOAT },
            { name: 'u_beta', value: PRESSURE_CALC_BETA, type: FLOAT },
            { name: 'u_pxSize', value: [1 / velocityState.width, 1 / velocityState.height], type: FLOAT },
            { name: 'u_previousState', value: 0, type: INT },
            { name: 'u_divergence', value: 1, type: INT },
        ],
    });
    const gradientSubtraction = new GPUProgram(composer, {
        name: 'gradientSubtraction',
        fragmentShader: `
            in vec2 v_uv;
            uniform vec2 u_pxSize;
            uniform sampler2D u_scalarField;
            uniform sampler2D u_vectorField;
            out vec2 out_result;
            void main() {
                float n = texture(u_scalarField, v_uv + vec2(0, u_pxSize.y)).r;
                float s = texture(u_scalarField, v_uv - vec2(0, u_pxSize.y)).r;
                float e = texture(u_scalarField, v_uv + vec2(u_pxSize.x, 0)).r;
                float w = texture(u_scalarField, v_uv - vec2(u_pxSize.x, 0)).r;
                out_result = texture2D(u_vectorField, v_uv).xy - 0.5 * vec2(e - w, n - s);
            }`,
        uniforms: [
            { name: 'u_pxSize', value: [1 / velocityState.width, 1 / velocityState.height], type: FLOAT },
            { name: 'u_scalarField', value: 0, type: INT },
            { name: 'u_vectorField', value: 1, type: INT },
        ],
    });
    const renderParticles = new GPUProgram(composer, {
        name: 'renderParticles',
        fragmentShader: `
            #define FADE_TIME 0.1
            in vec2 v_uv;
            in vec2 v_uv_position;
            uniform isampler2D u_ages;
            uniform sampler2D u_velocity;
            out float out_state;
            void main() {
                float ageFraction = float(texture(u_ages, v_uv_position).x) / ${PARTICLE_LIFETIME.toFixed(1)};
                float opacity = mix(0.0, 1.0, min(ageFraction * 10.0, 1.0)) * mix(1.0, 0.0, max(ageFraction * 10.0 - 90.0, 0.0));
                vec2 velocity = texture(u_velocity, v_uv).xy;
                float multiplier = clamp(dot(velocity, velocity) * 0.05 + 0.7, 0.0, 1.0);
                out_state = opacity * multiplier;
            }`,
        uniforms: [
            { name: 'u_ages', value: 0, type: INT },
            { name: 'u_velocity', value: 1, type: INT },
        ],
    });
    const ageParticles = new GPUProgram(composer, {
        name: 'ageParticles',
        fragmentShader: `
            in vec2 v_uv;
            uniform isampler2D u_ages;
            out int out_age;
            void main() {
                int age = texture(u_ages, v_uv).x + 1;
                out_age = stepi(age, ${PARTICLE_LIFETIME}) * age;
            }`,
        uniforms: [{ name: 'u_ages', value: 0, type: INT }],
    });
    const advectParticles = new GPUProgram(composer, {
        name: 'advectParticles',
        fragmentShader: `
            in vec2 v_uv;
            uniform vec2 u_dimensions;
            uniform sampler2D u_positions;
            uniform sampler2D u_velocity;
            uniform isampler2D u_ages;
            uniform sampler2D u_initialPositions;
            out vec4 out_position;
            void main() {
                vec4 positionData = texture(u_positions, v_uv);
                vec2 absolute = positionData.rg;
                vec2 displacement = positionData.ba;
                vec2 position = absolute + displacement;
                vec2 pxSize = 1.0 / u_dimensions;
                vec2 velocity1 = texture(u_velocity, position * pxSize).xy;
                vec2 halfStep = position + velocity1 * 0.5 * ${1 / NUM_RENDER_STEPS};
                vec2 velocity2 = texture(u_velocity, halfStep * pxSize).xy;
                displacement += velocity2 * ${1 / NUM_RENDER_STEPS};
                float shouldMerge = step(20.0, dot(displacement, displacement));
                absolute = mod(absolute + shouldMerge * displacement + u_dimensions, u_dimensions);
                displacement *= (1.0 - shouldMerge);
                int shouldReset = stepi(texture(u_ages, v_uv).x, 1);
                out_position = mix(vec4(absolute, displacement), texture(u_initialPositions, v_uv), float(shouldReset));
            }`,
        uniforms: [
            { name: 'u_positions', value: 0, type: INT },
            { name: 'u_velocity', value: 1, type: INT },
            { name: 'u_ages', value: 2, type: INT },
            { name: 'u_initialPositions', value: 3, type: INT },
            { name: 'u_dimensions', value: [canvas.width, canvas.height], type: FLOAT },
        ],
    });
    const fadeTrails = new GPUProgram(composer, {
        name: 'fadeTrails',
        fragmentShader: `
            in vec2 v_uv;
            uniform sampler2D u_image;
            uniform float u_increment;
            out float out_color;
            void main() {
                out_color = max(texture(u_image, v_uv).x + u_increment, 0.0);
            }`,
        uniforms: [
            { name: 'u_image', value: 0, type: INT },
            { name: 'u_increment', value: -1 / PARAMS.trailLength, type: FLOAT },
        ],
    });
    const renderTrails = new GPUProgram(composer, {
        name: 'renderTrails',
        fragmentShader: `
            in vec2 v_uv;
            uniform sampler2D u_trailState;
            out vec4 out_color;
            void main() {
                vec3 background = vec3(0.98, 0.922, 0.843);
                vec3 particle = vec3(0, 0, 0.2);
                out_color = vec4(mix(background, particle, texture(u_trailState, v_uv).x), 1);
            }`,
    });
    const touch = new GPUProgram(composer, {
        name: 'touch',
        fragmentShader: `
            in vec2 v_uv;
            in vec2 v_uv_local;
            uniform sampler2D u_velocity;
            uniform vec2 u_vector;
            out vec2 out_velocity;
            void main() {
                vec2 radialVec = (v_uv_local * 2.0 - 1.0);
                float radiusSq = dot(radialVec, radialVec);
                vec2 velocity = texture(u_velocity, v_uv).xy + (1.0 - radiusSq) * u_vector * ${TOUCH_FORCE_SCALE.toFixed(1)};
                float velocityMag = length(velocity);
                out_velocity = velocity / velocityMag * min(velocityMag, ${MAX_VELOCITY.toFixed(1)});
            }`,
        uniforms: [
            { name: 'u_velocity', value: 0, type: INT },
            { name: 'u_vector', value: [0, 0], type: FLOAT },
        ],
    });

    function applyForce(x, y, lastX, lastY, amplify) {
        if (x === lastX && y === lastY) return;
        const scale = amplify || 1;
        touch.setUniform('u_vector', [(x - lastX) * scale, -(y - lastY) * scale]);
        composer.stepSegment({
            program: touch,
            input: velocityState,
            output: velocityState,
            position1: [x, canvas.clientHeight - y],
            position2: [lastX, canvas.clientHeight - lastY],
            thickness: isTile ? 22 : 30,
            endCaps: true,
        });
    }

    const stirrers = [
        { wx: 0.00115, wy: 0.00173, rx: 0.34, ry: 0.30, phase: 0.4, last: null },
        { wx: 0.00082, wy: 0.00141, rx: 0.22, ry: 0.38, phase: 2.6, last: null },
        { wx: 0.00158, wy: 0.00097, rx: 0.40, ry: 0.18, phase: 4.1, last: null },
    ];
    let userActiveUntil = 0;

    function stir(now) {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (w < 2 || h < 2) return;
        stirrers.forEach((s) => {
            const x = w * (0.5 + s.rx * Math.sin(now * s.wx + s.phase));
            const y = h * (0.5 + s.ry * Math.sin(now * s.wy + s.phase * 1.7));
            if (s.last) applyForce(x, y, s.last[0], s.last[1], STIR_AMPLIFY);
            s.last = [x, y];
        });
    }

    function loop() {
        if (autoStir && performance.now() > userActiveUntil) {
            stir(performance.now());
        }

        composer.step({ program: advection, input: [velocityState, velocityState], output: velocityState });
        composer.step({ program: divergence2D, input: velocityState, output: divergenceState });
        for (let i = 0; i < NUM_JACOBI_STEPS; i++) {
            composer.step({ program: jacobi, input: [pressureState, divergenceState], output: pressureState });
        }
        composer.step({ program: gradientSubtraction, input: [pressureState, velocityState], output: velocityState });

        composer.step({ program: ageParticles, input: particleAgeState, output: particleAgeState });
        composer.step({ program: fadeTrails, input: trailState, output: trailState });
        for (let i = 0; i < NUM_RENDER_STEPS; i++) {
            composer.step({
                program: advectParticles,
                input: [particlePositionState, velocityState, particleAgeState, particleInitialState],
                output: particlePositionState,
            });
            composer.drawLayerAsPoints({
                layer: particlePositionState,
                program: renderParticles,
                input: [particleAgeState, velocityState],
                output: trailState,
                wrapX: true,
                wrapY: true,
            });
        }
        composer.step({ program: renderTrails, input: trailState });
    }

    const activeTouches = {};
    function onPointerMove(e) {
        const x = e.clientX;
        const y = e.clientY;
        userActiveUntil = performance.now() + 2500;
        if (activeTouches[e.pointerId] === undefined) {
            activeTouches[e.pointerId] = { current: [x, y] };
            return;
        }
        activeTouches[e.pointerId].last = activeTouches[e.pointerId].current;
        activeTouches[e.pointerId].current = [x, y];
        const { current, last } = activeTouches[e.pointerId];
        if (current[0] === last[0] && current[1] === last[1]) return;
        applyForce(current[0], current[1], last[0], last[1], 1);
    }
    function onPointerStop(e) {
        delete activeTouches[e.pointerId];
    }
    if (interactive) {
        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerup', onPointerStop);
        canvas.addEventListener('pointerout', onPointerStop);
        canvas.addEventListener('pointercancel', onPointerStop);
    }

    let lastSize = [0, 0];
    function onResize() {
        const nextWidth = Math.max(1, window.innerWidth);
        const nextHeight = Math.max(1, window.innerHeight);
        if (nextWidth === lastSize[0] && nextHeight === lastSize[1]) return;
        lastSize = [nextWidth, nextHeight];
        composer.resize([nextWidth, nextHeight]);

        const velocityDimensions = [
            Math.max(1, Math.ceil(nextWidth / VELOCITY_SCALE_FACTOR)),
            Math.max(1, Math.ceil(nextHeight / VELOCITY_SCALE_FACTOR)),
        ];
        velocityState.resize(velocityDimensions);
        divergenceState.resize(velocityDimensions);
        pressureState.resize(velocityDimensions);
        trailState.resize([nextWidth, nextHeight]);

        advection.setUniform('u_dimensions', [nextWidth, nextHeight]);
        advectParticles.setUniform('u_dimensions', [nextWidth, nextHeight]);
        const velocityPxSize = [1 / velocityDimensions[0], 1 / velocityDimensions[1]];
        divergence2D.setUniform('u_pxSize', velocityPxSize);
        jacobi.setUniform('u_pxSize', velocityPxSize);
        gradientSubtraction.setUniform('u_pxSize', velocityPxSize);

        NUM_PARTICLES = calcNumParticles(nextWidth, nextHeight);
        const positions = new Float32Array(NUM_PARTICLES * 4);
        for (let i = 0; i < positions.length / 4; i++) {
            positions[POSITION_NUM_COMPONENTS * i] = Math.random() * nextWidth;
            positions[POSITION_NUM_COMPONENTS * i + 1] = Math.random() * nextHeight;
        }
        particlePositionState.resize(NUM_PARTICLES, positions);
        particleInitialState.resize(NUM_PARTICLES, positions);
        const ages = new Int16Array(NUM_PARTICLES);
        for (let i = 0; i < NUM_PARTICLES; i++) {
            ages[i] = Math.round(Math.random() * PARTICLE_LIFETIME);
        }
        particleAgeState.resize(NUM_PARTICLES, ages);
        stirrers.forEach((s) => { s.last = null; });
    }
    let resizeTimer = 0;
    function requestResize() {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(onResize, 80);
    }
    window.addEventListener('resize', requestResize);
    if (window.ResizeObserver) {
        new ResizeObserver(requestResize).observe(document.documentElement);
    }
    onResize();

    // Seed the field so the first paint is not an empty cream square.
    const seedAt = performance.now();
    for (let i = 0; i < 24; i++) stir(seedAt + i * 40);

    function frame() {
        window.requestAnimationFrame(frame);
        if (document.hidden) return;
        if (composer.tick) composer.tick();
        loop();
    }
    frame();
})();
