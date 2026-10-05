(function () {
    'use strict';
    const scope = '.member-portfolio';
    const originals = new WeakMap();
    const attributes = new WeakMap();
    const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const keys = window.TDSPPortfolioTranslationKeys || [];
    const exact = new Map(keys.filter(([source]) => !source.includes('{')));
    const templates = keys.filter(([source]) => source.includes('{')).map(([source, key]) => {
        const names = [];
        let pattern = '', offset = 0;
        for (const match of source.matchAll(/\{(\w+)\}/g)) {
            pattern += escape(source.slice(offset, match.index));
            names.push(match[1]);
            pattern += '(.+?)';
            offset = match.index + match[0].length;
        }
        pattern += escape(source.slice(offset));
        return {source, key, names, pattern: new RegExp('^' + pattern + '$')};
    });

    function translate(source, dictionary) {
        const exactKey = exact.get(source);
        if (exactKey && dictionary[exactKey]) return dictionary[exactKey];
        for (const template of templates) {
            const match = template.pattern.exec(source);
            if (!match || !dictionary[template.key]) continue;
            const values = Object.fromEntries(template.names.map((name, index) => [name, match[index + 1]]));
            return dictionary[template.key].replace(/\{(\w+)\}/g, (token, name) => name === 'note' ? translate(values[name], dictionary) || values[name] : values[name] ?? token);
        }
        const pieces = source.split(' · ');
        if (pieces.length > 1) {
            const result = pieces.map(piece => translate(piece, dictionary) || piece).join(' · ');
            if (result !== source) return result;
        }
        return '';
    }

    function update(current, state, translateText) {
        const source = state && current === state.output ? state.source : current;
        const spaces = source.match(/^(\s*)([\s\S]*?)(\s*)$/);
        const output = translateText(source) || (spaces[1] + (translateText(spaces[2]) || spaces[2]) + spaces[3]);
        return {source, output};
    }

    function apply(root, translateText) {
        const roots = root.matches?.(scope) || root.closest?.(scope) ? [root] : [...(root.querySelectorAll?.(scope) || [])];
        for (const container of roots) {
            const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
                if (node.parentElement?.closest('[translate="no"],[data-i18n],script,style,input,textarea,.portfolio-asset-name')) continue;
                const state = update(node.nodeValue, originals.get(node), translateText);
                originals.set(node, state);
                if (node.nodeValue !== state.output) node.nodeValue = state.output;
            }
            const elements = container.nodeType === Node.ELEMENT_NODE ? [container, ...container.querySelectorAll('*')] : [];
            for (const element of elements) {
                if (element.closest('[translate="no"]') || element.tagName === 'IMG') continue;
                let saved = attributes.get(element);
                if (!saved) attributes.set(element, saved = new Map());
                for (const attribute of ['placeholder', 'title', 'aria-label', 'aria-valuetext', 'data-label']) {
                    if (!element.hasAttribute(attribute)) continue;
                    if (element.hasAttribute(`data-i18n-${attribute}-original`)) continue;
                    const current = element.getAttribute(attribute);
                    const state = update(current, saved.get(attribute), translateText);
                    saved.set(attribute, state);
                    if (current !== state.output) element.setAttribute(attribute, state.output);
                }
            }
        }
    }
    window.TDSPPortfolioI18n = Object.freeze({translate, apply});
}());
