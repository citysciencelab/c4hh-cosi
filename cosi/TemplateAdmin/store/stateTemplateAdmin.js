/**
 * Shadow tool state definition.
 * @typedef {Object} ContactState
 * @property {Boolean} active If true, TemplateAdmin will be rendered.
 * @property {String} id Id of the Contact component.
 * @property {String} name Displayed as the title. (config-param)
 * @property {String} icon Icon next to the title. (config-param)
 * @property {String} labelOfOrientationValue the label of orientationValue
 */
const state = {
    active: false,
    id: "templateAdmin",
    type: "templateAdmin",
    name: "additional:modules.cosi.templateAdmin.title",
    icon: "bi-folder2-open",
    ignorePropertyNames: [],
    importedTemplateNames: [],
    savedTemplateContents: [],
    selectedTemplate: undefined,
    labelOfOrientationValue: "additional:modules.cosi.templateAdmin.label.existingAreas"
};

export default state;
