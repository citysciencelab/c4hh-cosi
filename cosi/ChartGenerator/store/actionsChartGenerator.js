import generateGraphData from "../utils/generateGraphData";

/**
 *
 * @param {*} newDatasets newDatasets
 * @return {void}
 */
function addDatasets ({commit, getters}, newDatasets) {
    const
        datasets = [...getters.datasets],
        chartConfigs = [...getters.chartConfigs];
    let chartConfig;

    for (const dataset of newDatasets) {
        if (!dataset.cgid) {
            dataset.cgid = dataset.id + "-" + dataset.name;
        }

        const checkDouble = datasets.find(x => x.cgid === dataset.cgid);

        if (checkDouble) {
            const index = datasets.indexOf(checkDouble);

            datasets.splice(index, 1);
            chartConfigs.splice(index, 1);
        }

        if (dataset.target === "" || dataset.target === undefined || dataset.target === null) {
            commit("setActive", true);
        }

        if (Array.isArray(dataset.type)) {
            if (!dataset.sub_graph) {
                dataset.sub_graph = 0;
            }

            chartConfig = dataset.type.map(type => generateGraphData(dataset, type));
        }
        else {
            chartConfig = generateGraphData(dataset, dataset.type);
        }

        chartConfigs.push(chartConfig);
        datasets.push(dataset);
    }
    commit("setChartConfigs", chartConfigs);
    commit("setDatasets", datasets);
}

const actions = {
    async channelGraphData ({commit, getters}, dataset) {
        if (Array.isArray(dataset)) {
            addDatasets({commit, getters}, dataset);
        }
        else {
            addDatasets({commit, getters}, [dataset]);
        }
    }
};

export default actions;
