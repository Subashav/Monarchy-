export class Galaxy {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.mouse = { x: -1000, y: -1000 };
    this.isVisible = true;
    
    this.options = {
      starSpeed: options.starSpeed || 0.05,
      density: options.density || 0.8, // Reduced for performance
      hueShift: options.hueShift || 330,
      speed: options.speed || 1,
      glowIntensity: options.glowIntensity || 0.5,
      saturation: options.saturation || 0,
      mouseRepulsion: options.mouseRepulsion || false,
      repulsionStrength: options.repulsionStrength || 2,
      twinkleIntensity: options.twinkleIntensity || 0.5,
      rotationSpeed: options.rotationSpeed || 0.0001,
      transparent: options.transparent || true,
      starSize: options.starSize || 1.0,
      brightness: options.brightness || 1.0,
      exclusionRadius: options.exclusionRadius || 500,
      ...options
    };

    this.init();
    this._setupVisibility();
    this.animate();
    
    window.addEventListener('resize', () => {
        this.init(); // Re-init on resize to fill new area
    });
    
    if (this.options.mouseRepulsion) {
      window.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      }, { passive: true });
    }
  }

  init() {
    this.resize();
    // Adjust density to be more manageable
    const starCount = Math.floor((this.canvas.width * this.canvas.height) / 3000 * this.options.density);
    this.stars = [];
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    for (let i = 0; i < starCount; i++) {
      const radius = Math.random() * Math.max(this.canvas.width, this.canvas.height) * 0.8;
      const angle = Math.random() * Math.PI * 2;
      
      this.stars.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        originalX: centerX + Math.cos(angle) * radius,
        originalY: centerY + Math.sin(angle) * radius,
        size: (Math.random() * 2.0 + 0.5) * this.options.starSize,
        opacity: Math.random(),
        blinkSpeed: (Math.random() * 0.015 + 0.005) * this.options.speed,
        hue: this.options.hueShift + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * this.options.starSpeed,
        vy: (Math.random() - 0.5) * this.options.starSpeed,
        angle: angle,
        dist: radius
      });
    }
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

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const centerX = w * 0.5;
    const centerY = h * 0.5;
    const stars = this.stars;
    const len = stars.length;
    const rotSpeed = this.options.rotationSpeed;
    const mouseRepulsion = this.options.mouseRepulsion && this.options.repulsionStrength > 0;
    const repStr = this.options.repulsionStrength;
    const mouseX = this.mouse.x;
    const mouseY = this.mouse.y;
    const twinkle = this.options.twinkleIntensity;
    const bright = this.options.brightness;
    const exclRadius = this.options.exclusionRadius;
    const exclRadiusSq = exclRadius * exclRadius;
    const glowOn = this.options.glowIntensity > 0;
    const sat = this.options.saturation;
    const TAU = 6.283185307;

    for (let i = 0; i < len; i++) {
      const star = stars[i];
      star.angle += rotSpeed;
      star.originalX = centerX + Math.cos(star.angle) * star.dist;
      star.originalY = centerY + Math.sin(star.angle) * star.dist;

      if (mouseRepulsion) {
        const dx = star.x - mouseX;
        const dy = star.y - mouseY;
        const distSq = dx * dx + dy * dy;
        if (distSq < 40000) { // 200*200
          const dist = Math.sqrt(distSq);
          const force = (200 - dist) / 200 * repStr;
          star.x += (dx / dist) * force;
          star.y += (dy / dist) * force;
        } else {
          star.x += (star.originalX - star.x) * 0.02;
          star.y += (star.originalY - star.y) * 0.02;
        }
      } else {
        star.x = star.originalX;
        star.y = star.originalY;
      }

      star.x += star.vx;
      star.y += star.vy;

      star.opacity += star.blinkSpeed;
      if (star.opacity > 1 || star.opacity < 0.1) star.blinkSpeed *= -1;

      const dxC = star.x - centerX;
      const dyC = star.y - centerY;
      const distCenterSq = dxC * dxC + dyC * dyC;

      let centerFade = 1;
      if (distCenterSq < exclRadiusSq) {
        centerFade = Math.pow(Math.sqrt(distCenterSq) / exclRadius, 1.5);
      }

      const alpha = star.opacity * twinkle * centerFade * bright;

      if (glowOn && star.size > 1.2) {
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = `hsla(${star.hue},${sat}%,100%,1)`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 3, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = `hsla(${star.hue},${sat}%,100%,${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, TAU);
      ctx.fill();
    }
  }

  animate() {
    if (this.isVisible) {
      this.draw();
    }
    requestAnimationFrame(() => this.animate());
  }
}
