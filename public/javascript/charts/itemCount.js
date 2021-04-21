async function getChartData() {
    const response = await fetch('http://localhost:3000/items', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    return response.json();
}

console.log(getChartData());







const labels = [
    'JavaScript',
    'myMetrics App',
    'Random Bits'
];
const data = {
    labels: labels,
    datasets: [{
        label: 'Number of Items',
        backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(255, 159, 64, 0.2)',
            'rgba(255, 205, 86, 0.2)'
        ],
        borderColor: [
            'rgb(255, 99, 132)',
            'rgb(255, 159, 64)',
            'rgb(255, 205, 86)',
        ],
        data: [4, 16, 1],
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

// === include 'setup' then 'config' above ===
const myChart = new Chart(
    document.querySelector('#item-count'),
    config
);