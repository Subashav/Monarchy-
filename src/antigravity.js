import { Renderer, Program, Mesh, Vec2, Vec3, Color, Geometry, Camera, Plane } from 'ogl';

export class Antigravity {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            count: options.count || 800, // Higher density for galaxy look
            magnetRadius: options.magnetRadius || 10.0,
            ringRadius: options.ringRadius || 25.0,
            waveSpeed: options.waveSpeed || 0.4,
            waveAmplitude: options.waveAmplitude || 0.8,
            particleSize: options.particleSize || 0.12,
            lerpSpeed: options.lerpSpeed || 0.08,
            color: options.color || "#FFFFFF",
            autoAnimate: options.autoAnimate !== undefined ? options.autoAnimate : true,
            rotationSpeed: options.rotationSpeed || 0.05,
            exclusionRadius: options.exclusionRadius || 6.0, // Area for text
            fieldStrength: options.fieldStrength || 6.0,
            ...options
        };

        this.mouse = new Vec2(-10, -10);
        this.targetMouse = new Vec2(-10, -10);
        this.time = 0;
        this.init();
    }

    init() {
        this.renderer = new Renderer({ alpha: true, antialias: true, premultipliedAlpha: false });
        this.gl = this.renderer.gl;
        this.container.appendChild(this.gl.canvas);

        this.gl.clearColor(0, 0, 0, 0);

        this.camera = new Camera(this.gl, { fov: 40 });
        this.camera.position.z = 30;

        const geo = new Plane(this.gl, {
            width: this.options.particleSize,
            height: this.options.particleSize,
        });

        const count = this.options.count;
        const positions = new Float32Array(count * 3);
        const randoms = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            // Circle/Galaxy distribution
            const angle = Math.random() * Math.PI * 2;
            // Weighted distribution to have more particles towards middle-radius, but clear center
            const r = this.options.exclusionRadius + Math.pow(Math.random(), 0.7) * (this.options.ringRadius - this.options.exclusionRadius);
            
            positions[i * 3 + 0] = Math.cos(angle) * r;
            positions[i * 3 + 1] = Math.sin(angle) * r;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 6.0;

            randoms[i * 3 + 0] = Math.random(); // Blink phase
            randoms[i * 3 + 1] = Math.random(); // Size variance
            randoms[i * 3 + 2] = Math.random(); // Rotation phase
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
            uniform float uExclusionRadius;
            uniform float uMagnetRadius;
            uniform float uFieldStrength;
            uniform float uRotationSpeed;

            void main() {
                vUv = uv;
                vec3 p = offset;
                
                // Slow Global Rotation (Galaxy Style)
                float globalAngle = uTime * uRotationSpeed;
                float s = sin(globalAngle);
                float c = cos(globalAngle);
                mat2 globalRot = mat2(c, -s, s, c);
                p.xy = globalRot * p.xy;

                // Twinkle / Flicker
                float twinkle = sin(uTime * 2.0 + random.x * 10.0) * 0.5 + 0.5;
                
                // Center Fade (Text Protection)
                float distCenter = length(p.xy);
                float centerFade = smoothstep(uExclusionRadius * 0.5, uExclusionRadius, distCenter);
                
                // Mouse Attraction/Repulsion (Antigravity Interaction)
                vec2 mousePos = uMouse * vec2(20.0, 15.0);
                float distMouse = distance(p.xy, mousePos);
                float interact = 0.0;
                if (distMouse < uMagnetRadius) {
                    float force = (1.0 - distMouse / uMagnetRadius) * uFieldStrength;
                    p.xy += normalize(p.xy - mousePos) * force;
                    interact = force;
                }

                vOpacity = (0.3 + twinkle * 0.5) * centerFade + (interact * 0.3);

                // Billboard
                vec4 viewPos = viewMatrix * modelMatrix * vec4(p, 1.0);
                viewPos.xyz += position * (0.8 + random.y * 1.5 + interact);

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
                float alpha = smoothstep(0.5, 0.4, d);
                if (alpha < 0.01) discard;
                gl_FragColor = vec4(uColor, vOpacity * alpha);
            }
        `;

        this.program = new Program(this.gl, {
            vertex,
            fragment,
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: this.mouse },
                uColor: { value: new Color(this.options.color) },
                uExclusionRadius: { value: this.options.exclusionRadius },
                uMagnetRadius: { value: this.options.magnetRadius },
                uFieldStrength: { value: this.options.fieldStrength },
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
