export async function getItemCountChartData() {
    const response = await fetch('http://localhost:3000/itemCountChart', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    return response.json();
}

export function createItemCountChart(res) {
    const labels = res.boardNames;
    const data = {
        labels: labels,
        datasets: [{
            label: 'Count of Tasks',
            backgroundColor: 'rgb(48, 111, 216)',
            borderColor: 'rgb(48,111,216)',
            data: res.itemCount,
        }]
    };

    const config = {
        type: 'bar',
        data,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };

    const itemCount = new Chart(
        document.querySelector('#study-time-by-board'),
        config
    );
}

