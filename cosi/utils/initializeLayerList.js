import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import defaults from "@masterportal/masterportalapi/src/defaults";

/**
 *
 * @export
<<<<<<< HEAD
 * @param {Object} [layerConf=defaults.layerConf] - recreates the initialization of the layerList from masterportal
=======
 * @param {Object} [layerConf=defaults.layerConf] -
>>>>>>> 39389637 (add new addons_3_0_0 structure-add missing addons)
 * @return {Promise} -
 */
export async function initializeLayerList (layerConf = defaults.layerConf) {
    return new Promise((resolve, reject) => {
        try {
            rawLayerList.initializeLayerList(layerConf, () => {
                resolve();
            });
        }
        catch (err) {
            reject(err);
        }
    });
<<<<<<< HEAD
=======

>>>>>>> 39389637 (add new addons_3_0_0 structure-add missing addons)
}
