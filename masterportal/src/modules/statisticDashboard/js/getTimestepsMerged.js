// @ts-check
/**
 * @import {DropdownItem} from "@shared/modules/dropdown/types/typesDropdown.js"
 * @import {TimeStepsFilter} from "../types/typesStatisticDashboard"
 */

import dayjs from "dayjs";
import isObject from "@shared/js/utils/isObject.js";
import sortBy from "@shared/js/utils/sortBy.js";

/**
 * Gets the time steps for the filter. It merges the unique list with the configured time steps, if provided.
 * @param {TimeStepsFilter} timeSteps The time steps object with {Number: Label}.
 * @param {Record<string, true>} uniqueList The list of unique time values as an object with {value: true}.
 * @param {string} inputFormat The input format for the date.
 * @param {string} outputFormat The format to transform the date to.
 * @returns {DropdownItem[]} The merged time steps.
 */
function getTimestepsMerged (timeSteps, uniqueList, inputFormat, outputFormat) {
    let /** @type {DropdownItem[]} */
        result = [],

        /** @type {string[]} */
        uniqueListAsArray = [];

    if (isObject(uniqueList)) {
        uniqueListAsArray = Object.keys(uniqueList);
        uniqueListAsArray.forEach(uniqueTime => {
            result.push({value: uniqueTime, title: dayjs(uniqueTime, inputFormat).format(outputFormat)});
        });
    }
    if (isObject(timeSteps)) {
        Object.entries(timeSteps).forEach(([key, value]) => {
            const uniqueTime = key === "all" ? uniqueListAsArray : uniqueListAsArray.slice(Number(`-${key}`));

            if (Array.isArray(uniqueTime) && uniqueTime.length) {
                result.push({value: uniqueTime, title: value});
            }
        });
    }

    result = sortBy(result, "title").reverse();

    return result;
}

export default getTimestepsMerged;
