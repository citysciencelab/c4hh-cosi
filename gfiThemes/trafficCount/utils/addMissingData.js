import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import advancedFormat from "dayjs/plugin/advancedFormat";

dayjs.extend(isoWeek);
dayjs.extend(advancedFormat);

/**
 * adds new entries with value null in a single day dataset where time slots are missing
 * @pre the given timeData might have gaps
 * @post the given timeData has no gaps and the seconds are zeroed
 * @param {String} from the starting date based on the calender as "YYYY-MM-DD HH:mm:ss"
 * @param {Object} timeData a single dataset object{date: value}
 * @param {Number} [minutes=15] the minutes (should fit an hour) to split an hour into (default: 15 minutes)
 * @returns {Object}  a new dataset object{date: value} without any gaps in the timeline
 */
export function addMissingDataDay (from, timeData, minutes = 15) {
    const zeroedData = {},
        result = {},
        datePrefix = dayjs(from, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD "),
        hourParts = Math.floor(60 / Math.max(1, minutes));
    let h,
        m,
        key;

    for (key in timeData) {
        zeroedData[dayjs(key, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:00")] = timeData[key];
    }

    // add missing datasets
    for (h = 0; h < 24; h++) {
        for (m = 0; m < hourParts; m++) {
            key = datePrefix + String(h).padStart(2, "0") + ":" + String(m * minutes).padStart(2, "0") + ":00";

            if (Object.prototype.hasOwnProperty.call(zeroedData, key)) {
                result[key] = zeroedData[key];
            }
            else {
                result[key] = null;
            }
        }
    }

    return result;
}

/**
 * adds new entries with value null in a single week dataset where time slots are missing
 * @pre the given timeData might have gaps
 * @post the given timeData has no gaps and the seconds are zeroed
 * @param {String} from the starting date based on the calender as "YYYY-MM-DD HH:mm:ss"
 * @param {Object} timeData a single dataset object{date: value}
 * @returns {Object}  a new dataset object{date: value} without any gaps in the timeline
 */
export function addMissingDataWeek (from, timeData) {
    const zeroedData = {},
        result = {};
    let wd,
        key;

    for (key in timeData) {
        zeroedData[dayjs(key, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:00")] = timeData[key];
    }

    // add missing datasets
    for (wd = 1; wd <= 7; wd++) {
        key = dayjs(from, "YYYY-MM-DD HH:mm:ss").isoWeekday(wd).format("YYYY-MM-DD HH:mm:00");

        if (Object.prototype.hasOwnProperty.call(zeroedData, key)) {
            result[key] = zeroedData[key];
        }
        else {
            result[key] = null;
        }
    }

    return result;
}

/**
 * adds new entries with value null in a single year dataset where time slots are missing
 * @pre the given timeData might have gaps
 * @post the given timeData has no gaps and the seconds are zeroed
 * @param {(String|Number)} year the year to cover based on the calender as "YYYY"
 * @param {Object} timeData a single dataset object{date: value}
 * @returns {Object}  a new dataset object{date: value} without any gaps in the timeline
 */
export function addMissingDataYear (year, timeData) {
    const zeroedData = {},
        result = {};
        // set objMoment to the first thursday (00:00:00) of the year, as the first thursday of january is always in the first calendar week of the year

    let key,
        objMoment = dayjs(String(year), "YYYY-W").add(2, "day");

    for (key in timeData) {
        zeroedData[dayjs(key, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:00")] = timeData[key];
    }

    // add missing datasets
    // objMoment is always thursday of the week, as only the last thursday of the year is always in the current year
    while (objMoment.format("YYYY") === String(year) || (objMoment.format("YYYY") === String(Number(year) + 1) && objMoment.format("MM") === "01" && Number(objMoment.format("DD").charAt(1)) <= 7)) {
        key = objMoment.isoWeekday(1).format("YYYY-MM-DD HH:mm:00");
        if (Object.prototype.hasOwnProperty.call(zeroedData, key)) {
            result[key] = zeroedData[key];

        }
        else {
            result[key] = null;
        }

        objMoment = objMoment.add(1, "week");
    }

    return result;
}

export default {addMissingDataDay, addMissingDataWeek, addMissingDataYear};
