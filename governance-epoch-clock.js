(function () {
    function createEpochClock({
        epochDurationSeconds,
        epochZeroMs,
        onEpochRollover = null
    }) {
        let countdownTimer = null;
        let epochEndsAtMs = null;
        let currentEpochNumber = null;

        function update() {
            const clockEpoch = getSnapshot();
            currentEpochNumber = clockEpoch.epoch;
            epochEndsAtMs = clockEpoch.endsAtMs;
            const remainingSeconds = Math.max(Math.ceil((epochEndsAtMs - Date.now()) / 1000), 0);
            updateDisplay(remainingSeconds);
            start();
        }

        function getSnapshot(nowMs = Date.now()) {
            const epochDurationMs = epochDurationSeconds * 1000;
            const elapsedEpochs = Math.max(Math.floor((nowMs - epochZeroMs) / epochDurationMs), 0);
            return {
                epoch: elapsedEpochs,
                endsAtMs: epochZeroMs + ((elapsedEpochs + 1) * epochDurationMs)
            };
        }

        function start() {
            if (countdownTimer !== null) return;

            countdownTimer = window.setInterval(() => {
                if (!Number.isFinite(epochEndsAtMs)) {
                    updateDisplay(null);
                    return;
                }
                const remainingSeconds = Math.max(Math.ceil((epochEndsAtMs - Date.now()) / 1000), 0);
                if (remainingSeconds <= 0) {
                    rollForward();
                    return;
                }
                updateDisplay(remainingSeconds);
            }, 1000);
        }

        function rollForward() {
            if (!Number.isFinite(epochEndsAtMs)) {
                updateDisplay(null);
                return;
            }

            const epochDurationMs = epochDurationSeconds * 1000;
            const elapsedEpochs = Math.max(Math.floor((Date.now() - epochEndsAtMs) / epochDurationMs) + 1, 1);
            epochEndsAtMs += elapsedEpochs * epochDurationMs;
            if (Number.isFinite(currentEpochNumber)) currentEpochNumber += elapsedEpochs;
            if (typeof onEpochRollover === 'function') onEpochRollover({
                elapsedEpochs,
                epoch: currentEpochNumber,
                endsAtMs: epochEndsAtMs
            });

            const remainingSeconds = Math.max(Math.ceil((epochEndsAtMs - Date.now()) / 1000), 0);
            updateDisplay(remainingSeconds);
        }

        function updateDisplay(remainingSeconds) {
            const menuEpochElement = document.getElementById('menu-epoch');
            if (menuEpochElement) {
                const epochText = Number.isFinite(currentEpochNumber) ? `Epoch ${currentEpochNumber}` : 'Epoch ...';
                menuEpochElement.textContent = Number.isFinite(remainingSeconds)
                    ? `${epochText} ${formatCountdown(remainingSeconds)} left`
                    : epochText;
                return;
            }

            const countdownElement = document.getElementById('gov-epoch-countdown');
            if (!countdownElement) return;
            countdownElement.textContent = Number.isFinite(remainingSeconds)
                ? formatCountdown(remainingSeconds)
                : '--';
        }

        function formatCountdown(totalSeconds) {
            const seconds = Math.max(Math.floor(totalSeconds), 0);
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
            return [
                String(hours).padStart(2, '0'),
                String(minutes).padStart(2, '0'),
                String(remainingSeconds).padStart(2, '0')
            ].join(':');
        }

        return Object.freeze({
            formatCountdown,
            getSnapshot,
            rollForward,
            start,
            update,
            updateDisplay
        });
    }

    window.TDSPEpochClock = Object.freeze({
        create: createEpochClock
    });
}());
