/**
 * User type definition
 * @typedef {Object} ReportingToolState
 * @property {Boolean} [active=false] - Is activated (will be rendered) or not (config-param).
 * @property {String} id - The id of the reporting tool component.
 * @property {String} type - The type of the module.
 * @property {string} name - The name of the tool (config-param).
 * @property {string} icon - Bootstrap icon class (config-param).
 * @property {Boolean} [infrastructureTableLimitEnabled=false] - Deciding if the count of infrastructure data is limited.
 * @property {Number} infrastructureTableLimit - The count of infrastructure data.
 * @property {Boolean} reportLoader - check if the report is generating.
 */
const state = {
    active: false,
    id: "reportingTool",
    type: "reportingTool",
    name: "additional:modules.cosi.reportingTool.title",
    icon: "bi-printer",
    infrastructureTableLimitEnabledConfig: false,
    infrastructureTableLimitConfig: 10,
    readmeUrl: {
        "de-DE": "bitbucket.org/geowerkstatt-hamburg/addons/src/dev_version_2/cosi/manuals/015vorlagen.md"
    },
    reportLoader: false
};

export default state;
