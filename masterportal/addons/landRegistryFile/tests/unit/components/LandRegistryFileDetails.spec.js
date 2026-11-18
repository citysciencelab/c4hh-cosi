import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";

import Component from "../../../components/LandRegistryFileDetails.vue";

describe("addons/landRegistryFile/tests/unit/components/LandRegistryFileDetails.spec.js", () => {
    let wrapper,
        store;
    const landRegistryFileFeatures = [
            {
                id: "1",
                properties: {
                    name: "Feature 1",
                    additionalInfo: "Additional Info 1",
                    noTitle: "No Title 1",
                    notInDetailsFields: "Not in Details Fields 1"
                }
            },
            {
                id: "2",
                properties: {
                    name: "Feature 2",
                    additionalInfo: "Additional Info 2",
                    noTitle: "No Title 2",
                    notInDetailsFields: "Not in Details Fields 2"
                }
            },
            {
                id: "3",
                properties: {
                    name: "Feature 3",
                    additionalInfo: "Additional Info 3",
                    noTitle: "No Title 3",
                    notInDetailsFields: "Not in Details Fields 3"
                }
            }
        ],
        oafSchema = {
            properties: {
                name: {"title": "Feature Name"},
                additionalInfo: {"title": "Additional Info"},
                noTitle: {},
                notInDetailsFields: {}
            }
        },
        detailsFields = ["name", "additionalInfo", "noTitle"];

    beforeEach(() => {
        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        LandRegistryFile: {
                            namespaced: true,
                            state: () => ({
                                landRegistryFileFeatures: landRegistryFileFeatures,
                                selectedDetailFeatureId: null,
                                oafSchema: oafSchema,
                                detailsFields: detailsFields
                            }),
                            getters: {
                                getSortedFeatures: state => state.landRegistryFileFeatures,
                                selectedDetailFeatureId: state => state.selectedDetailFeatureId,
                                oafSchema: state => state.oafSchema,
                                detailsFields: state => state.detailsFields
                            },
                            mutations: {
                                setSelectedDetailFeatureId (state, featureId) {
                                    state.selectedDetailFeatureId = featureId;
                                }
                            },
                            actions: {
                                selectFeatureOnMap: ({commit}, {featureId}) => commit("setSelectedDetailFeatureId", featureId)
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            props: {
            },
            global: {
                mocks: {
                    $t: key => key
                },
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    /**
     * Simulates the map selection that determines the displayed detail feature.
     * @param {string} featureId The ID of the feature to select.
     * @returns {void}
     */
    function selectFeature (featureId) {
        store.commit("Modules/LandRegistryFile/setSelectedDetailFeatureId", featureId);
    }

    it("should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("when a middle feature is selected, both previous and next buttons should be displayed", async () => {
        selectFeature("2");
        await wrapper.vm.$nextTick();

        expect(wrapper.find("#previous-feature").exists()).to.be.true;
        expect(wrapper.find("#next-feature").exists()).to.be.true;
    });

    it("when the first feature is selected, only the next button should be displayed", async () => {
        selectFeature("1");
        await wrapper.vm.$nextTick();

        expect(wrapper.find("#next-feature").exists()).to.be.true;
        expect(wrapper.find("#previous-feature").exists()).to.be.false;
    });

    it("when the last feature is selected, only the previous button should be displayed", async () => {
        selectFeature("3");
        await wrapper.vm.$nextTick();

        expect(wrapper.find("#previous-feature").exists()).to.be.true;
        expect(wrapper.find("#next-feature").exists()).to.be.false;
    });

    it("navigating to the previous feature should set the selected feature id to the previous feature", async () => {
        selectFeature("2");

        wrapper.vm.setPreviousFeature();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedDetailFeatureId).to.equal("1");
    });

    it("navigating to the next feature should set the selected feature id to the next feature", async () => {
        selectFeature("2");

        wrapper.vm.setNextFeature();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedDetailFeatureId).to.equal("3");
    });

    it("navigating to the previous feature when the first feature is selected should do nothing", async () => {
        selectFeature("1");

        wrapper.vm.setPreviousFeature();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedDetailFeatureId).to.equal("1");
    });

    it("navigating to the next feature when the last feature is selected should do nothing", async () => {
        selectFeature("3");

        wrapper.vm.setNextFeature();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedDetailFeatureId).to.equal("3");
    });

    it("when a feature outside the list is selected, both previous and next buttons should not be displayed", async () => {
        selectFeature("4");
        await wrapper.vm.$nextTick();

        expect(wrapper.find("#previous-feature").exists()).to.be.false;
        expect(wrapper.find("#next-feature").exists()).to.be.false;
    });

    it("displays labels from the OAF schema and the selected feature values", async () => {
        selectFeature("1");
        await wrapper.vm.$nextTick();

        const rows = wrapper.findAll("table tr");

        expect(rows[0].findAll("td").map(td => td.text())).to.deep.equal(["Feature Name", "Feature 1"]);
        expect(rows[1].findAll("td").map(td => td.text())).to.deep.equal(["Additional Info", "Additional Info 1"]);
    });

    it("displays the field name as label when the OAF schema does not provide a title", async () => {
        selectFeature("1");
        await wrapper.vm.$nextTick();

        const rows = wrapper.findAll("table tr");

        expect(rows[2].findAll("td").map(td => td.text())).to.deep.equal(["noTitle", "No Title 1"]);
    });

    it("does not display fields that are not in detailsFields", async () => {
        selectFeature("1");
        await wrapper.vm.$nextTick();

        const rows = wrapper.findAll("table tr");

        const fieldNames = rows.map(row => row.find("td").text());

        expect(fieldNames).to.not.include("notInDetailsFields");
    });
});
