import mutations from "../../../store/mutationsBimFactory.js";
import {expect} from "chai";

describe("mutationsBimFactory", () => {
    it("removes errors from the correct component with containerId and machineName", () => {
        const state = {
            workflowsDetails: [{
                steps: [{
                    sections: [{
                        containers: [{
                            containerId: "c2",
                            components: [{
                                machineName: "detailfield",
                                errors: [{msg: "Fehler"}]
                            }, {
                                machineName: "otherfield",
                                errors: [{msg: "Should stay"}]
                            }]
                        }]
                    }]
                }]
            }]
        };

        mutations.clearComponentErrors(state, {
            containerId: "c2",
            machineName: "detailfield"
        });

        expect(state.workflowsDetails[0].steps[0].sections[0].containers[0].components[0].errors).to.deep.equal([]);
        expect(state.workflowsDetails[0].steps[0].sections[0].containers[0].components[1].errors).to.deep.equal([{msg: "Should stay"}]);
    });

    it("removes all errors from all components when called without params", () => {
        const state = {
            workflowsDetails: [{
                steps: [{
                    sections: [{
                        containers: [{
                            containerId: "c2",
                            components: [{
                                machineName: "detailfield",
                                errors: [{msg: "Fehler"}]
                            }, {
                                machineName: "otherfield",
                                errors: [{msg: "Should also be cleared"}]
                            }]
                        }]
                    }]
                }]
            }]
        };

        mutations.clearComponentErrors(state);

        expect(state.workflowsDetails[0].steps[0].sections[0].containers[0].components[0].errors).to.deep.equal([]);
        expect(state.workflowsDetails[0].steps[0].sections[0].containers[0].components[1].errors).to.deep.equal([]);
    });

    it("sets emptyError if emptyError param is true", () => {
        const state = {
            workflowsDetails: [{
                steps: [{
                    sections: [{
                        containers: [{
                            containerId: "c2",
                            components: [{
                                machineName: "detailfield",
                                errors: [{msg: "Fehler"}]
                            }]
                        }]
                    }]
                }]
            }]
        };

        mutations.clearComponentErrors(state, {
            containerId: "c2",
            machineName: "detailfield",
            emptyError: true
        });

        expect(state.workflowsDetails[0].steps[0].sections[0].containers[0].components[0].errors).to.deep.equal([{msg: ""}]);
    });
});
