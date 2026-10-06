export function siteChartDefaults(element) {
    const style = getComputedStyle(element);
    const color = style.getPropertyValue('--text').trim();
    const grid = style.getPropertyValue('--line').trim();
    const font = { family: style.fontFamily, size: parseFloat(style.fontSize) || 14 };
    return {
        color,
        grid,
        positive: style.getPropertyValue('--accent-strong').trim(),
        negative: style.getPropertyValue('--ai-unavailable-color').trim() || '#c62828',
        legend: { position: 'top', align: 'start', labels: { color, usePointStyle: true, pointStyle: 'line', padding: 20, boxWidth: 20, font } },
        tooltip: { backgroundColor: style.getPropertyValue('--surface').trim(), titleColor: color, bodyColor: color, borderColor: grid, borderWidth: 1, cornerRadius: 8, padding: 12, displayColors: true, titleFont: font, bodyFont: font },
        ticks: { color, maxTicksLimit: 5, padding: 10, font },
        title: { color, font },
        line: { borderWidth: 2.5, borderCapStyle: 'round', borderJoinStyle: 'round', pointHoverRadius: 5, pointHitRadius: 14, fill: false }
    };
}
