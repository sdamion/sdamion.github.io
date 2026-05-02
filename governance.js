const KOIOS_PROPOSALS_URL = 'https://api.koios.rest/api/v1/proposal_list?order=block_time.desc&limit=500';
const KOIOS_TIP_URL = 'https://api.koios.rest/api/v1/tip';
const KOIOS_VOTES_URL = 'https://api.koios.rest/api/v1/vote_list';
const CORS_PROXY_URL = 'https://api.codetabs.com/v1/proxy?quest=';

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGovernance);
} else {
    initGovernance();
}

function initGovernance() {
    loadCurrentEpoch();
    loadGovernanceActions();
}

async function loadCurrentEpoch() {
    const epochElement = document.getElementById('menu-epoch');
    if (!epochElement) return;

    try {
        const tip = await fetchViaProxy(KOIOS_TIP_URL);
        const epoch = Array.isArray(tip) ? tip[0]?.epoch_no : tip?.epoch_no;
        epochElement.textContent = Number.isFinite(epoch) ? `Epoch ${epoch}` : '';
    } catch (error) {
        epochElement.textContent = '';
    }
}

async function loadGovernanceActions() {
    const groups = {
        active: document.getElementById('governance-active'),
        approved: document.getElementById('governance-approved'),
        rejected: document.getElementById('governance-rejected')
    };

    if (!groups.active || !groups.approved || !groups.rejected) return;

    try {
        const proposals = await fetchGovernanceProposals();
        const grouped = groupGovernanceProposals(proposals);

        renderGovernanceGroup(groups.active, grouped.active, 'No active actions found.');
        renderGovernanceGroup(groups.approved, grouped.approved, 'No approved actions found.');
        renderGovernanceGroup(groups.rejected, grouped.rejected, 'No rejected actions found.');
        updateGovernanceCounts(grouped);

        enrichGovernanceVotes([
            ...grouped.active,
            ...grouped.approved,
            ...grouped.rejected
        ]).then(() => {
            renderGovernanceGroup(groups.active, grouped.active, 'No active actions found.');
            renderGovernanceGroup(groups.approved, grouped.approved, 'No approved actions found.');
            renderGovernanceGroup(groups.rejected, grouped.rejected, 'No rejected actions found.');
        }).catch(() => {});
    } catch (error) {
        Object.values(groups).forEach(group => {
            group.textContent = '';
            const message = document.createElement('p');
            message.className = 'small-text';
            message.textContent = 'Governance actions could not be loaded. Open GovTool for the full overview.';
            group.appendChild(message);
        });
    }
}

async function fetchGovernanceProposals() {
    const proxied = await fetchViaProxy(KOIOS_PROPOSALS_URL);
    return Array.isArray(proxied) ? proxied : [];
}

async function fetchGovernanceVotes(proposalIds) {
    if (!proposalIds.length) return [];

    const chunks = chunkArray(proposalIds, 30);
    const allVotes = [];

    for (const chunk of chunks) {
        const ids = chunk.map(encodeURIComponent).join(',');
        const url = `${KOIOS_VOTES_URL}?proposal_id=in.(${ids})&select=proposal_id,vote&limit=5000`;
        const votes = await fetchViaProxy(url);
        if (Array.isArray(votes)) allVotes.push(...votes);
    }

    return allVotes;
}

