import {mean, median} from "./math";

/** If parameters of a facility dataset is inconsistent, this function provides the average value from all other facilities.
* @param {Number[]} dataArray Of Objects containing data to be checked for lacking data sets.
* @param {String} [strategy="median"] The strategy that will be used for filling in the empty data. Can be "median" or "mean"
* @returns {Object[]} Array of complete/fixed Data.
*/
export default function compensateLackingData (dataArray, strategy = "median") {
    const completeData = [],
        incompleteData = [];
    let avg;

    if (dataArray.length === 0) {
        return {
            data: [],
            incompleteDatasets: 0,
            totalDatasets: 0
        };
    }

    dataArray.forEach(dataset => {
        if (dataset === undefined || dataset === "") {
            incompleteData.push(dataset);
        }
        else {
            completeData.push(dataset);
        }
    });

    if (completeData.length === 0) {
        return "error";
    }

    if (incompleteData.length > 0) {
        if (strategy === "mean") {
            avg = mean(completeData);
        }
        else {
            avg = median(completeData);
        }

        for (let i = 0; i < incompleteData.length; i++) {
            completeData.push(avg);
        }
    }

    return {
        data: completeData,
        incompleteDatasets: incompleteData.length,
        totalDatasets: completeData.length
    };
}
