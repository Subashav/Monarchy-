import './style.css'
import './border-glow.css'
import { Orb } from './orb.js'
import { Galaxy } from './galaxy.js'
import { Prism } from './prism.js'
import { Antigravity } from './antigravity.js'
import { initBorderGlow } from './border-glow.js'
import { initLegalModals } from './legal.js'
import { Particles } from './particles.js'
import './particles.css'
import './jarvis.css'
import { Jarvis } from './jarvis.js'


document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lenis Smooth Scrolling
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Handle Smooth Entrance
    setTimeout(() => {
        document.body.classList.remove('loading');
    }, 100);

    // Initialize BorderGlow on elements with .glow-card class
    document.querySelectorAll('.glow-card').forEach(card => {
        initBorderGlow(card, {
            animated: true,
            glowIntensity: 1.5,
            edgeSensitivity: 40,
            borderRadius: 20
        });
    });
    // Reveal all elements hidden initially to ensure visibility
    document.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('reveal-hidden');
    });

    // Initialize Lucide Icons with multiple retries if needed
    const initIcons = () => {
        if (window.lucide) {
            window.lucide.createIcons();
            console.log('Lucide icons created');
        } else {
            console.warn('Lucide not found, retrying...');
            setTimeout(initIcons, 500);
        }
    };
    initIcons();

    // GSAP Scroll Animations
    if (window.gsap) {
        window.gsap.registerPlugin(window.ScrollTrigger);

        // Header Scroll Effect
        const header = document.getElementById('header');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

        // Hero Content Reveal - Enhanced Timing
        window.gsap.to('.hero .reveal', {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.8,
            ease: 'expo.out',
            delay: 0.4
        });

        // Generic Section Reveals - Consistent 0.7s duration
        document.querySelectorAll('section').forEach(section => {
            const elements = section.querySelectorAll('.reveal');
            if (elements.length > 0) {
                window.gsap.to(elements, {
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 85%',
                    },
                    opacity: 1,
                    y: 0,
                    stagger: 0.1,
                    duration: 0.7,
                    ease: 'power2.out'
                });
            }
        });

        // Hero Visual Parallax and Mouse move
        const heroVisual = document.querySelector('.hero-visual img');
        if (heroVisual) {
            window.gsap.to(heroVisual, {
                scrollTrigger: {
                    trigger: '.hero',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true
                },
                y: 150,
                rotate: 5,
                scale: 1.1
            });

            document.addEventListener('mousemove', (e) => {
                const xAxis = (window.innerWidth / 2 - e.pageX) / 50;
                const yAxis = (window.innerHeight / 2 - e.pageY) / 50;
                window.gsap.to('.hero-visual', {
                    rotateX: yAxis,
                    rotateY: xAxis,
                    duration: 1,
                    ease: 'power2.out'
                });
            });

            // Parallax effect for the hero visual
            window.addEventListener('scroll', () => {
                const scrolled = window.scrollY;
                const heroVisual = document.querySelector('.hero-visual');
                if (heroVisual) {
                    heroVisual.style.transform = `translateY(${scrolled * 0.15}px)`;
                }
            });
        }

        // Global Card Hover Interactions (Lush Scale + Elevation)
        const cardsToAnimate = '.glow-card, .service-card, .why-item, .stack-card, .marquee-card, .testimonial-card, .process-step, .price-card';
        document.querySelectorAll(cardsToAnimate).forEach(card => {
            card.addEventListener('mouseenter', () => {
                window.gsap.to(card, {
                    y: -12,
                    scale: 1.02,
                    zIndex: 10,
                    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.05)',
                    duration: 0.4,
                    ease: 'power2.out'
                });
            });
            card.addEventListener('mouseleave', () => {
                window.gsap.to(card, {
                    y: 0,
                    scale: 1,
                    zIndex: 1,
                    boxShadow: 'none',
                    duration: 0.4,
                    ease: 'power2.out'
                });
            });
        });

        // Stacking Methodology Animation
        const stackCards = window.gsap.utils.toArray('.stack-card');
        if (stackCards.length > 0) {
            stackCards.forEach((card, index) => {
                if (index < stackCards.length - 1) {
                    window.gsap.to(card, {
                        scrollTrigger: {
                            trigger: stackCards[index + 1],
                            start: "top 90%", // Start scaling sooner
                            end: "top 120px", // Complete when it hits the stack top
                            scrub: 1, // More lag for smoother visibility
                            invalidateOnRefresh: true,
                        },
                        scale: 0.85, // More aggressive scale for visibility
                        opacity: 0.6, // Fades more to draw focus to the new top card
                        y: -50, // More upward movement
                        filter: "brightness(0.3) blur(2px)",
                        ease: "power2.inOut"
                    });
                }
            });
        }

    } else {
        // Fallback for Intersection Observer if GSAP is missing
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.remove('reveal-hidden');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal-hidden').forEach(el => observer.observe(el));
    }

    // Initialize Hero Orb
    const orbContainer = document.getElementById('hero-orb');
    if (orbContainer) {
        new Orb(orbContainer, {
            trackElement: document.querySelector('.hero'),
            hue: 0,
            hoverIntensity: 2,
            rotateOnHover: true,
            forceHoverState: false,
            backgroundColor: '#000000'
        });
    }

    // Initialize Galaxy on services hero
    const galaxyCanvas = document.getElementById('hero-galaxy');
    const isTrainingPage = window.location.pathname.includes('training');
    if (galaxyCanvas && !isTrainingPage) {
        new Galaxy(galaxyCanvas, {
            starSpeed: 0,
            density: 3.0,
            hueShift: 0,
            speed: 1,
            glowIntensity: 0.6,
            saturation: 0,
            mouseRepulsion: true,
            repulsionStrength: 2.5,
            twinkleIntensity: 0.8,
            rotationSpeed: 0.002,
            transparent: true,
            starSize: 1.0,
            brightness: 2.2,
            exclusionRadius: 300
        });
    }

    // Initialize Prism on training hero
    const prismCanvas = document.getElementById('hero-prism');
    if (prismCanvas) {
        new Prism(prismCanvas, {
            height: 4,
            baseWidth: 5.5,
            glow: 0.6,
            noise: 0.1,
            transparent: true,
            scale: 3.5,
            hueShift: 0,
            colorFrequency: 0.65,
            hoverStrength: 2,
            inertia: 0.05,
            bloom: 0.5,
            timeScale: 0.2
        });
    }

    // Initialize Antigravity on various hero sections
    const antiContainer = document.getElementById('hero-antigravity');
    const contactAnti = document.getElementById('contact-antigravity');
    const trainingAnti = document.getElementById('training-antigravity');
    
    const antiParams = {
        count: 400,
        magnetRadius: 6,
        ringRadius: 12,
        waveSpeed: 0.6,
        waveAmplitude: 1.5,
        particleSize: 0.1,
        lerpSpeed: 0.08,
        color: "#FFFFFF",
        autoAnimate: true,
        particleVariance: 1,
        rotationSpeed: 0.2,
        depthFactor: 1,
        pulseSpeed: 3,
        particleShape: "dot",
        fieldStrength: 4
    };

    if (antiContainer) new Antigravity(antiContainer, antiParams);
    if (contactAnti) new Antigravity(contactAnti, antiParams);
    if (trainingAnti) new Antigravity(trainingAnti, antiParams);

    // Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-active');
            const icon = mobileToggle.querySelector('.lucide');
            if (navLinks.classList.contains('mobile-active')) {
                if (icon) icon.setAttribute('data-lucide', 'x');
                document.body.style.overflow = 'hidden'; // Prevent scroll
            } else {
                if (icon) icon.setAttribute('data-lucide', 'menu');
                document.body.style.overflow = ''; // Restore scroll
            }
            if (window.lucide) window.lucide.createIcons();
        });

        // Close menu on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('mobile-active');
                mobileToggle.querySelector('i').setAttribute('data-lucide', 'menu');
                document.body.style.overflow = '';
                window.lucide.createIcons();
            });
        });
    }

    // Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Legal Modals
    initLegalModals();

    // Initialize Global Subtle Particles Background
    const initGlobalParticles = () => {
        const particleContainer = document.createElement('div');
        particleContainer.id = 'global-particles';
        particleContainer.className = 'particles-background';
        document.body.appendChild(particleContainer);

        const particles = new Particles(particleContainer, {
            particleCount: 150,
            particleSpread: 18,
            speed: 0.08,
            particleColors: ["#ffffff"],
            moveParticlesOnHover: true,
            particleHoverFactor: 0.5,
            alphaParticles: true,
            particleBaseSize: 60, // Increased size
            sizeRandomness: 0.8,
            cameraDistance: 25,
            disableRotation: false
        });

        // "Except hero section" - Hide particles when hero is in view
        const heroSections = document.querySelectorAll('.hero, .services-hero, .training-hero');
        if (heroSections.length > 0 && window.IntersectionObserver) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        particleContainer.classList.add('hidden');
                    } else {
                        particleContainer.classList.remove('hidden');
                    }
                });
            }, { threshold: 0.1 });

            heroSections.forEach(hero => observer.observe(hero));
        }
    };
    initGlobalParticles();
});