async function fetchViaProxy(url) {
    return fetchJson(`${CORS_PROXY_URL}${encodeURIComponent(url)}`);
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

function chunkArray(items, size) {
    const chunks = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
}

function groupGovernanceProposals(proposals) {
    const groups = proposals.reduce((grouped, proposal) => {
        grouped[getGovernanceStatus(proposal)].push(proposal);
        return grouped;
    }, { active: [], approved: [], rejected: [] });

    groups.active.sort((a, b) => {
        const aTime = Number(a.block_time) || 0;
        const bTime = Number(b.block_time) || 0;
        return aTime - bTime;
    });

    return groups;
}

async function enrichGovernanceVotes(proposals) {
    const proposalIds = proposals
        .map(proposal => proposal.proposal_id)
        .filter(Boolean);

    proposals.forEach(proposal => {
        proposal.votePercentages = null;
    });

    try {
        const votes = await fetchGovernanceVotes(proposalIds);
        const percentagesByProposal = getVotePercentagesByProposal(votes);

        proposals.forEach(proposal => {
            proposal.votePercentages = percentagesByProposal[proposal.proposal_id] || null;
        });
    } catch (error) {
        proposals.forEach(proposal => {
            proposal.votePercentages = null;
        });
    }
}

function getGovernanceStatus(proposal) {
    if (proposal.dropped_epoch !== null || proposal.expired_epoch !== null) return 'rejected';
    if (proposal.ratified_epoch !== null || proposal.enacted_epoch !== null) return 'approved';
    return 'active';
}

function renderGovernanceGroup(container, proposals, emptyMessage) {
    container.textContent = '';

    if (!proposals.length) {
        const empty = document.createElement('p');
        empty.className = 'small-text';
        empty.textContent = emptyMessage;
        container.appendChild(empty);
        return;
    }

    proposals.forEach(proposal => {
        container.appendChild(createGovernanceCard(proposal));
    });
}

function createGovernanceCard(proposal) {
    const card = document.createElement('button');
    card.className = 'governance-card';
    card.type = 'button';
    card.addEventListener('click', () => openGovernanceOverlay(proposal));

    const title = document.createElement('span');
    title.className = 'governance-title';
    title.textContent = getProposalTitle(proposal);

    const expiration = document.createElement('span');
    expiration.className = 'governance-expiration';
    expiration.textContent = getExpirationText(proposal);

    const votes = document.createElement('span');
    votes.className = `governance-votes ${getVoteColorClass(proposal.votePercentages)}`;
    votes.textContent = formatVotePercentages(proposal.votePercentages);

    card.appendChild(title);
    card.appendChild(expiration);
    if (votes.textContent) card.appendChild(votes);

    return card;
}

function openGovernanceOverlay(proposal) {
    closeGovernanceOverlay();

    const overlay = document.createElement('div');
    overlay.className = 'governance-overlay';
    overlay.id = 'governance-overlay';
    overlay.addEventListener('click', event => {
        if (event.target === overlay) closeGovernanceOverlay();
    });

    const dialog = document.createElement('article');
    dialog.className = 'governance-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'governance-dialog-title');

    const close = document.createElement('button');
    close.className = 'governance-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Close governance action');
    close.textContent = 'Close';
    close.addEventListener('click', closeGovernanceOverlay);

    const type = document.createElement('span');
    type.className = 'governance-type';
    type.textContent = formatProposalType(proposal.proposal_type);

    const title = document.createElement('h2');
    title.id = 'governance-dialog-title';
    title.textContent = getProposalTitle(proposal);

    const meta = document.createElement('p');
    meta.className = 'small-text';
    meta.textContent = getProposalMeta(proposal);

    const content = document.createElement('div');
    content.className = 'governance-detail-content';

    addDetailRow(content, 'Action ID', proposal.proposal_id);
    addDetailRow(content, 'Transaction', proposal.proposal_tx_hash);
    addDetailRow(content, 'Type', formatProposalType(proposal.proposal_type));
    addDetailRow(content, 'Proposed epoch', proposal.proposed_epoch);
    addDetailRow(content, 'Expiration epoch', proposal.expiration);
    addDetailRow(content, 'Ratified epoch', proposal.ratified_epoch);
    addDetailRow(content, 'Enacted epoch', proposal.enacted_epoch);
    addDetailRow(content, 'Expired epoch', proposal.expired_epoch);
    addDetailRow(content, 'Dropped epoch', proposal.dropped_epoch);
    addDetailRow(content, 'Vote percentages', formatVotePercentages(proposal.votePercentages));
    addDetailRow(content, 'Deposit', formatLovelace(proposal.deposit));
    addDetailRow(content, 'Return address', proposal.return_address);
    addDetailRow(content, 'Metadata URL', proposal.meta_url);

    const body = proposal.meta_json?.body || proposal.meta_json || {};
    addDetailRow(content, 'Abstract', body.abstract);
    addDetailRow(content, 'Motivation', body.motivation);
    addDetailRow(content, 'Rationale', body.rationale);

    if (proposal.proposal_description) {
        const raw = document.createElement('pre');
        raw.className = 'governance-json';
        raw.textContent = JSON.stringify(proposal.proposal_description, null, 2);
        const label = document.createElement('strong');
        label.textContent = 'On-chain action';
        content.appendChild(label);
        content.appendChild(raw);
    }

    dialog.appendChild(close);
    dialog.appendChild(type);
    dialog.appendChild(title);
    dialog.appendChild(meta);
    dialog.appendChild(content);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    close.focus();
    document.addEventListener('keydown', handleGovernanceOverlayKeydown);
}

function closeGovernanceOverlay() {
    const overlay = document.getElementById('governance-overlay');
    if (overlay) overlay.remove();
    document.removeEventListener('keydown', handleGovernanceOverlayKeydown);
}

function handleGovernanceOverlayKeydown(event) {
    if (event.key === 'Escape') closeGovernanceOverlay();
}

