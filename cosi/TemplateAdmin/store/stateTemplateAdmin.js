/**
 * Shadow tool state definition.
 * @typedef {Object} ContactState
 * @property {Boolean} active If true, TemplateAdmin will be rendered.
 * @property {String} id Id of the Contact component.
 * @property {String} name Displayed as the title. (config-param)
 * @property {String} icon Icon next to the title. (config-param)
 * @property {Object} activeMode current active tab mode.
 * @property {Boolean} enableExport If true, the button export will be activated.
 * @property {String} initialStatus - the initial status.
 * @property {String} labelOfOrientationValue the label of orientationValue
 * @property {String[]} selectedGeoDataList the selected geodata list.
 * @property {String[]} selectedStatDataList the selected statisdata list.
 */
const state = {
    active: false,
    id: "templateAdmin",
    type: "templateAdmin",
    name: "additional:modules.cosi.templateAdmin.title",
    icon: "bi-folder2-open",
    activeMode: {
        type: "create",
        text: "additional:modules.cosi.templateAdmin.button.addTemplate",
        icon: "bi bi-plus-square"
    },
    enableExport: false,
    dataOptions: [],
    statOptions: [],
    toolOptions: [],
    ignorePropertyNames: [],
    initialStatus: undefined,
    importedTemplateNames: [],
    loadedTemplates: [],
    savedTemplateContents: [],
    selectedTemplate: undefined,
    selectedGeoDataList: [],
    selectedStatDataList: [],
    labelOfOrientationValue: "additional:modules.cosi.templateAdmin.label.existingAreas"
};

export default state;
