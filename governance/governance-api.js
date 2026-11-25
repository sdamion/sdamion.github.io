(function () {
    function createGovernanceApiModule({ isLocalPreview = false, endpoints = {} } = {}) {
        function withParams(path, params) {
            const query = new URLSearchParams(params);
            return `${path}?${query.toString()}`;
        }

        function getCurrentLanguage() {
            return window.TDSPI18n?.getLanguage?.() || 'en';
        }

        function withCurrentLanguage(path) {
            const language = getCurrentLanguage() || 'en';
            const separator = path.includes('?') ? '&' : '?';
            return `${path}${separator}lang=${encodeURIComponent(language)}`;
        }

        function addCurrentLanguage(params = {}) {
            const language = getCurrentLanguage() || 'en';
            return { ...params, lang: language };
        }

        function catalystProposals(options = {}) {
            if (isLocalPreview) {
                const params = new URLSearchParams();
                if (options.funds) params.set('type', 'funds');
                if (options.fundName) params.set('fund', options.fundName);
                const localized = addCurrentLanguage(Object.fromEntries(params.entries()));
                return withParams(endpoints.localCatalystProposals, localized);
            }
            if (options.funds) return withCurrentLanguage(`${endpoints.catalystProposals}/funds`);
            const params = new URLSearchParams(addCurrentLanguage());
            if (options.fundName) params.set('fund', options.fundName);
            return `${endpoints.catalystProposals}${params.size ? `?${params.toString()}` : ''}`;
        }

        function catalystProposalDetail(proposalId) {
            if (isLocalPreview) {
                return withParams(endpoints.localCatalystProposalDetail, addCurrentLanguage({ proposalId }));
            }
            return withCurrentLanguage(`${endpoints.catalystProposalDetailBase}/${encodeURIComponent(proposalId)}`);
        }

        function catalystProposalSummary(proposalId) {
            if (isLocalPreview) {
                return withParams(endpoints.localCatalystProposalSummary, addCurrentLanguage({ proposalId }));
            }
            return withCurrentLanguage(`${endpoints.catalystProposalSummaryBase}/${encodeURIComponent(proposalId)}/summary`);
        }

        function catalystPilot2026() {
            return withCurrentLanguage(isLocalPreview
                ? endpoints.localCatalystPilot2026
                : endpoints.catalystPilot2026);
        }

        function cips() {
            return withCurrentLanguage(isLocalPreview ? endpoints.localCips : endpoints.cips);
        }

        function dashboard() {
            return withCurrentLanguage(isLocalPreview ? endpoints.localDashboard : endpoints.dashboard);
        }

        function compactDashboard() {
            return withCurrentLanguage(isLocalPreview ? endpoints.localCompactDashboard : endpoints.compactDashboard);
        }

        function proposalVotes(proposalId) {
            if (isLocalPreview) {
                return withParams(endpoints.localProposalVotes, { proposalId });
            }
            return `${endpoints.proposalVotesBase}/${encodeURIComponent(proposalId)}/votes`;
        }

        function proposalDetail(proposalId) {
            if (isLocalPreview) {
                return withParams(endpoints.localProposalDetail, addCurrentLanguage({ proposalId }));
            }
            return withCurrentLanguage(`${endpoints.proposalDetailBase}/${encodeURIComponent(proposalId)}`);
        }

        function proposalSummary(proposalId) {
            if (isLocalPreview) {
                return withParams(endpoints.localProposalSummary, addCurrentLanguage({ proposalId }));
            }
            return withCurrentLanguage(`${endpoints.proposalSummaryBase}/${encodeURIComponent(proposalId)}/summary`);
        }


        function committeeInfo() {
            return isLocalPreview ? endpoints.localCommittee : endpoints.committeeInfo;
        }

        function committeeMember(memberId) {
            if (isLocalPreview) {
                return withParams(endpoints.localCommitteeMember, { memberId });
            }
            return `${endpoints.committeeMemberBase}/${encodeURIComponent(memberId)}`;
        }


        function metadata(url, options = {}) {
            const params = new URLSearchParams({ url });
            if (options.refresh) params.set('refresh', '1');
            if (isLocalPreview) {
                return `${endpoints.localMetadata}?${params.toString()}`;
            }
            return `${endpoints.remoteMetadata}?${params.toString()}`;
        }

        function withTimeout(promise, timeoutMs, message) {
            let timeoutId;
            const timeout = new Promise((_, reject) => {
                timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
            });
            return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
        }

        return Object.freeze({catalystPilot2026,
catalystProposalDetail,
catalystProposalSummary,
catalystProposals,
cips,
committeeInfo,
committeeMember,
compactDashboard,
dashboard,
metadata,
proposalDetail,
proposalSummary,
proposalVotes,
withTimeout});
}

    window.TDSPGovernanceApi = Object.freeze({
        create: createGovernanceApiModule
    });
}());
