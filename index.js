// API URLs
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=cardano,hyperliquid&vs_currencies=usd';
const GECKOTERMINAL_API_URL = 'https://api.geckoterminal.com/api/v2/simple/networks/cardano/token_price/3d77d63dfa6033be98021417e08e3368cc80e67f8d7afa196aaa0b3953746172636820546f6b656e,6d06570ddd778ec7c0cca09d381eca194e90c8cffa7582879735dbde584552,b6a7467ea1deb012808ef4e87b5ff371e85f7142d7b356a40d9b42a0436f726e75636f70696173205b76696120436861696e506f72742e696f5d';

// Token IDs from GeckoTerminal
const TOKEN_IDS = {
    STRCH: "3d77d63dfa6033be98021417e08e3368cc80e67f8d7afa196aaa0b3953746172636820546f6b656e",
};

const IS_LOCAL_PREVIEW = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const THEME_STORAGE_KEY = 'tdsp-theme';
const COINGECKO_PRICE_URL = IS_LOCAL_PREVIEW ? '/__coingecko_price_proxy__' : COINGECKO_API_URL;
const GECKOTERMINAL_PRICE_URL = IS_LOCAL_PREVIEW ? '/__geckoterminal_price_proxy__' : GECKOTERMINAL_API_URL;

// Fetch and display ADA, HYPE, and STRCH prices asynchronously
async function fetchPrices() {
    const adaEl = document.getElementById('ada-price');
    const hypeEl = document.getElementById('hype-price');
    const strchEl = document.getElementById('strch-price');

    const [coingeckoResult, geckoterminalResult] = await Promise.allSettled([
        fetch(COINGECKO_PRICE_URL).then(response => {
            if (!response.ok) throw new Error(`CoinGecko HTTP Error: ${response.status}`);
            return response.json();
        }),
        fetch(GECKOTERMINAL_PRICE_URL).then(response => {
            if (!response.ok) throw new Error(`GeckoTerminal HTTP Error: ${response.status}`);
            return response.json();
        })
    ]);

    if (coingeckoResult.status === 'fulfilled') {
        const adaPrice = coingeckoResult.value.cardano?.usd?.toFixed(2);
        const hypePrice = coingeckoResult.value.hyperliquid?.usd?.toFixed(2);
        if (adaEl) adaEl.textContent = adaPrice ? `$${adaPrice}` : 'N/A';
        if (hypeEl) hypeEl.textContent = hypePrice ? `$${hypePrice}` : 'N/A';
    } else {
        if (adaEl) adaEl.textContent = 'N/A';
        if (hypeEl) hypeEl.textContent = 'N/A';
    }

    if (geckoterminalResult.status === 'fulfilled') {
        const tokenPrices = geckoterminalResult.value?.data?.attributes?.token_prices || {};
        const strchPrice = parseFloat(tokenPrices[TOKEN_IDS.STRCH]);
        if (strchEl) strchEl.textContent = Number.isFinite(strchPrice) ? `$${strchPrice.toFixed(12)}` : 'N/A';
    } else {
        if (strchEl) strchEl.textContent = 'N/A';
    }
}

// Navigate to details page
function goToDetails() {
    window.location.href = "details.html";
}

// Fetch prices on page load and set up auto-update
// Initialize UI behaviors and price fetching when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    fetchPrices();
    setInterval(fetchPrices, 60000); // Auto-update every 60 seconds
    initUI();
});

document.addEventListener('tdsp:content-loaded', () => {
    initUI();
});

function initUI() {
    setupRevealOnScroll();
    setupHeaderVisibility();
}

function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    applyStoredTheme();
    syncThemeToggle(toggle);

    toggle.addEventListener('click', () => {
        const currentTheme = getPreferredTheme();
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        document.documentElement.dataset.theme = nextTheme;
        syncThemeToggle(toggle);
    });
}

function applyStoredTheme() {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
        document.documentElement.dataset.theme = storedTheme;
        return;
    }

    delete document.documentElement.dataset.theme;
}

function getPreferredTheme() {
    const explicitTheme = document.documentElement.dataset.theme;
    if (explicitTheme === 'light' || explicitTheme === 'dark') return explicitTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function syncThemeToggle(toggle) {
    const nextTheme = getPreferredTheme() === 'dark' ? 'light' : 'dark';
    toggle.dataset.nextTheme = nextTheme;
    toggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
}

function setupRevealOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.12, root: null, rootMargin: '0px 0px -10% 0px' });

    const targets = Array.from(document.querySelectorAll('.section, .hero-logo, .link-grid, h2, p'));
    targets.forEach(el => {
        if (el.dataset.revealObserved === 'true') return;
        el.dataset.revealObserved = 'true';
        el.classList.add('reveal');
        observer.observe(el);
    });

    // Fallback: if observer didn't trigger within 1s, reveal everything so the page isn't stuck hidden
    setTimeout(() => {
        const stillHidden = targets.filter(t => !t.classList.contains('visible'));
        if (stillHidden.length) {
            stillHidden.forEach(t => t.classList.add('visible'));
        }
    }, 1000);
}

function setupHeaderVisibility() {
    const navLinks = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
    const sections = navLinks
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    if (!navLinks.length || !sections.length) return;

    const observer = new IntersectionObserver((entries) => {
        const visible = entries
            .filter(entry => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`);
        });
    }, {
        rootMargin: '-25% 0px -55% 0px',
        threshold: [0.1, 0.25, 0.5]
    });

    sections.forEach(section => observer.observe(section));

    navLinks.forEach(link => {
        if (link.dataset.navBound === 'true') return;
        link.dataset.navBound = 'true';
        link.addEventListener('click', () => {
            navLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
        });
    });

    const firstLink = navLinks[0];
    if (firstLink) {
        firstLink.classList.add('active');
    }
}
