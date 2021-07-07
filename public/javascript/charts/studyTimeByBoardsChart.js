export async function getStudyTimeByBoardsData() {
    const response = await fetch('http://localhost:3000/studyTimeByBoardsChart', {
        method: 'GET'
    });
    return response.json();
}

export function createStudyTimeByBoardsChart(chartData) {
    const data = {
        labels: chartData.boardNames,
        datasets: [{
            label: 'Total Minutes',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgb(153, 102, 255)',
            borderWidth: 1,
            data: chartData.boardStudyTime,
        }]
    };
    const config = {
        type: 'bar',
        data
    };

    const boardStudyTime = new Chart(
        document.querySelector('#study-time-by-board'),
        config
    );
}

