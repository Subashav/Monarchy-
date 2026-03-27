import { Renderer, Program, Mesh, Triangle, Vec2, Vec3, Color, Cylinder, Box, Geometry } from 'ogl';

export class Antigravity {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            count: options.count || 300,
            magnetRadius: options.magnetRadius || 10,
            ringRadius: options.ringRadius || 10,
            waveSpeed: options.waveSpeed || 0.4,
            waveAmplitude: options.waveAmplitude || 1.0,
            particleSize: options.particleSize || 2.0,
            lerpSpeed: options.lerpSpeed || 0.1,
            color: options.color || "#FF9FFC",
            autoAnimate: options.autoAnimate !== undefined ? options.autoAnimate : false,
            particleVariance: options.particleVariance || 1.0,
            rotationSpeed: options.rotationSpeed || 0.0,
            depthFactor: options.depthFactor || 1.0,
            pulseSpeed: options.pulseSpeed || 3.0,
            particleShape: options.particleShape || "capsule",
            fieldStrength: options.fieldStrength || 10.0,
            ...options
        };

        this.mouse = new Vec2(0, 0);
        this.targetMouse = new Vec2(0, 0);
        this.time = 0;
        this.init();
    }

    init() {
        this.renderer = new Renderer({ alpha: true, antialias: true, premultipliedAlpha: false });
        this.gl = this.renderer.gl;
        this.container.appendChild(this.gl.canvas);

        this.gl.clearColor(0, 0, 0, 0);

        // Geometries
        let geo;
        if (this.options.particleShape === "capsule") {
            // Approximation using a small cylinder
            geo = new Cylinder(this.gl, {
                radiusTop: 0.1 * this.options.particleSize,
                radiusBottom: 0.1 * this.options.particleSize,
                height: 0.4 * this.options.particleSize,
                radialSegments: 8
            });
        } else {
            geo = new Box(this.gl, {
                width: 0.2 * this.options.particleSize,
                height: 0.2 * this.options.particleSize,
                depth: 0.2 * this.options.particleSize
            });
        }

        // Instancing setup
        const count = this.options.count;
        const positions = new Float32Array(count * 3);
        const randoms = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = this.options.ringRadius * (0.5 + Math.random() * 0.5);
            positions[i * 3 + 0] = Math.cos(angle) * r;
            positions[i * 3 + 1] = Math.sin(angle) * r;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 5;

            randoms[i * 3 + 0] = Math.random();
            randoms[i * 3 + 1] = Math.random();
            randoms[i * 3 + 2] = Math.random();
        }

        const geometry = new Geometry(this.gl, {
            ...geo.attributes,
            offset: { instanced: 1, size: 3, data: positions },
            random: { instanced: 1, size: 3, data: randoms }
        });

        const vertex = /* glsl */ `
            attribute vec3 position;
            attribute vec3 offset;
            attribute vec3 random;
            attribute vec2 uv;
            varying vec2 vUv;
            varying float vGlow;

            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            uniform float uTime;
            uniform vec2 uMouse;
            uniform float uWaveSpeed;
            uniform float uWaveAmplitude;
            uniform float uMagnetRadius;
            uniform float uFieldStrength;
            uniform float uPulseSpeed;
            uniform float uRotationSpeed;

            void main() {
                vUv = uv;
                vec3 p = offset;
                
                // Wave motion
                p.z += sin(random.x * 10.0 + uTime * uWaveSpeed) * uWaveAmplitude;
                p.x += cos(random.y * 10.0 + uTime * uWaveSpeed * 0.5) * uWaveAmplitude * 0.2;
                
                // Magnetic field
                vec2 m = uMouse * 20.0; // Scale mouse to field space
                float d = distance(p.xy, m);
                if (d < uMagnetRadius) {
                    float force = (1.0 - d / uMagnetRadius) * uFieldStrength;
                    p.xy += normalize(p.xy - m) * force;
                    vGlow = force;
                } else {
                    vGlow = 0.0;
                }

                // Pulse
                float pulse = sin(uTime * uPulseSpeed + random.z * 6.28) * 0.5 + 0.5;
                
                // Rotation
                float angle = uTime * uRotationSpeed + random.x * 6.28;
                float s = sin(angle);
                float c = cos(angle);
                mat2 rot = mat2(c, -s, s, c);
                
                vec3 transformed = position;
                transformed.xy = rot * transformed.xy;
                transformed *= (1.0 + pulse * 0.3);

                gl_Position = projectionMatrix * modelViewMatrix * vec4(p + transformed, 1.0);
            }
        `;

        const fragment = /* glsl */ `
            precision highp float;
            varying vec2 vUv;
            varying float vGlow;
            uniform vec3 uColor;

            void main() {
                float dist = distance(vUv, vec2(0.5));
                float alpha = smoothstep(0.5, 0.4, dist);
                vec3 finalColor = uColor + vGlow * 0.5;
                gl_FragColor = vec4(finalColor, alpha * (0.6 + vGlow));
            }
        `;

        this.program = new Program(this.gl, {
            vertex,
            fragment,
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: this.mouse },
                uColor: { value: new Color(this.options.color) },
                uWaveSpeed: { value: this.options.waveSpeed },
                uWaveAmplitude: { value: this.options.waveAmplitude },
                uMagnetRadius: { value: this.options.magnetRadius },
                uFieldStrength: { value: this.options.fieldStrength },
                uPulseSpeed: { value: this.options.pulseSpeed },
                uRotationSpeed: { value: this.options.rotationSpeed }
            },
            transparent: true,
            depthTest: false
        });

        this.mesh = new Mesh(this.gl, { geometry, program: this.program });

        this.resize();
        window.addEventListener('resize', () => this.resize());

        window.addEventListener('mousemove', e => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (1.0 - e.clientY / window.innerHeight) * 2 - 1;
            this.targetMouse.set(x, y);
        });

        this.update();
    }

    resize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.renderer.setSize(width, height);
        this.gl.canvas.style.width = '100%';
        this.gl.canvas.style.height = '100%';
    }

    update() {
        this.time += 0.016;
        this.mouse.lerp(this.targetMouse, this.options.lerpSpeed);

        this.program.uniforms.uTime.value = this.time;
        this.program.uniforms.uMouse.value = this.mouse;

        this.renderer.render({ scene: this.mesh });
        this.rafId = requestAnimationFrame(() => this.update());
    }

    destroy() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        window.removeEventListener('resize', () => this.resize());
        this.gl.canvas.remove();
    }
}
