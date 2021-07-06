export async function getItemCountChartData() {
    const response = await fetch('http://localhost:3000/itemCountChart', {
        method: 'GET'
    });
    return response.json();
}

export function createItemCountChart(chartData) {
    const data = {
        labels: chartData.boardNames,
        datasets: [{
            label: 'Number of Tasks',
            backgroundColor: 'rgb(48, 111, 216)',
            borderColor: 'rgb(48,111,216)',
            data: chartData.itemCount,
        }]
    };
    const config = {
        type: 'bar',
        data
    };

    const itemCount = new Chart(
        document.querySelector('#item-count-by-boards'),
        config
    );
    return;
}

