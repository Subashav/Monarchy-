/**
 * JARVIS - AI Growth Assistant
 * Custom chatbot for MONARCHY
 */

export class Jarvis {
    constructor() {
        this.isOpen = false;
        this.lastAction = null; // Track the bot's last question/action
        this.messages = [
            { id: 1, type: 'bot', text: 'Hello, I am JARVIS. Your AI Growth Assistant for MONARCHY.' },
            { id: 2, type: 'bot', text: 'How can I help you scale your business today? You can ask about our IT, Marketing, or HR solutions.' }
        ];
        this.suggestions = [
            { label: 'Services', query: 'What services do you provide?' },
            { label: 'Hiring', query: 'How can you help with recruitment?' },
            { label: 'Contact', query: 'What is your phone number and email?' },
            { label: 'Training', query: 'Tell me about career training' }
        ];
        
        this.knowledge = this.collectSiteData();
        this.init();
    }

    collectSiteData() {
        const data = {
            brand: 'MONARCHY',
            phone: '+91 6385753874', // Fallback
            email: 'contact@monarchsoftwares.company', // Fallback
            tagline: 'Hire, Build, and Grow Effortlessly', // Fallback
            services: []
        };

        // Try to find phone from tel: links
        const telLink = document.querySelector('a[href^="tel:"]');
        if (telLink) data.phone = telLink.textContent.trim();

        // Try to find email from mailto: links
        const mailLink = document.querySelector('a[href^="mailto:"]');
        if (mailLink) data.email = mailLink.textContent.trim();

        // Try to find tagline from hero h1
        const heroTag = document.querySelector('.hero h1');
        if (heroTag) data.tagline = heroTag.textContent.replace(/\s+/g, ' ').trim();

        // Extract services from nav or dropdowns
        const serviceLinks = document.querySelectorAll('.dropdown-menu .dropdown-content h5');
        serviceLinks.forEach(s => data.services.push(s.textContent.trim()));

        return data;
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
        jarvisEl.className = 'jarvis-instance'; // Rename container to instance to avoid confusion
        jarvisEl.innerHTML = `
            <div class="jarvis-trigger" id="jarvisTrigger">
                <img src="/jarvis-avatar.png" class="bot-icon-img" alt="JARVIS">
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
                
                <div class="jarvis-messages" id="jarvisMessages">
                    <!-- Messages will be injected here -->
                </div>
                
                <div class="jarvis-options" id="jarvisOptions">
                    <!-- Suggestions will be injected here -->
                </div>
                
                <form class="jarvis-input-area" id="jarvisForm">
                    <input type="text" class="jarvis-input" placeholder="Type your message..." autocomplete="off">
                    <button type="submit" class="jarvis-send">
                        <i data-lucide="send"></i>
                    </button>
                </form>
            </div>
        `;
        // Prepend to show above WhatsApp
        container.prepend(jarvisEl);
        
        // Re-init lucide icons for the new elements
        if (window.lucide) {
            window.lucide.createIcons();
        }
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
            
            if (this.isOpen) {
                setTimeout(() => input.focus(), 300);
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (text) {
                this.handleUserMessage(text);
                input.value = '';
            }
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Close on click outside
        document.addEventListener('mousedown', (e) => {
            if (!this.isOpen) return;
            
            const jarvisContainer = document.querySelector('.jarvis-instance');
            if (jarvisContainer && !jarvisContainer.contains(e.target)) {
                this.close();
            }
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
        
        this.messages.forEach(msg => {
            this.renderMessage(msg);
        });
        
        this.renderOptions();
    }

    renderMessage(msg) {
        const container = document.getElementById('jarvisMessages');
        const msgEl = document.createElement('div');
        msgEl.className = `message ${msg.type}`;
        msgEl.textContent = msg.text;
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
        
        // Show typing indicator
        const messageContainer = document.getElementById('jarvisMessages');
        const typing = document.createElement('div');
        typing.className = 'typing';
        typing.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        messageContainer.appendChild(typing);
        messageContainer.scrollTop = messageContainer.scrollHeight;

        // Auto-reply logic
        const response = this.getBotResponse(text);
        
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate thinking
        
        typing.remove();
        this.renderMessage({ type: 'bot', text: response });
    }

    getBotResponse(query) {
        const q = query.toLowerCase().trim();
        
        // Handle affirmative responses if we just asked a question
        if (this.lastAction === 'offer_call' && (q === 'yes' || q === 'yep' || q === 'sure' || q.includes('okay') || q.includes('please'))) {
            this.lastAction = null;
            return `Excellent! You can book your free strategy call directly on our contact page: <a href="/contact.html" style="color: #00d2ff; text-decoration: underline;">Book Now</a>. Or shall I provide our phone number again?`;
        }

        if (q.includes('what') && (q.includes('monarchy') || q.includes('this site') || q.includes('you do'))) {
            this.lastAction = null;
            return `${this.knowledge.brand} is your integrated growth partner. Our mission is to help you ${this.knowledge.tagline}. We handle IT, HR, and Marketing under one roof.`;
        }
        if (q.includes('phone') || q.includes('number') || q.includes('call') || q.includes('mobile')) {
            this.lastAction = 'offer_call';
            return `You can reach ${this.knowledge.brand} directly at ${this.knowledge.phone}. Would you like to schedule a formal strategy call?`;
        }
        if (q.includes('email') || q.includes('mail') || q.includes('contact')) {
            this.lastAction = 'offer_call';
            return `You can email us at ${this.knowledge.email} or call ${this.knowledge.phone}. Should I help you book a consultation?`;
        }
        if (q.includes('it') || q.includes('software') || q.includes('web') || q.includes('app')) {
            this.lastAction = 'offer_call';
            return `Our IT division builds high-performance platforms, mobile apps, and custom enterprise solutions. Would you like to discuss a technical project with us?`;
        }
        if (q.includes('hr') || q.includes('hiring') || q.includes('recruit') || q.includes('talent')) {
            this.lastAction = 'offer_call';
            return `We provide end-to-end HR and recruitment solutions, having placed 500+ professionals. Do you need help with hiring talent?`;
        }
        if (q.includes('mark') || q.includes('ads') || q.includes('seo') || q.includes('growth')) {
            this.lastAction = 'offer_call';
            return `Our marketing engine drives visibility through SEO, PPC, and brand strategy. Would you like a free audit of your current marketing?`;
        }
        if (q.includes('training') || q.includes('career') || q.includes('fresher')) {
            return `${this.knowledge.brand}'s training program transforms freshers into industry-ready professionals. You can find more details on our <a href="/training.html" style="color: #00d2ff; text-decoration: underline;">Training Page</a>.`;
        }
        if (q.includes('services') || q.includes('offer') || q.includes('do you do')) {
            const services = this.knowledge.services.length > 0 ? this.knowledge.services.join(', ') : 'IT, HR, and Digital Marketing';
            return `We offer: ${services}. Each is synchronized for maximum impact. Which one are you interested in?`;
        }
        if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
            return "Hello! I am JARVIS. How can I assist you with your business growth engines today?";
        }
        
        this.lastAction = 'offer_call';
        return "I'd love to provide more details about that. Would you like to schedule a free 30-minute strategy call with our growth experts?";
    }
}

// Auto-initialize when imported
if (typeof document !== 'undefined') {
    new Jarvis();
}
