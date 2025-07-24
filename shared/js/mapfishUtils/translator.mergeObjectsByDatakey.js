import isObject from "../../../../src/shared/js/utils/isObject.js";
import {formatValue} from "./translator.concatStringByDatakey.js";

/**
 * Translator to merge multiple arrays of objects from the knowledge base in one array.
 * @param {String[]} datakey - An array of formats to construct the array from.
 * @param {Object} knowledgeBase - The knowledge base to get value from.
 * @param {String} defaultValue - The default value to use for any unset value.
 * @param {Object} options Options to define how to handle any datakey.
 * @returns {Object[]} The merged objects or an empty array.
 */
function mergeObjectsByDatakey (datakey, knowledgeBase, defaultValue, options) {
    const mergedObjects = [];

    if (!Array.isArray(datakey)) {
        console.error(`addons/valuationPrint/utils/translator.mergeObjectsByDatakey: datakey is ${datakey}, but it has to be an array`);
        return mergedObjects;
    }

    if (!isObject(knowledgeBase)) {
        console.error(`addons/valuationPrint/utils/translator.mergeObjectsByDatakey: knowledgeBase is ${knowledgeBase}, but it has to be an object`);
        return mergedObjects;
    }

    if (typeof defaultValue !== "string") {
        console.error(`addons/valuationPrint/utils/translator.mergeObjectsByDatakey: defaultValue is ${defaultValue}, but it has to be a string`);
        return mergedObjects;
    }

    datakey.forEach(key => {
        if (Array.isArray(knowledgeBase[key])) {
            knowledgeBase[key].forEach(obj => {
                for (const prop in obj) {
                    const optionKey = key + "." + prop;

                    if (typeof obj[prop] === "undefined") {
                        obj[prop] = defaultValue;
                    }
                    else if (typeof options !== "undefined" && Object.prototype.hasOwnProperty.call(options, optionKey)) {
                        obj[prop] = formatValue(obj[prop], options[optionKey]);
                    }
                }
            });

            mergedObjects.push(...knowledgeBase[key]);
        }
    });

    return mergedObjects;
}

export {
    mergeObjectsByDatakey
};
