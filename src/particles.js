import { Renderer, Camera, Geometry, Program, Mesh } from 'ogl';

const hexToRgb = hex => {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const int = parseInt(hex, 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  return [r, g, b];
};

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec4 random;
  attribute vec3 color;
  
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSpread;
  uniform float uBaseSize;
  uniform float uSizeRandomness;
  
  varying vec4 vRandom;
  varying vec3 vColor;
  
  void main() {
    vRandom = random;
    vColor = color;
    
    vec3 pos = position * uSpread;
    pos.z *= 10.0;
    
    vec4 mPos = modelMatrix * vec4(pos, 1.0);
    float t = uTime;
    mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
    mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
    mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);
    
    vec4 mvPos = viewMatrix * mPos;

    if (uSizeRandomness == 0.0) {
      gl_PointSize = uBaseSize;
    } else {
      gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);
    }

    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  
  uniform float uTime;
  uniform float uAlphaParticles;
  varying vec4 vRandom;
  varying vec3 vColor;
  
  void main() {
    vec2 uv = gl_PointCoord.xy;
    float d = length(uv - vec2(0.5));
    
    if(uAlphaParticles < 0.5) {
      if(d > 0.5) {
        discard;
      }
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0);
    } else {
      float circle = smoothstep(0.5, 0.4, d) * 0.8;
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle);
    }
  }
`;

export class Particles {
    constructor(container, options = {}) {
        this.container = container;
        this.particleCount = options.particleCount || 200;
        this.particleSpread = options.particleSpread || 10;
        this.speed = options.speed || 0.1;
        this.particleColors = options.particleColors || ['#ffffff'];
        this.moveParticlesOnHover = options.moveParticlesOnHover || false;
        this.particleHoverFactor = options.particleHoverFactor || 1;
        this.alphaParticles = options.alphaParticles !== undefined ? options.alphaParticles : false;
        this.particleBaseSize = options.particleBaseSize || 100;
        this.sizeRandomness = options.sizeRandomness !== undefined ? options.sizeRandomness : 1;
        this.cameraDistance = options.cameraDistance || 20;
        this.disableRotation = options.disableRotation || false;
        this.pixelRatio = options.pixelRatio || window.devicePixelRatio || 1;

        this.mouse = { x: 0, y: 0 };
        this.lastTime = performance.now();
        this.elapsed = 0;
        this.rafId = null;
        this.isVisible = true;

        this.init();
    }

    init() {
        if (!this.container) return;

        this.renderer = new Renderer({
            dpr: this.pixelRatio,
            depth: false,
            alpha: true
        });
        this.gl = this.renderer.gl;
        this.container.appendChild(this.gl.canvas);
        this.gl.clearColor(0, 0, 0, 0);

        this.camera = new Camera(this.gl, { fov: 15 });
        this.camera.position.set(0, 0, this.cameraDistance);

        this.render = this.render.bind(this);
        this.resize = this.resize.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);

        this.resize();
        window.addEventListener('resize', this.resize);

        if (this.moveParticlesOnHover) {
            window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
        }

        // Visibility observer to pause when offscreen
        if ('IntersectionObserver' in window) {
            this._visObs = new IntersectionObserver((entries) => {
                this.isVisible = entries[0].isIntersecting;
            }, { threshold: 0 });
            this._visObs.observe(this.container);
        }

        const count = this.particleCount;
        const positions = new Float32Array(count * 3);
        const randoms = new Float32Array(count * 4);
        const colors = new Float32Array(count * 3);
        const palette = this.particleColors;

        for (let i = 0; i < count; i++) {
            let x, y, z, len;
            do {
                x = Math.random() * 2 - 1;
                y = Math.random() * 2 - 1;
                z = Math.random() * 2 - 1;
                len = x * x + y * y + z * z;
            } while (len > 1 || len === 0);
            const r = Math.cbrt(Math.random());
            positions.set([x * r, y * r, z * r], i * 3);
            randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
            const col = hexToRgb(palette[Math.floor(Math.random() * palette.length)]);
            colors.set(col, i * 3);
        }

        this.geometry = new Geometry(this.gl, {
            position: { size: 3, data: positions },
            random: { size: 4, data: randoms },
            color: { size: 3, data: colors }
        });

        this.program = new Program(this.gl, {
            vertex,
            fragment,
            uniforms: {
                uTime: { value: 0 },
                uSpread: { value: this.particleSpread },
                uBaseSize: { value: this.particleBaseSize * this.pixelRatio },
                uSizeRandomness: { value: this.sizeRandomness },
                uAlphaParticles: { value: this.alphaParticles ? 1 : 0 }
            },
            transparent: true,
            depthTest: false
        });

        this.mesh = new Mesh(this.gl, { mode: this.gl.POINTS, geometry: this.geometry, program: this.program });

        this.rafId = requestAnimationFrame(this.render);
    }

    resize() {
        if (!this.container) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.renderer.setSize(width, height);
        this.camera.perspective({ aspect: this.gl.canvas.width / this.gl.canvas.height });
    }

    handleMouseMove(e) {
        const rect = this.container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        this.mouse = { x, y };
    }

    render(t) {
        this.rafId = requestAnimationFrame(this.render);
        if (!this.isVisible) return;
        const delta = t - this.lastTime;
        this.lastTime = t;
        this.elapsed += delta * this.speed;

        this.program.uniforms.uTime.value = this.elapsed * 0.001;

        if (this.moveParticlesOnHover) {
            this.mesh.position.x = -this.mouse.x * this.particleHoverFactor;
            this.mesh.position.y = -this.mouse.y * this.particleHoverFactor;
        }

        if (!this.disableRotation) {
            this.mesh.rotation.x = Math.sin(this.elapsed * 0.0002) * 0.1;
            this.mesh.rotation.y = Math.cos(this.elapsed * 0.0005) * 0.15;
            this.mesh.rotation.z += 0.01 * this.speed;
        }

        this.renderer.render({ scene: this.mesh, camera: this.camera });
    }

    destroy() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        window.removeEventListener('resize', this.resize);
        window.removeEventListener('mousemove', this.handleMouseMove);
        if (this.gl && this.gl.canvas && this.gl.canvas.parentElement) {
            this.gl.canvas.parentElement.removeChild(this.gl.canvas);
        }
        if (this.gl) {
            this.gl.getExtension('WEBGL_lose_context')?.loseContext();
        }
    }
}
