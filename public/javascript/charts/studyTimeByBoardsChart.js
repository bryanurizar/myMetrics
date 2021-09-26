export async function getStudyTimeByBoardsData() {
    const response = await fetch(`${process.env.API_URL}/studyTimeByBoardsChart`, {
        method: 'GET'
    });
    return response.json();
}

export function createStudyTimeByBoardsChart(chartData) {
    const data = {
        labels: chartData.boardNames,
        datasets: [{
            label: 'Total Hours',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgb(153, 102, 255)',
            borderWidth: 1,
            data: chartData.boardStudyTime,
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

    const boardStudyTime = new Chart(
        document.querySelector('#study-time-by-board'),
        config
    );
}

