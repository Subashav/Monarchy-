/**
 * Orb.js - Vanilla JS port of the react-bits Orb component
 * Based on ogl library
 */
import { Mesh, Program, Renderer, Triangle, Vec3 } from 'ogl';

function hexToVec3(color) {
    if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16) / 255;
        const g = parseInt(color.slice(3, 5), 16) / 255;
        const b = parseInt(color.slice(5, 7), 16) / 255;
        return new Vec3(r, g, b);
    }
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
        return new Vec3(parseInt(rgbMatch[1]) / 255, parseInt(rgbMatch[2]) / 255, parseInt(rgbMatch[3]) / 255);
    }
    const hslMatch = color.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/);
    if (hslMatch) {
        const h = parseInt(hslMatch[1]) / 360;
        const s = parseInt(hslMatch[2]) / 100;
        const l = parseInt(hslMatch[3]) / 100;
        return hslToRgb(h, s, l);
    }
    return new Vec3(0, 0, 0);
}

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return new Vec3(r, g, b);
}

export class Orb {
    constructor(container, options = {}) {
        this.container = container;
        this.trackElement = options.trackElement || container;
        this.hue = options.hue !== undefined ? options.hue : 0;
        this.hoverIntensity = options.hoverIntensity !== undefined ? options.hoverIntensity : 0.2;
        this.rotateOnHover = options.rotateOnHover !== undefined ? options.rotateOnHover : true;
        this.forceHoverState = options.forceHoverState !== undefined ? options.forceHoverState : false;
        this.backgroundColor = options.backgroundColor || '#000000';

        this.targetHover = 0;
        this.lastTime = 0;
        this.currentRot = 0;
        this.rotationSpeed = 0.3;
        this.rafId = null;
        this.isVisible = true;
        this._bgVec3 = null;

        this.init();
    }

