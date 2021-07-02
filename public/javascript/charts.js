import { createItemCountChart, getItemCountChartData } from './charts/itemCountChart.js';

(async () => {
    createItemCountChart(await getItemCountChartData());
})();