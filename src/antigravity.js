import { Renderer, Program, Mesh, Vec2, Vec3, Color, Geometry, Camera, Plane } from 'ogl';

export class Antigravity {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            count: options.count || 300,
            magnetRadius: options.magnetRadius || 8.0,
            ringRadius: options.ringRadius || 12.0,
            waveSpeed: options.waveSpeed || 0.6,
            waveAmplitude: options.waveAmplitude || 1.5,
            particleSize: options.particleSize || 0.1,
            lerpSpeed: options.lerpSpeed || 0.08,
            color: options.color || "#FFFFFF",
            autoAnimate: options.autoAnimate !== undefined ? options.autoAnimate : true,
            rotationSpeed: options.rotationSpeed || 0.2,
            depthFactor: options.depthFactor || 1.0,
            pulseSpeed: options.pulseSpeed || 2.0,
            fieldStrength: options.fieldStrength || 5.0,
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

        this.camera = new Camera(this.gl, { fov: 35 });
        this.camera.position.z = 25;

        // Use a simple flat plane for single-particle look (Billboard)
        const geo = new Plane(this.gl, {
            width: this.options.particleSize,
            height: this.options.particleSize,
        });

        const count = this.options.count;
        const positions = new Float32Array(count * 3);
        const randoms = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * 35.0;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 25.0;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 15.0;

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
            varying float vOpacity;

            uniform mat4 modelMatrix;
            uniform mat4 viewMatrix;
            uniform mat4 projectionMatrix;
            uniform float uTime;
            uniform vec2 uMouse;
            uniform float uWaveSpeed;
            uniform float uWaveAmplitude;
            uniform float uMagnetRadius;
            uniform float uFieldStrength;
            uniform float uPulseSpeed;

            void main() {
                vUv = uv;
                vec3 p = offset;
                
                // Floating motion
                p.y += sin(uTime * uWaveSpeed + random.x * 10.0) * uWaveAmplitude;
                p.x += cos(uTime * uWaveSpeed * 0.5 + random.y * 10.0) * uWaveAmplitude * 0.5;
                
                // Mouse Interaction
                vec2 mousePos = uMouse * vec2(15.0, 10.0);
                float dist = distance(p.xy, mousePos);
                float interact = 0.0;
                if (dist < uMagnetRadius) {
                    float force = (1.0 - dist / uMagnetRadius) * uFieldStrength;
                    p.xy += normalize(p.xy - mousePos) * force;
                    interact = force;
                }

                float pulse = sin(uTime * uPulseSpeed + random.x * 6.28) * 0.5 + 0.5;
                vOpacity = (0.2 + pulse * 0.3) + (interact * 0.3);

                // Billboard effect: ensure particle always faces camera
                vec3 modelPos = p;
                vec4 viewPos = viewMatrix * modelMatrix * vec4(modelPos, 1.0);
                viewPos.xyz += position * (1.0 + interact * 0.5); // Add plane geometry in view space

                gl_Position = projectionMatrix * viewPos;
            }
        `;

        const fragment = /* glsl */ `
            precision highp float;
            varying vec2 vUv;
            varying float vOpacity;
            uniform vec3 uColor;

            void main() {
                float d = distance(vUv, vec2(0.5));
                float soft = smoothstep(0.5, 0.45, d);
                if (soft < 0.01) discard;
                gl_FragColor = vec4(uColor, vOpacity * soft * 0.8);
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
                uPulseSpeed: { value: this.options.pulseSpeed }
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
        this.camera.perspective({ aspect: width / height });
    }

    update() {
        this.time += 0.016;
        this.mouse.lerp(this.targetMouse, this.options.lerpSpeed);

        this.program.uniforms.uTime.value = this.time;
        this.program.uniforms.uMouse.value = this.mouse;

        this.renderer.render({ scene: this.mesh, camera: this.camera });
        this.rafId = requestAnimationFrame(() => this.update());
    }

    destroy() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        window.removeEventListener('resize', () => this.resize());
        this.gl.canvas.remove();
    }
}
