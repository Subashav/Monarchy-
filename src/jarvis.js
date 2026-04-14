/**
 * JARVIS - AI Growth Assistant
 * Fully Trained Chatbot for MONARCH SOFTWARES
 */

export class Jarvis {
    constructor() {
        this.isOpen = false;
        this.lastAction = null;
        this.messages = [
            { id: 1, type: 'bot', text: 'Hello, I am JARVIS. Your AI Growth Assistant for MONARCH SOFTWARES.' },
            { id: 2, type: 'bot', text: 'I am trained on our full ecosystem of IT, Marketing, and HR solutions. How can I help you scale today?' }
        ];
        this.suggestions = [
            { label: 'How can you help me scale?', query: 'how can you help me scale' },
            { label: 'Cloud Infrastructure', query: 'tell me about cloud infrastructure' },
            { label: 'Hiring Talent', query: 'how can you help with recruitment' },
            { label: 'Training Programs', query: 'what training tracks do you offer' },
            { label: 'Company Location', query: 'where are you located' }
        ];
        
        this.knowledge = {
            brand: 'MONARCH SOFTWARES',
            phone: '+91 6385753874',
            email: 'contact@monarchsoftwares.company',
            location: 'Bangalore, India (Onsite)',
            tagline: 'The integrated growth engine for ambitious businesses.'
        };

        // Training Data - 100+ patterns handled via categories
        this.brain = [
            // INTEGRATED MODEL / WHO WE ARE
            {
                keywords: ['your name', 'who is this', 'identity', 'what are you called', 'who are you', 'what is monarch', 'what do you do', 'about the company', 'monarch softwares'],
                response: `I am JARVIS, the AI Growth Assistant for MONARCH SOFTWARES. I help synchronize your IT, HR, and Marketing into a single growth engine.`
            },
            {
                keywords: ['how it works', 'integrated model', 'synchronized', 'why monarch', 'advantage'],
                response: `Our integrated model means your tech, talent, and marketing teams share the same strategy room. When tech ships a feature, marketing is already live. When leads come in, HR is already staffing. Everything compounds for faster growth.`
            },

            // IT SOLUTIONS
            {
                keywords: ['it services', 'software engineering', 'development', 'tech stack'],
                response: `Our IT division engineers production-grade platforms. We specialize in Web Engineering (Next.js/React), Mobile Dev (Native/Cross), and Enterprise Solutions (CRM/ERP). Would you like to see our specific IT service breakdown?`
            },
            {
                keywords: ['web engineering', 'website', 'web dev', 'frontend', 'backend', 'nextjs', 'react'],
                response: `We build high-performance web applications using the latest tech like Next.js and React. Our focus is on speed, scalability, and premium UI/UX that converts visitors into customers.`
            },
            {
                keywords: ['mobile app', 'android', 'ios', 'cross platform', 'flutter', 'react native'],
                response: `We develop native and cross-platform mobile applications that provide seamless user experiences. From initial wireframing to App Store deployment, we handle the entire lifecycle.`
            },
            {
                keywords: ['cloud', 'infrastructure', 'aws', 'azure', 'devops', 'scaling'],
                response: `Our cloud experts design scalable architectures that grow with your traffic. We handle server management, security, and automated deployment pipelines so you never have to worry about downtime.`
            },
            {
                keywords: ['ai', 'machine learning', 'ml', 'automation', 'chatbots'],
                response: `We integrate AI and ML to automate your business processes. Whether it's custom recommendation engines, data processing, or assistants like me (JARVIS), we build tech that thinks.`
            },

            // HR SOLUTIONS
            {
                keywords: ['hr', 'recruitment', 'hiring', 'talent', 'staffing', 'job'],
                response: `Our HR division is a precision talent engine. We offer end-to-end recruitment, payroll management, and statutory compliance. We've placed over 500+ professionals with a 92% retention rate.`
            },
            {
                keywords: ['payroll', 'compliance', 'statutory', 'pf', 'esi', 'tax'],
                response: `We handle all payroll processing and statutory filings (PF, ESI, TDS, Professional Tax). We ensure your business is 100% compliant so you can focus on building your product, not paperwork.`
            },
            {
                keywords: ['campus hiring', 'volume hiring', 'freshers', 'bulk recruitment'],
                response: `We run intensive campus drives and batch recruitment events. Our assessments filter thousands of candidates to find the top 1% who are ready to contribute from Day 1.`
            },
            {
                keywords: ['retention', 'guarantee', 'how long'],
                response: `We offer placement guarantees and have achieved a 92% retention rate past the 12-month mark. We don't just find resumes; we find cultural and technical fits.`
            },

            // MARKETING SOLUTIONS
            {
                keywords: ['marketing', 'digital marketing', 'advertising', 'ads', 'growth'],
                response: `Our marketing division turns visibility into revenue. We engineer full-funnel strategies involving SEO, PPC, and brand design. Would you like a free audit of your current visibility?`
            },
            {
                keywords: ['seo', 'search engine', 'keywords', 'organic', 'rank'],
                response: `Our SEO domination plan involves deep technical audits, link building, and buyer-intent content strategy. We target organic growth that compounds without increasing ad spend.`
            },
            {
                keywords: ['ppc', 'google ads', 'meta ads', 'facebook ads', 'instagram ads', 'paid advertising'],
                response: `We manage precision-targeted paid campaigns with clear ROI attribution. Every rupee spent is tracked from first click to final conversion.`
            },
            {
                keywords: ['social media', 'instagram', 'linkedin', 'twitter', 'content', 'reels'],
                response: `We build social ecosystems that build trust at scale. We handle content creation, community engagement, and influencer partnerships across all major platforms.`
            },
            {
                keywords: ['branding', 'logo', 'design', 'creative', 'brand identity'],
                response: `Premium aesthetics command premium pricing. We build complete brand identities, from logo systems to high-fidelity video production.`
            },

            // TRAINING
            {
                keywords: ['training', 'career engineering', 'learn', 'course', 'internship', 'bootcamp'],
                response: `Our career engineering program transforms potential into proficiency. It's a 12-week immersive journey with live projects and 1-on-1 mentorship from working professionals.`
            },
            {
                keywords: ['how long is training', 'duration', 'weeks', 'months'],
                response: `The standard training cycle is 12 weeks: Phase 1 (Foundation), Phase 2 (Real Project Immersion), and Phase 3 (Career Launch & Placement).`
            },

            // LOGISTICS / CONTACT
            {
                keywords: ['contact', 'email', 'phone', 'call', 'number', 'reach you'],
                response: `You can reach us at ${this.knowledge.phone} or email ${this.knowledge.email}. Our headquarters are in ${this.knowledge.location}. Would you like to book a consultation?`
            },
            {
                keywords: ['location', 'where are you', 'office', 'bangalore', 'bengaluru', 'city'],
                response: `We are based in ${this.knowledge.location}. You can see our exact location on the map in the footer of our website.`
            },
            {
                keywords: ['consultation', 'booking', 'strategy call', 'meeting', 'appointment'],
                response: `You can book a free 30-minute strategy call directly on our <a href="/contact.html" style="color: #00d2ff; text-decoration: underline;">Contact Page</a>. Shall I provide our phone number as well?`
            },

            // PERSONALITY / FALLBACKS
            {
                keywords: ['hello', 'hi', 'hey', 'greetings'],
                response: `Hello! I am JARVIS. How can I assist you with your business growth engines today?`
            },
            {
                keywords: ['thanks', 'thank you', 'ok', 'okay', 'great'],
                response: `You're very welcome! If you have any more questions about our IT, HR, or Marketing services, just ask.`
            },
            {
                keywords: ['bye', 'goodbye', 'see you'],
                response: `Goodbye! I'm here 24/7 if you need help scaling your business. Have a great day!`
            }
        ];

        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.addInitialMessages();
    }

