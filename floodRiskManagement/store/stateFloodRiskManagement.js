/**
 * User type definition
 * @typedef {Object} floodRiskManagement
 * @property {String} description - the description of floodRiskManagement.
 * @property {String} icon - Icon next to title.
 * @property {String} id - id of the WaterRiskCheck component.
 * @property {String} name - Displayed as title.
 * @property {String} type - type of the WaterRiskCheck component.
 * @property {String} selectedCycle - the selected cycle.
 * @property {String} selectedEvent - the selected flood event.
 * @property {String} selectedFrequency - the selected frequeny of flood events.
 * @property {String} selectedType - the selected map type.
 */
const state = {
    description: "additional:modules.floodRiskManagement.description",
    icon: "bi-water",
    id: "floodRiskManagement",
    name: "additional:modules.floodRiskManagement.title",
    selectedCycle: "",
    selectedEvent: "",
    selectedFrequency: "",
    selectedType: "",
    type: "floodRiskManagement"
};

export default state;
