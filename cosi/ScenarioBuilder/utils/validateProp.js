import typesMapping from "../../assets/mapping.types.json";

const rules = {
    required: [
        value => Boolean(value) || "Erforderlich"
    ],
    number: [
        value => !isNaN(parseFloat(value)) || "Wert muss eine Zahl sein. Kommastellen müssen mit Punkt abgetrennt werden"
    ],
    string: [], // add rules for strings
    date: [], // add rules for dates
    geom: [], // no rules for geometry
    boolean: [
        value => typeof JSON.parse(value) === "boolean" || "Wert muss 'true' oder 'false' sein."
    ]
};

/**
 * Checks whether the current field is relevant in the context and thus required
 * @param {Object} field - the field definition from WFS
 * @param {String} layerMap the layerMapping info of the working layer
 * @returns {Boolean} is relevant field?
 */
export function compareLayerMapping (field, layerMap) {
    if (field.name === layerMap.keyOfAttrName) {
        return true;
    }
    if (field.name === layerMap.categoryField) {
        return true;
    }

    return false;
}

/**
 * Returns the validation rules for the given data type
 * @param {String} field the field description
 * @param {String} layerMap the layerMapping info of the working layer
 * @returns {Function[]} the rule set for the data type
 */
export default function validateProp (field, layerMap) {
    const baseRule = parseInt(field.minOccurs, 10) > 0 || compareLayerMapping(field, layerMap) ? rules.required : [],
        type = typesMapping[field.type],
        typeRules = rules[type] || [];

    return [...baseRule, ...typeRules];
}
