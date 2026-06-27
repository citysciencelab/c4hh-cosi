/**
 * User type definition
 * @typedef {Object} DistrictSelectorState
 * @property {Boolean} [active=false] - Is activated (will rendered) or not (config-param).
 * @property {String[]} activeTemplates - the active templates.
 * @property {String} activeTemplateName - the active template name.
 * @property {String[]} blackLayerlist - the layer will not be removed by toggle the button.
 * @property {String} currentActiveTemplate - the current active template name.
 * @property {Boolean} [deactivateGFI=false] - Deactivates the gfi if true (config-param).
 * @property {String} [icon="bi-folder2-open"] - Bootstrap icon class (config-param).
 * @property {String} id - The id of the district selector component.
 * @property {String} [name="Sitzung speichern"] - The name of the tool (config-param).
 * @property {Boolean} [renderToWindow=true] - Renders tool in a window if true, otherwise in the sidebar (config-param).
 * @property {Boolean} [resizableWindow=false] - If True, window is resizable (config-param).
 * @property {String} toolToOpen - the tool to be open after this tool is closed.
 * @property {Boolean} [useImport=false] - If true, it is possible to import templates.
 * @property {Boolean} [useTemplatesForMapping=false] - If true, the mapping is overwritten with the statistic data from the templates.
 * @property {Object} templateContents - The selected data from templates.
 * @property {String[]} defaultActiveLayerIds - the default active layer Ids in COSI.
 * @property {Boolean} [multiTemplate=false] - If true, multiple templates are allowed to be active.
 * @property {String[]} importedTemplateNames - the imported template names list.
 * @property {String} reportName - The report name for reporting tool.
 * @property {String[]} reportLayerIds - the report layer ids for reporting tool.
 * @property {String[]} reportCategories - the report categories for reporting tool.
 * @property {boolean|String} selectedTemplateName - the selected template name.
 * @property {Object[]} saveTemplate - the saved templates.
 * @property {Object[]} filters - the templates saved as filters.
 * @property {Object[]} templates - the whole templates.
 */
const state = {
    active: false,
    activeTemplates: [],
    activeTemplateName: false,
    blackLayerlist: ["33780", "27773", "28201", "28028", "28150"],
    currentActiveTemplate: "",
    deactivateGFI: false,
    defaultActiveLayerIds: [],
    icon: "bi-folder2-open",
    id: "templateManager",
    isVisibleInMenu: true,
    importedTemplateNames: [],
    multiTemplate: false,
    name: "Vorlagen Manager",
    readmeUrl: {
        "en-US": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/015templates.md",
        "de-DE": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/015vorlagen.md"
    },
    renderToWindow: true,
    resizableWindow: true,
    templatePath: "./assets/templates",
    templateContents: undefined,
    templateFiles: [
        "Erhaltungsmanagement_Spielplaetze"
    ],
    toolToOpen: undefined,
    useImport: false,
    useTemplatesForMapping: false,
    reportName: "",
    reportLayerIds: [],
    reportCategories: [],
    selectedTemplateName: false,
    saveTemplate: [],
    filters: [],
    templates: []
};

export default state;
