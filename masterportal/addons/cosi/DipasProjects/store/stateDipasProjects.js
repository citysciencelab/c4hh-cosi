/**
 * User type definition
 * @typedef {object} DIPASProjectsState
 * @property {string} id id of the VueAddon component
 * @property {string} name displayed as title (config-param)
 * @property {string} icon icon next to title (config-param)
 * @property {boolean} isVisibleInMenu if true, tool is selectable in menu (config-param)
 * @property {boolean} deactivateGFI flag if tool should deactivate gfi (config-param)
 */
const state = {
    type: "dipasProjects",
    id: "Dipas",
    name: "DIPAS Projekte",
    icon: "bi-people",
    isVisibleInMenu: true,
    deactivateGFI: false,
    baseUrl: "https://beteiligung.hamburg/drupal/dipas-pds/projects"
};

export default state;
