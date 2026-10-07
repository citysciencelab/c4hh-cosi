/**
 * User type definition
 * @typedef {Object} potentialDamagedBuilding
 * @property {String} id - Id of the component.
 * @property {String} type type of the component.
 * @property {String} name - Displayed as title.
 * @property {String} icon - Icon next to title.
 * @property {Array} itemList - List of items representing potential damaged building layers.
 */
const state = {
    hasMouseMapInteractions: true,
    icon: "bi-building",
    id: "potentialDamagedBuilding",
    itemList: [
        {
            "name": "Gebäude",
            "selected": true,
            "wfstConfig": undefined,
            "wfstId": "36014",
            "wmsId": "36477",
            "wmsLayer": undefined
        },
        {
            "name": "Unterirdische Bauwerke",
            "selected": false,
            "wfstConfig": undefined,
            "wfstId": "36015",
            "wmsId": "36479",
            "wmsLayer": undefined
        }
    ],
    name: "additional:modules.potentialDamagedBuilding.title",
    type: "potentialDamagedBuilding"
};

export default state;
