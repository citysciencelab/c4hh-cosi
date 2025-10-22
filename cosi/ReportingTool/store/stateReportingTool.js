/**
 * User type definition
 * @typedef {Object} ReportingToolState
 * @property {Boolean} [active=false] - Is activated (will be rendered) or not (config-param).
 * @property {String} id - The id of the reporting tool component.
 * @property {String} type - The type of the module.
 * @property {string} name - The name of the tool (config-param).
 * @property {string} icon - Bootstrap icon class (config-param).
 * @property {Object} readmeUrl - URL that leads to the tool instructions.
 */
const state = {
    active: false,
    id: "reportingTool",
    type: "reportingTool",
    name: "additional:modules.cosi.reportingTool.title",
    icon: "bi-printer",
    readmeUrl: {
        "de-DE": "bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/015vorlagen.md"
    }
};

export default state;
