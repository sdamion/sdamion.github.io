(function () {
    function createPieChartRenderer({ formatPercentage }) {
        function translateLabel(label) {
            const value = String(label || '').replace(/\s+/g, ' ').trim();
            return window.TDSPI18n?.translateText?.(value) || value;
        }

        function getSegments(items) {
            const total = items.reduce((sum, item) => sum + item.value, 0);
            if (!total) return [];

            let start = 0;
            return items.map(item => {
                const span = (item.value / total) * 360;
                const end = start + span;
                const segment = {
                    ...item,
                    start,
                    end,
                    mid: start + span / 2
                };
                start = end;
                return segment;
            });
        }

        function createChart(items, options = {}) {
            const chart = document.createElement('div');
            chart.className = 'governance-pie-chart';
            const segments = getSegments(items);
            chart.appendChild(createSvg(segments, chart, options));

            if (options.showLabels !== false) {
                segments.forEach(segment => {
                    const label = createAmountLabel(segment, options.labelFormatter);
                    if (label) chart.appendChild(label);
                });
            }

            return chart;
        }

        function createSvg(segments, chart, options = {}) {
            const namespace = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(namespace, 'svg');
            svg.classList.add('governance-pie-chart-svg');
            svg.setAttribute('viewBox', '0 0 100 100');
            svg.setAttribute('role', 'group');
            svg.setAttribute('aria-label', 'Interactive pie chart');

            const track = document.createElementNS(namespace, 'circle');
            track.classList.add('governance-pie-chart-track');
            track.setAttribute('cx', '50');
            track.setAttribute('cy', '50');
            track.setAttribute('r', '43');
            svg.appendChild(track);

            if (options.isLoading === true || !segments.length) return svg;

            const circumference = 2 * Math.PI * 43;
            segments.forEach((segment, index) => {
                const span = segment.end - segment.start;
                const interactiveSegment = createSector(segment, namespace);
                const segmentLabel = translateLabel(segment.label || `Segment ${index + 1}`);
                interactiveSegment.classList.add('governance-pie-chart-sector');
                interactiveSegment.style.fill = segment.color;
                interactiveSegment.setAttribute('tabindex', '0');
                const isClickable = typeof options.onSegmentClick === 'function';
                interactiveSegment.setAttribute('role', isClickable ? 'button' : 'img');
                interactiveSegment.setAttribute(
                    'aria-label',
                    `${segmentLabel}: ${formatPercentage(span / 360 * 100)}${isClickable ? ', open details' : ''}`
                );
                if (isClickable) {
                    interactiveSegment.classList.add('is-clickable');
                    window.TDSPRuntime?.bindActionTrigger?.(interactiveSegment, event => {
                        options.onSegmentClick(segment, event.currentTarget);
                    }, {
                        datasetKey: 'pieSegmentBound',
                        errorMessage: `${segmentLabel || 'Chart segment'} details could not be opened.`
                    });
                }

                const arc = document.createElementNS(namespace, 'circle');
                arc.classList.add('governance-pie-chart-arc');
                arc.setAttribute('cx', '50');
                arc.setAttribute('cy', '50');
                arc.setAttribute('r', '43');
                arc.setAttribute('transform', 'rotate(-90 50 50)');
                arc.style.stroke = segment.color;
                arc.style.color = segment.color;
                arc.style.strokeDasharray = `${circumference * span / 360} ${circumference}`;
                arc.style.strokeDashoffset = `${-circumference * segment.start / 360}`;

                const showSegment = () => {
                    chart.classList.add('is-segment-active');
                    interactiveSegment.classList.add('is-active');
                    arc.classList.add('is-active');
                };
                const hideSegment = () => {
                    chart.classList.remove('is-segment-active');
                    interactiveSegment.classList.remove('is-active');
                    arc.classList.remove('is-active');
                };
                interactiveSegment.addEventListener('mouseenter', showSegment);
                interactiveSegment.addEventListener('mouseleave', hideSegment);
                interactiveSegment.addEventListener('focus', showSegment);
                interactiveSegment.addEventListener('blur', hideSegment);

                svg.append(interactiveSegment, arc);
            });

            if (options.showSegmentSeparators === true && segments.length > 1) {
                segments.forEach(segment => {
                    const inner = getPoint(segment.start, 39);
                    const outer = getPoint(segment.start, 47);
                    const separator = document.createElementNS(namespace, 'line');
                    separator.classList.add('governance-pie-chart-separator');
                    separator.setAttribute('x1', String(inner.x));
                    separator.setAttribute('y1', String(inner.y));
                    separator.setAttribute('x2', String(outer.x));
                    separator.setAttribute('y2', String(outer.y));
                    svg.appendChild(separator);
                });
            }

            return svg;
        }

        function createSector(segment, namespace) {
            const span = Math.min(359.999, segment.end - segment.start);
            const start = getPoint(segment.start, 47);
            const end = getPoint(segment.start + span, 47);
            const sector = document.createElementNS(namespace, 'path');
            sector.setAttribute(
                'd',
                `M 50 50 L ${start.x} ${start.y} A 47 47 0 ${span > 180 ? 1 : 0} 1 ${end.x} ${end.y} Z`
            );
            return sector;
        }

        function getPoint(angle, radius) {
            const radians = ((angle - 90) * Math.PI) / 180;
            return {
                x: 50 + Math.cos(radians) * radius,
                y: 50 + Math.sin(radians) * radius
            };
        }

        function createAmountLabel(segment, formatter = null) {
            if (!segment.value) return null;

            const text = typeof formatter === 'function'
                ? formatter(segment)
                : formatPercentage((segment.end - segment.start) / 360 * 100);
            if (!text) return null;

            const label = document.createElement('span');
            label.className = 'governance-pie-label';
            label.textContent = text;

            const radians = ((segment.mid - 90) * Math.PI) / 180;
            positionLabel(label, radians, segment.end - segment.start);
            return label;
        }

        function positionLabel(label, radians, segmentDegrees) {
            const radius = segmentDegrees < 18 ? 38 : 32;
            const x = Math.min(88, Math.max(12, 50 + (Math.cos(radians) * radius)));
            const y = Math.min(88, Math.max(12, 50 + (Math.sin(radians) * radius)));

            label.style.left = `${x}%`;
            label.style.top = `${y}%`;
        }

        return Object.freeze({
            createChart,
            getSegments
        });
    }

    window.TDSPPieChart = Object.freeze({
        create: createPieChartRenderer
    });
}());
