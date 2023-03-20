// /**
//  * Stores a district's original statistical data in its properties for later use
//  * @param {module:ol/Feature} feature - the feature whose data to store for later
//  * @returns {void}
//  */
// export default function storeOriginalDistrictStats (feature) {
//     if (!feature.get("originalData")) {
//         feature.set("originalData", {
//             stats: feature.get("stats")?.map(f => f.clone())
//         });
//     }
// }
