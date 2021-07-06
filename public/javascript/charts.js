import { createItemCountChart, getItemCountChartData } from './charts/itemCountChart.js';
import { createStudyTimeByBoardsChart, getStudyTimeByBoardsData } from './charts/studyTimeByBoardsChart.js';

(async () => {
    createItemCountChart(await getItemCountChartData());
})();

(async () => {
    createStudyTimeByBoardsChart(await getStudyTimeByBoardsData());
})();