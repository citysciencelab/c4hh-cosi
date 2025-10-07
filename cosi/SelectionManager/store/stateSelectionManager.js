/**
 * User type definition
 * @typedef {object} selectionmanagerState
 * @property {boolean} active if true, VueAddon will rendered
 * @property {string} id id of the VueAddon component
 * @property {string} type type of the VueAddon component
 * @property {string} name displayed as title (config-param)
 * @property {string} icon icon next to title (config-param)
 * @todo the rest
 */
const state = {
    active: false,
    id: "selectionManager",
    type: "selectionManager",
    // defaults for config.json parameters
    name: "SelectionManager",
    icon: "bi-textarea",
    selections: [],
    activeSelection: null,
    acceptSelection: null, // other tools can commit to this variable. Then, a new selection is added and set as active.
    readmeUrl: {
        "en-US": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/022selectionmanager.md",
        "de-DE": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/022auswahlmanager.md",
        "en": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/022selectionmanager.md",
        "de": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/022auswahlmanager.md"
    }
};

export default state;
