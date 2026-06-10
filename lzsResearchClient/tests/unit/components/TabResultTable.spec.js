import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import sinon from "sinon";

import Component from "../../../components/TabResultTable.vue";

describe("addons/lzsResearchClient/tests/unit/components/tabs/TabResultTable.spec.js", () => {
    let wrapper,
        store;

    const tableHeader = ["JAHRGANG", "KACHELNUMMER", "BESCHREIBUNG"];

    const fakeLayer = {
            get: () => "lzsGeorefLayer"
        },
        fakeFunctionGetLayers = sinon.fake.returns({
            getArray: () => [fakeLayer]
        }),
        fakeFunctionGetView = sinon.fake.returns({
            fit: () => null
        }),
        fakeFunctionGetMap = sinon.fake.returns({
            getLayers: fakeFunctionGetLayers,
            removeLayer: sinon.fake.returns(null),
            addLayer: sinon.fake.returns(null),
            getView: fakeFunctionGetView
        });

    beforeEach(() => {
        const tableDatasets = [
            {
                instanceId: "dataset1",
                attributes: [
                    {
                        value: "2017",
                        id: "JAHRGANG"
                    },
                    {
                        value: "6",
                        id: "KACHELNUMMER"
                    },
                    {
                        value: "Z Item",
                        id: "BESCHREIBUNG"
                    }
                ],
                geom: {
                    coordinates: [
                        [0, 1],
                        [1, 1],
                        [1, 0],
                        [0, 0],
                        [0, 1]
                    ],
                    type: "Polygon"
                }
            },
            {
                instanceId: "dataset2",
                attributes: [
                    {
                        value: "2015",
                        id: "JAHRGANG"
                    },
                    {
                        value: "30",
                        id: "KACHELNUMMER"
                    },
                    {
                        value: "A Item",
                        id: "BESCHREIBUNG"
                    }
                ],
                geom: {
                    coordinates: [0, 1],
                    type: "Point"
                }
            }
        ];

        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        LzsResearchClient: {
                            namespaced: true,
                            state: () => ({
                                // to be used later
                            }),
                            getters: {
                                lzsGeomLayout: () => {
                                    return {
                                        fillColor: [50, 168, 149, 0.3],
                                        strokeColor: [50, 168, 149],
                                        strokeWidth: 2,
                                        circleFillColor: [50, 168, 149, 0.5],
                                        circleStrokeColor: [50, 168, 149],
                                        circleRadius: 10
                                    };
                                }
                            },
                            actions: {
                                fetchGeometryForInstanceId: () => Promise.resolve()
                            },
                            mutations: {
                                setCheckedForInstanceId: () => sinon.stub()
                            }
                        }
                    }
                }
            }
        });

        sinon.stub(mapCollection, "getMap").callsFake(fakeFunctionGetMap);

        wrapper = shallowMount(Component, {
            props: {
                tableIndex: "tableIndex-1",
                tableHeader,
                tableDatasets,
                hasGeoRef: true
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

        sinon.restore();
        sinon.resetHistory();
    });

    it("should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("sorts string column correctly", async () => {
        const sortButton = wrapper.find("th.th-item-BESCHREIBUNG span.sortable-icon");

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-JAHRGANG").text()).to.equal("2015");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-KACHELNUMMER").text()).to.equal("30");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-BESCHREIBUNG").text()).to.equal("A Item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-JAHRGANG").text()).to.equal("2017");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-KACHELNUMMER").text()).to.equal("6");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-BESCHREIBUNG").text()).to.equal("Z Item");

        sortButton.trigger("click");

        await wrapper.vm.$nextTick();

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-JAHRGANG").text()).to.equal("2015");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-KACHELNUMMER").text()).to.equal("30");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-BESCHREIBUNG").text()).to.equal("A Item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-JAHRGANG").text()).to.equal("2017");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-KACHELNUMMER").text()).to.equal("6");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-BESCHREIBUNG").text()).to.equal("Z Item");

        sortButton.trigger("click");

        await wrapper.vm.$nextTick();

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-JAHRGANG").text()).to.equal("2017");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-KACHELNUMMER").text()).to.equal("6");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-BESCHREIBUNG").text()).to.equal("Z Item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-JAHRGANG").text()).to.equal("2015");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-KACHELNUMMER").text()).to.equal("30");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-BESCHREIBUNG").text()).to.equal("A Item");
    });

    it("sorts number column correctly", async () => {
        const sortButton = wrapper.find("th.th-item-KACHELNUMMER span.sortable-icon");

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-JAHRGANG").text()).to.equal("2015");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-KACHELNUMMER").text()).to.equal("30");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-BESCHREIBUNG").text()).to.equal("A Item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-JAHRGANG").text()).to.equal("2017");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-KACHELNUMMER").text()).to.equal("6");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-BESCHREIBUNG").text()).to.equal("Z Item");

        sortButton.trigger("click");

        await wrapper.vm.$nextTick();

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-JAHRGANG").text()).to.equal("2017");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-KACHELNUMMER").text()).to.equal("6");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-BESCHREIBUNG").text()).to.equal("Z Item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-JAHRGANG").text()).to.equal("2015");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-KACHELNUMMER").text()).to.equal("30");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-BESCHREIBUNG").text()).to.equal("A Item");

        sortButton.trigger("click");

        await wrapper.vm.$nextTick();

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-JAHRGANG").text()).to.equal("2015");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-KACHELNUMMER").text()).to.equal("30");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-BESCHREIBUNG").text()).to.equal("A Item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-JAHRGANG").text()).to.equal("2017");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-KACHELNUMMER").text()).to.equal("6");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-BESCHREIBUNG").text()).to.equal("Z Item");
    });

    it("shows georef button and calls function to show geometry on click", async () => {
        const iconButtons = wrapper.findAllComponents({name: "IconButton"});

        expect(iconButtons).to.be.an("array").with.lengthOf(4);
        expect(iconButtons[0].vm.icon).to.equal("bi-crosshair");
        expect(iconButtons[1].vm.icon).to.equal("bi-arrow-right-circle");
        expect(iconButtons[2].vm.icon).to.equal("bi-crosshair");
        expect(iconButtons[3].vm.icon).to.equal("bi-arrow-right-circle");

        iconButtons[0].trigger("click");

        await wrapper.vm.$nextTick();

        expect(wrapper.vm.currentlyShownGeorefId).to.equal("dataset2");
        expect(iconButtons[0].vm.classArray).to.include("isShownGeometry");

        wrapper.vm.clearGeomIndicators();
        expect(wrapper.vm.currentlyShownGeorefId).to.equal(null);
    });

    it("create correct featues from geometry", async () => {
        const pointVectorFeature = wrapper.vm.createNewVectorFeature({type: "Point", coordinates: [0, 1]}),
            lineVectorFeature = wrapper.vm.createNewVectorFeature({type: "LineString", coordinates: [[0, 1], [1, 1], [1, 0]]}),
            polygonVectorFeature = wrapper.vm.createNewVectorFeature({type: "Polygon", coordinates: [[[0, 1], [1, 1], [1, 0], [0, 1]]]}),
            brokenVectorFeature1 = wrapper.vm.createNewVectorFeature({type: "broken", coordinates: [[[0, 1], [1, 1], [1, 0], [0, 1]]]}),
            brokenVectorFeature2 = wrapper.vm.createNewVectorFeature({coordinates: [[0, 1], [1, 1], [1, 0], [0, 1]]}),
            brokenVectorFeature3 = wrapper.vm.createNewVectorFeature({type: "broken"}),
            brokenVectorFeature4 = wrapper.vm.createNewVectorFeature({});

        expect(pointVectorFeature).to.be.an("object");
        expect(pointVectorFeature.getGeometry().getCoordinates()).to.deep.equal([0, 1]);
        expect(lineVectorFeature).to.be.an("object");
        expect(lineVectorFeature.getGeometry().getCoordinates()).to.deep.equal([[0, 1], [1, 1], [1, 0]]);
        expect(polygonVectorFeature).to.be.an("object");
        expect(polygonVectorFeature.getGeometry().getCoordinates()).to.deep.equal([[[0, 1], [1, 1], [1, 0], [0, 1]]]);
        expect(brokenVectorFeature1).to.be.null;
        expect(brokenVectorFeature2).to.be.null;
        expect(brokenVectorFeature3).to.be.null;
        expect(brokenVectorFeature4).to.be.null;
    });

    it("checking both datasets changes the checked state of the header checkbox", async () => {
        const headerCheckbox = wrapper.find("thead input[type='checkbox']"),
            checkboxes = wrapper.findAll("tbody input[type='checkbox']");

        expect(headerCheckbox.element.checked).to.be.false;
        expect(checkboxes[0].element.checked).to.be.false;
        expect(checkboxes[1].element.checked).to.be.false;

        await checkboxes[0].setChecked();

        expect(headerCheckbox.element.checked).to.be.false;
        expect(checkboxes[0].element.checked).to.be.true;
        expect(checkboxes[1].element.checked).to.be.false;

        await checkboxes[1].setChecked();

        expect(headerCheckbox.element.checked).to.be.true;
        expect(checkboxes[0].element.checked).to.be.true;
        expect(checkboxes[1].element.checked).to.be.true;

        await checkboxes[0].setChecked(false);

        expect(headerCheckbox.element.checked).to.be.false;
        expect(checkboxes[0].element.checked).to.be.false;
        expect(checkboxes[1].element.checked).to.be.true;
    });

    it("checking the header checkbox changes the checked state of all datasets", async () => {
        const headerCheckbox = wrapper.find("thead input[type='checkbox']"),
            checkboxes = wrapper.findAll("tbody input[type='checkbox']");

        expect(headerCheckbox.element.checked).to.be.false;
        expect(checkboxes[0].element.checked).to.be.false;
        expect(checkboxes[1].element.checked).to.be.false;

        await headerCheckbox.setChecked();

        expect(headerCheckbox.element.checked).to.be.true;
        expect(checkboxes[0].element.checked).to.be.true;
        expect(checkboxes[1].element.checked).to.be.true;

        await headerCheckbox.setChecked(false);

        expect(headerCheckbox.element.checked).to.be.false;
        expect(checkboxes[0].element.checked).to.be.false;
        expect(checkboxes[1].element.checked).to.be.false;
    });
});
