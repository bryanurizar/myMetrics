export async function getPausesCountChart() {
    const response = await fetch('/pausesByBoards', {
        method: 'GET'
    });
    return response.json();
}

export function createPausesCountChart(chartData) {
    const data = {
        labels: chartData.lastTenSessions,
        datasets: [{
            label: 'No of Pauses in Last 10 Sessions',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 1,
            data: chartData.pausesCount
        }]
    };
    const options = {
        scales: {
            y: {
                min: 0,
                ticks: {
                    stepSize: 1
                }
            }
        }
    };
    const config = {
        type: 'bar',
        data,
        options
    };

    const pausesCountChart = new Chart(
        document.querySelector('#pauses-per-study-sessions'),
        config
    );
}

