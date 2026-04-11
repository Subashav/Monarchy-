
export const legalContent = {
    privacy: {
        title: "Privacy Policy",
        content: `
            <div class="legal-section">
                <h3>1. Introduction</h3>
                <p>Welcome to MONARCHY. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.</p>
            </div>
            <div class="legal-section">
                <h3>2. The Data We Collect</h3>
                <p>Personal data, or personal information, means any information about an individual from which that person can be identified. We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
                <ul>
                    <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                    <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
                    <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
                    <li><strong>Usage Data:</strong> includes information about how you use our website, products and services.</li>
                </ul>
            </div>
            <div class="legal-section">
                <h3>3. How We Use Your Data</h3>
                <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                <ul>
                    <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                    <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                    <li>Where we need to comply with a legal obligation.</li>
                </ul>
            </div>
            <div class="legal-section">
                <h3>4. Data Security</h3>
                <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.</p>
            </div>
            <div class="legal-section">
                <h3>5. Your Legal Rights</h3>
                <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, and to withdraw consent.</p>
            </div>
        `
    },
    terms: {
        title: "Terms and Conditions",
        content: `
            <div class="legal-section">
                <h3>1. Terms</h3>
                <p>By accessing the website at <a href="https://monarchsoftwares.company">monarchsoftwares.company</a>, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
            </div>
            <div class="legal-section">
                <h3>2. Use License</h3>
                <p>Permission is granted to temporarily download one copy of the materials (information or software) on MONARCHY's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.</p>
            </div>
            <div class="legal-section">
                <h3>3. Disclaimer</h3>
                <p>The materials on MONARCHY's website are provided on an 'as is' basis. MONARCHY makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
            </div>
            <div class="legal-section">
                <h3>4. Limitations</h3>
                <p>In no event shall MONARCHY or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on MONARCHY's website, even if MONARCHY or a MONARCHY authorized representative has been notified orally or in writing of the possibility of such damage.</p>
            </div>
            <div class="legal-section">
                <h3>5. Accuracy of Materials</h3>
                <p>The materials appearing on MONARCHY's website could include technical, typographical, or photographic errors. MONARCHY does not warrant that any of the materials on its website are accurate, complete or current. MONARCHY may make changes to the materials contained on its website at any time without notice.</p>
            </div>
            <div class="legal-section">
                <h3>6. Governing Law</h3>
                <p>These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.</p>
            </div>
        `
    }
};

export function initLegalModals() {
    // Create Modal Structure
    const modalHTML = `
        <div id="legal-modal" class="modal-overlay">
            <div class="modal-container glass grow-card">
                <div class="modal-header">
                    <h2 id="modal-title" class="gradient-text"></h2>
                    <button id="modal-close" class="modal-close-btn">&times;</button>
                </div>
                <div id="modal-content" class="modal-body"></div>
                <div class="modal-footer">
                    <button class="btn btn-primary close-footer-btn">Close</button>
                </div>
            </div>
        </div>
    `;

    // Inject into body
    if (!document.getElementById('legal-modal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    const modal = document.getElementById('legal-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-content');
    const closeBtn = document.getElementById('modal-close');
    const footCloseBtn = modal.querySelector('.close-footer-btn');

    const openModal = (type) => {
        const data = legalContent[type];
        if (!data) return;

        title.innerText = data.title;
        body.innerHTML = data.content;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Triggers lucide icon creation if content has icons
        if (window.lucide) window.lucide.createIcons();
    };

    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };

    // Event Listeners for links
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (target.matches('.privacy-trigger')) {
            e.preventDefault();
            openModal('privacy');
        } else if (target.matches('.terms-trigger')) {
            e.preventDefault();
            openModal('terms');
        }
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (footCloseBtn) footCloseBtn.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}
