export async function getItemCountChartData() {
    const response = await fetch(`${process.env.API_URL}/itemCountChart`, {
        method: 'GET'
    });
    return response.json();
}

export function createItemCountChart(chartData) {
    const data = {
        labels: chartData.boardNames,
        datasets: [{
            label: 'No of Tasks',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1,
            data: chartData.itemCount,
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

    const itemCount = new Chart(
        document.querySelector('#item-count-by-boards'),
        config
    );
    return;
}

