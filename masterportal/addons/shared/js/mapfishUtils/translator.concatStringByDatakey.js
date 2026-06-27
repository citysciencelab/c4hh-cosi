import isObject from "../../../../src/shared/js/utils/isObject.js";
import thousandsSeparator from "../../../../src/shared/js/utils/thousandsSeparator.js";

/**
 * Translator for generating a string with any number of knowledge base value.
 * @param {Object} knowledgeBase The knowledge base to get value from.
 * @param {String|String[]} datakey The format to construct the string from. May be an array of formats.
 * @param {String|Object} defaults If no value is found in the knowledge base instead of defaultValue, this string or object relation should be used.
 * @param {String|Object} defaultValue The default to use for any unset value that is not found in defaults.
 * @param {String} delimitor The separator to use for data sets in case of multiple value in the knowledge base, also the separator for arrays of datakeys.
 * @param {Object} options Options to define how to handle any datakey.
 * @returns {String|Error} A single string or an error if errors where found for this concat in knowledgeBase.
 */
function concatStringByDatakey (knowledgeBase, datakey, defaults, defaultValue, delimitor, options) {
    const error = findPossibleError(knowledgeBase, datakey);

    if (error instanceof Error) {
        return error;
    }
    let result = "";

    if (Array.isArray(datakey)) {
        datakey.forEach(key => {
            if (result) {
                result += delimitor;
            }
            result += concatSingleDatakey(knowledgeBase, key, defaults, defaultValue, delimitor, options);
        });
    }
    else {
        result = concatSingleDatakey(knowledgeBase, datakey, defaults, defaultValue, delimitor, options);
    }

    return result ? result : getDefaultOnEmptyResult(datakey, defaults, defaultValue);
}

/**
 * Sub translator for single datakey only.
 * @param {Object} knowledgeBase The knowledge base to get value from.
 * @param {String|String[]} datakey The format to construct the string from. May be an array of formats.
 * @param {String|Object} defaults If no value is found in the knowledge base instead of defaultValue, this string or object relation should be used.
 * @param {String|Object} defaultValue The default to use for any unset value that is not found in defaults.
 * @param {String} delimitor The separator to use for data sets in case of multiple value in the knowledge base.
 * @param {Object} options Options to define how to handle any datakey.
 * @returns {String} A single string.
 */
function concatSingleDatakey (knowledgeBase, datakey, defaults, defaultValue, delimitor, options) {
    const keys = getKeysFromDataKey(datakey),
        knowledgeFlip = getFlippedKnowledgeBase(knowledgeBase, keys, defaults, defaultValue),
        result = new Set();

    knowledgeFlip.forEach(knowledgeBits => {
        result.add(mergeKnowledgeIntoDatakey(knowledgeBits, datakey, options));
    });

    return [...result].join(delimitor);
}

/**
 * Looks through the structure marked by datakeys in knowledge base, returns an error if any errors where found.
 * @param {Object} knowledgeBase The knowledge base to get value from.
 * @param {String|String[]} datakeys The format to construct the string from. May be an array of formats.
 * @returns {Boolean|Error} false if no error was found, the error if any was found.
 */
function findPossibleError (knowledgeBase, datakeys) {
    if (!Array.isArray(datakeys)) {
        return findPossibleError(knowledgeBase, [datakeys]);
    }
    let error = false;

    datakeys.forEach(datakey => {
        const keys = getKeysFromDataKey(datakey),
            len = keys.length;

        for (let i = 0; i < len; i++) {
            if (knowledgeBase[keys[i]] instanceof Error) {
                error = knowledgeBase[keys[i]];
                return;
            }
        }
    });
    return error;
}

/**
 * Returns the default value if the result would be empty, based on defaults and defaultValue.
 * @param {String|String[]} datakey The format to construct the string from. May be an array of formats.
 * @param {String|Object} defaults If no value is found in the knowledge base instead of defaultValue, this string or object relation should be used.
 * @param {String|Object} defaultValue The default to use for any unset value that is not found in defaults.
 * @returns {String} The resulting default value.
 */
function getDefaultOnEmptyResult (datakey, defaults, defaultValue) {
    if (typeof datakey !== "string") {
        return defaultValue;
    }
    else if (typeof defaults === "string") {
        return defaults;
    }
    const keys = getKeysFromDataKey(datakey);

    if (Array.isArray(keys) && keys.length === 1 && isObject(defaults) && typeof defaults[keys[0]] === "string") {
        return defaults[keys[0]];
    }
    return defaultValue;
}

/**
 * Creates a flipped knowledge base for the given keys.
 * @param {Object} knowledgeBase The knowledge base to get value from.
 * @param {String[]} keys The keys to get the value to flip from knowledgeBase.
 * @param {String|Object} defaults If no value is found in the knowledge base instead of defaultValue, this string or object relation should be used.
 * @param {String|Object} defaultValue The default to use for any unset value that is not found in defaults.
 * @returns {Object[]} An array of Objects with keys and value, each representing one entry of knowledge base arrays (or knowledge base strings).
 */
function getFlippedKnowledgeBase (knowledgeBase, keys, defaults, defaultValue) {
    const maxLen = calcMaxArrayLength(knowledgeBase, keys),
        result = [];

    for (let i = 0; i < maxLen; i++) {
        result[i] = {};
        keys.forEach(key => {
            result[i][key] = Array.isArray(knowledgeBase[key]) ? knowledgeBase[key][i] : knowledgeBase[key];
            if (typeof result[i][key] === "undefined") {
                result[i][key] = isObject(defaults) && typeof defaults[key] === "string" ? defaults[key] : defaultValue;
            }
        });
    }

    return result;
}

