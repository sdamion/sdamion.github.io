async function fetchData() {
    try {
        const response = await fetch('https://www.tdsp.online/api/resource/6738f8cddce9fe405732f092');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();

        document.getElementById("name").textContent = data.name;
        document.getElementById("status-text").innerHTML = data.runtime_details.active_status ? 
            '<span class="online">Online</span>' : '<span class="offline">Offline</span>';
        document.getElementById("location").textContent = data.location_details.country;

        document.getElementById("total-storage").textContent = (data.storage_details.storage_capacity / 1000).toFixed(2) + " TB";
        document.getElementById("committed-storage").textContent = (data.storage_details.committed_storage_in_bytes / (1000 ** 4)).toFixed(2) + " TB";
        document.getElementById("used-storage").textContent = (data.storage_details.storage_consumed_in_bytes / (1000 ** 3)).toFixed(2) + " GB";
        document.getElementById("storage-available").textContent = (data.storage_details.storage_available_in_bytes / (1000 ** 3)).toFixed(2) + " GB";

        document.getElementById("staked").textContent = (data.stake_details.staked_amount.quantity / 1e6).toFixed(2) + " IAG";
        document.getElementById("rewards").textContent = (data.reward_details.accumulated_reward.quantity / 1e6).toFixed(2) + " IAG";
        document.getElementById("fees").textContent = (data.reward_details.accumulated_fee.quantity / 1e6).toFixed(6) + " ADA";

    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById("status-text").textContent = "Error Loading Data";
    }
}

async function fetchPerformanceData() {
    try {
        const response = await fetch('https://www.tdsp.online/api/resource/6738f8cddce9fe405732f092/performance/history');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const performanceData = await response.json();
        if (!performanceData.success) throw new Error("Invalid performance history response");

        // Get last 7 days of data
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 8);

        const lastWeekData = performanceData.data
            .filter(entry => new Date(entry.date) >= sevenDaysAgo)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const dates = lastWeekData.map(entry => new Date(entry.date).toISOString().split('T')[0]);
        const scores = lastWeekData.map(entry => entry.score);

        updateChart(dates, scores);

    } catch (error) {
        console.error("Error fetching performance history:", error);
    }
}

function updateChart(dates, scores) {
    const ctx = document.getElementById('performanceChart').getContext('2d');

    // Destroy existing chart instance if it exists (prevents memory leak)
    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }

    // Set color dynamically based on score
const barColors = scores.map((score, index) => {
        const gradient = ctx.createLinearGradient(30, 30, 30, 300);
        gradient.addColorStop(0, 'rgba(34, 167, 240, 0.7)'); // Light Blue
        gradient.addColorStop(1, 'rgba(155, 89, 182, 0.7)'); // Purple
        return gradient;
    
});

new Chart(ctx, {
    type: 'bar',
    data: {
        labels: dates,
        datasets: [{
            label: 'Performance Score',
            data: scores,
            backgroundColor: barColors,
            borderWidth: 0,
            borderRadius: 5,
            hoverBorderColor: 'black',
            barThickness: 20
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { display: true }
        },
        scales: {
            y: { beginAtZero: true, max: 80 }
        },
        animation: {
            duration: 1000,
            easing: 'easeInOutBounce'
        }
    }
});
}
// Initial Data Fetch
fetchData();
fetchPerformanceData();

// Auto-refresh every 12 hours (12 * 60 * 60 * 1000 milliseconds)
setInterval(() => {
    fetchData();
    fetchPerformanceData();
}, 12 * 60 * 60 * 1000);
