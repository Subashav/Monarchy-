import './style.css'
import './border-glow.css'
import { Orb } from './orb.js'
import { Galaxy } from './galaxy.js'
import { Prism } from './prism.js'
import { Antigravity } from './antigravity.js'
import { initBorderGlow } from './border-glow.js'

document.addEventListener('DOMContentLoaded', () => {
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

        // Hero Content Reveal
        window.gsap.to('.hero .reveal-hidden', {
            opacity: 1,
            y: 0,
            stagger: 0.2,
            duration: 1.2,
            ease: 'power4.out',
            delay: 0.5
        });

        // Generic Section Reveals
        document.querySelectorAll('section').forEach(section => {
            const elements = section.querySelectorAll('.reveal-hidden');
            if (elements.length > 0) {
                window.gsap.to(elements, {
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 80%',
                    },
                    opacity: 1,
                    y: 0,
                    stagger: 0.15,
                    duration: 1.2,
                    ease: 'power4.out'
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
        }

        // Testimonial Hover Interaction
        // Testimonial & Glow Card Hover Interaction (Pop up)
        document.querySelectorAll('.testimonial-card, .glow-card, .service-card, .why-item').forEach(card => {
            card.addEventListener('mouseenter', () => {
                window.gsap.to(card, {
                    y: -15,
                    scale: 1.03,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    duration: 0.5,
                    ease: 'power3.out'
                });
            });
            card.addEventListener('mouseleave', () => {
                window.gsap.to(card, {
                    y: 0,
                    scale: 1,
                    boxShadow: 'none',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    duration: 0.5,
                    ease: 'power3.out'
                });
            });
        });

        // Stacking Methodology Animation
        const stackCards = window.gsap.utils.toArray('.stack-card');
        if (stackCards.length > 0) {
            stackCards.forEach((card, index) => {
                if (index === stackCards.length - 1) return;
                
                window.gsap.to(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top 15vh",
                        end: "bottom 15vh",
                        scrub: true,
                        invalidateOnRefresh: true,
                    },
                    scale: 0.95,
                    opacity: 0.5,
                    filter: "brightness(0.3) blur(2px)",
                });
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
            density: 2.4,
            hueShift: 165,
            speed: 1,
            glowIntensity: 0.3,
            saturation: 0,
            mouseRepulsion: true,
            repulsionStrength: 2,
            twinkleIntensity: 0.9,
            rotationSpeed: 0.005,
            transparent: true
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
        count: 800,
        magnetRadius: 8,
        ringRadius: 20,
        exclusionRadius: 8,
        waveSpeed: 0.4,
        waveAmplitude: 1.5,
        particleSize: 0.12,
        lerpSpeed: 0.08,
        color: "#FFFFFF",
        autoAnimate: true,
        rotationSpeed: 0.1,
        pulseSpeed: 2,
        fieldStrength: 5
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
            const icon = mobileToggle.querySelector('i');
            if (navLinks.classList.contains('mobile-active')) {
                icon.setAttribute('data-lucide', 'x');
                document.body.style.overflow = 'hidden'; // Prevent scroll
            } else {
                icon.setAttribute('data-lucide', 'menu');
                document.body.style.overflow = ''; // Restore scroll
            }
            window.lucide.createIcons();
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
});