    init() {
        if (!this.container) return;

        this.renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
        this.gl = this.renderer.gl;
        this.gl.clearColor(0, 0, 0, 0);
        this.container.appendChild(this.gl.canvas);

        const vert = /* glsl */ `
            precision highp float;
            attribute vec2 position;
            attribute vec2 uv;
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const frag = /* glsl */ `
            precision highp float;
            uniform float iTime;
            uniform vec3 iResolution;
            uniform float hue;
            uniform float hover;
            uniform float rot;
            uniform float hoverIntensity;
            uniform vec3 backgroundColor;
            varying vec2 vUv;

            vec3 rgb2yiq(vec3 c) {
                float y = dot(c, vec3(0.299, 0.587, 0.114));
                float i = dot(c, vec3(0.596, -0.274, -0.322));
                float q = dot(c, vec3(0.211, -0.523, 0.312));
                return vec3(y, i, q);
            }

            vec3 yiq2rgb(vec3 c) {
                float r = c.x + 0.956 * c.y + 0.621 * c.z;
                float g = c.x - 0.272 * c.y - 0.647 * c.z;
                float b = c.x - 1.106 * c.y + 1.703 * c.z;
                return vec3(r, g, b);
            }

            vec3 adjustHue(vec3 color, float hueDeg) {
                float hueRad = hueDeg * 3.14159265 / 180.0;
                vec3 yiq = rgb2yiq(color);
                float cosA = cos(hueRad);
                float sinA = sin(hueRad);
                float i = yiq.y * cosA - yiq.z * sinA;
                float q = yiq.y * sinA + yiq.z * cosA;
                yiq.y = i;
                yiq.z = q;
                return yiq2rgb(yiq);
            }

            vec3 hash33(vec3 p3) {
                p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
                p3 += dot(p3, p3.yxz + 19.19);
                return -1.0 + 2.0 * fract(vec3(
                    p3.x + p3.y,
                    p3.x + p3.z,
                    p3.y + p3.z
                ) * p3.zyx);
            }

            float snoise3(vec3 p) {
                const float K1 = 0.333333333;
                const float K2 = 0.166666667;
                vec3 i = floor(p + (p.x + p.y + p.z) * K1);
                vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
                vec3 e = step(vec3(0.0), d0 - d0.yzx);
                vec3 i1 = e * (1.0 - e.zxy);
                vec3 i2 = 1.0 - e.zxy * (1.0 - e);
                vec3 d1 = d0 - (i1 - K2);
                vec3 d2 = d0 - (i2 - K1);
                vec3 d3 = d0 - 0.5;
                vec4 h = max(0.6 - vec4(
                    dot(d0, d0),
                    dot(d1, d1),
                    dot(d2, d2),
                    dot(d3, d3)
                ), 0.0);
                vec4 n = h * h * h * h * vec4(
                    dot(d0, hash33(i)),
                    dot(d1, hash33(i + i1)),
                    dot(d2, hash33(i + i2)),
                    dot(d3, hash33(i + 1.0))
                );
                return dot(vec4(31.316), n);
            }

            vec4 extractAlpha(vec3 colorIn) {
                float a = max(max(colorIn.r, colorIn.g), colorIn.b);
                return vec4(colorIn.rgb / (a + 1e-5), a);
            }

            const vec3 baseColor1 = vec3(0.611765, 0.262745, 0.996078);
            const vec3 baseColor2 = vec3(0.298039, 0.760784, 0.913725);
            const vec3 baseColor3 = vec3(0.062745, 0.078431, 0.600000);
            const float innerRadius = 0.6;
            const float noiseScale = 0.65;

            float light1(float intensity, float attenuation, float dist) {
                return intensity / (1.0 + dist * attenuation);
            }

            float light2(float intensity, float attenuation, float dist) {
                return intensity / (1.0 + dist * dist * attenuation);
            }

            vec4 draw(vec2 uv) {
                vec3 color1 = adjustHue(baseColor1, hue);
                vec3 color2 = adjustHue(baseColor2, hue);
                vec3 color3 = adjustHue(baseColor3, hue);
                float ang = atan(uv.y, uv.x);
                float len = length(uv);
                float invLen = len > 0.0 ? 1.0 / len : 0.0;
                float bgLuminance = dot(backgroundColor, vec3(0.299, 0.587, 0.114));
                float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
                float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
                float d0 = distance(uv, (r0 * invLen) * uv);
                float v0 = light1(1.0, 10.0, d0);
                v0 *= smoothstep(r0 * 1.05, r0, len);
                float innerFade = smoothstep(r0 * 0.8, r0 * 0.95, len);
                v0 *= mix(innerFade, 1.0, bgLuminance * 0.7);
                float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;
                float a = iTime * -1.0;
                vec2 pos = vec2(cos(a), sin(a)) * r0;
                float d = distance(uv, pos);
                float v1 = light2(1.5, 5.0, d);
                v1 *= light1(1.0, 50.0, d0);
                float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
                float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);
                vec3 colBase = mix(color1, color2, cl);
                float fadeAmount = mix(1.0, 0.1, bgLuminance);
                vec3 darkCol = mix(color3, colBase, v0);
                darkCol = (darkCol + v1) * v2 * v3;
                darkCol = clamp(darkCol, 0.0, 1.0);
                vec3 lightCol = (colBase + v1) * mix(1.0, v2 * v3, fadeAmount);
                lightCol = mix(backgroundColor, lightCol, v0);
                lightCol = clamp(lightCol, 0.0, 1.0);
                vec3 finalCol = mix(darkCol, lightCol, bgLuminance);
                return extractAlpha(finalCol);
            }

