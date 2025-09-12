/**
 * User type definition
 * @typedef {Object} MapState
 * @property {String} id - id of the component
 * @property {String} type type of the component
 * @property {String} name - displayed as the title
 * @property {String} description The description that should be shown in the button in the menu.
 * @property {String} icon - icon next to the title
 * @property {Boolean} isVisibleInMenu - if true, tool is selectable in menu (config-param)
 * @property {Boolean} deactivateGFI - flag if tool should deactivate gfi (config-param)
 * @property {String[]} supportedDevices list of devices supported
 * @property {String[]} supportedMapModes list of map modes supported
 */

const state = {
    id: "geoMarker",
    type: "geoMarker",
    name: "additional:modules.geoMarker.name",
    description: "additional:modules.geoMarker.description",
    icon: "bi-pin-map",
    isVisibleInMenu: true,
    deactivateGFI: true,
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D"],
    categoriesUrl: "",
    departmentsUrl: "",
    categories: [],
    departments: []
};

export default state;


