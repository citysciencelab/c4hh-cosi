import {concatStringByDatakey} from "./translator.concatStringByDatakey";
import {getFixedMap} from "./translator.getFixedMap";
import {getProportionMap} from "./translator.getProportionMap";
import {getWalkerMap} from "./translator.getWalkerMap";
import {mergeObjectsByDatakey} from "./translator.mergeObjectsByDatakey";

/**
 * Creates the mapfish dialog from the transformer configuration and the knowledge base.
 * @param {Object} parcel - The parcel data.
 * @param {Number[]} parcel.center - The parcel center.
 * @param {ol/extent} parcel.extent - The extent of the parcel.
 * @param {ol/Feature} parcel.feature - The ol feature of the parcel.
 * @param {ol/geom/Polygon} parcel.geometry - The geometry of the parcel.
 * @param {Object} knowledgeBase - The knowledge base.
 * @param {Object} transformer - The configuration of the transformer.
 * @param {String} defaultValue - Used when nothing is present or nothing was found.
 * @param {String} mapProjection - The EPSG-Code of the current map projection.
 * @param {String} outputFilename - The output filename of the pdf (without extension).
 * @returns {Object} The mapfish dialog.
 */
export function createMapfishDialog (parcel, knowledgeBase, transformer, defaultValue, mapProjection, outputFilename) {
    const mapfishDialog = {},
        defaultDelimitor = ", ";

    Object.entries(transformer).forEach(([prefix, obj]) => {
        Object.entries(obj).forEach(([postfix, transformerConfig]) => {
            if (transformerConfig.type === "mapWalker") {
                mapfishDialog[prefix + "." + postfix] = getWalkerMap(parcel?.feature, parcel?.center, mapProjection, transformerConfig.style, transformerConfig.scale, transformerConfig.layerIds, transformerConfig.dpi);
            }
            else if (transformerConfig.type === "mapProportion") {
                mapfishDialog[prefix + "." + postfix] = getProportionMap(parcel?.feature, parcel?.extent, mapProjection, transformerConfig.style, transformerConfig.proportion, transformerConfig.layerIds, transformerConfig.dpi);
            }
            else if (transformerConfig.type === "mapFixed") {
                mapfishDialog[prefix + "." + postfix] = getFixedMap(parcel?.center, mapProjection, transformerConfig.style, transformerConfig.bbox, transformerConfig.layerIds, transformerConfig.dpi);
            }
            else if (transformerConfig.type === "concat") {
                const resultConcat = concatStringByDatakey(knowledgeBase, transformerConfig.datakey, transformerConfig.default, defaultValue, transformerConfig.delimitor ? transformerConfig.delimitor : defaultDelimitor, transformerConfig.options);

                if (!(resultConcat instanceof Error)) {
                    mapfishDialog[prefix + "." + postfix] = resultConcat;
                }
            }
            else if (transformerConfig.type === "iterator") {
                if (!(knowledgeBase[transformerConfig.datakey] instanceof Error) && typeof transformerConfig?.idx === "number") {
                    if (typeof knowledgeBase[transformerConfig.datakey] !== "undefined" && knowledgeBase[transformerConfig.datakey].length > transformerConfig.idx) {
                        const diffLength = knowledgeBase[transformerConfig.datakey].length - transformerConfig.idx + 1;

                        knowledgeBase[transformerConfig.datakey].splice(transformerConfig.idx);
                        knowledgeBase[transformerConfig.datakey][transformerConfig.idx - 1] = typeof transformerConfig.warning !== "undefined" ? diffLength + transformerConfig.warning : "";
                    }
                    for (let idx = 0; idx < transformerConfig.idx; idx++) {
                        if (Array.isArray(knowledgeBase[transformerConfig.datakey]) && typeof knowledgeBase[transformerConfig.datakey][idx] !== "undefined") {
                            mapfishDialog[prefix + "." + postfix + "." + idx] = knowledgeBase[transformerConfig.datakey][idx];
                        }
                        else {
                            mapfishDialog[prefix + "." + postfix + "." + idx] = typeof transformerConfig?.default === "string" ? transformerConfig.default : defaultValue;
                        }
                    }
                }
            }
            else if (transformerConfig.type === "datasource") {
                mapfishDialog[prefix + "." + postfix] = mergeObjectsByDatakey(transformerConfig.datakey, knowledgeBase, defaultValue, transformerConfig.options);
            }
            else {
                mapfishDialog[prefix + "." + postfix] = transformerConfig.content;
            }
        });
    });

    return {
        layout: "A4 Hochformat",
        attributes: mapfishDialog,
        outputFilename
    };
}
