// @ts-check
import isObject from "./isObject.js";
import localeCompare from "./localeCompare.js";

/**
 * @import {DropdownItem} from "@shared/modules/dropdown/types/typesDropdown.js"
 */

/**
 * Gets the key of a dropdown item or a selected value to match them against each other.
 * Objects are identified by their value, or by their title if they have no value.
 * @param {*} item The dropdown item or selected value.
 * @returns {*} The key of the item.
 */
function getItemKey (item) {
    if (isObject(item)) {
        return item.value ?? item.title;
    }
    return item;
}

/**
 * Finds the dropdown item that matches the selected value.
 * @param {Array} items The dropdown items.
 * @param {*} value The selected value or selected item.
 * @returns {*} The matching item or undefined.
 */
function findItem (items, value) {
    return items.find(item => getItemKey(item) === getItemKey(value));
}

/**
 * Gets the displayed title of a dropdown item.
 * @param {*} item The dropdown item.
 * @param {string} [itemTitle="title"] The property that contains the title.
 * @returns {string} The title of the item.
 */
function getItemTitle (item, itemTitle = "title") {
    if (isObject(item)) {
        return String(item[itemTitle] ?? "");
    }
    return String(item ?? "");
}

/**
 * Checks whether a dropdown item is pinned and has to stay in front of the other items.
 * @param {DropdownItem} item The dropdown item.
 * @returns {boolean} True if the item is pinned.
 */
function isPinned (item) {
    return item?.pinned === true;
}

/**
 * Checks whether the items are grouped by subheaders or dividers, which must not be reordered.
 * @param {Array} items The dropdown items.
 * @returns {boolean} True if the items are grouped.
 */
function isGrouped (items) {
    return items.some(item => item?.type === "subheader" || item?.type === "divider");
}

/**
 * Compares two dropdown items: pinned items first, then alphabetically by title in the current language.
 * Numbers within the titles are compared numerically, case and accents are ignored.
 * @param {*} a The first dropdown item.
 * @param {*} b The second dropdown item.
 * @param {string} [itemTitle="title"] The property that contains the title.
 * @returns {number} The sort order.
 */
export function compareDropdownItems (a, b, itemTitle = "title") {
    if (isPinned(a) !== isPinned(b)) {
        return isPinned(a) ? -1 : 1;
    }
    if (isPinned(a)) {
        return 0;
    }
    return localeCompare(getItemTitle(a, itemTitle), getItemTitle(b, itemTitle), i18next.language, {numeric: true, sensitivity: "base"});
}

/**
 * Sorts dropdown items alphabetically. Pinned items are placed first.
 * Grouped items (subheaders, dividers) are returned in their original order.
 * @param {Array} items The dropdown items, usually strings or {@link DropdownItem}.
 * @param {Object} [options={}] The sort options.
 * @param {Array} [options.selectedValues=[]] The selected values or selected items.
 * @param {boolean} [options.selectedFirst=false] Places the selected items in front of the not selected items.
 * @param {string} [options.itemTitle="title"] The property that contains the title.
 * @returns {Array} A new sorted list.
 */
export function sortDropdownItems (items, {selectedValues = [], selectedFirst = false, itemTitle = "title"} = {}) {
    if (!Array.isArray(items) || !items.length) {
        return [];
    }
    if (isGrouped(items)) {
        return [...items];
    }

    const selectedKeys = selectedFirst && Array.isArray(selectedValues) ? selectedValues.map(getItemKey) : [],
        selectedItems = items.filter(item => selectedKeys.includes(getItemKey(item))),
        notSelectedItems = items.filter(item => !selectedKeys.includes(getItemKey(item)));

    return [
        ...selectedItems.sort((a, b) => compareDropdownItems(a, b, itemTitle)),
        ...notSelectedItems.sort((a, b) => compareDropdownItems(a, b, itemTitle))
    ];
}

/**
 * Sorts the selected values by the titles of their dropdown items, e.g. to show the chips in alphabetical order.
 * Pinned items are placed first, selected values without a matching item are appended unchanged.
 * @param {Array} items The dropdown items, usually strings or {@link DropdownItem}.
 * @param {Array} selectedValues The selected values or selected items.
 * @param {string} [itemTitle="title"] The property that contains the title.
 * @returns {Array} A new sorted list of the selected values.
 */
export function sortSelectedValues (items, selectedValues, itemTitle = "title") {
    if (!Array.isArray(selectedValues) || !selectedValues.length) {
        return [];
    }

    const itemList = Array.isArray(items) ? items : [],
        knownValues = selectedValues.filter(value => findItem(itemList, value) !== undefined),
        unknownValues = selectedValues.filter(value => findItem(itemList, value) === undefined);

    return [
        ...knownValues.sort((a, b) => compareDropdownItems(findItem(itemList, a), findItem(itemList, b), itemTitle)),
        ...unknownValues
    ];
}

export default sortDropdownItems;
