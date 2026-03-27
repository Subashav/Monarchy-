import { Renderer, Program, Mesh, Triangle, RenderTarget } from 'ogl';

export class SplashCursor {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            SIM_RESOLUTION: options.SIM_RESOLUTION || 128,
            DYE_RESOLUTION: options.DYE_RESOLUTION || 1440,
            DENSITY_DISSIPATION: options.DENSITY_DISSIPATION || 3.5,
            VELOCITY_DISSIPATION: options.VELOCITY_DISSIPATION || 2.0,
            PRESSURE: options.PRESSURE || 0.8,
            CURL: options.CURL || 30.0,
            SPLAT_RADIUS: options.SPLAT_RADIUS || 0.1,
            SPLAT_FORCE: options.SPLAT_FORCE || 6000,
            COLOR_UPDATE_SPEED: options.COLOR_UPDATE_SPEED || 1.0,
            TRANSPARENT: options.TRANSPARENT !== undefined ? options.TRANSPARENT : true,
            BRAND_COLOR: options.BRAND_COLOR || { r: 0.8, g: 0.6, b: 1.0 }, // Subashav/Monarchy- purple/blue tone
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

        const isWebGL2 = gl instanceof WebGL2RenderingContext;
        let type = gl.HALF_FLOAT || gl.getExtension('OES_texture_half_float')?.HALF_FLOAT_OES || gl.UNSIGNED_BYTE;
        if (isWebGL2) {
            gl.getExtension('EXT_color_buffer_float');
        } else {
            gl.getExtension('OES_texture_float');
            gl.getExtension('OES_texture_half_float');
        }
        const internalFormat = isWebGL2 ? gl.RGBA16F : gl.RGBA;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Shaders (same as before)
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
            precision highp float;
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
            precision highp float;
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
            precision highp float;
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
            precision highp float;
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
            precision highp float;
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
                float alpha = dot(color, vec3(0.299, 0.587, 0.114));
                gl_FragColor = vec4(color, alpha);
            }
        `;

        const simRes = this.options.SIM_RESOLUTION;
        const dyeRes = this.options.DYE_RESOLUTION;

        this.density = this.createDoubleBuffer(dyeRes, dyeRes, internalFormat, type);
        this.velocity = this.createDoubleBuffer(simRes, simRes, internalFormat, type);
        this.divergence = this.createBuffer(simRes, simRes, internalFormat, type);
        this.curl = this.createBuffer(simRes, simRes, internalFormat, type);
        this.pressure = this.createDoubleBuffer(simRes, simRes, internalFormat, type);

        this.triangle = new Triangle(gl);
        
        this.programs = {
            clear: new Program(gl, { vertex: baseVertex, fragment: clearShader }),
            splat: new Program(gl, { vertex: baseVertex, fragment: splatShader }),
            advection: new Program(gl, { vertex: baseVertex, fragment: advectionShader }),
            divergence: new Program(gl, { vertex: baseVertex, fragment: divergenceShader }),
            curl: new Program(gl, { vertex: baseVertex, fragment: curlShader }),
            pressure: new Program(gl, { vertex: baseVertex, fragment: pressureShader }),
            gradSubtract: new Program(gl, { vertex: baseVertex, fragment: gradSubtractShader }),
            display: new Program(gl, { vertex: baseVertex, fragment: displayShader, transparent: true })
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
        this.autoSplatTime = 0;
        
        const animate = (t) => {
            const dt = Math.min((t - this.lastTime) / 1000, 0.016);
            this.lastTime = t;
            this.autoSplatTime += dt;

            // Auto-splat for floating effect
            if (this.autoSplatTime > 0.5) {
                this.autoSplatTime = 0;
                const x = 0.2 + Math.random() * 0.6;
                const y = 0.2 + Math.random() * 0.6;
                const dx = (Math.random() - 0.5) * 50;
                const dy = (Math.random() - 0.5) * 50;
                const c = this.options.BRAND_COLOR;
                this.splat(x, y, dx, dy, [c.r * 0.5, c.g * 0.5, c.b * 0.5]);
            }

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
            swap() { const temp = fbo1; fbo1 = fbo2; fbo2 = temp; }
        };
    }

    resize() {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        this.renderer.setSize(width, height);
    }

    render(dt) {
        const gl = this.gl;
        const p = this.programs;

        if (this.mouse.moved) {
            this.mouse.moved = false;
            const c = this.options.BRAND_COLOR;
            // Use subtle variation of brand color instead of full colorful
            const color = [
                c.r * (0.8 + Math.random() * 0.4),
                c.g * (0.8 + Math.random() * 0.4),
                c.b * (0.8 + Math.random() * 0.4)
            ];
            this.splat(this.mouse.x, this.mouse.y, this.mouse.dx * this.options.SPLAT_FORCE, this.mouse.dy * this.options.SPLAT_FORCE, color);
        }

        // Advection/Diffusion Solver steps (same as before)
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
}
