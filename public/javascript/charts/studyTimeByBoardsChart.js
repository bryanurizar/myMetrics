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
            label: 'Study Time by Boards (min)',
            backgroundColor: 'rgb(48, 111, 216)',
            borderColor: 'rgb(48,111,216)',
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

