import { createItemCountChart, getItemCountChartData } from './charts/itemCountChart.js';
import { createStudyTimeByBoardsChart, getStudyTimeByBoardsData } from './charts/studyTimeByBoardsChart.js';
import { createNoOfDaysSinceLastSessionChart, getNoOfDaysSinceLastSessionChartData } from './charts/daysSinceLastStudySession.js';

(async () => {
    createItemCountChart(await getItemCountChartData());
})();

(async () => {
    createStudyTimeByBoardsChart(await getStudyTimeByBoardsData());
})();

(async () => {
    createNoOfDaysSinceLastSessionChart(await getNoOfDaysSinceLastSessionChartData());
})();