function addDetailRow(container, label, value) {
    if (value === null || value === undefined || value === '') return;
    const cleanValue = cleanGovernanceText(String(value));
    if (!cleanValue) return;

    const row = document.createElement('div');
    row.className = 'governance-detail-row';

    const key = document.createElement('strong');
    key.textContent = label;

    const text = document.createElement('span');
    appendRichText(text, cleanValue);

    row.appendChild(key);
    row.appendChild(text);
    container.appendChild(row);
}

function cleanGovernanceText(text) {
    return text
        .replace(/^\s*\[image\d*\]:\s*<[^>]*>\s*$/gim, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function appendRichText(container, text) {
    const urlPattern = /(https?:\/\/[^\s<>"')\]]+)/g;
    let lastIndex = 0;

    text.replace(urlPattern, (url, _match, offset) => {
        if (offset > lastIndex) {
            container.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
        }

        const cleanUrl = url.replace(/[.,;:!?]+$/, '');
        const trailing = url.slice(cleanUrl.length);

        if (isImageUrl(cleanUrl)) {
            const imageLink = document.createElement('a');
            imageLink.href = cleanUrl;
            imageLink.target = '_blank';
            imageLink.rel = 'noopener noreferrer';

            const image = document.createElement('img');
            image.className = 'governance-detail-image';
            image.src = cleanUrl;
            image.alt = 'Governance action image';
            image.loading = 'lazy';

            imageLink.appendChild(image);
            container.appendChild(imageLink);
        } else {
            const link = document.createElement('a');
            link.href = cleanUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
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

function isImageUrl(url) {
    return /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(url);
}

function getProposalTitle(proposal) {
    return proposal.meta_json?.body?.title
        || proposal.meta_json?.title
        || `${formatProposalType(proposal.proposal_type)} governance action`;
}

function getProposalMeta(proposal) {
    const parts = [`Epoch ${proposal.proposed_epoch}`];
    if (proposal.expiration !== null) parts.push(`expires ${proposal.expiration}`);
    if (proposal.enacted_epoch !== null) parts.push(`enacted ${proposal.enacted_epoch}`);
    if (proposal.ratified_epoch !== null) parts.push(`ratified ${proposal.ratified_epoch}`);
    if (proposal.expired_epoch !== null) parts.push(`expired ${proposal.expired_epoch}`);
    if (proposal.dropped_epoch !== null) parts.push(`dropped ${proposal.dropped_epoch}`);
    return parts.join(' / ');
}

function getExpirationText(proposal) {
    if (proposal.expired_epoch !== null) return `Expired epoch ${proposal.expired_epoch}`;
    if (proposal.dropped_epoch !== null) return `Dropped epoch ${proposal.dropped_epoch}`;
    if (proposal.expiration !== null) return `Expires epoch ${proposal.expiration}`;
    return 'No expiration data';
}

function getVotePercentagesByProposal(votes) {
    const totals = votes.reduce((groups, vote) => {
        if (!vote.proposal_id) return groups;

        groups[vote.proposal_id] = groups[vote.proposal_id] || { yes: 0, no: 0, abstain: 0 };
        const key = String(vote.vote || '').toLowerCase();
        if (key in groups[vote.proposal_id]) {
            groups[vote.proposal_id][key] += 1;
        }

        return groups;
    }, {});

    return Object.entries(totals).reduce((percentages, [proposalId, votesForProposal]) => {
        const total = votesForProposal.yes + votesForProposal.no + votesForProposal.abstain;
        if (!total) return percentages;

        percentages[proposalId] = {
            yes: votesForProposal.yes / total * 100,
            no: votesForProposal.no / total * 100,
            abstain: votesForProposal.abstain / total * 100
        };

        return percentages;
    }, {});
}

function formatVotePercentages(percentages) {
    if (!percentages) return '';

    return [
        `Yes ${formatPercentage(percentages.yes)}`,
        `No ${formatPercentage(percentages.no)}`,
        `Abstain ${formatPercentage(percentages.abstain)}`
    ].join(' | ');
}

function getVoteColorClass(percentages) {
    const yes = Number(percentages?.yes);
    if (!Number.isFinite(yes)) return 'vote-neutral';
    if (yes >= 76) return 'vote-green';
    if (yes >= 38) return 'vote-orange';
    return 'vote-red';
}

function updateGovernanceCounts(groups) {
    setText('gov-active-count', groups.active.length);
    setText('gov-approved-count', groups.approved.length);
    setText('gov-rejected-count', groups.rejected.length);
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
}

function formatProposalType(type) {
    return String(type || 'Governance')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ');
}

function formatLovelace(value) {
    const lovelace = Number(value);
    if (!Number.isFinite(lovelace)) return value;
    return `${(lovelace / 1_000_000).toLocaleString()} ADA`;
}

function formatPercentage(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return value;
    const rounded = Math.round(number * 100) / 100;
    return `${rounded.toLocaleString()}%`;
}