            vec4 mainImage(vec2 fragCoord) {
                vec2 center = iResolution.xy * 0.5;
                float size = min(iResolution.x, iResolution.y);
                vec2 uv = (fragCoord - center) / size * 2.0;
                float angle = rot;
                float s = sin(angle);
                float c = cos(angle);
                uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
                uv.x += hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime);
                uv.y += hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime);
                return draw(uv);
            }

            void main() {
                vec2 fragCoord = vUv * iResolution.xy;
                vec4 col = mainImage(fragCoord);
                gl_FragColor = vec4(col.rgb * col.a, col.a);
            }
        `;

        this.geometry = new Triangle(this.gl);
        this.program = new Program(this.gl, {
            vertex: vert,
            fragment: frag,
            uniforms: {
                iTime: { value: 0 },
                iResolution: { value: new Vec3(this.gl.canvas.width, this.gl.canvas.height, this.gl.canvas.width / this.gl.canvas.height) },
                hue: { value: this.hue },
                hover: { value: 0 },
                rot: { value: 0 },
                hoverIntensity: { value: this.hoverIntensity },
                backgroundColor: { value: hexToVec3(this.backgroundColor) }
            }
        });

        this.mesh = new Mesh(this.gl, { geometry: this.geometry, program: this.program });

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.trackElement.addEventListener('mousemove', e => this.handleMouseMove(e), { passive: true });
        this.trackElement.addEventListener('mouseleave', () => this.handleMouseLeave());

        this._bgVec3 = hexToVec3(this.backgroundColor);
        this._setupVisibility();
        this.rafId = requestAnimationFrame(t => this.update(t));
    }

    resize() {
        if (!this.container) return;
        const dpr = window.devicePixelRatio || 1;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.renderer.setSize(width * dpr, height * dpr);
        this.gl.canvas.style.width = width + 'px';
        this.gl.canvas.style.height = height + 'px';
        this.program.uniforms.iResolution.value.set(this.gl.canvas.width, this.gl.canvas.height, this.gl.canvas.width / this.gl.canvas.height);
    }

    _setupVisibility() {
        if ('IntersectionObserver' in window) {
            const target = this.container.closest('section') || this.container;
            this._visObs = new IntersectionObserver((entries) => {
                this.isVisible = entries[0].isIntersecting;
            }, { threshold: 0 });
            this._visObs.observe(target);
        }
    }

    handleMouseMove(e) {
        // Calculate relative to container even if tracking on parent
        const rect = this.container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const width = rect.width;
        const height = rect.height;
        const size = Math.min(width, height);
        const centerX = width / 2;
        const centerY = height / 2;
        const uvX = ((x - centerX) / size) * 2.0;
        const uvY = ((y - centerY) / size) * 2.0;

        if (Math.sqrt(uvX * uvX + uvY * uvY) < 0.8) {
            this.targetHover = 1;
        } else {
            this.targetHover = 0;
        }
    }

    handleMouseLeave() {
        this.targetHover = 0;
    }

    update(t) {
        this.rafId = requestAnimationFrame(t => this.update(t));
        if (!this.isVisible) return;

        if (!this.lastTime) this.lastTime = t;
        const dt = (t - this.lastTime) * 0.001;
        this.lastTime = t;

        this.program.uniforms.iTime.value = t * 0.001;
        this.program.uniforms.hue.value = this.hue;
        this.program.uniforms.hoverIntensity.value = this.hoverIntensity;
        this.program.uniforms.backgroundColor.value = this._bgVec3;

        const effectiveHover = this.forceHoverState ? 1 : this.targetHover;
        this.program.uniforms.hover.value += (effectiveHover - this.program.uniforms.hover.value) * 0.1;

        if (this.rotateOnHover && effectiveHover > 0.5) {
            this.currentRot += dt * this.rotationSpeed;
        }
        this.program.uniforms.rot.value = this.currentRot;

        this.renderer.render({ scene: this.mesh });
    }

    destroy() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        window.removeEventListener('resize', () => this.resize());
        this.trackElement.removeEventListener('mousemove', e => this.handleMouseMove(e));
        this.trackElement.removeEventListener('mouseleave', () => this.handleMouseLeave());
        if (this.gl.canvas.parentElement) {
            this.gl.canvas.parentElement.removeChild(this.gl.canvas);
        }
        this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
}
