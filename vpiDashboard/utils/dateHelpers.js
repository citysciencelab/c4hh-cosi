import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import {Config} from "../config.js";

dayjs.extend(isBetween);

/**
 * @param {Object} date The date what should be changed
 * @return {string} The new formatted string MM-YYYY
 */
function changeDateFormat (date) {
    const theDate = new Date(date),
        year = theDate.getFullYear(),
        month = theDate.getMonth() + 1;

    return `${month.toString().padStart(2, "0")}-${year}`;
}
/**
 * Returns a function which sets the disabled dates for the datepicker
 * only allow past dates, at least 3 days ago but not longer than 01.01.2024 and only allow the range of given duration in weeks
 * @param {Number} weekRange selectable range in weeks from the current selected date
 * @return {Function} tells if the date shall be disabled or not
 */
function disabledDates (weekRange = 52) {
    return (val, currentDate) => {
        let enabledDuration = true;

        if (currentDate.length === 1) {
            const duration = dayjs.duration(weekRange, "weeks");

            enabledDuration = dayjs(val).isBetween(dayjs(currentDate).add(duration), dayjs(currentDate).subtract(duration), "days", "[]");
        }

        return new Date(val).getTime() > new Date(Config.lastSelectableDate).getTime() || !enabledDuration || new Date(val).getTime() < new Date(Config.firstSelectableDate).getTime();
    };
}

export {changeDateFormat, disabledDates};
