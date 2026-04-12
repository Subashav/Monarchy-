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
    const header = document.getElementById('header');

    // Scroll progress (Lenis does not always update window.scrollY — drive UI from Lenis)
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    // 1. Initialize Lenis Smooth Scrolling
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        wheelMultiplier: 1.0,
        smooth: true
    });

    const updateScrollChrome = () => {
        const limit = lenis.limit;
        const pct = !limit || limit <= 0 ? 0 : Math.min(100, Math.max(0, (lenis.scroll / limit) * 100));
        progressBar.style.width = pct + '%';
        if (header) {
            if (lenis.scroll > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    };

    lenis.on('scroll', () => {
        if (window.ScrollTrigger) {
            window.ScrollTrigger.update();
        }
        updateScrollChrome();
    });

    // Drive Lenis from GSAP ticker so ScrollTrigger and Lenis share one timeline (fixes scrub / pin drift)
    if (window.gsap) {
        window.gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        window.gsap.ticker.lagSmoothing(0);
    } else {
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    updateScrollChrome();

    // Handle Smooth Entrance Instantly
    document.body.classList.remove('loading');

    // Initialize BorderGlow on elements with .glow-card class
    document.querySelectorAll('.glow-card').forEach(card => {
        initBorderGlow(card, {
            animated: true,
            glowIntensity: 1.5,
            edgeSensitivity: 40,
            borderRadius: 20
        });
    });


    // Initialize Lucide Icons with multiple retries if needed
    const initIcons = () => {
        if (window.lucide) {
            window.lucide.createIcons();
        } else {
            setTimeout(initIcons, 500);
        }
    };
    initIcons();

    // GSAP Scroll Animations (Lenis scrolls document.documentElement — proxy must match)
    const scrollRoot = document.documentElement;

    if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
        document.body.classList.add('gsap-ready');

        ScrollTrigger.scrollerProxy(scrollRoot, {
            scrollTop(value) {
                if (arguments.length) {
                    lenis.scrollTo(value, { immediate: true });
                }
                return lenis.scroll;
            },
            getBoundingClientRect() {
                return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
            },
            pinType: scrollRoot.style.transform ? 'transform' : 'fixed'
        });

        window.ScrollTrigger.defaults({ scroller: scrollRoot });

        // Magnetic Buttons Utility
        document.querySelectorAll('.btn-primary, .btn-outline, .logo').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                window.gsap.to(btn, {
                    x: x * 0.3,
                    y: y * 0.3,
                    duration: 0.6,
                    ease: 'power3.out'
                });
            });
            btn.addEventListener('mouseleave', () => {
                window.gsap.to(btn, {
                    x: 0,
                    y: 0,
                    duration: 0.8,
                    ease: 'elastic.out(1, 0.3)'
                });
            });
        });

        // Unified scroll reveals — skip headings nested inside .reveal; skip column wrappers handled by .story-grid stagger
        document.querySelectorAll('h1, h2, h3, .reveal').forEach((el) => {
            if (el.classList.contains('no-split') && el.closest('.hero')) {
                return;
            }
            const tag = el.tagName;
            if ((tag === 'H1' || tag === 'H2' || tag === 'H3') && el.closest('.reveal')) {
                return;
            }
            if (el.classList.contains('reveal') && el.parentElement && el.parentElement.classList.contains('story-grid')) {
                return;
            }
            if (el.classList.contains('reveal') && el.parentElement && el.parentElement.classList.contains('tech-section-inner')) {
                return;
            }
            if (el.classList.contains('reveal') && el.closest('.hero')) {
                return;
            }
            if (el.classList.contains('story-grid')) {
                return;
            }

            window.gsap.from(el, {
                scrollTrigger: {
                    trigger: el,
                    start: 'top 92%',
                    toggleActions: 'play none none reverse',
                    once: true,
                    invalidateOnRefresh: true
                },
                y: 48,
                scale: 0.98,
                rotationX: -4,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
                clearProps: 'transform,opacity,visibility'
            });
        });

        // Hero Content Entrance Reveal
        window.gsap.from('.hero .reveal', {
            y: 30,
            opacity: 0,
            stagger: 0.15,
            duration: 1.2,
            ease: 'expo.out',
            delay: 0.2,
            clearProps: 'transform,opacity,visibility'
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


        // --- Generalized Robot-Style Section Animations ---
        document.querySelectorAll('.tech-section').forEach((section, index) => {
            const robotImg = section.querySelector('.reveal-robot');
            const visualWrap = section.querySelector('.tech-visual');
            
            if (robotImg) {
                // Initial setup to avoid flash
                window.gsap.set(robotImg, { x: 140, opacity: 0, force3D: true });

                // Entrance animation linked to scroll
                window.gsap.to(robotImg, {
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 85%',
                        end: 'bottom 50%',
                        scrub: 1,
                        invalidateOnRefresh: true
                    },
                    x: 0,
                    opacity: 1,
                    ease: 'none'
                });
            }

            if (visualWrap) {
                // Entrance animation for the robot/asset
                const robotImg = visualWrap.querySelector('.reveal-robot');
                if (robotImg) {
                    window.gsap.from(robotImg, {
                        scrollTrigger: {
                            trigger: visualWrap,
                            start: "top 90%",
                            toggleActions: "play none none reverse"
                        },
                        y: 100,
                        scale: 0.8,
                        opacity: 0,
                        duration: 1.8,
                        ease: "expo.out"
                    });

                    // Continuous Floating idle animation
                    window.gsap.to(robotImg, {
                        y: -20,
                        duration: 3 + Math.random() * 2,
                        repeat: -1,
                        yoyo: true,
                        ease: "sine.inOut"
                    });
                }
            }
        });

        window.gsap.utils.toArray('.story-grid, .tech-section-inner, .pillars-grid').forEach((grid) => {
            const cells = grid.querySelectorAll(':scope > *');
            cells.forEach((cell, index) => {
                const fromX = index === 0 ? -56 : 56;
                window.gsap.from(cell, {
                    scrollTrigger: {
                        trigger: grid,
                        start: 'top 86%',
                        once: true,
                        invalidateOnRefresh: true
                    },
                    x: fromX,
                    opacity: 0,
                    duration: 1.05,
                    delay: index * 0.1,
                    ease: 'power3.out',
                    clearProps: 'transform,opacity'
                });
            });
        });

        document.querySelectorAll('.process-timeline').forEach((row) => {
            const steps = row.querySelectorAll(':scope > *');
            if (steps.length === 0) {
                return;
            }
            window.gsap.from(steps, {
                scrollTrigger: {
                    trigger: row,
                    start: 'top 86%',
                    once: true,
                    invalidateOnRefresh: true
                },
                y: 44,
                opacity: 0,
                duration: 0.85,
                stagger: 0.09,
                ease: 'power3.out',
                clearProps: 'transform,opacity'
            });
        });

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

        // Stacking deck animation (methodology section only — not services division cards)
        const stackCards = window.gsap.utils.toArray('.cards-stack-container .stack-card');
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
    try {
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
    } catch (e) {
        console.error('Orb initialization failed:', e);
    }

    // Initialize Galaxy on services hero
    try {
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
    } catch (e) {
        console.error('Galaxy initialization failed:', e);
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
    
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-active');
            const icon = mobileToggle.querySelector('.lucide');
            if (navLinks.classList.contains('mobile-active')) {
                if (icon) {
                    icon.setAttribute('data-lucide', 'x');
                }
                document.body.style.overflow = 'hidden';
            } else {
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                }
                document.body.style.overflow = '';
            }
            if (window.lucide) {
                window.lucide.createIcons();
            }
        });

        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('mobile-active');
                const icon = mobileToggle.querySelector('.lucide');
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                }
                document.body.style.overflow = '';
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            });
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || !href.startsWith('#')) {
                return;
            }
            const target = href.length > 1 ? document.querySelector(href) : null;
            if (!target) {
                if (href === '#') {
                    e.preventDefault();
                }
                return;
            }
            e.preventDefault();
            lenis.scrollTo(target, {
                offset: -90,
                duration: 1.35,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });
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
    // Interactive Cards Handler
    document.querySelectorAll('.service-card, .stack-card').forEach(card => {
        card.addEventListener('click', () => {
            const link = card.querySelector('a');
            if (link) link.click();
        });
    });

    // Mobile dropdown toggle — must match CSS nav breakpoint (968px), not 1024px.
    // Using 1024 here left inline display:block on the menu while desktop nav still showed,
    // which forced vertical stacking and overrode the horizontal mega-menu layout.
    const NAV_MOBILE_MAX = 968;

    const clearDesktopDropdownInlineStyles = () => {
        if (window.innerWidth > NAV_MOBILE_MAX) {
            document.querySelectorAll('.dropdown-menu').forEach((menu) => {
                menu.style.removeProperty('display');
            });
        }
    };

    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            if (window.innerWidth <= NAV_MOBILE_MAX) {
                e.preventDefault();
                const menu = toggle.nextElementSibling;
                if (menu) {
                    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                }
            }
        });
    });

    initGlobalParticles();

    clearDesktopDropdownInlineStyles();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            clearDesktopDropdownInlineStyles();
            if (typeof lenis.resize === 'function') {
                lenis.resize();
            }
            if (window.ScrollTrigger) {
                window.ScrollTrigger.refresh();
            }
            updateScrollChrome();
        }, 150);
    });

    window.addEventListener('load', () => {
        if (window.ScrollTrigger) {
            window.ScrollTrigger.refresh();
        }
        if (typeof lenis.resize === 'function') {
            lenis.resize();
        }
        updateScrollChrome();
    });

    requestAnimationFrame(() => {
        if (window.ScrollTrigger) {
            window.ScrollTrigger.refresh();
        }
    });
});
