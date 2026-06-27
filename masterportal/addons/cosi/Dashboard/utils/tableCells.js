import isObject from "@shared/js/utils/isObject.js";
import mathutils from "../../utils/math";
import {getDistrictByName, getStatisticByCategory} from "../../DistrictSelector/utils/districts";
import Feature from "ol/Feature";

/**
 * Returns the value for the cell.
 * If no value is available, checks whether it can be calculated from existing statistical data.
 * @param {*} item - item
 * @param {*} header - header
 * @param {*} timestamp - year
 * @param {Object[]} districts - All districts of the current level.
 * @param {String} [timestampPrefix="jahr_"] - The string the timestamps start with (e.g. jahr_).
 * @param {String} [locale="de-DE"] The locale to be used for number formatting.
 * @param {Boolean} [raw=false] If true, returns the raw number instead of a localized string.
 * @returns {String|Number} The value as String for the cell or "-" if no value is available. Number if raw=true.
 */
export function getValue (item, header, timestamp, districts, timestampPrefix = "jahr_", locale = "de-DE", raw = false) {
    let val;

    if (!isObject(item)) {
        return "-";
    }

    if (header?.value && item[header.value]) {
        const parsedFloat = parseFloat(item[header.value][String(timestampPrefix) + timestamp]);

        if (Number.isFinite(parsedFloat)) {
            val = raw ? parsedFloat : parsedFloat.toLocaleString(locale, {maximumFractionDigits: 1});
        }
    }

    if (!val && isObject(item.calculation) && item.valueType === "relative" && item[header.value]) {
        const foundDistrict = getDistrictByName(districts, header.value),
            statFeature_A = getStatisticByCategory(foundDistrict, item.calculation.category_A),
            statFeature_B = getStatisticByCategory(foundDistrict, item.calculation.category_B),
            resultFeature = getStatisticByCategory(foundDistrict, item.category);

        let dividend, divisor, result;

        if (statFeature_A instanceof Feature && statFeature_B instanceof Feature) {
            dividend = Number(statFeature_A.get(String(timestampPrefix) + timestamp));
            divisor = Number(statFeature_B.get(String(timestampPrefix) + timestamp));
            result = mathutils[item.calculation.operation](dividend, divisor) * (item.calculation.modifier || 1);
            if (Number.isFinite(result)) {
                val = raw ? result : result.toLocaleString(locale, {minimumFractionDigits: 1, maximumFractionDigits: 1});
                resultFeature.set(timestampPrefix + timestamp, val);
            }
            item[header.value].isCalculated = true;
        }
    }

    return val || "-";
}

/**
 * Returns the class for the cell
 * @param {*} item - item
 * @param {*} header - header
 * @param {*} timestamp - year
 * @returns {String} the class
 */
export function getValueClass (item, header, timestamp) {
    return item[header.value]?.isModified <= timestamp || item[header.value]?.isCalculated ? "modified" : "";
}

/**
 * Returns the tooltip for the cell
 * @param {*} item - item
 * @param {*} header - header
 * @param {*} timestamp - year
 * @returns {String} the tooltip
 */
export function getValueTooltip (item, header, timestamp) {
    return item[header.value]?.isModified <= timestamp ? this.$t("additional:modules.tools.cosi.dashboard.modifiedTooltip") : undefined;
}

/**
 * Returns if the value is calculated or not.
 * @param {Object} item The item.
 * @param {Object} header The header.
 * @returns {Boolean} true if the value is calculated, false if not.
 */
export function isValueCalculated (item, header) {
    if (!isObject(item) || !isObject(header)) {
        return false;
    }
    return item[header.value]?.isCalculated === true;
}
