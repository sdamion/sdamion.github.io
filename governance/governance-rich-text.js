(function () {
    function createGovernanceRichText(options = {}) {
        const normalizeMetadataUrl = typeof options.normalizeMetadataUrl === 'function'
            ? options.normalizeMetadataUrl
            : value => String(value || '');
        const normalizeImageSource = typeof options.normalizeImageSource === 'function'
            ? options.normalizeImageSource
            : () => '';
        const looksLikeBase64Image = typeof options.looksLikeBase64Image === 'function'
            ? options.looksLikeBase64Image
            : () => false;

        function cleanGovernanceText(text) {
            return text
                .replace(/\n{3,}/g, '\n\n')
                .trim();
        }

        function sanitizeGovernanceMarkdown(text) {
            return text
                .split('\n')
                .filter(line => {
                    const trimmed = line.trim();
                    if (!trimmed) return true;

                    if (/^\[[^\]]+\]:\s*<?data:image\/[a-z0-9.+-]+;base64,/i.test(trimmed)) return false;
                    if (/^<?data:image\/[a-z0-9.+-]+;base64,/i.test(trimmed)) return false;
                    if (/^!\[[^\]]*\]\(data:image\/[a-z0-9.+-]+;base64,[^)]+\)$/i.test(trimmed)) return false;

                    return true;
                })
                .join('\n')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
        }

        function appendRichText(container, text) {
            const urlPattern = /((?:https?:\/\/|ipfs:\/\/)[^\s<>"')\]]+)/g;
            let lastIndex = 0;

            text.replace(urlPattern, (url, _match, offset) => {
                if (offset > lastIndex) {
                    container.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
                }

                const cleanUrl = url.replace(/[.,;:!?]+$/, '');
                const trailing = url.slice(cleanUrl.length);

                const imageSrc = normalizeImageSource(cleanUrl);
                if (imageSrc) {
                    const imageLink = document.createElement('a');
                    imageLink.href = imageSrc;
                    imageLink.target = '_blank';
                    imageLink.rel = 'noopener noreferrer';

                    const image = document.createElement('img');
                    image.className = 'governance-detail-image';
                    image.src = imageSrc;
                    image.alt = 'Governance action image';
                    image.loading = 'lazy';
                    image.referrerPolicy = 'no-referrer';

                    imageLink.appendChild(image);
                    container.appendChild(imageLink);
                } else {
                    const link = document.createElement('a');
                    link.href = cleanUrl;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.referrerPolicy = 'no-referrer';
                    link.textContent = cleanUrl;
                    container.appendChild(link);
                }

                if (trailing) {
                    container.appendChild(document.createTextNode(trailing));
                }

                lastIndex = offset + url.length;
                return url;
            });

            if (lastIndex < text.length) {
                container.appendChild(document.createTextNode(text.slice(lastIndex)));
            }
        }

        function renderMarkdown(container, markdown) {
            const lines = cleanGovernanceText(markdown).replace(/\r\n?/g, '\n').split('\n');
            let index = 0;

            while (index < lines.length) {
                const line = lines[index];

                if (!line.trim()) {
                    index += 1;
                    continue;
                }

                if (line.trim().startsWith('```')) {
                    const language = line.trim().slice(3).trim();
                    index += 1;
                    const codeLines = [];
                    while (index < lines.length && !lines[index].trim().startsWith('```')) {
                        codeLines.push(lines[index]);
                        index += 1;
                    }
                    if (index < lines.length) index += 1;

                    const pre = document.createElement('pre');
                    pre.className = 'governance-markdown-code';
                    if (language) pre.dataset.language = language;
                    pre.textContent = codeLines.join('\n');
                    container.appendChild(pre);
                    continue;
                }

                const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
                if (headingMatch) {
                    const level = Math.min(6, headingMatch[1].length + 1);
                    const heading = document.createElement(`h${level}`);
                    appendMarkdownInline(heading, headingMatch[2].trim());
                    container.appendChild(heading);
                    index += 1;
                    continue;
                }

                if (isMarkdownTable(lines, index)) {
                    const { element, nextIndex } = renderMarkdownTable(lines, index);
                    container.appendChild(element);
                    index = nextIndex;
                    continue;
                }

                if (/^>\s?/.test(line)) {
                    const quoteLines = [];
                    while (index < lines.length && /^>\s?/.test(lines[index])) {
                        quoteLines.push(lines[index].replace(/^>\s?/, ''));
                        index += 1;
                    }

                    const blockquote = document.createElement('blockquote');
                    renderMarkdown(blockquote, quoteLines.join('\n'));
                    container.appendChild(blockquote);
                    continue;
                }

                if (/^\s*([-*+])\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
                    const { element, nextIndex } = renderMarkdownList(lines, index);
                    container.appendChild(element);
                    index = nextIndex;
                    continue;
                }

                const paragraphLines = [];
                while (index < lines.length) {
                    const current = lines[index];
                    if (!current.trim()) break;
                    if (current.trim().startsWith('```')) break;
                    if (/^(#{1,6})\s+/.test(current)) break;
                    if (/^>\s?/.test(current)) break;
                    if (/^\s*([-*+])\s+/.test(current) || /^\s*\d+\.\s+/.test(current)) break;
                    if (isMarkdownTable(lines, index)) break;
                    paragraphLines.push(current.trim());
                    index += 1;
                }

                const paragraph = document.createElement('p');
                appendMarkdownInline(paragraph, paragraphLines.join(' '));
                container.appendChild(paragraph);
            }
        }

        function renderMarkdownList(lines, startIndex) {
            const ordered = /^\s*\d+\.\s+/.test(lines[startIndex]);
            const list = document.createElement(ordered ? 'ol' : 'ul');
            let index = startIndex;

            while (index < lines.length) {
                const line = lines[index];
                if (!line.trim()) {
                    if (hasNextMarkdownListItem(lines, index + 1, ordered)) {
                        index += 1;
                        continue;
                    }
                    break;
                }
                if (ordered && !/^\s*\d+\.\s+/.test(line)) break;
                if (!ordered && !/^\s*[-*+]\s+/.test(line)) break;

                const item = document.createElement('li');
                const itemLines = [line.replace(/^\s*(?:[-*+]|\d+\.)\s+/, '').trim()];
                index += 1;
                while (index < lines.length) {
                    const continuation = lines[index];
                    const trimmed = continuation.trim();
                    if (!trimmed) break;
                    if (/^(#{1,6})\s+/.test(continuation)) break;
                    if (/^>\s?/.test(continuation)) break;
                    if (/^\s*([-*+])\s+/.test(continuation) || /^\s*\d+\.\s+/.test(continuation)) break;
                    if (isMarkdownTable(lines, index)) break;
                    itemLines.push(trimmed);
                    index += 1;
                }
                appendMarkdownInline(item, itemLines.join(' '));
                list.appendChild(item);
            }

            return { element: list, nextIndex: index };
        }

        function hasNextMarkdownListItem(lines, startIndex, ordered) {
            for (let index = startIndex; index < lines.length; index += 1) {
                const line = lines[index];
                if (!line.trim()) continue;
                return ordered ? /^\s*\d+\.\s+/.test(line) : /^\s*[-*+]\s+/.test(line);
            }
            return false;
        }

        function isMarkdownTable(lines, index) {
            if (index + 1 >= lines.length) return false;
            const header = lines[index];
            const separator = lines[index + 1];
            return header.includes('|') && /^[\s|:-]+$/.test(separator.trim()) && separator.includes('-');
        }

        function renderMarkdownTable(lines, startIndex) {
            const table = document.createElement('table');
            table.className = 'governance-markdown-table';

            const headerCells = splitMarkdownTableRow(lines[startIndex]);
            const thead = document.createElement('thead');
            const headRow = document.createElement('tr');
            headerCells.forEach(cellText => {
                const th = document.createElement('th');
                appendMarkdownInline(th, cellText);
                headRow.appendChild(th);
            });
            thead.appendChild(headRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            let index = startIndex + 2;
            while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
                const bodyRow = document.createElement('tr');
                splitMarkdownTableRow(lines[index]).forEach(cellText => {
                    const td = document.createElement('td');
                    appendMarkdownInline(td, cellText);
                    bodyRow.appendChild(td);
                });
                tbody.appendChild(bodyRow);
                index += 1;
            }

            table.appendChild(tbody);
            return { element: table, nextIndex: index };
        }

        function splitMarkdownTableRow(row) {
            return row
                .trim()
                .replace(/^\|/, '')
                .replace(/\|$/, '')
                .split('|')
                .map(cell => cell.trim());
        }

        function appendMarkdownInline(container, text) {
            const tokens = tokenizeMarkdownInline(text);
            tokens.forEach(token => appendMarkdownToken(container, token));
        }

        function tokenizeMarkdownInline(text) {
            const tokens = [];
            let index = 0;

            while (index < text.length) {
                const remaining = text.slice(index);

                let match = remaining.match(/^!\[([^\]]*)\]\(([^)\s]+)\)/);
                if (match) {
                    tokens.push({ type: 'image', alt: match[1], src: match[2] });
                    index += match[0].length;
                    continue;
                }

                match = remaining.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+|ipfs:\/\/[^)\s]+)\)/);
                if (match) {
                    tokens.push({ type: 'link', label: match[1], href: match[2] });
                    index += match[0].length;
                    continue;
                }

                match = remaining.match(/^`([^`]+)`/);
                if (match) {
                    tokens.push({ type: 'code', text: match[1] });
                    index += match[0].length;
                    continue;
                }

                match = remaining.match(/^\*\*([^*]+)\*\*/);
                if (match) {
                    tokens.push({ type: 'strong', children: tokenizeMarkdownInline(match[1]) });
                    index += match[0].length;
                    continue;
                }

                match = remaining.match(/^\*([^*]+)\*/);
                if (match) {
                    tokens.push({ type: 'em', children: tokenizeMarkdownInline(match[1]) });
                    index += match[0].length;
                    continue;
                }

                match = remaining.match(/^((?:https?:\/\/|ipfs:\/\/)[^\s<>"')\]]+)/);
                if (match) {
                    tokens.push({ type: 'link', label: match[1], href: match[1] });
                    index += match[0].length;
                    continue;
                }

                const nextSpecial = remaining.search(/(!?\[|`|\*\*|\*|https?:\/\/|ipfs:\/\/)/);
                if (nextSpecial === -1) {
                    tokens.push({ type: 'text', text: remaining });
                    break;
                }
                if (nextSpecial > 0) {
                    tokens.push({ type: 'text', text: remaining.slice(0, nextSpecial) });
                    index += nextSpecial;
                    continue;
                }

                tokens.push({ type: 'text', text: remaining[0] });
                index += 1;
            }

            return tokens;
        }

        function appendMarkdownToken(container, token) {
            if (token.type === 'text') {
                container.appendChild(document.createTextNode(token.text));
                return;
            }

            if (token.type === 'code') {
                const code = document.createElement('code');
                code.textContent = token.text;
                container.appendChild(code);
                return;
            }

            if (token.type === 'link') {
                const link = document.createElement('a');
                link.href = normalizeMetadataUrl(token.href);
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.referrerPolicy = 'no-referrer';
                link.textContent = token.label;
                container.appendChild(link);
                return;
            }

            if (token.type === 'image') {
                const imageSrc = normalizeImageSource(token.src, token.alt);
                if (!imageSrc) {
                    container.appendChild(document.createTextNode(token.alt || token.src));
                    return;
                }

                const imageLink = document.createElement('a');
                imageLink.href = imageSrc;
                imageLink.target = '_blank';
                imageLink.rel = 'noopener noreferrer';

                const image = document.createElement('img');
                image.className = 'governance-detail-image';
                image.src = imageSrc;
                image.alt = token.alt || 'Governance action image';
                image.loading = 'lazy';
                image.referrerPolicy = 'no-referrer';

                imageLink.appendChild(image);
                container.appendChild(imageLink);
                return;
            }

            const element = document.createElement(token.type === 'strong' ? 'strong' : 'em');
            token.children.forEach(child => appendMarkdownToken(element, child));
            container.appendChild(element);
        }

        function isImageUrl(url) {
            return /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(url);
        }

        function isRenderableImageUrl(url, keyHint = '') {
            if (isImageUrl(url)) return true;
            return /(image|img|logo|icon|picture|photo|banner|thumbnail|media|qr|svg)/i.test(keyHint);
        }

        function normalizeGovernanceImageCandidate(value, keyHint = '') {
            const trimmed = String(value || '').trim();
            if (!trimmed) return null;

            const markdownMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
            if (markdownMatch) {
                const src = normalizeGovernanceImageSource(markdownMatch[2], keyHint);
                return src ? { src, alt: markdownMatch[1] || 'Governance action image' } : null;
            }

            const src = normalizeGovernanceImageSource(trimmed, keyHint);
            return src ? { src, alt: 'Governance action image' } : null;
        }

        function normalizeGovernanceImageSource(value, keyHint = '') {
            if (!value) return '';

            const normalizedKeyHint = String(keyHint).toLowerCase();
            const rawValue = String(value);

            if (rawValue.startsWith('data:image/')) {
                return rawValue;
            }

            if (/^<svg[\s>]/i.test(rawValue)) {
                return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(rawValue)}`;
            }

            const normalizedUrl = normalizeMetadataUrl(rawValue);
            if (/^(https?:\/\/|ipfs:\/\/)/i.test(rawValue)) {
                return isRenderableImageUrl(normalizedUrl, normalizedKeyHint) ? normalizedUrl : '';
            }

            if (looksLikeBase64Image(rawValue, normalizedKeyHint)) {
                return `data:image/png;base64,${rawValue.replace(/\s+/g, '')}`;
            }

            return '';
        }

        function extractGovernanceImageCandidatesFromSources(sources = []) {
            const results = [];
            const seen = new Set();
            sources.forEach(source => collectGovernanceImageCandidates(source, results, seen));
            return results;
        }

        function collectGovernanceImageCandidates(value, results, seen, keyHint = '') {
            if (value === null || value === undefined) return;

            if (typeof value === 'string') {
                extractGovernanceImageCandidatesFromString(value, keyHint).forEach(candidate => {
                    if (!seen.has(candidate.src)) {
                        seen.add(candidate.src);
                        results.push(candidate);
                    }
                });
                return;
            }

            if (Array.isArray(value)) {
                value.forEach(entry => collectGovernanceImageCandidates(entry, results, seen, keyHint));
                return;
            }

            if (typeof value !== 'object') return;

            Object.entries(value).forEach(([key, entry]) => {
                const nestedHint = [keyHint, key].filter(Boolean).join('.');
                collectGovernanceImageCandidates(entry, results, seen, nestedHint);
            });
        }

        function extractGovernanceImageCandidatesFromString(value, keyHint = '') {
            const trimmed = value.trim();
            if (!trimmed) return [];

            const candidates = [];
            const seen = new Set();
            const addCandidate = candidate => {
                if (!candidate || seen.has(candidate.src)) return;
                seen.add(candidate.src);
                candidates.push(candidate);
            };

            const directCandidate = normalizeGovernanceImageCandidate(trimmed, keyHint);
            if (directCandidate) addCandidate(directCandidate);

            const markdownMatches = trimmed.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g);
            for (const match of markdownMatches) {
                const src = normalizeGovernanceImageSource(match[2], keyHint || match[1]);
                if (src) addCandidate({ src, alt: match[1] || 'Governance action image' });
            }

            const htmlMatches = trimmed.matchAll(/<img\b[^>]*src=["']([^"']+)["'][^>]*?(?:alt=["']([^"']*)["'])?[^>]*>/gi);
            for (const match of htmlMatches) {
                const src = normalizeGovernanceImageSource(match[1], keyHint || match[2]);
                if (src) addCandidate({ src, alt: match[2] || 'Governance action image' });
            }

            const dataImageMatches = trimmed.matchAll(/data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+/gi);
            for (const match of dataImageMatches) {
                const src = normalizeGovernanceImageSource(match[0], keyHint);
                if (src) addCandidate({ src, alt: 'Governance action image' });
            }

            const urlMatches = trimmed.matchAll(/(?:https?:\/\/|ipfs:\/\/)[^\s<>"')\]]+/gi);
            for (const match of urlMatches) {
                const src = normalizeGovernanceImageSource(match[0], keyHint);
                if (src) addCandidate({ src, alt: 'Governance action image' });
            }

            const parsedJson = parseEmbeddedJson(trimmed);
            if (parsedJson) {
                collectGovernanceImageCandidates(parsedJson, candidates, seen, keyHint);
            }

            return candidates;
        }

        function parseEmbeddedJson(value) {
            if (!value || value.length < 2) return null;

            const startsLikeJson = (
                (value.startsWith('{') && value.endsWith('}'))
                || (value.startsWith('[') && value.endsWith(']'))
            );
            if (!startsLikeJson) return null;

            try {
                return JSON.parse(value);
            } catch {
                return null;
            }
        }

        return Object.freeze({
            appendRichText,
            cleanText: cleanGovernanceText,
            extractImageCandidates: extractGovernanceImageCandidatesFromSources,
            isImageUrl,
            isRenderableImageUrl,
            normalizeGovernanceImageCandidate,
            normalizeImageSource: normalizeGovernanceImageSource,
            sanitizeMarkdown: sanitizeGovernanceMarkdown,
            renderMarkdown
        });
    }

    window.TDSPGovernanceRichText = Object.freeze({
        create: createGovernanceRichText
    });
}());