    render() {
        let container = document.querySelector('.floating-actions');
        if (!container) {
            container = document.createElement('div');
            container.className = 'floating-actions';
            document.body.appendChild(container);
        }

        const jarvisEl = document.createElement('div');
        jarvisEl.className = 'jarvis-instance';
        jarvisEl.innerHTML = `
            <div class="jarvis-trigger" id="jarvisTrigger">
                <i data-lucide="message-square" class="bot-icon"></i>
                <i data-lucide="x" class="close-icon"></i>
            </div>
            
            <div class="jarvis-window" id="jarvisWindow">
                <div class="jarvis-header">
                    <div class="jarvis-avatar">
                        <img src="/jarvis-avatar.png" alt="JARVIS">
                    </div>
                    <div class="jarvis-info">
                        <h3>JARVIS</h3>
                        <p>Growth Assistant • Online</p>
                    </div>
                </div>
                
                <div class="jarvis-messages" id="jarvisMessages"></div>
                
                <div class="jarvis-options" id="jarvisOptions"></div>
                
                <form class="jarvis-input-area" id="jarvisForm">
                    <input type="text" class="jarvis-input" placeholder="Type your message..." autocomplete="off">
                    <button type="submit" class="jarvis-send">
                        <i data-lucide="send"></i>
                    </button>
                </form>
            </div>
        `;
        container.prepend(jarvisEl);
        if (window.lucide) window.lucide.createIcons();
    }

