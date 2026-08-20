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
            const language = getCurrentLanguage();
            if (!language || language === 'en') return path;
            const separator = path.includes('?') ? '&' : '?';
            return `${path}${separator}lang=${encodeURIComponent(language)}`;
        }

        function addCurrentLanguage(params = {}) {
            const language = getCurrentLanguage();
            if (!language || language === 'en') return params;
            return { ...params, lang: language };
        }

        function catalystProposals(options = {}) {
            if (isLocalPreview) {
                const params = new URLSearchParams();
                if (options.funds) params.set('type', 'funds');
                if (options.fundName) params.set('fund', options.fundName);
                return `${endpoints.localCatalystProposals}?${params.toString()}`;
            }
            if (options.funds) return `${endpoints.catalystProposals}/funds`;
            const params = new URLSearchParams();
            if (options.fundName) params.set('fund', options.fundName);
            return `${endpoints.catalystProposals}${params.size ? `?${params.toString()}` : ''}`;
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
                return withParams(endpoints.localProposalSummary, { proposalId });
            }
            return `${endpoints.proposalSummaryBase}/${encodeURIComponent(proposalId)}/summary`;
        }

        function proposalDrepRationale(proposalId, drepId) {
            if (isLocalPreview) {
                return withParams(endpoints.localProposalRationale, { proposalId, drepId });
            }
            return `${endpoints.proposalRationaleBase}/${encodeURIComponent(proposalId)}/drep/${encodeURIComponent(drepId)}/rationale`;
        }

        function catalystProposalDetail(proposalId) {
            if (isLocalPreview) {
                return withParams(endpoints.localCatalystProposalDetail, { proposalId });
            }
            return `${endpoints.catalystProposalDetailBase}/${encodeURIComponent(proposalId)}`;
        }

        function catalystProposalSummary(proposalId) {
            if (isLocalPreview) {
                return withParams(endpoints.localCatalystProposalSummary, { proposalId });
            }
            return `${endpoints.catalystProposalSummaryBase}/${encodeURIComponent(proposalId)}/summary`;
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

        function spoDirectory() {
            return isLocalPreview ? endpoints.localSpoDirectory : endpoints.spoDirectory;
        }

        function spoRescanStatus() {
            return isLocalPreview ? endpoints.localSpoRescanStatus : endpoints.spoRescanStatus;
        }

        function spoDetail(poolId) {
            if (isLocalPreview) {
                return withParams(endpoints.localSpoDetail, { poolId });
            }
            return `${endpoints.spoDetailBase}/${encodeURIComponent(poolId)}`;
        }

        function drepInfo() {
            if (isLocalPreview) {
                return `${endpoints.localDrepDirectory}?type=directory`;
            }
            return endpoints.drepInfo;
        }

        function drepDetail(drepId) {
            if (isLocalPreview) {
                return withParams(endpoints.localDrepDetail, { drepId });
            }
            return `${endpoints.drepDetailBase}/${encodeURIComponent(drepId)}`;
        }

        function drepVoteStats(ids = []) {
            const params = ids.length ? `?ids=${encodeURIComponent(ids.join(','))}` : '';
            if (isLocalPreview) {
                return `${endpoints.localDrepVoteStats}${params}`;
            }
            return `${endpoints.drepVoteStats}${params}`;
        }

        function drepCorrelation() {
            return isLocalPreview ? endpoints.localDrepCorrelation : endpoints.drepCorrelation;
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

        return Object.freeze({
            catalystProposalDetail,
            catalystProposalSummary,
            catalystProposals,
            cips,
            committeeInfo,
            committeeMember,
            compactDashboard,
            dashboard,
            drepCorrelation,
            drepDetail,
            drepInfo,
            drepVoteStats,
            metadata,
            proposalDetail,
            proposalDrepRationale,
            proposalSummary,
            proposalVotes,
            spoDetail,
            spoDirectory,
            spoRescanStatus,
            withTimeout
        });
    }

    window.TDSPGovernanceApi = Object.freeze({
        create: createGovernanceApiModule
    });
}());
