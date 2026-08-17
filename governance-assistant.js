(function () {
    function createGovernanceAssistant(options = {}) {
        const GOVERNANCE_IS_LOCAL_PREVIEW = options.isLocalPreview === true;
        const CONSTITUTION_CHAT_API_URL = options.chatApiUrl;
        const CONSTITUTION_CHAT_FEEDBACK_API_URL = options.feedbackApiUrl;
        const CONSTITUTION_DOCUMENT_API_URL = options.documentApiUrl;
        const LOCAL_CONSTITUTION_CHAT_PROXY_PATH = options.localChatPath;
        const LOCAL_CONSTITUTION_CHAT_FEEDBACK_PROXY_PATH = options.localFeedbackPath;
        const LOCAL_CONSTITUTION_DOCUMENT_PROXY_PATH = options.localDocumentPath;
        const fetchJson = options.fetchJson;
        const fetchResponse = options.fetchResponse;
        const createGovernanceMenuOverlay = options.createOverlay;
        const removeGovernanceMenuOverlay = options.removeOverlay;
        const getTopGovernanceMenuOverlay = options.getTopOverlay;
        const getConstitutionChatRequestContext = options.getRequestContext;

        function openConstitutionAssistantOverlay(context = null, returnFocus = document.getElementById('tdspbot-open')) {
            const isContextualAssistant = Boolean(context);
            const panel = createConstitutionChatPanel(context);
            createGovernanceMenuOverlay({
                id: 'constitution-assistant-overlay',
                titleId: 'constitution-assistant-title',
                titleText: 'TDSPBot',
                closeLabel: 'Close Constitution assistant',
                closeOverlay: closeConstitutionAssistantOverlay,
                bodyNodes: [panel],
                dialogClass: 'governance-constitution-chat-dialog',
                closeOnBackdrop: false,
                showBack: isContextualAssistant,
                showClose: !isContextualAssistant,
                enableSearch: false,
                returnFocus
            });
            setupConstitutionChat(panel, context);
            panel.querySelector('#constitution-chat-question')?.focus();
        }

        function closeConstitutionAssistantOverlay() {
            removeGovernanceMenuOverlay('constitution-assistant-overlay');
        }

        function createConstitutionChatPanel(context = null) {
            const panel = document.createElement('section');
            panel.className = 'constitution-chat governance-menu-card';
            panel.setAttribute('aria-labelledby', 'constitution-chat-title');

            const heading = document.createElement('div');
            heading.className = 'constitution-chat-heading';
            const headingCopy = document.createElement('div');
            headingCopy.className = 'constitution-chat-heading-copy';
            const title = document.createElement('strong');
            title.id = 'constitution-chat-title';
            title.textContent = 'TDSPBot';
            headingCopy.append(title);
            heading.append(headingCopy);

            const messages = document.createElement('div');
            messages.id = 'constitution-chat-messages';
            messages.className = 'constitution-chat-messages';
            messages.setAttribute('aria-live', 'polite');
            const empty = document.createElement('p');
            empty.className = 'constitution-chat-empty';
            empty.textContent = context?.title
                ? `Ask about ${context.title}.`
                : 'Ask about available governance, DReps, SPOs, Starch, Treasury, or the Constitution.';
            messages.appendChild(empty);

            const form = document.createElement('form');
            form.id = 'constitution-chat-form';
            form.className = 'constitution-chat-form';
            form.autocomplete = 'off';
            const label = document.createElement('label');
            label.className = 'sr-only';
            label.htmlFor = 'constitution-chat-question';
            label.textContent = 'Question about Cardano governance';
            const input = document.createElement('textarea');
            input.id = 'constitution-chat-question';
            input.name = 'question';
            input.rows = 1;
            input.maxLength = 5000;
            input.autocomplete = 'off';
            input.placeholder = 'Search Cardano data or ask about the Constitution';
            input.required = true;
            const submit = document.createElement('button');
            submit.id = 'constitution-chat-submit';
            submit.type = 'submit';
            submit.className = 'governance-vote-secondary';
            submit.textContent = 'Continue Chat';
            submit.setAttribute('aria-label', 'Continue with conversation history');
            const newQuestion = document.createElement('button');
            newQuestion.id = 'constitution-chat-new-question';
            newQuestion.type = 'submit';
            newQuestion.className = 'governance-vote-button';
            newQuestion.textContent = 'New Chat';
            newQuestion.setAttribute('aria-label', 'Ask a new question without conversation history');
            const formActions = document.createElement('div');
            formActions.className = 'constitution-chat-form-actions';
            formActions.append(newQuestion, submit);
            form.append(label, input, formActions);

            const status = document.createElement('p');
            status.id = 'constitution-chat-status';
            status.className = 'constitution-chat-status';
            status.setAttribute('role', 'status');
            status.setAttribute('aria-live', 'polite');
            const note = document.createElement('p');
            note.className = 'constitution-chat-note';
            note.textContent = 'AI-generated answer. Verify proposal details and constitutional references before making decisions.';

            panel.appendChild(heading);

            if (context?.title || context?.id) {
                const contextLine = document.createElement('p');
                contextLine.className = 'constitution-chat-note';
                contextLine.textContent = getConstitutionChatContextDisplayParts(context).join(' • ');
                panel.appendChild(contextLine);
            }

            panel.append(messages, form, status, note);
            return panel;
        }

        function getConstitutionChatContextLabel(context) {
            if (context?.kind === 'cip') return 'CIP context';
            if (context?.kind === 'catalyst_proposal') return 'Catalyst proposal context';
            if (context?.kind === 'governance_action') return 'Governance action context';
            if (context?.kind === 'governance_vote') return 'DRep vote context';
            if (context?.kind === 'funding_recipient') return 'Catalyst/Treasury recipient context';
            if (context?.section) return `${context.section} context`;
            return 'Website context';
        }

        function getConstitutionChatContextDisplayParts(context) {
            return [
                getConstitutionChatContextLabel(context),
                context?.title || context?.recipient || context?.menu,
                context?.vote_choice ? `Vote ${context.vote_choice}` : null,
                context?.id,
                context?.summary
            ].filter(Boolean);
        }

        async function openConstitutionDocumentOverlay() {
            if (getTopGovernanceMenuOverlay('constitution-document-overlay')) return;
            const content = document.createElement('div');
            content.className = 'constitution-document';
            const loading = document.createElement('p');
            loading.className = 'small-text';
            loading.textContent = 'Loading Constitution...';
            content.appendChild(loading);

            createGovernanceMenuOverlay({
                id: 'constitution-document-overlay',
                titleId: 'constitution-document-title',
                titleText: 'Cardano Constitution',
                closeLabel: 'Close Constitution',
                closeOverlay: closeConstitutionDocumentOverlay,
                bodyNodes: [content],
                dialogClass: 'governance-constitution-dialog',
                closeOnBackdrop: false,
                showBack: false,
                enableSearch: false,
                returnFocus: document.getElementById('constitution-document-open')
            });

            try {
                const payload = await fetchJson(getConstitutionDocumentApiUrl(), {
                    headers: { accept: 'application/json' }
                });
                if (!payload.text) throw new Error('The Constitution document is empty.');
                if (!content.isConnected) return;
                content.textContent = '';
                const documentText = document.createElement('pre');
                documentText.className = 'constitution-document-text';
                documentText.textContent = payload.text;
                content.appendChild(documentText);
            } catch (error) {
                if (!content.isConnected) return;
                content.textContent = '';
                const message = document.createElement('p');
                message.className = 'error-text';
                message.textContent = error instanceof Error
                    ? error.message
                    : 'The Cardano Constitution could not be loaded.';
                content.appendChild(message);
            }
        }

        function closeConstitutionDocumentOverlay() {
            removeGovernanceMenuOverlay('constitution-document-overlay');
        }

        function getConstitutionDocumentApiUrl() {
            return GOVERNANCE_IS_LOCAL_PREVIEW
                ? LOCAL_CONSTITUTION_DOCUMENT_PROXY_PATH
                : CONSTITUTION_DOCUMENT_API_URL;
        }

        function setupConstitutionChat(panel, context = null) {
            const form = panel?.querySelector('#constitution-chat-form');
            const input = panel?.querySelector('#constitution-chat-question');
            const messages = panel?.querySelector('#constitution-chat-messages');
            const submit = panel?.querySelector('#constitution-chat-submit');
            const newQuestion = panel?.querySelector('#constitution-chat-new-question');
            const status = panel?.querySelector('#constitution-chat-status');
            if (!form || !input || !messages || !submit || !newQuestion || !status) return;
            const conversation = [];
            let pendingNewChatSubmit = false;

            const clearConversation = () => {
                conversation.length = 0;
                messages.textContent = '';
                const empty = document.createElement('p');
                empty.className = 'constitution-chat-empty';
                empty.textContent = 'Ask about available governance, DReps, SPOs, Starch, Treasury, or the Constitution.';
                messages.appendChild(empty);
                status.textContent = '';
            };
            const resizeInput = () => {
                input.style.height = 'auto';
                input.style.height = `${Math.min(input.scrollHeight, 128)}px`;
            };
            input.addEventListener('input', resizeInput);
            input.addEventListener('keydown', event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    pendingNewChatSubmit = true;
                    form.requestSubmit(newQuestion);
                }
            });
            newQuestion.addEventListener('click', () => {
                clearConversation();
            });

            form.addEventListener('submit', async event => {
                event.preventDefault();
                const question = input.value.replace(/\s+/g, ' ').trim();
                const startsNewConversation = pendingNewChatSubmit || event.submitter === newQuestion;
                pendingNewChatSubmit = false;
                if (!question || submit.disabled || newQuestion.disabled) return;

                if (startsNewConversation) {
                    clearConversation();
                }
                const empty = messages.querySelector('.constitution-chat-empty');
                if (empty) empty.remove();
                appendConstitutionChatMessage(messages, question, 'question');
                const history = startsNewConversation
                    ? []
                    : getConstitutionChatHistoryForQuestion(conversation, question);
                conversation.push({ role: 'user', content: question });
                input.value = '';
                resizeInput();
                submit.disabled = true;
                newQuestion.disabled = true;
                input.disabled = true;
                status.textContent = 'Consulting the Constitution...';
                let pendingAnswerMessage = null;

                try {
                    const response = await fetchResponse(getConstitutionChatApiUrl(), {
                        method: 'POST',
                        headers: {
                            accept: 'application/x-ndjson, application/json',
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({
                            question,
                            history,
                            stream: true,
                            context: getConstitutionChatRequestContext(context)
                        })
                    });
                    const contentType = response.headers.get('content-type') || '';
                    let payload;
                    let answer = '';
                    if (contentType.includes('application/x-ndjson') && response.body) {
                        pendingAnswerMessage = appendConstitutionChatMessage(messages, '', 'answer');
                        payload = await readConstitutionChatStream(response, event => {
                            answer += String(event.text || '');
                            pendingAnswerMessage.body.textContent = formatConstitutionChatAnswer(answer);
                            pendingAnswerMessage.stakePrompt.hidden = false;
                            messages.scrollTop = messages.scrollHeight;
                            status.textContent = 'Generating answer...';
                        });
                        if (!answer) {
                            pendingAnswerMessage.message.remove();
                            throw new Error('The Constitution assistant returned an empty answer.');
                        }
                    } else {
                        payload = await response.json().catch(() => ({}));
                        answer = String(payload.answer || '');
                        pendingAnswerMessage = appendConstitutionChatMessage(messages, answer, 'answer');
                    }
                    if (payload.feedback_id && pendingAnswerMessage) {
                        appendConstitutionChatFeedback(
                            pendingAnswerMessage.message,
                            payload.feedback_id,
                            status
                        );
                        messages.scrollTop = messages.scrollHeight;
                    }
                    conversation.push({ role: 'assistant', content: answer });
                    while (conversation.length > 12) conversation.shift();
                    status.textContent = payload.cached ? 'Answer loaded from saved website data.' : '';
                } catch (error) {
                    if (conversation.at(-1)?.role === 'user') conversation.pop();
                    if (pendingAnswerMessage && !pendingAnswerMessage.body.textContent) {
                        pendingAnswerMessage.message.remove();
                    }
                    appendConstitutionChatMessage(
                        messages,
                        error instanceof Error
                            ? error.message
                            : 'The Constitution assistant is temporarily unavailable.',
                        'error'
                    );
                    status.textContent = '';
                } finally {
                    submit.disabled = false;
                    newQuestion.disabled = false;
                    input.disabled = false;
                    input.focus();
                }
            });
        }

        function getConstitutionChatHistory(conversation) {
            const history = [];
            let remaining = 4000;
            for (const message of conversation.slice(-6).reverse()) {
                if (remaining <= 0) break;
                const content = String(message.content || '').slice(0, remaining);
                if (!content) continue;
                history.push({ role: message.role, content });
                remaining -= content.length;
            }
            return history.reverse();
        }

        function getConstitutionChatHistoryForQuestion(conversation, question) {
            const normalizedQuestion = String(question || '').replace(/\s+/g, ' ').trim().toLowerCase();
            for (let index = 0; index < conversation.length; index += 1) {
                const message = conversation[index];
                if (message.role !== 'user') continue;
                const previousQuestion = String(message.content || '').replace(/\s+/g, ' ').trim().toLowerCase();
                if (previousQuestion === normalizedQuestion) {
                    return getConstitutionChatHistory(conversation.slice(0, index));
                }
            }
            return getConstitutionChatHistory(conversation);
        }

        function getConstitutionChatApiUrl() {
            return GOVERNANCE_IS_LOCAL_PREVIEW
                ? LOCAL_CONSTITUTION_CHAT_PROXY_PATH
                : CONSTITUTION_CHAT_API_URL;
        }

        function getConstitutionChatFeedbackApiUrl() {
            return GOVERNANCE_IS_LOCAL_PREVIEW
                ? LOCAL_CONSTITUTION_CHAT_FEEDBACK_PROXY_PATH
                : CONSTITUTION_CHAT_FEEDBACK_API_URL;
        }

        async function readConstitutionChatStream(response, onDelta) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let result = {};
            const processLine = line => {
                const value = line.trim();
                if (!value) return;
                let event;
                try {
                    event = JSON.parse(value);
                } catch {
                    return;
                }
                if (event.type === 'delta') {
                    onDelta(event);
                } else if (event.type === 'done') {
                    result = event;
                } else if (event.type === 'error') {
                    throw new Error(event.error || 'The Constitution assistant is temporarily unavailable.');
                }
            };

            while (true) {
                const { value, done } = await reader.read();
                buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
                const lines = buffer.split(/\r?\n/);
                buffer = lines.pop() || '';
                lines.forEach(processLine);
                if (done) break;
            }
            if (buffer) processLine(buffer);
            return result;
        }

        function appendConstitutionChatMessage(container, text, type) {
            const message = document.createElement('div');
            message.className = `constitution-chat-message constitution-chat-message-${type}`;
            const label = document.createElement('strong');
            label.textContent = type === 'question' ? 'You' : type === 'answer' ? 'Governance assistant' : 'Unavailable';
            const body = document.createElement('p');
            body.textContent = type === 'answer'
                ? formatConstitutionChatAnswer(text)
                : String(text || '');
            message.append(label, body);
            let stakePrompt = null;
            if (type === 'answer') {
                stakePrompt = createConstitutionChatStakePrompt();
                stakePrompt.hidden = !String(text || '').trim();
                message.appendChild(stakePrompt);
            }
            container.appendChild(message);

            while (container.children.length > 20) {
                container.firstElementChild?.remove();
            }
            container.scrollTop = container.scrollHeight;
            return { message, body, stakePrompt };
        }

        function formatConstitutionChatAnswer(value) {
            return String(value || '')
                .replace(/\bbackend cache\b/gi, 'website data')
                .replace(/\bcached\b/gi, 'available')
                .replace(/\bcache\b/gi, 'website data');
        }

        function createConstitutionChatStakePrompt() {
            const prompt = document.createElement('p');
            prompt.className = 'constitution-chat-stake-prompt';
            prompt.append('If this answer was useful, consider ');
            const link = document.createElement('a');
            link.href = '#stakenow';
            link.textContent = 'staking to TDSP';
            link.addEventListener('click', event => {
                const stakeTrigger = document.querySelector('[data-stake-open]');
                if (!stakeTrigger) return;
                event.preventDefault();
                stakeTrigger.click();
            });
            prompt.append(link, '.');
            return prompt;
        }

        function appendConstitutionChatFeedback(message, feedbackId, status) {
            const feedback = document.createElement('div');
            feedback.className = 'constitution-chat-feedback';
            const question = document.createElement('strong');
            question.textContent = 'Was this the answer you were looking for?';
            const actions = document.createElement('div');
            actions.className = 'constitution-chat-feedback-actions';
            const yes = document.createElement('button');
            yes.type = 'button';
            yes.textContent = 'Yes';
            yes.className = 'governance-vote-button';
            const no = document.createElement('button');
            no.type = 'button';
            no.textContent = 'No';
            no.className = 'governance-vote-secondary';
            actions.append(yes, no);
            feedback.append(question, actions);
            message.appendChild(feedback);

            const submitFeedback = async helpful => {
                yes.disabled = true;
                no.disabled = true;
                try {
                    const payload = await fetchJson(getConstitutionChatFeedbackApiUrl(), {
                        method: 'POST',
                        headers: {
                            accept: 'application/json',
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({
                            feedback_id: feedbackId,
                            helpful
                        })
                    });
                    feedback.replaceChildren();
                    const result = document.createElement('span');
                    result.textContent = helpful
                        ? (payload.saved ? 'Answer saved.' : 'Thank you for your feedback.')
                        : 'Saved for review.';
                    feedback.appendChild(result);
                    status.textContent = '';
                } catch (error) {
                    yes.disabled = false;
                    no.disabled = false;
                    status.textContent = error instanceof Error
                        ? error.message
                        : 'Answer feedback could not be saved.';
                }
            };
            yes.addEventListener('click', () => submitFeedback(true));
            no.addEventListener('click', () => submitFeedback(false));
        }

        return Object.freeze({
            open: openConstitutionAssistantOverlay,
            close: closeConstitutionAssistantOverlay,
            openDocument: openConstitutionDocumentOverlay,
            closeDocument: closeConstitutionDocumentOverlay,
            getChatApiUrl: getConstitutionChatApiUrl
        });
    }

    window.TDSPGovernanceAssistant = Object.freeze({
        create: createGovernanceAssistant
    });
}());

