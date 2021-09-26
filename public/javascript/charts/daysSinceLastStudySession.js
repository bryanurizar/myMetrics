export async function getNoOfDaysSinceLastSessionChartData() {
    const response = await fetch('/daysSinceLastSession', {
        method: 'GET'
    });
    return response.json();
}

export function createNoOfDaysSinceLastSessionChart(chartData) {
    const data = {
        labels: chartData.boardNames,
        datasets: [{
            label: 'No of Days since Last Session',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1,
            data: chartData.daysSinceLastSession,
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


    const numberOfDaysChart = new Chart(
        document.querySelector('#number-of-days-since-last-study-session'),
        config
    );
}

