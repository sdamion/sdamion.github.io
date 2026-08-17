(function () {
    function createDrepUtils() {
        function addDirectoryEntries(directory, payload) {
            const entries = unwrapEntries(payload);
            entries.forEach(entry => {
                const name = extractNameFromEntry(entry);
                if (!name) return;

                getEntryIdentifiers(entry).forEach(identifier => {
                    directory.set(identifier, name);
                    const shortened = shortenIdentifier(identifier);
                    if (shortened) directory.set(shortened, name);
                });
            });
        }

        function unwrapEntries(payload) {
            if (Array.isArray(payload)) return payload;
            if (Array.isArray(payload?.data)) return payload.data;
            if (Array.isArray(payload?.dreps)) return payload.dreps;
            if (Array.isArray(payload?.items)) return payload.items;
            if (payload && typeof payload === 'object') return Object.values(payload).filter(Boolean);
            return [];
        }

        function extractNameFromEntry(entry) {
            if (!entry || typeof entry !== 'object') return null;

            const authorNames = Array.isArray(entry.authors)
                ? entry.authors.map(author => author?.name).filter(Boolean)
                : [];
            if (authorNames.length) return authorNames[0];

            const metadata = entry.metadata || {};
            const metaJson = entry.meta_json || metadata.meta_json || {};
            const body = entry.body || metadata.body || metaJson.body || {};

            return firstNonEmptyText(
                body.dRepName,
                body.drepName,
                body.givenName,
                body.given_name,
                body.name,
                body.title,
                entry.name,
                entry.title,
                entry.given_name,
                entry.givenName,
                entry.display_name,
                entry.displayName,
                metadata.name,
                metadata.title,
                metadata.givenName,
                metadata.given_name,
                metaJson.name,
                metaJson.title
            );
        }

        function getEntryIdentifiers(entry) {
            return [
                entry?.voter_id,
                entry?.voterId,
                entry?.voter_hex,
                entry?.drep_id,
                entry?.drepId,
                entry?.id,
                entry?.hex,
                entry?.credential,
                entry?.view,
                entry?.bech32,
                entry?.drep_hash,
                entry?.drepHash,
                entry?.drep?.id,
                entry?.drep?.view,
                entry?.drep?.hex,
                entry?.drep?.bech32,
                entry?.metadata?.voter_id,
                entry?.metadata?.voterId,
                entry?.metadata?.drep_id
            ]
                .map(normalizeIdentifier)
                .filter(Boolean);
        }

        function normalizeIdentifier(value) {
            if (value === null || value === undefined) return '';
            return String(value).trim().toLowerCase();
        }

        function shortenIdentifier(value) {
            const normalized = normalizeIdentifier(value);
            if (!normalized) return '';
            return normalized.startsWith('drep1') ? normalized.slice(5) : normalized;
        }

        function extractMetadataName(payload) {
            if (!payload || typeof payload !== 'object') return null;

            const authorNames = Array.isArray(payload.authors)
                ? payload.authors.map(author => author?.name).filter(Boolean)
                : [];
            if (authorNames.length) return authorNames[0];

            const body = payload.body || {};
            return firstNonEmptyText(
                body.dRepName,
                body.drepName,
                body.givenName,
                body.given_name,
                body.name,
                body.title,
                payload.name,
                payload.title,
                payload.givenName,
                payload.given_name
            );
        }

        function firstNonEmptyText(...values) {
            for (const value of values) {
                const text = extractTextValue(value);
                if (text) return text;
            }
            return null;
        }

        function extractTextValue(value) {
            if (value === null || value === undefined) return '';
            if (typeof value === 'string') return value.trim();
            if (typeof value !== 'object') return String(value).trim();

            return (
                extractTextValue(value['@value'])
                || extractTextValue(value.value)
                || extractTextValue(value.text)
                || extractTextValue(value.label)
                || extractTextValue(value.name)
                || ''
            );
        }

        function normalizeMetadataUrl(url) {
            if (!url || typeof url !== 'string') return '';
            const trimmed = url.trim();
            if (!trimmed) return '';

            if (trimmed.startsWith('ipfs://')) {
                return `https://ipfs.io/ipfs/${trimmed.slice('ipfs://'.length)}`;
            }

            return trimmed;
        }

        return Object.freeze({
            addDirectoryEntries,
            extractMetadataName,
            extractNameFromEntry,
            extractTextValue,
            firstNonEmptyText,
            getEntryIdentifiers,
            normalizeIdentifier,
            normalizeMetadataUrl,
            shortenIdentifier,
            unwrapEntries
        });
    }

    window.TDSPDrepUtils = Object.freeze({
        create: createDrepUtils
    });
}());
