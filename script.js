// ============================================================
// ALUGIO — Language Toggle
// ============================================================

const STORAGE_KEY = 'alugio_language';
const DEFAULT_LANG = 'pt';

let currentLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;

document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLang);
    updateLanguageButtons();
    initLeadForm();
});

document.getElementById('lang-pt').addEventListener('click', () => {
    setLanguage('pt');
});

document.getElementById('lang-en').addEventListener('click', () => {
    setLanguage('en');
});

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyLanguage(lang);
    updateLanguageButtons();
    document.documentElement.lang = lang;
}

function applyLanguage(lang) {
    // Handle simple text elements
    document.querySelectorAll('[data-lang-pt][data-lang-en]').forEach(element => {
        element.textContent = element.getAttribute(`data-lang-${lang}`);
    });

    // Handle multi-paragraph language blocks
    document.querySelectorAll('[data-lang-block]').forEach(block => {
        block.classList.toggle('active', block.getAttribute('data-lang-block') === lang);
    });

    // Handle input/select placeholders
    document.querySelectorAll('[data-placeholder-pt][data-placeholder-en]').forEach(el => {
        el.placeholder = el.getAttribute(`data-placeholder-${lang}`);
    });
}

function updateLanguageButtons() {
    document.getElementById('lang-pt').classList.toggle('active', currentLang === 'pt');
    document.getElementById('lang-en').classList.toggle('active', currentLang === 'en');
}

// ============================================================
// ALUGIO — Lead Capture Form
// ============================================================

// Replace this URL after deploying the Azure Function
const LEAD_API_URL = 'https://YOUR_FUNCTION_APP.azurewebsites.net/api/leads';

const MESSAGES = {
    pt: {
        submitting: 'Enviando...',
        submit:     'Quero Acesso Antecipado',
        success:    '✅ Recebemos suas informações! Entraremos em contato em breve.',
        error:      '❌ Algo deu errado. Por favor, tente novamente.',
        required:   'Por favor, preencha Nome e E-mail.',
    },
    en: {
        submitting: 'Submitting...',
        submit:     'Request Early Access',
        success:    '✅ We received your info! We\'ll be in touch soon.',
        error:      '❌ Something went wrong. Please try again.',
        required:   'Please fill in your Name and Email.',
    },
};

function initLeadForm() {
    const form = document.getElementById('lead-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitLead();
    });
}

async function submitLead() {
    const msg      = MESSAGES[currentLang] || MESSAGES.pt;
    const submit   = document.getElementById('lead-submit');
    const btnText  = document.getElementById('lead-btn-text');
    const feedback = document.getElementById('lead-feedback');

    const name          = document.getElementById('lead-name').value.trim();
    const email         = document.getElementById('lead-email').value.trim();
    const phone         = document.getElementById('lead-phone').value.trim();
    const location      = document.getElementById('lead-location').value.trim();
    const propertyCount = document.getElementById('lead-properties').value;

    // Clear previous state
    feedback.className = 'lead-feedback hidden';
    feedback.textContent = '';
    document.getElementById('lead-name').classList.remove('error');
    document.getElementById('lead-email').classList.remove('error');

    // Client-side validation
    if (!name || !email) {
        if (!name)  document.getElementById('lead-name').classList.add('error');
        if (!email) document.getElementById('lead-email').classList.add('error');
        showFeedback(feedback, 'error', msg.required);
        return;
    }

    // Loading state
    submit.disabled = true;
    btnText.textContent = msg.submitting;

    try {
        const response = await fetch(LEAD_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, location, propertyCount }),
        });

        if (response.ok) {
            showFeedback(feedback, 'success', msg.success);
            document.getElementById('lead-form').reset();
        } else {
            const data = await response.json().catch(() => ({}));
            showFeedback(feedback, 'error', data.error || msg.error);
        }
    } catch {
        showFeedback(feedback, 'error', msg.error);
    } finally {
        submit.disabled = false;
        btnText.textContent = msg.submit;
    }
}

function showFeedback(el, type, message) {
    el.className = `lead-feedback ${type}`;
    el.textContent = message;
}
