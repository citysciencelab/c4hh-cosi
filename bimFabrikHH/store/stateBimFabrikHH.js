/**
 * User type definition
 * @typedef {Object} MapState
 * @property {String[]} supportedDevices list of devices supported
 * @property {String[]} supportedMapModes list of map modes supported
 * @property {String} type type of the BimFabrikHH component
 * @property {String} id - id of BimFabrikHH component
 * @property {String} name - displayed as the title
 * @property {String} description The description that should be shown in the button in the menu.
 * @property {String} icon - icon next to the title
 * @property {Boolean} isVisibleInMenu - if true, tool is selectable in menu (config-param)
 * @property {Boolean} deactivateGFI - flag if tool should deactivate gfi (config-param)
 */


const state = {
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D"],
    type: "bimFabrikHH",
    id: "bimFabrikHH",
    name: "additional:modules.bimfabrikhh.name",
    description: "additional:modules.bimfabrikhh.description",
    icon: "bi-house-gear-fill",
    isVisibleInMenu: true,
    deactivateGFI: true
};

export default state;


