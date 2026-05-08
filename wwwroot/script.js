// ============================================================
// ALUGIO — Language Toggle
// ============================================================

const STORAGE_KEY = 'alugio_language';
const SUPPORTED_LANGS = ['pt', 'en'];
const FALLBACK_LANG = 'pt';

function detectInitialLanguage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED_LANGS.includes(stored)) return stored;

    const candidates = navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || ''];

    for (const raw of candidates) {
        const tag = (raw || '').toLowerCase().split('-')[0];
        if (SUPPORTED_LANGS.includes(tag)) {
            localStorage.setItem(STORAGE_KEY, tag);
            return tag;
        }
    }

    localStorage.setItem(STORAGE_KEY, FALLBACK_LANG);
    return FALLBACK_LANG;
}

let currentLang = detectInitialLanguage();

document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLang);
    updateLanguageButtons();
    initLeadForm();
    initHamburger();
    initHeroCta();
    initTestimonials();
    initReveal();
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
    const mPT = document.getElementById('lang-pt-mobile');
    const mEN = document.getElementById('lang-en-mobile');
    if (mPT) mPT.classList.toggle('active', currentLang === 'pt');
    if (mEN) mEN.classList.toggle('active', currentLang === 'en');
}

function initHamburger() {
    const btn = document.getElementById('hamburger');
    const nav = document.getElementById('main-nav');

    btn.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when a nav link is clicked
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
        });
    });

    // Mobile language buttons
    const mPT = document.getElementById('lang-pt-mobile');
    const mEN = document.getElementById('lang-en-mobile');
    if (mPT) mPT.addEventListener('click', () => { setLanguage('pt'); });
    if (mEN) mEN.addEventListener('click', () => { setLanguage('en'); });
}

// ============================================================
// ALUGIO — Lead Capture Form
// ============================================================

// Replace this URL after deploying the Azure Function
const LEAD_API_URL = 'https://alugio-alpha-leadcapture-fqf6dje7fba9e6fe.westus2-01.azurewebsites.net/api/leads';

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

// ============================================================
// ALUGIO — Scroll reveal
// ============================================================

function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !('IntersectionObserver' in window)) {
        items.forEach(el => el.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -5% 0px',
    });

    items.forEach(el => observer.observe(el));
}

// ============================================================
// ALUGIO — Hero CTA smooth scroll
// ============================================================

function initHeroCta() {
    const btn = document.getElementById('hero-cta');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const target = document.getElementById('early-access');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// ============================================================
// ALUGIO — Testimonials Carousel
// ============================================================

function initTestimonials() {
    const root = document.getElementById('testimonials-carousel');
    if (!root) return;

    const track = document.getElementById('testimonials-track');
    const dotsContainer = document.getElementById('testimonials-dots');
    const prev = root.querySelector('.carousel-arrow.prev');
    const next = root.querySelector('.carousel-arrow.next');
    const cards = Array.from(track.children);
    if (!cards.length) return;

    const AUTO_INTERVAL_MS = 10000;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let page = 0;
    let timer = null;

    function perPage() {
        return window.innerWidth <= 768 ? 1 : 2;
    }

    function pageCount() {
        return Math.max(1, Math.ceil(cards.length / perPage()));
    }

    function renderDots() {
        dotsContainer.innerHTML = '';
        const count = pageCount();
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel-dot' + (i === page ? ' active' : '');
            dot.setAttribute('aria-label', `Go to page ${i + 1}`);
            dot.addEventListener('click', () => goTo(i, true));
            dotsContainer.appendChild(dot);
        }
    }

    function updateDotsActive() {
        Array.from(dotsContainer.children).forEach((d, i) => {
            d.classList.toggle('active', i === page);
        });
    }

    function applyOffset() {
        const offset = -(page * 100);
        track.style.transform = `translateX(${offset}%)`;
    }

    function goTo(index, userInitiated) {
        const count = pageCount();
        page = ((index % count) + count) % count;
        applyOffset();
        updateDotsActive();
        if (userInitiated) restartAuto();
    }

    function goNext(userInitiated) { goTo(page + 1, userInitiated); }
    function goPrev(userInitiated) { goTo(page - 1, userInitiated); }

    function startAuto() {
        if (reducedMotion) return;
        stopAuto();
        timer = setInterval(() => goNext(false), AUTO_INTERVAL_MS);
    }

    function stopAuto() {
        if (timer) { clearInterval(timer); timer = null; }
    }

    function restartAuto() {
        stopAuto();
        startAuto();
    }

    prev.addEventListener('click', () => goPrev(true));
    next.addEventListener('click', () => goNext(true));

    root.addEventListener('mouseenter', stopAuto);
    root.addEventListener('mouseleave', startAuto);
    root.addEventListener('focusin', stopAuto);
    root.addEventListener('focusout', startAuto);

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const count = pageCount();
            if (page >= count) page = count - 1;
            renderDots();
            applyOffset();
        }, 150);
    });

    renderDots();
    applyOffset();
    startAuto();
}
