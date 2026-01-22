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
 * @property {String} geomarkerEditLayerUrl The source Url for Layer to update and get
 * @property {String|null} geoMarkerUpdateLayerIds - The id(s) of the layer(s) which contain the selected GeoMarker feature
 * @property {Object|null} updateGeoMarkerFeature - The GeoMarker feature being updated
 * @property {Object|null} rollbackGeoMarkerFeature - The feature to roll back to
 * @property {String|null} selectedInteraction - Which map interaction is currently active, if any.
 * @property {Object|null} drawInteraction - The current draw interaction object
 * @property {Object|null} drawLayer - Temporary layer used for drawing features
 * @property {Object|null} modifyInteraction - The current modify interaction object
 * @property {Object|null} selectInteraction - The current select interaction object
 * @property {Object|null} translateInteraction - The current translate interaction object
 * @property {Object} currentlyLockedFeature - The currently locked GeoMarker feature and some information on timeouts to release or renew the lock
 * @property {String[]} statusOptions - List of possible selections for 'status'
 * @property {Object} filterSelections - settings the user chose for the filter
 * @property {Boolean} initialLoading - only true for initial loading to indicate whether the filter needs to wait for all features loaded
 * @property {Boolean} newGeoMarkerCreated - after a geomarker created, it is true, and used in tablistContent to show the geomarker as selected.
 * @property {Boolean} isFilterApplied - after filter is applied it becomes true. It is used in geoMarkerForm to set the filter again after a new geomarker created.
 * @property {String|null} scrollToGeoMarkerId - this holds the id of the geomarker to scroll to it in the list.
 * @property {Number} listScrollTop - holds the scroll position of the list to restore it when needed
 * @property {Number|null} reloadIntervalId - holds the interval ID for reloading GeoMarker features periodically
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
    geomarkerEditLayerUrl: "",
    geoMarkerUpdateLayerIds: null,
    geoMarkerUpdateFeature: null,
    triggerFilter: false,
    rollbackGeoMarkerFeature: null,
    selectedInteraction: null,
    drawInteraction: null,
    drawLayer: null,
    modifyInteraction: null,
    selectInteraction: null,
    translateInteraction: null,
    currentlyLockedFeature: {
        featureId: null,
        lockId: null,
        lockRefreshTimeStamp: null,
        lockRefreshTimeoutId: null,
        lockMaxTimeStamp: null,
        expiration: 300
    },
    // filter settings
    statusOptions: ["offen", "geschlossen", "inaktiv"],
    filterSelections: {
        departmentsSelected: [],
        statusSelected: [],
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
        },
        geom: null
    },
    isFilterApplied: false,
    initialLoading: true,
    newGeoMarkerCreated: false,
    scrollToGeoMarkerId: null,
    listScrollTop: 0,
    reloadIntervalId: null
};

export default state;


