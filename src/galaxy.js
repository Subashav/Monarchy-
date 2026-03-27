export class Galaxy {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.mouse = { x: -1000, y: -1000 };
    
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
    this.animate();
    
    window.addEventListener('resize', () => {
        this.init(); // Re-init on resize to fill new area
    });
    
    if (this.options.mouseRepulsion) {
      window.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      });
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

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    this.stars.forEach(star => {
      // Rotate around center slightly
      star.angle += this.options.rotationSpeed;
      star.originalX = centerX + Math.cos(star.angle) * star.dist;
      star.originalY = centerY + Math.sin(star.angle) * star.dist;

      // Mouse repulsion
      if (this.options.mouseRepulsion && this.options.repulsionStrength > 0) {
        const dx = star.x - this.mouse.x;
        const dy = star.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 200) {
          const force = (200 - dist) / 200 * this.options.repulsionStrength;
          star.x += (dx / dist) * force;
          star.y += (dy / dist) * force;
        } else {
          // Return to original pos
          star.x += (star.originalX - star.x) * 0.02;
          star.y += (star.originalY - star.y) * 0.02;
        }
      } else {
          star.x = star.originalX;
          star.y = star.originalY;
      }

      // Linear Movement fallback
      star.x += star.vx;
      star.y += star.vy;

      // Twinkle with Center Fade-out for Readability
      const dxCenter = star.x - centerX;
      const dyCenter = star.y - centerY;
      const distToCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
      
      star.opacity += star.blinkSpeed;
      if (star.opacity > 1 || star.opacity < 0.1) star.blinkSpeed *= -1;

      // Calculate center exclusion/fade
      let centerFade = 1;
      const exclusionRadius = this.options.exclusionRadius; 
      if (distToCenter < exclusionRadius) {
          centerFade = Math.pow(distToCenter / exclusionRadius, 1.5); // Curvy fade
      }

      const alpha = star.opacity * this.options.twinkleIntensity * centerFade * this.options.brightness;
      const color = `hsla(${star.hue}, ${this.options.saturation}%, 100%, ${alpha})`;
      
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      
      // Removed ShadowBlur for performance, using a radial gradient for large stars if needed
      // Instead, just draw a slightly larger faint circle for "glow"
      if (this.options.glowIntensity > 0 && star.size > 1.2) {
          this.ctx.globalAlpha = alpha * 0.7;
          this.ctx.beginPath();
          this.ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.globalAlpha = 1;
      }

      this.ctx.fill();
    });
  }

  animate() {
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}
