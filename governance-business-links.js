(function () {
    function createBusinessLinksModule({
        businessLogos = {},
        businessLogosByDomain = {},
        normalizeBusinessName,
        openExternalWarning
    }) {
        function getWebsiteUrls(group, { mappedUrl, projectWebsites = [], normalizeDomainText } = {}) {
            if (mappedUrl) return normalizeUrlList(mappedUrl);

            const normalizedLabel = typeof normalizeDomainText === 'function'
                ? normalizeDomainText(group?.label)
                : '';
            const matchedUrl = projectWebsites
                .map(value => String(value || '').trim())
                .filter(Boolean)
                .find(url => {
                    const domain = getRootDomainLabel(url);
                    if (!domain || !normalizedLabel || typeof normalizeDomainText !== 'function') return false;
                    const normalizedDomain = normalizeDomainText(domain);
                    return normalizedDomain.includes(normalizedLabel)
                        || normalizedLabel.includes(normalizedDomain);
                });
            return normalizeUrlList(matchedUrl);
        }

        function normalizeUrlList(value) {
            return (Array.isArray(value) ? value : [value])
                .map(normalizeExternalUrl)
                .filter(Boolean);
        }

        function createWebsiteLinks(urls) {
            const normalizedUrls = normalizeUrlList(urls);
            if (!normalizedUrls.length) return null;
            const list = document.createElement('span');
            list.className = 'governance-business-url-list';
            normalizedUrls.forEach(url => {
                const link = document.createElement('a');
                link.className = 'governance-card-detail governance-business-url';
                link.href = url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = getRootDomainLabel(url) || url;
                link.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (typeof openExternalWarning === 'function') {
                        openExternalWarning(url, event.currentTarget);
                        return;
                    }
                    window.open(url, '_blank', 'noopener,noreferrer');
                });
                list.appendChild(link);
            });
            return list;
        }

        function createLogo(urls, label) {
            const normalizedUrls = normalizeUrlList(urls);
            if (!normalizedUrls.length) return null;
            const logos = normalizedUrls.flatMap(url => {
                const logoData = getLogoData(url, label);
                return logoData ? [logoData] : [];
            });
            if (!logos.length) return null;

            const frame = document.createElement('span');
            frame.className = `governance-business-logo-frame${logos.length > 1 ? ' governance-business-logo-frame--multi' : ''}`;
            frame.setAttribute('aria-hidden', 'true');
            frame.title = `${label || 'Company'} logo`;

            logos.forEach(({ logoUrl, domain, mappedLogo }) => {
                const logo = document.createElement('img');
                logo.className = 'governance-business-logo';
                logo.alt = '';
                logo.loading = 'lazy';
                logo.decoding = 'async';
                logo.src = logoUrl;
                logo.addEventListener('error', () => {
                    if (mappedLogo) return;
                    if (logo.dataset.fallbackLoaded === 'true') return;
                    logo.dataset.fallbackLoaded = 'true';
                    logo.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=96`;
                });
                frame.appendChild(logo);
            });

            return frame;
        }

        function getLogoData(url, label) {
            const normalizedUrl = normalizeExternalUrl(url);
            if (!normalizedUrl) return null;
            const normalizedLabel = typeof normalizeBusinessName === 'function'
                ? normalizeBusinessName(label)
                : String(label || '').trim();
            let origin;
            let domain;
            try {
                const parsed = new URL(normalizedUrl);
                origin = parsed.origin;
                domain = parsed.hostname.replace(/^www\./i, '');
            } catch {
                return null;
            }
            if (!origin || !domain) return null;
            const mappedLogo = businessLogos[normalizedLabel] || businessLogosByDomain[domain];
            return {
                logoUrl: mappedLogo || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=96`,
                domain,
                mappedLogo
            };
        }

        function normalizeExternalUrl(value) {
            const raw = String(value || '').trim();
            if (!raw) return null;
            try {
                const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
                if (!['https:', 'http:'].includes(url.protocol)) return null;
                return url.href;
            } catch {
                return null;
            }
        }

        function getRootDomainLabel(value) {
            const normalizedUrl = normalizeExternalUrl(value);
            if (!normalizedUrl) return '';
            try {
                return new URL(normalizedUrl).hostname.replace(/^www\./i, '');
            } catch {
                return '';
            }
        }

        return Object.freeze({
            createLogo,
            createWebsiteLinks,
            getRootDomainLabel,
            getWebsiteUrls,
            normalizeExternalUrl,
            normalizeUrlList
        });
    }

    window.TDSPBusinessLinks = Object.freeze({
        create: createBusinessLinksModule
    });
}());
