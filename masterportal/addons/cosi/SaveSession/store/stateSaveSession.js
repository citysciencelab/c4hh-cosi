/**
 * User type definition
 * @typedef {Object} DistrictSelectorState
 * @property {Boolean} [active=false] - Is activated (will rendered) or not (config-param).
 * @property {Boolean} [deactivateGFI=false] - Deactivates the gfi if true (config-param).
 * @property {String} [icon="bi-save"] - Bootstrap icon class (config-param).
 * @property {String} id - The id of the district selector component.
 * @property {String} [name="Sitzung speichern"] - The name of the tool (config-param).
 * @property {String[]} defaultActiveLayerIds - the default active layer Ids in COSI.
 */
const state = {
    active: false,
    deactivateGFI: false,
    icon: "bi-save",
    id: "saveSession",
    isVisibleInMenu: true,
    name: "additional:modules.cosi.saveSession.title",
    sessionToLoad: null,
    readmeUrl: {
        "en-US": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/014savesession.md",
        "de-DE": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/014sitzungspeichern.md"
    },
    onlyUdpServices: true,
    defaultActiveLayerIds: []
};

export default state;
