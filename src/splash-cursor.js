import { Renderer, Program, Mesh, Triangle, RenderTarget } from 'ogl';

export class SplashCursor {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            SIM_RESOLUTION: options.SIM_RESOLUTION || 128,
            DYE_RESOLUTION: options.DYE_RESOLUTION || 1440,
            DENSITY_DISSIPATION: options.DENSITY_DISSIPATION || 3.5,
            VELOCITY_DISSIPATION: options.VELOCITY_DISSIPATION || 2.0,
            PRESSURE: options.PRESSURE || 0.1,
            CURL: options.CURL || 3.0,
            SPLAT_RADIUS: options.SPLAT_RADIUS || 0.2,
            SPLAT_FORCE: options.SPLAT_FORCE || 6000,
            COLOR_UPDATE_SPEED: options.COLOR_UPDATE_SPEED || 10,
            BACK_COLOR: options.BACK_COLOR || { r: 0, g: 0, b: 0 },
            TRANSPARENT: options.TRANSPARENT !== undefined ? options.TRANSPARENT : true,
            ...options
        };

        this.mouse = { x: 0.5, y: 0.5, dx: 0, dy: 0, moved: false };
        this.init();
    }

    init() {
        this.renderer = new Renderer({ 
            alpha: this.options.TRANSPARENT,
            premultipliedAlpha: false,
            antialias: false
        });
        const gl = this.renderer.gl;
        this.gl = gl;
        this.container.appendChild(gl.canvas);

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Shaders
        const baseVertex = /* glsl */ `
            attribute vec2 position;
            attribute vec2 uv;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform vec2 texelSize;
            void main() {
                vUv = uv;
                vL = vUv - vec2(texelSize.x, 0.0);
                vR = vUv + vec2(texelSize.x, 0.0);
                vT = vUv + vec2(0.0, texelSize.y);
                vB = vUv - vec2(0.0, texelSize.y);
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const clearShader = /* glsl */ `
            precision mediump float;
            varying vec2 vUv;
            uniform sampler2D uTexture;
            uniform float value;
            void main () {
                gl_FragColor = value * texture2D(uTexture, vUv);
            }
        `;

        const splatShader = /* glsl */ `
            precision highp float;
            varying vec2 vUv;
            uniform sampler2D uTarget;
            uniform float aspectRatio;
            uniform vec3 color;
            uniform vec2 point;
            uniform float radius;
            void main () {
                vec2 p = vUv - point.xy;
                p.x *= aspectRatio;
                vec3 splat = exp(-dot(p, p) / radius) * color;
                vec3 base = texture2D(uTarget, vUv).xyz;
                gl_FragColor = vec4(base + splat, 1.0);
            }
        `;

        const advectionShader = /* glsl */ `
            precision highp float;
            varying vec2 vUv;
            uniform sampler2D uVelocity;
            uniform sampler2D uSource;
            uniform vec2 texelSize;
            uniform float dt;
            uniform float dissipation;
            void main () {
                vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
                gl_FragColor = dissipation * texture2D(uSource, coord);
            }
        `;

        const divergenceShader = /* glsl */ `
            precision mediump float;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uVelocity;
            void main () {
                float L = texture2D(uVelocity, vL).x;
                float R = texture2D(uVelocity, vR).x;
                float T = texture2D(uVelocity, vT).y;
                float B = texture2D(uVelocity, vB).y;
                float div = 0.5 * (R - L + T - B);
                gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
            }
        `;

        const curlShader = /* glsl */ `
            precision mediump float;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uVelocity;
            void main () {
                float L = texture2D(uVelocity, vL).y;
                float R = texture2D(uVelocity, vR).y;
                float T = texture2D(uVelocity, vT).x;
                float B = texture2D(uVelocity, vB).x;
                float vorticity = R - L - T + B;
                gl_FragColor = vec4(vorticity, 0.0, 0.0, 1.0);
            }
        `;

        const pressureShader = /* glsl */ `
            precision mediump float;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uPressure;
            uniform sampler2D uDivergence;
            void main () {
                float L = texture2D(uPressure, vL).x;
                float R = texture2D(uPressure, vR).x;
                float T = texture2D(uPressure, vT).x;
                float B = texture2D(uPressure, vB).x;
                float div = texture2D(uDivergence, vUv).x;
                float pressure = (L + R + B + T - div) * 0.25;
                gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
            }
        `;

        const gradSubtractShader = /* glsl */ `
            precision mediump float;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uPressure;
            uniform sampler2D uVelocity;
            void main () {
                float L = texture2D(uPressure, vL).x;
                float R = texture2D(uPressure, vR).x;
                float T = texture2D(uPressure, vT).x;
                float B = texture2D(uPressure, vB).x;
                vec2 velocity = texture2D(uVelocity, vUv).xy;
                velocity.xy -= vec2(R - L, T - B);
                gl_FragColor = vec4(velocity, 0.0, 1.0);
            }
        `;

        const displayShader = /* glsl */ `
            precision highp float;
            varying vec2 vUv;
            uniform sampler2D uTexture;
            void main () {
                vec3 color = texture2D(uTexture, vUv).rgb;
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        // Textures
        const internalFormat = gl.RGBA;
        const type = gl.FLOAT || gl.HALF_FLOAT; // Standard WebGL 1 float texture support is via extension

        const simRes = this.options.SIM_RESOLUTION;
        const dyeRes = this.options.DYE_RESOLUTION;

        this.density = this.createDoubleBuffer(dyeRes, dyeRes, internalFormat, type);
        this.velocity = this.createDoubleBuffer(simRes, simRes, internalFormat, type);
        this.divergence = this.createBuffer(simRes, simRes, internalFormat, type);
        this.curl = this.createBuffer(simRes, simRes, internalFormat, type);
        this.pressure = this.createDoubleBuffer(simRes, simRes, internalFormat, type);

        this.triangle = new Triangle(gl);
        
        this.programs = {
            clear: new Program(gl, { vertex: baseVertex, fragment: clearShader, depthTest: false, depthWrite: false }),
            splat: new Program(gl, { vertex: baseVertex, fragment: splatShader, depthTest: false, depthWrite: false }),
            advection: new Program(gl, { vertex: baseVertex, fragment: advectionShader, depthTest: false, depthWrite: false }),
            divergence: new Program(gl, { vertex: baseVertex, fragment: divergenceShader, depthTest: false, depthWrite: false }),
            curl: new Program(gl, { vertex: baseVertex, fragment: curlShader, depthTest: false, depthWrite: false }),
            pressure: new Program(gl, { vertex: baseVertex, fragment: pressureShader, depthTest: false, depthWrite: false }),
            gradSubtract: new Program(gl, { vertex: baseVertex, fragment: gradSubtractShader, depthTest: false, depthWrite: false }),
            display: new Program(gl, { vertex: baseVertex, fragment: displayShader, depthTest: false, depthWrite: false })
        };

        this.mesh = new Mesh(gl, { geometry: this.triangle });

        window.addEventListener('mousemove', e => {
            const x = e.clientX / window.innerWidth;
            const y = 1.0 - e.clientY / window.innerHeight;
            this.mouse.dx = x - this.mouse.x;
            this.mouse.dy = y - this.mouse.y;
            this.mouse.x = x;
            this.mouse.y = y;
            this.mouse.moved = true;
        });

        this.lastTime = performance.now();
        const animate = (t) => {
            const dt = Math.min((t - this.lastTime) / 1000, 0.016);
            this.lastTime = t;
            this.render(dt);
            this.rafId = requestAnimationFrame(animate);
        };
        this.rafId = requestAnimationFrame(animate);
    }

    createBuffer(width, height, internalFormat, type) {
        return new RenderTarget(this.gl, {
            width, height, internalFormat, type,
            minFilter: this.gl.LINEAR, magFilter: this.gl.LINEAR,
            wrapS: this.gl.CLAMP_TO_EDGE, wrapT: this.gl.CLAMP_TO_EDGE, depth: false
        });
    }

    createDoubleBuffer(width, height, internalFormat, type) {
        let fbo1 = this.createBuffer(width, height, internalFormat, type);
        let fbo2 = this.createBuffer(width, height, internalFormat, type);
        return {
            get read() { return fbo1; },
            get write() { return fbo2; },
            swap() { [fbo1, fbo2] = [fbo2, fbo1]; }
        };
    }

    resize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.renderer.setSize(width, height);
        this.gl.canvas.style.width = '100%';
        this.gl.canvas.style.height = '100%';
    }

    render(dt) {
        const gl = this.gl;
        const p = this.programs;

        if (this.mouse.moved) {
            this.mouse.moved = false;
            const time = performance.now() * 0.001 * this.options.COLOR_UPDATE_SPEED;
            const color = [
                Math.sin(time) * 0.5 + 0.5,
                Math.sin(time * 1.2) * 0.5 + 0.5,
                Math.sin(time * 1.4) * 0.5 + 0.5
            ];
            this.splat(this.mouse.x, this.mouse.y, this.mouse.dx * this.options.SPLAT_FORCE, this.mouse.dy * this.options.SPLAT_FORCE, color);
        }

        // Advection
        p.advection.uniforms = {
            uVelocity: { value: this.velocity.read.texture },
            uSource: { value: this.velocity.read.texture },
            texelSize: { value: [1/this.options.SIM_RESOLUTION, 1/this.options.SIM_RESOLUTION] },
            dt: { value: dt },
            dissipation: { value: 1.0 - dt * this.options.VELOCITY_DISSIPATION }
        };
        this.apply(this.velocity.write, p.advection);
        this.velocity.swap();

        p.advection.uniforms.uSource.value = this.density.read.texture;
        p.advection.uniforms.dissipation.value = 1.0 - dt * this.options.DENSITY_DISSIPATION;
        p.advection.uniforms.texelSize.value = [1/this.options.DYE_RESOLUTION, 1/this.options.DYE_RESOLUTION];
        this.apply(this.density.write, p.advection);
        this.density.swap();

        // Curl/Divergence/Pressure
        p.curl.uniforms = { uVelocity: { value: this.velocity.read.texture }, texelSize: { value: [1/this.options.SIM_RESOLUTION, 1/this.options.SIM_RESOLUTION] } };
        this.apply(this.curl, p.curl);

        p.divergence.uniforms = { uVelocity: { value: this.velocity.read.texture }, texelSize: { value: [1/this.options.SIM_RESOLUTION, 1/this.options.SIM_RESOLUTION] } };
        this.apply(this.divergence, p.divergence);

        p.clear.uniforms = { uTexture: { value: this.pressure.read.texture }, value: { value: this.options.PRESSURE } };
        this.apply(this.pressure.write, p.clear);
        this.pressure.swap();

        p.pressure.uniforms = { uPressure: { value: this.pressure.read.texture }, uDivergence: { value: this.divergence.texture }, texelSize: { value: [1/this.options.SIM_RESOLUTION, 1/this.options.SIM_RESOLUTION] } };
        for (let i = 0; i < 20; i++) {
            this.apply(this.pressure.write, p.pressure);
            this.pressure.swap();
        }

        p.gradSubtract.uniforms = { uPressure: { value: this.pressure.read.texture }, uVelocity: { value: this.velocity.read.texture }, texelSize: { value: [1/this.options.SIM_RESOLUTION, 1/this.options.SIM_RESOLUTION] } };
        this.apply(this.velocity.write, p.gradSubtract);
        this.velocity.swap();

        // Final Display
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        p.display.uniforms = { uTexture: { value: this.density.read.texture } };
        this.mesh.program = p.display;
        this.mesh.draw();
    }

    splat(x, y, dx, dy, color) {
        const p = this.programs;
        p.splat.uniforms = {
            uTarget: { value: this.velocity.read.texture },
            aspectRatio: { value: this.gl.canvas.width / this.gl.canvas.height },
            point: { value: [x, y] },
            color: { value: [dx, dy, 0] },
            radius: { value: this.options.SPLAT_RADIUS / 100 }
        };
        this.apply(this.velocity.write, p.splat);
        this.velocity.swap();

        p.splat.uniforms.uTarget.value = this.density.read.texture;
        p.splat.uniforms.color.value = color;
        this.apply(this.density.write, p.splat);
        this.density.swap();
    }

    apply(target, program) {
        this.gl.viewport(0, 0, target.width, target.height);
        this.mesh.program = program;
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, target.buffer);
        this.mesh.draw();
    }
    
    destroy() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        window.removeEventListener('resize', () => this.resize());
        this.gl.canvas.remove();
    }
}
