(function () {
    function createDetailRenderingModule({
        appendRichText,
        cleanText,
        createCopyButton,
        renderMarkdown,
        sanitizeMarkdown
    }) {
        function addDetailRow(container, label, value, options = {}) {
            if (value === null || value === undefined || value === '') return;
            const cleanValue = cleanText(String(value));
            if (!cleanValue) return;
            const displayValue = options.displayValue === undefined
                ? cleanValue
                : cleanText(String(options.displayValue));

            const row = document.createElement('div');
            row.className = 'governance-detail-row';

            const key = document.createElement('strong');
            key.textContent = label;

            const text = document.createElement('span');
            appendRichText(text, displayValue);

            row.appendChild(key);
            row.appendChild(text);
            if (options.copyLabel) {
                row.classList.add('governance-detail-row--copyable');
                const copyButton = createCopyButton(String(value), options.copyLabel);
                copyButton.classList.add('governance-detail-copy-button');
                row.appendChild(copyButton);
            }
            container.appendChild(row);
        }

        function addMarkdownDetailSection(container, label, value) {
            if (value === null || value === undefined || value === '') return;
            const cleanValue = sanitizeMarkdown(cleanText(String(value)));
            if (!cleanValue) return;

            const section = document.createElement('section');
            section.className = 'governance-markdown-section';

            const heading = document.createElement('strong');
            heading.textContent = label;

            const body = document.createElement('div');
            body.className = 'governance-markdown';
            renderMarkdown(body, cleanValue);

            section.appendChild(heading);
            section.appendChild(body);
            container.appendChild(section);
        }

        return Object.freeze({
            addDetailRow,
            addMarkdownDetailSection
        });
    }

    window.TDSPDetailRendering = Object.freeze({
        create: createDetailRenderingModule
    });
}());
