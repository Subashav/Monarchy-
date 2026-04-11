/**
 * JARVIS - AI Growth Assistant
 * Custom chatbot for MONARCHY
 */

export class Jarvis {
    constructor() {
        this.isOpen = false;
        this.messages = [
            { id: 1, type: 'bot', text: 'Hello, I am JARVIS. Your AI Growth Assistant for MONARCHY.' },
            { id: 2, type: 'bot', text: 'How can I help you scale your business today? You can ask about our IT, Marketing, or HR solutions.' }
        ];
        this.suggestions = [
            { label: 'IT Services', query: 'Tell me about IT services' },
            { label: 'HR Solutions', query: 'How can you help with hiring?' },
            { label: 'Marketing', query: 'What digital marketing services do you offer?' },
            { label: 'Training', query: 'Tell me about your career training' },
            { label: 'Contact Human', query: 'I want to talk to a person' }
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
        jarvisEl.className = 'jarvis-instance'; // Rename container to instance to avoid confusion
        jarvisEl.innerHTML = `
            <div class="jarvis-trigger" id="jarvisTrigger">
                <div class="arc-reactor"></div>
                <i data-lucide="bot" class="bot-icon"></i>
                <i data-lucide="x" class="close-icon"></i>
            </div>
            
            <div class="jarvis-window" id="jarvisWindow">
                <div class="jarvis-header">
                    <div class="jarvis-avatar">
                        <i data-lucide="zap" style="width: 18px; color: #00d2ff;"></i>
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
                this.isOpen = false;
                trigger.classList.remove('active');
                windowEl.classList.remove('active');
            }
        });
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
        const q = query.toLowerCase();
        
        if (q.includes('it') || q.includes('software') || q.includes('web') || q.includes('app')) {
            return "Our IT division builds high-performance web platforms, mobile apps, and custom enterprise solutions. Would you like to see our IT services page?";
        }
        if (q.includes('hr') || q.includes('hiring') || q.includes('recruit') || q.includes('talent')) {
            return "We provide end-to-end HR solutions, talent sourcing, and recruitment process outsourcing. We find the people who build empires.";
        }
        if (q.includes('mark') || q.includes('ads') || q.includes('seo') || q.includes('growth')) {
            return "Our marketing engine drives visibility through SEO, PPC, and brand strategy to fill your sales pipeline with qualified leads.";
        }
        if (q.includes('training') || q.includes('career') || q.includes('fresher')) {
            return "MONARCHY'S training program transforms freshers into industry-ready professionals. Check out our Training page for details!";
        }
        if (q.includes('person') || q.includes('human') || q.includes('talk') || q.includes('contact')) {
            return "Of course! You can book a free strategy call directly from our Contact page, or call us at +91 6385753874.";
        }
        if (q.includes('hello') || q.includes('hi')) {
            return "Hello there! How can I assist you with your business growth engines today?";
        }
        
        return "That's interesting. I'd love to discuss how MONARCHY can help you scale in that area. Should we schedule a consultation call?";
    }
}

// Auto-initialize when imported
if (typeof document !== 'undefined') {
    new Jarvis();
}
