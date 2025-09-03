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
 * @property {Boolean} hasMouseMapInteractions If this attribute is true, then all other modules will be deactivated when this attribute is also true. Only one module with this attribute true may be open at the same time, since conflicts can arise in the card interactions.
 * @property {String} categoriesUrl URL pointing to the categories json
 * @property {String} departmentsUrl URL pointing to the departments json
 * @property {Object[]} categories List of category objects
 * @property {Object[]} departments List of department objects
 * @property {Object[]} geoMarkerFeatureList List of selected feature objects
 * @property {String} geoMarkerWfsFeatureType Feature type of the corresponding WFS layers
 * @property {String} geoMarkerWfsFeatureIdPrefix Feature IDs may contain a prefix, e.g. PREFIX_123.
 * @property {null|Object} geoMarkerFeatureSelected Selected GeoMarker feature
 * @property {String} geoMarkerActiveTab - Id of the current tab to be activated
 * @property {TransactionLayer[]} layerInformation Information about the WFS-T layer used for editing configured for the tool.
 * @property {Feature} newGeoMarkerFeature The newly created GeoMarker feature
 * @property {String} geoMarkerEditLayerId The id of the layer where the drawn features are stored
 * @property {String} selectedInteraction Which map interaction is currently active, if any.
 * @property {String[]} statusOptions - List of possible selections for 'status'
 * @property {Object} filterSelections - settings the user chose for the filter
 * @property {Boolean} initialLoading - only true for initial loading to indicate whether the filter needs to wait for all features loaded
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
    hasMouseMapInteractions: true,
    categoriesUrl: "",
    departmentsUrl: "",
    categories: [],
    departments: [],
    geoMarkerWfsFeatureType: "geomarker",
    geoMarkerWfsFeatureIdPrefix: "DE.HH.UP_GEOMARKER_",
    geoMarkerFeatureList: [],
    geoMarkerFeatureSelected: null,
    geoMarkerActiveTab: "tabFilter",
    // map interactions
    layerInformation: [],
    newGeoMarkerFeature: null,
    geoMarkerEditLayerId: "geomarker_edit",
    selectedInteraction: null,
    // filter settings
    statusOptions: ["offen", "geschlossen", "inaktiv"],
    filterSelections: {
        departmentsSelected: [],
        statusSelected: ["offen"],
        filterValueSource: "",
        filterValueDescr: "",
        filterValueComment: "",
        filterValueId: "",
        categorySelected: [],
        creationDate: {
            from: "",
            to: ""
        },
        closedDate: {
            from: "",
            to: ""
        },
        reminderDate: {
            from: "",
            to: ""
        }
    },
    initialLoading: true
};

export default state;