    setupEventListeners() {
        const trigger = document.getElementById('jarvisTrigger');
        const windowEl = document.getElementById('jarvisWindow');
        const form = document.getElementById('jarvisForm');
        const input = form.querySelector('input');
        
        trigger.addEventListener('click', () => {
            this.isOpen = !this.isOpen;
            trigger.classList.toggle('active', this.isOpen);
            windowEl.classList.toggle('active', this.isOpen);
            if (this.isOpen) setTimeout(() => input.focus(), 300);
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (text) {
                this.handleUserMessage(text);
                input.value = '';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });

        document.addEventListener('mousedown', (e) => {
            if (!this.isOpen) return;
            const jarvisContainer = document.querySelector('.jarvis-instance');
            if (jarvisContainer && !jarvisContainer.contains(e.target)) this.close();
        });
    }

    close() {
        const trigger = document.getElementById('jarvisTrigger');
        const windowEl = document.getElementById('jarvisWindow');
        this.isOpen = false;
        if (trigger) trigger.classList.remove('active');
        if (windowEl) windowEl.classList.remove('active');
    }

    addInitialMessages() {
        const messageContainer = document.getElementById('jarvisMessages');
        messageContainer.innerHTML = '';
        this.messages.forEach(msg => this.renderMessage(msg));
        this.renderOptions();
    }

    renderMessage(msg) {
        const container = document.getElementById('jarvisMessages');
        const msgEl = document.createElement('div');
        msgEl.className = `message ${msg.type}`;
        msgEl.innerHTML = msg.text;
        container.appendChild(msgEl);
        container.scrollTop = container.scrollHeight;
    }

    renderOptions() {
        const container = document.getElementById('jarvisOptions');
        container.innerHTML = '';
        this.suggestions.forEach(suggest => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = suggest.label;
            btn.onclick = () => this.handleUserMessage(suggest.query, suggest.label);
            container.appendChild(btn);
        });
    }

    async handleUserMessage(text, label = null) {
        this.renderMessage({ type: 'user', text: label || text });
        
        const messageContainer = document.getElementById('jarvisMessages');
        const typing = document.createElement('div');
        typing.className = 'typing';
        typing.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        messageContainer.appendChild(typing);
        messageContainer.scrollTop = messageContainer.scrollHeight;

        const response = this.getBotResponse(text);
        await new Promise(resolve => setTimeout(resolve, 800)); // Reduced thinking time for snappier feel
        
        typing.remove();
        this.renderMessage({ type: 'bot', text: response });
    }

    getBotResponse(query) {
        const q = query.toLowerCase().trim();
        
        // Check for specific brain matches
        let bestMatch = null;
        let highestScore = 0;

        for (const item of this.brain) {
            let score = 0;
            for (const keyword of item.keywords) {
                if (q.includes(keyword)) {
                    score += keyword.length; // Priority to longer keyword matches
                }
            }
            if (score > highestScore) {
                highestScore = score;
                bestMatch = item;
            }
        }

        if (bestMatch && highestScore > 0) {
            return bestMatch.response;
        }

        // Generic fallback with helpful context
        return "I'd love to help with that. Could you please specify if you're interested in our **IT**, **Marketing**, or **HR** solutions? Or would you like to speak to a human expert at " + this.knowledge.phone + "?";
    }
}

if (typeof document !== 'undefined') {
    new Jarvis();
}
