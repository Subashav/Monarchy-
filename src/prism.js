/**
 * Prism.js - WebGL-based prismatic crystal animation component.
 * Creates a rotating, refractive triangular prism effect.
 */
export class Prism {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!this.gl) {
      console.warn('WebGL not available for Prism');
      return;
    }
    
    this.mouse = { x: 0.5, y: 0.5 };
    this.targetMouse = { x: 0.5, y: 0.5 };
    this.time = 0;
    
    this.options = {
      height: options.height || 4,
      baseWidth: options.baseWidth || 5.5,
      glow: options.glow || 1.1,
      noise: options.noise || 0.1,
      scale: options.scale || 2.4,
      hueShift: options.hueShift || 0,
      colorFrequency: options.colorFrequency || 0.65,
      hoverStrength: options.hoverStrength || 2,
      inertia: options.inertia || 0.05,
      bloom: options.bloom || 1,
      timeScale: options.timeScale || 0.2,
      transparent: options.transparent || true,
      ...options
    };

    this.isVisible = true;
    this.init();
    this.bindEvents();
    this._setupVisibility();
    this.animate();
  }

  // Initialize WebGL context, shaders, and buffers
  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    const gl = this.gl;

    // Vertex shader
    const vertSrc = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment shader - creates a rotating prismatic crystal effect
    const fragSrc = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform vec2 mouse;
      uniform float glow;
      uniform float noiseAmt;
      uniform float scale;
      uniform float hueShift;
      uniform float colorFreq;
      uniform float bloom;
      
      // Simplex-like noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
      
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
      
      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }
      
      // SDF for a triangle/prism shape
      float sdTriangle(vec2 p, float h, float w) {
        p.y += h * 0.3;
        vec2 q = abs(p);
        float d = max(q.x * 0.866 + p.y * 0.5, -p.y) - h * 0.5;
        return d;
      }
      
      void main() {
        vec2 uv = (gl_FragCoord.xy - resolution * 0.5) / min(resolution.x, resolution.y);
        uv /= scale * 0.15;
        
        // Mouse influence with inertia
        vec2 mouseInfluence = (mouse - 0.5) * 0.3;
        uv += mouseInfluence;
        
        // Rotate slowly
        float angle = time * 0.15;
        mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        vec2 rotUv = rot * uv;
        
        // Prism distance
        float d = sdTriangle(rotUv, 1.2, 0.8);
        
        // Noise distortion
        float n = snoise(uv * 3.0 + time * 0.3) * noiseAmt;
        d += n * 0.05;
        
        // Edge glow
        float edge = 1.0 / (abs(d) * 20.0 + 0.5) * glow;
        
        // Inner refraction pattern
        float inner = 0.0;
        if (d < 0.0) {
          float refract = snoise(rotUv * 5.0 + time * 0.5) * 0.5 + 0.5;
          refract += snoise(rotUv * 8.0 - time * 0.3) * 0.3;
          inner = refract * 0.6 * smoothstep(0.0, -0.15, d);
        }
        
        // Rainbow dispersion along edges
        float hue = fract(atan(rotUv.y, rotUv.x) / 6.28 + time * colorFreq * 0.1 + hueShift / 360.0);
        vec3 edgeColor = hsv2rgb(vec3(hue, 0.7, 1.0));
        
        // Inner prismatic colors
        float innerHue = fract(snoise(rotUv * 3.0 + time * 0.2) * 0.5 + 0.5 + hueShift / 360.0);
        vec3 innerColor = hsv2rgb(vec3(innerHue, 0.5, 0.8));
        
        // Combine
        vec3 col = edge * edgeColor + inner * innerColor;
        
        // Bloom/glow spread
        float bloomDist = 1.0 / (abs(d) * 5.0 + 1.0) * bloom * 0.15;
        col += bloomDist * edgeColor * 0.3;
        
        // Subtle ambient light
        col += vec3(0.01, 0.005, 0.02) * (1.0 - length(uv) * 0.5);
        
        // Alpha based on content
        float alpha = clamp(edge * 0.5 + inner + bloomDist * 0.5, 0.0, 1.0);
        
        gl_FragColor = vec4(col, alpha);
      }
    `;

    // Compile shaders
    const vert = this.compileShader(gl.VERTEX_SHADER, vertSrc);
    const frag = this.compileShader(gl.FRAGMENT_SHADER, fragSrc);
    
    this.program = gl.createProgram();
    gl.attachShader(this.program, vert);
    gl.attachShader(this.program, frag);
    gl.linkProgram(this.program);
    
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('Prism shader program failed:', gl.getProgramInfoLog(this.program));
      return;
    }

    // Full-screen quad
    const verts = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    this.posLoc = gl.getAttribLocation(this.program, 'position');
    this.uniforms = {
      resolution: gl.getUniformLocation(this.program, 'resolution'),
      time: gl.getUniformLocation(this.program, 'time'),
      mouse: gl.getUniformLocation(this.program, 'mouse'),
      glow: gl.getUniformLocation(this.program, 'glow'),
      noiseAmt: gl.getUniformLocation(this.program, 'noiseAmt'),
      scale: gl.getUniformLocation(this.program, 'scale'),
      hueShift: gl.getUniformLocation(this.program, 'hueShift'),
      colorFreq: gl.getUniformLocation(this.program, 'colorFreq'),
      bloom: gl.getUniformLocation(this.program, 'bloom'),
      baseWidth: gl.getUniformLocation(this.program, 'baseWidth'),
      height: gl.getUniformLocation(this.program, 'height'),
    };
  }

  // Helper to compile individual WebGL shaders
  compileShader(type, src) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Prism shader error:', gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth || window.innerWidth;
      this.canvas.height = parent.clientHeight || window.innerHeight;
    } else {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  bindEvents() {
    const parent = this.canvas.parentElement || document;
    parent.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.targetMouse.x = (e.clientX - rect.left) / rect.width;
      this.targetMouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
    }, { passive: true });
  }

  _setupVisibility() {
    if ('IntersectionObserver' in window) {
      const target = this.canvas.closest('section') || this.canvas.parentElement || this.canvas;
      this._visObs = new IntersectionObserver((entries) => {
        this.isVisible = entries[0].isIntersecting;
      }, { threshold: 0 });
      this._visObs.observe(target);
    }
  }

  // Main render function to draw the prism frame
  draw() {
    const gl = this.gl;
    if (!gl || !this.program) return;

    // Lerp mouse with inertia
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * this.options.inertia;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * this.options.inertia;

    this.time += 0.016 * this.options.timeScale;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(this.program);
    gl.enableVertexAttribArray(this.posLoc);
    gl.vertexAttribPointer(this.posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uniforms.time, this.time);
    gl.uniform2f(this.uniforms.mouse, this.mouse.x, this.mouse.y);
    gl.uniform1f(this.uniforms.glow, this.options.glow);
    gl.uniform1f(this.uniforms.noiseAmt, this.options.noise);
    gl.uniform1f(this.uniforms.scale, this.options.scale);
    gl.uniform1f(this.uniforms.hueShift, this.options.hueShift);
    gl.uniform1f(this.uniforms.colorFreq, this.options.colorFrequency);
    gl.uniform1f(this.uniforms.bloom, this.options.bloom);
    gl.uniform1f(this.uniforms.baseWidth, this.options.baseWidth);
    gl.uniform1f(this.uniforms.height, this.options.height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // Main animation loop
  animate() {
    requestAnimationFrame(() => this.animate());
    if (!this.isVisible) return;
    this.draw();
  }
}
