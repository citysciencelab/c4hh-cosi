<<<<<<< HEAD
import unifyString from "../../utils/unifyString.js";

=======
>>>>>>> 39389637 (add new addons_3_0_0 structure-add missing addons)
export default {
    /**
     * calculates comparable features
     * @param {Array} layerFilterList value
     * @returns {Array} comparable features results
     */
    setComparableFeatures: async function (layerFilterList) {
        const allFeatures = layerFilterList.map(layerFilter => {
<<<<<<< HEAD
=======

>>>>>>> 39389637 (add new addons_3_0_0 structure-add missing addons)
                const id = layerFilter.quotientLayer ?
                    `${layerFilter.layerId}/${layerFilter.quotientLayer}` : layerFilter.layerId;

                return this.propertiesMap[id]
                    .filter(props => props[layerFilter.field] >= layerFilter.value - layerFilter.low
                    && props[layerFilter.field] <= layerFilter.value + layerFilter.high
<<<<<<< HEAD
=======
                    // && props[this.keyOfAttrNameStats] !== this.selectedDistrict // Ich würde das Referenzgebiet nicht aus dem Vergleich ausschließen
>>>>>>> 39389637 (add new addons_3_0_0 structure-add missing addons)
                    && props[this.selectorField].indexOf(this.keyOfAttrNameStats) !== -1);
            }),
            intersection = allFeatures.reduce((a, b) => a.filter(
                x => b.find(y => y[this.keyOfAttrNameStats]
<<<<<<< HEAD
                    === x[this.keyOfAttrNameStats])))
                .sort((a, b) => a.id > b.id ? 1 : -1),
            results = intersection.reduce((res, statObj) => {
                if (!res.resultNames.includes(statObj.id)) {
                    const geom = this.selectedDistrictLevel.districts
                        .find(d => unifyString(statObj.id, false).includes(d.getName()))?.adminFeature.getGeometry();

                    statObj.feature.setGeometry(geom);
                    res.table.push({
                        name: statObj.id,
                        ...allFeatures.map((p, i) => parseFloat(p.find(f => f[this.keyOfAttrNameStats] === statObj.id)[layerFilterList[i].field]))
                    });
                    res.features.push(statObj.feature);
                    res.resultNames.push(statObj.id);
                }

                return res;
            }, {
                resultNames: [],
                features: [],
                table: []
            });

        return results;
=======
                    === x[this.keyOfAttrNameStats]))),
            resultNames = intersection.map(p => p[this.keyOfAttrNameStats])
                .sort().filter((x, i, a) => !i || x !== a[i - 1]), // sort and without duplicates
            table = resultNames.map(n => ({
                name: n,
                ...allFeatures.map((p, i) => parseFloat(p.find(f => f[this.keyOfAttrNameStats] === n)[layerFilterList[i].field]))
            })),
            features = intersection.map(r => r.feature);

        return {
            resultNames,
            features,
            table
        };
>>>>>>> 39389637 (add new addons_3_0_0 structure-add missing addons)
    }
};
