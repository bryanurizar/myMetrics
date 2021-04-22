async function getChartData() {
    const response = await fetch('http://localhost:3000/data', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    const res = await response.json();

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
        document.querySelector('#item-count'),
        config
    );
}

getChartData();