/**
 * Calculates the maximal length of value in knowledgeBase, considering all given keys.
 * @param {Object} knowledgeBase The knowledge base to get value from.
 * @param {String[]} keys The keys to lookup and determine the longes array in knowledgeBase.
 * @returns {Number} The maximal length of any knowledgeBase array found at any given key.
 */
function calcMaxArrayLength (knowledgeBase, keys) {
    if (!isObject(knowledgeBase) || !Array.isArray(keys)) {
        return 0;
    }
    let result = 0;

    keys.forEach(key => {
        if (Array.isArray(knowledgeBase[key]) && result < knowledgeBase[key].length) {
            result = knowledgeBase[key].length;
        }
    });
    return result;
}

/**
 * Parses the given datakey and extracts all single datakeys.
 * @param {String} datakey The datakey with single datakeys to parse for.
 * @returns {String[]} An array of single datakeys.
 */
function getKeysFromDataKey (datakey) {
    const parts = getSplittedDatakey(datakey),
        len = parts.length,
        result = [];
    let i = 0;

    if (len === 1) {
        return parts;
    }
    else if (len % 2 === 0) {
        console.error(new Error("getKeysFromDataKey: The given datakey has a syntax problem - empty datakey or missing {{ or }}.", datakey));
        return [];
    }
    for (i = 0; i < len; i++) {
        if (i % 2 === 1) {
            result.push(parts[i]);
        }
    }

    return result;
}

/**
 * Splits the given datakey at positions of {{ and }}.
 * @param {String} datakey A datakey with placeholders {{ and }}.
 * @returns {String[]} All parts of the datakey splitted by {{ and }}.
 */
function getSplittedDatakey (datakey) {
    if (typeof datakey !== "string") {
        return [];
    }
    const pre = "{{",
        post = "}}";

    return datakey.replaceAll(pre, post).split(post);
}

/**
 * Replaces placeholders in datakey with the value from knowledgeBits.
 * @param {Object} knowledgeBits An object with key value where key is the single datakey and value is the replacement.
 * @param {String} datakey A datakey with placeholders for the replacements in knowledgeBits.
 * @param {Object} options Options to define how to handle any datakey.
 * @returns {String} The datakey where placeholders are replaced by value.
 */
function mergeKnowledgeIntoDatakey (knowledgeBits, datakey, options) {
    if (typeof datakey !== "string" || !isObject(knowledgeBits)) {
        return "";
    }
    let result = datakey;
    const pre = "{{",
        post = "}}";

    Object.entries(knowledgeBits).forEach(([key, value]) => {
        const formatedValue = formatValue(value, isObject(options) ? options[key] : undefined);

        if (key === datakey) {
            result = result.replace(key, formatedValue);
        }
        else {
            result = result.replaceAll(pre + key + post, formatedValue);
        }
    });

    return result;
}

/**
 * Formats the given value if options are given.
 * @param {*} value The value to format.
 * @param {Object} [options] The options which define how to format the value.
 * @param {String} [options.type] The type to interpret value e.g. Number.
 * @param {Number} [options.decimals] Decimals to use if type is Number.
 * @param {Object} [options.thousandsSeparator] Describes the way thousands separation is used.
 * @param {String} [options.thousandsSeparator.delimAbs] The letter(s) to use as thousand point.
 * @param {String} [options.thousandsSeparator.delimDec] The letter(s) to use as decimal point.
 * @returns {*} The formated value.
 */
function formatValue (value, options) {
    if (options?.type === "Number") {
        return formatValueNumber(value, options);
    }
    return value;
}

/**
 * Formats the given value for type Number.
 * @param {*} value The value to format.
 * @param {Object} [options] The options which define how to format the value.
 * @param {Number} [options.decimals] Decimals to use.
 * @param {Boolean} [options.thousandsSeparator] true if thousandsSeparator should be used.
 * @param {String} [options.thousandsSeparator.delimAbs] The letter(s) to use as thousand point.
 * @param {String} [options.thousandsSeparator.delimDec] The letter(s) to use as decimal point.
 * @param {String} [options.postfix] postfix of the value.
 * @returns {String} The formated value.
 */
function formatValueNumber (value, options) {
    let saveValue = 0;

    if (typeof value === "number") {
        saveValue = value;
    }
    else if (typeof value === "string") {
        if (value.indexOf(".") !== -1 && value.indexOf(".") > value.indexOf(",")) {
            saveValue = parseFloat(value.replaceAll(",", ""));
        }
        else {
            saveValue = parseFloat(value.replaceAll(".", "").replace(",", "."));
        }
    }
    else if (typeof value === "boolean") {
        saveValue = value ? 1 : 0;
    }
    else {
        saveValue = 0;
    }

    if (isNaN(saveValue)) {
        saveValue = 0;
    }

    if (typeof options?.decimals === "number") {
        saveValue = saveValue.toFixed(options.decimals);
    }

    if (typeof options?.thousandsSeparator?.delimAbs === "string" && typeof options?.thousandsSeparator?.delimDec === "string") {
        saveValue = thousandsSeparator(saveValue, options.thousandsSeparator.delimAbs, options.thousandsSeparator.delimDec);
    }

    if (typeof options?.postfix === "string") {
        saveValue = String(saveValue) + options.postfix;
    }

    return String(saveValue);
}


export {
    concatStringByDatakey,
    concatSingleDatakey,
    findPossibleError,
    getDefaultOnEmptyResult,
    getFlippedKnowledgeBase,
    calcMaxArrayLength,
    getKeysFromDataKey,
    getSplittedDatakey,
    mergeKnowledgeIntoDatakey,
    formatValue,
    formatValueNumber
};
