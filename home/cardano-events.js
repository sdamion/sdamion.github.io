(function () {
    const notificationTimers = new Map();

    function parseCardanoEventDate(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
        const date = new Date(`${value}T12:00:00Z`);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function getCardanoEventNotificationId(event) {
        return String(event?.id || event?.uid || event?.link || `${event?.title || ''}:${event?.start_at || event?.start_date || ''}`).trim();
    }

    function getCardanoEventStartMs(event) {
        if (event?.start_at) {
            const startAt = Date.parse(event.start_at);
            if (Number.isFinite(startAt)) return startAt;
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(event?.start_date || ''))) {
            return new Date(`${event.start_date}T09:00:00`).getTime();
        }
        return NaN;
    }

    function formatCardanoEventDate(startValue, endValue) {
        const start = parseCardanoEventDate(startValue);
        const end = parseCardanoEventDate(endValue) || start;
        if (!start) return 'Date unavailable';

        const full = new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC'
        });
        if (!end || start.getTime() === end.getTime()) return full.format(start);

        const startYear = start.getUTCFullYear();
        const endYear = end.getUTCFullYear();
        const startMonth = start.getUTCMonth();
        const endMonth = end.getUTCMonth();
        if (startYear === endYear && startMonth === endMonth) {
            const month = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(start);
            return `${start.getUTCDate()} to ${end.getUTCDate()} ${month} ${startYear}`;
        }
        return `${full.format(start)} to ${full.format(end)}`;
    }

    function formatCardanoEventDateTime(event) {
        if (!event?.start_at) {
            return formatCardanoEventDate(event?.start_date, event?.end_date);
        }
        const start = new Date(event.start_at);
        const end = event?.end_at ? new Date(event.end_at) : null;
        if (Number.isNaN(start.getTime())) {
            return formatCardanoEventDate(event?.start_date, event?.end_date);
        }

        const date = new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).format(start);
        const time = new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        });
        if (!end || Number.isNaN(end.getTime())) return `${date} | ${time.format(start)}`;
        return `${date} | ${time.format(start)} to ${time.format(end)}`;
    }

    function getNotificationBody(event) {
        const details = [
            formatCardanoEventDateTime(event),
            event?.location,
            event?.organizer
        ].filter(Boolean);
        return details.join(' | ') || 'A Cardano event is starting now.';
    }

    function notifyEventStart(event, options) {
        const title = String(event?.title || 'Cardano event').trim();
        options.sendBrowserNotification?.(
            'Cardano event starting',
            `${title} — ${getNotificationBody(event)}`,
            `tdsp-cardano-event-${getCardanoEventNotificationId(event)}`,
            'events'
        );
    }

    function checkNotifications(events, options) {
        if (!Array.isArray(events) || !events.length) return;
        const previousState = options.readNotificationState?.(options.notificationStorageKey) || {};
        const notifiedIds = new Set(Array.isArray(previousState.notifiedIds) ? previousState.notifiedIds : []);
        const now = Date.now();
        const lookbackMs = 20 * 60 * 1000;

        notificationTimers.forEach(timer => window.clearTimeout(timer));
        notificationTimers.clear();

        events.forEach(event => {
            const id = getCardanoEventNotificationId(event);
            const startMs = getCardanoEventStartMs(event);
            if (!id || !Number.isFinite(startMs) || notifiedIds.has(id)) return;

            if (startMs <= now && now - startMs <= lookbackMs) {
                if (options.canSendBrowserNotification?.('events')) {
                    notifiedIds.add(id);
                    notifyEventStart(event, options);
                }
                return;
            }

            if (startMs <= now) return;

            const delay = startMs - now;
            if (delay > 2147483647) return;
            const timer = window.setTimeout(() => {
                const latestState = options.readNotificationState?.(options.notificationStorageKey) || {};
                const latestIds = new Set(Array.isArray(latestState.notifiedIds) ? latestState.notifiedIds : []);
                if (latestIds.has(id)) return;
                if (!options.canSendBrowserNotification?.('events')) return;
                latestIds.add(id);
                options.writeNotificationState?.(options.notificationStorageKey, {
                    notifiedIds: Array.from(latestIds).sort(),
                    updatedAt: Date.now()
                });
                notifyEventStart(event, options);
                notificationTimers.delete(id);
            }, delay);
            notificationTimers.set(id, timer);
        });

        options.writeNotificationState?.(options.notificationStorageKey, {
            notifiedIds: Array.from(notifiedIds).sort(),
            updatedAt: Date.now()
        });
    }

    function createCardanoEventCard(event) {
        const card = document.createElement('button');
        card.className = 'cardano-event-card governance-menu-card';
        card.type = 'button';
        card.dataset.sortDate = String(Date.parse(event?.start_at || `${event?.start_date}T00:00:00Z`) || 0);
        card.dataset.sortName = String(event?.title || '');
        card.setAttribute('aria-label', `Open event: ${event?.title || 'Cardano event'}`);

        const date = document.createElement('strong');
        date.className = 'cardano-event-date';
        date.textContent = formatCardanoEventDateTime(event);

        const title = document.createElement('span');
        title.className = 'cardano-event-title';
        title.textContent = event?.title || 'Cardano event';

        const meta = document.createElement('p');
        meta.className = 'cardano-event-meta';
        meta.textContent = [event?.location, event?.organizer].filter(Boolean).join(' | ') || 'Event details';

        card.append(title, date, meta);
        if (event?.image_url) {
            const image = document.createElement('img');
            image.className = 'cardano-event-card-image';
            image.src = event.image_url;
            image.alt = '';
            image.loading = 'lazy';
            image.referrerPolicy = 'no-referrer';
            image.addEventListener('error', () => {
                image.remove();
                card.classList.remove('has-image');
            }, { once: true });
            card.classList.add('has-image');
            card.appendChild(image);
        }
        window.TDSPRuntime?.bindMenuTrigger?.(card, () => openCardanoEventOverlay(event, card), {
            datasetKey: 'eventBound',
            errorMessage: 'Cardano event could not be opened.'
        });
        return card;
    }

    function getCardanoEventSource(event, payload) {
        if (String(event?.source || '').trim().toLowerCase() === 'luma') {
            return {
                key: 'luma',
                name: 'Luma',
                description: 'Cardano community calendar',
                url: payload?.luma_source_url || 'https://luma.com/CardanoEvents'
            };
        }
        return {
            key: 'cardano',
            name: 'Cardano.org',
            description: 'Official Cardano events',
            url: payload?.source_url || 'https://cardano.org/events/'
        };
    }

    function createCardanoEventSourceTile(source, events) {
        const tile = document.createElement('div');
        tile.className = 'governance-summary-clickable governance-menu-card cardano-event-source-tile';
        tile.setAttribute('role', 'button');
        tile.setAttribute('tabindex', '0');
        tile.setAttribute('aria-label', `Show ${source.name} events`);
        const count = document.createElement('strong');
        count.textContent = String(events.length);
        const name = document.createElement('span');
        name.textContent = source.name;
        const description = document.createElement('span');
        description.className = 'governance-summary-subvalue';
        description.textContent = source.description;
        const copy = document.createElement('div');
        copy.className = 'cardano-event-source-copy';
        copy.append(count, name, description);
        tile.appendChild(copy);

        const upcomingEvent = events[0];
        if (upcomingEvent?.image_url) {
            const image = document.createElement('img');
            image.className = 'cardano-event-source-image';
            image.src = upcomingEvent.image_url;
            image.alt = `${upcomingEvent.title || source.name} event`;
            image.loading = 'lazy';
            image.referrerPolicy = 'no-referrer';
            image.addEventListener('error', () => {
                image.remove();
                tile.classList.remove('has-image');
            }, { once: true });
            tile.classList.add('has-image');
            tile.appendChild(image);
        }
        const open = () => openCardanoEventSourceOverlay(source, events, tile);
        window.TDSPRuntime?.bindMenuTrigger?.(tile, open, {
            datasetKey: 'eventsBound',
            errorMessage: `${source.name} events could not be opened.`
        });
        return tile;
    }

    function createCardanoEventSourceContent(source, events) {
        const content = document.createElement('div');
        content.className = 'cardano-event-source-content';
        const eventGrid = document.createElement('div');
        eventGrid.className = 'cardano-events-grid';
        eventGrid.append(...events.map(createCardanoEventCard));
        content.appendChild(eventGrid);

        const sourceLink = document.createElement('a');
        sourceLink.className = 'cardano-event-link';
        sourceLink.href = source.url;
        sourceLink.target = '_blank';
        sourceLink.rel = 'noopener noreferrer';
        sourceLink.textContent = `Open ${source.name}`;
        content.appendChild(sourceLink);
        return content;
    }

    function openCardanoEventSourceOverlay(source, events, returnFocus = document.activeElement) {
        const overlayId = `cardano-event-source-${source.key}-overlay`;
        window.closePoolMenuOverlay?.(overlayId, false);
        window.createPoolMenuOverlay?.({
            id: overlayId,
            titleId: `cardano-event-source-${source.key}-title`,
            titleText: `${source.name} Events`,
            headerMeta: `${events.length} events`,
            closeLabel: `Close ${source.name} events`,
            closeOverlay: restoreFocus => window.closePoolMenuOverlay?.(overlayId, restoreFocus),
            returnFocus,
            rootTitle: 'Cardano Events',
            bodyNode: createCardanoEventSourceContent(source, events),
            defaultSort: 'oldest'
        });
    }

    function createCardanoEventDetail(event) {
        const detail = document.createElement('div');
        detail.className = 'cardano-event-detail';

        if (event?.image_url) {
            const image = document.createElement('img');
            image.className = 'cardano-event-detail-image';
            image.src = event.image_url;
            image.alt = `${event.title || 'Cardano event'} poster`;
            image.referrerPolicy = 'no-referrer';
            image.addEventListener('error', () => image.remove(), { once: true });
            detail.appendChild(image);
        }

        const facts = document.createElement('div');
        facts.className = 'cardano-event-detail-facts';
        [
            ['Date', formatCardanoEventDateTime(event)],
            ['Location', event?.location],
            ['Organizer', event?.organizer]
        ].forEach(([labelText, value]) => {
            if (!value) return;
            const row = document.createElement('div');
            row.className = 'cardano-event-detail-fact';
            const label = document.createElement('strong');
            label.textContent = labelText;
            const text = document.createElement('span');
            text.textContent = value;
            row.append(label, text);
            facts.appendChild(row);
        });
        detail.appendChild(facts);

        const description = document.createElement('p');
        description.className = 'cardano-event-detail-description';
        description.textContent = event?.description
            || 'More information is available on the event website.';
        detail.appendChild(description);

        if (event?.link) {
            const link = document.createElement('a');
            link.className = 'cardano-event-link';
            link.href = event.link;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'View event';
            detail.appendChild(link);
        }

        return detail;
    }

    function openCardanoEventOverlay(event, returnFocus = document.activeElement) {
        closeCardanoEventOverlay(false);
        window.createPoolMenuOverlay?.({
            id: 'cardano-event-overlay',
            titleId: 'cardano-event-title',
            titleText: event?.title || 'Cardano Event',
            headerMeta: formatCardanoEventDateTime(event),
            closeLabel: 'Close Cardano event',
            closeOverlay: closeCardanoEventOverlay,
            returnFocus,
            rootTitle: 'Cardano Events',
            bodyNode: createCardanoEventDetail(event)
        });
    }

    function closeCardanoEventOverlay(restoreFocus = true) {
        window.closePoolMenuOverlay?.('cardano-event-overlay', restoreFocus);
    }

    async function fetchAndRender(options = {}) {
        const container = document.getElementById(options.containerId || 'cardano-events');
        if (!container) return;

        try {
            const payload = await window.TDSPRuntime.fetchJson(
                options.apiUrl,
                { cache: 'no-store' }
            );
            const today = new Date().toISOString().slice(0, 10);
            const events = (Array.isArray(payload?.events) ? payload.events : [])
                .filter(event => String(event?.end_date || event?.start_date || '') >= today)
                .sort((left, right) => String(left?.start_date || '').localeCompare(String(right?.start_date || '')));
            if (!events.length) throw new Error('Events API returned no upcoming events');
            checkNotifications(events, options);
            const sourceOrder = ['cardano', 'luma'];
            const groupedEvents = new Map(sourceOrder.map(key => [key, []]));
            events.forEach(event => {
                const source = getCardanoEventSource(event, payload);
                if (!groupedEvents.has(source.key)) groupedEvents.set(source.key, []);
                groupedEvents.get(source.key).push(event);
            });
            const sourceTiles = sourceOrder
                .map(key => {
                    const sourceEvents = groupedEvents.get(key) || [];
                    if (!sourceEvents.length) return null;
                    return createCardanoEventSourceTile(
                        getCardanoEventSource(sourceEvents[0], payload),
                        sourceEvents
                    );
                })
                .filter(Boolean);
            const summary = document.createElement('div');
            summary.className = 'tdsp-tile-grid tdsp-tile-grid--event-sources';
            summary.append(...sourceTiles);
            container.replaceChildren(summary);
        } catch (error) {
            console.error('Cardano events could not be loaded', error);
            const message = window.TDSPRuntime.createSmallText('Upcoming Cardano events are temporarily unavailable.');
            container.replaceChildren(message);
        }
    }

    window.TDSPCardanoEvents = Object.freeze({
        fetchAndRender,
        formatCardanoEventDateTime
    });
})();
