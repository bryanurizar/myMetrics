export async function getPausesCountChart() {
    const response = await fetch('http://localhost:3000/pausesByBoards', {
        method: 'GET'
    });
    return response.json();
}

export function createPausesCountChart(chartData) {
    const data = {
        labels: chartData.lastTenSessions,
        datasets: [{
            label: 'Number of Pauses from Last 10 Sessions',
            backgroundColor: 'rgb(48, 111, 216)',
            borderColor: 'rgb(48,111,216)',
            data: chartData.pausesCount
        }]
    };
    const config = {
        type: 'bar',
        data,
    };

    const pausesCountChart = new Chart(
        document.querySelector('#pauses-per-study-sessions'),
        config
    );
}

