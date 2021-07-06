export async function getNoOfDaysSinceLastSessionChartData() {
    const response = await fetch('http://localhost:3000/daysSinceLastSession', {
        method: 'GET'
    });
    return response.json();
}

export function createNoOfDaysSinceLastSessionChart(chartData) {
    console.log(chartData.boardNames);
    console.log(chartData.daysSinceLastSession);
    const data = {
        labels: chartData.boardNames,
        datasets: [{
            label: 'No of Days Since Last Study Session',
            backgroundColor: 'rgb(48, 111, 216)',
            borderColor: 'rgb(48,111,216)',
            data: chartData.daysSinceLastSession,
        }]
    };
    const config = {
        type: 'bar',
        data
    };

    const numberOfDaysChart = new Chart(
        document.querySelector('#number-of-days-since-last-study-session'),
        config
    );
}

