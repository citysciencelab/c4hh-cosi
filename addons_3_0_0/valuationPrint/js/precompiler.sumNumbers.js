import {createAttributesByFeatures} from "./createKnowledgeBase";

/**
 * A function to return a sum of numbers from the propertyName
 * @param {ol/Feature[]} features An array of features to generate the attributes
 * @param {String} knowledgeBaseKey The key to use for sum in the result.
 * @param {String} knowledgeBaseSum The property name from which to get the value.
 * @param {String[]} propertyName All attribute that should be additionally put into the result.
 * @param {Function} onsuccess A function function(data) with data as the resulting entry for the knowledge base.
 * @param {Function} onerror A function to call on error as function(error) with error an instance of Error.
 * @returns {void}
 */
export default function sumNumbers (features, knowledgeBaseKey, knowledgeBaseSum, propertyName, onsuccess, onerror) {
    if (!Array.isArray(features)) {
        if (typeof onerror === "function") {
            onerror(new Error("sumNumbers: features is not an array"));
        }
        return;
    }
    else if (typeof knowledgeBaseKey !== "string") {
        if (typeof onerror === "function") {
            onerror(new Error("sumNumbers: the key to be summed is needed"));
        }
        return;
    }
    else if (typeof knowledgeBaseSum !== "string") {
        if (typeof onerror === "function") {
            onerror(new Error("sumNumbers: the propertyName to be summed is needed"));
        }
        return;
    }
    else if (!Array.isArray(propertyName)) {
        if (typeof onerror === "function") {
            onerror(new Error("sumNumbers: the propertyName should be in an array"));
        }
        return;
    }
    else if (!features.length) {
        if (typeof onsuccess === "function") {
            onsuccess({});
        }
        return;
    }

    const result = createAttributesByFeatures(features, propertyName);

    if (propertyName.includes(knowledgeBaseSum)) {
        result[knowledgeBaseKey] = 0;

        if (typeof result[knowledgeBaseSum] === "string") {
            result[knowledgeBaseKey] = result[knowledgeBaseSum];
        }
        else if (Array.isArray(result[knowledgeBaseSum])) {
            result[knowledgeBaseSum].forEach(value => {
                result[knowledgeBaseKey] += parseFloat(value);
            });
            result[knowledgeBaseKey] = [String(result[knowledgeBaseKey])];
        }
    }

    if (typeof onsuccess === "function") {
        onsuccess(result);
    }
}
