import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import sinon from "sinon";

import Component from "../../../components/TabResultTable.vue";

describe("addons/lzsResearchClient/tests/unit/components/tabs/TabResultTable.spec.js", () => {
    let wrapper,
        store,
        setVisibleFake;

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
                },
                checked: false
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
                },
                checked: false
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
                                setCheckedForDataset: () => sinon.stub()
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

        setVisibleFake = sinon.fake();
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }

        sinon.restore();
        sinon.resetHistory();
    });

    /**
     * Stubs the mapCollection.getMap function to return a map with the specified layers.
     * @param {Array} layers - The layers to be returned by the stubbed map.
     */
    function stubMapWithLayers (layers) {
        mapCollection.getMap.callsFake(() => ({
            getLayers: () => ({getArray: () => layers}),
            removeLayer: sinon.fake.returns(null),
            addLayer: sinon.fake.returns(null),
            getView: fakeFunctionGetView
        }));
    }

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

        wrapper.vm.clearGeomIndicator();
        expect(wrapper.vm.currentlyShownGeorefId).to.equal(null);
    });

    it("create correct features from geometry", async () => {
        const pointVectorFeature = wrapper.vm.createNewVectorFeature({type: "Point", coordinates: [0, 1]}),
            lineVectorFeature = wrapper.vm.createNewVectorFeature({type: "LineString", coordinates: [[0, 1], [1, 1], [1, 0]]}),
            polygonVectorFeature = wrapper.vm.createNewVectorFeature({type: "Polygon", coordinates: [[[0, 1], [1, 1], [1, 0], [0, 1]]]}),
            multiPointVectorFeature = wrapper.vm.createNewVectorFeature({type: "MultiPoint", coordinates: [[0, 1], [2, 3]]}),
            multiLineStringVectorFeature = wrapper.vm.createNewVectorFeature({type: "MultiLineString", coordinates: [[[0, 1], [1, 1], [1, 0]], [[2, 2], [3, 3]]]}),
            geometryCollectionVectorFeature = wrapper.vm.createNewVectorFeature({type: "GeometryCollection", geometries: [{type: "Point", coordinates: [0, 1]}, {type: "LineString", coordinates: [[0, 1], [1, 1]]}]}),
            brokenVectorFeature1 = wrapper.vm.createNewVectorFeature({type: "broken", coordinates: [[[0, 1], [1, 1], [1, 0], [0, 1]]]}),
            brokenVectorFeature2 = wrapper.vm.createNewVectorFeature({coordinates: [[0, 1], [1, 1], [1, 0], [0, 1]]}),
            brokenVectorFeature3 = wrapper.vm.createNewVectorFeature({type: "broken"}),
            brokenVectorFeature4 = wrapper.vm.createNewVectorFeature({});

        expect(pointVectorFeature).to.be.an("object");
        expect(pointVectorFeature.getGeometry().getCoordinates()).to.deep.equal([0, 1]);
        expect(lineVectorFeature).to.be.an("object");
        expect(lineVectorFeature.getGeometry().getCoordinates()).to.deep.equal([[0, 1], [1, 1], [1, 0]]);
        expect(polygonVectorFeature).to.be.an("object");
        expect(multiPointVectorFeature).to.be.an("object");
        expect(multiPointVectorFeature.getGeometry().getCoordinates()).to.deep.equal([[0, 1], [2, 3]]);
        expect(multiLineStringVectorFeature).to.be.an("object");
        expect(multiLineStringVectorFeature.getGeometry().getCoordinates()).to.deep.equal([[[0, 1], [1, 1], [1, 0]], [[2, 2], [3, 3]]]);
        expect(geometryCollectionVectorFeature).to.be.an("object");
        expect(geometryCollectionVectorFeature.getGeometry().getGeometries()).to.have.lengthOf(2);
        expect(geometryCollectionVectorFeature.getGeometry().getGeometries()[0].getCoordinates()).to.deep.equal([0, 1]);
        expect(geometryCollectionVectorFeature.getGeometry().getGeometries()[1].getCoordinates()).to.deep.equal([[0, 1], [1, 1]]);
        expect(polygonVectorFeature.getGeometry().getCoordinates()).to.deep.equal([[[0, 1], [1, 1], [1, 0], [0, 1]]]);
        expect(brokenVectorFeature1).to.be.null;
        expect(brokenVectorFeature2).to.be.null;
        expect(brokenVectorFeature3).to.be.null;
        expect(brokenVectorFeature4).to.be.null;
    });

    it("create correct OL geometries from geometry objects", () => {
        const pointGeometry = wrapper.vm.createOlGeometry({type: "Point", coordinates: [0, 1]}),
            lineGeometry = wrapper.vm.createOlGeometry({type: "LineString", coordinates: [[0, 1], [1, 1], [1, 0]]}),
            polygonGeometry = wrapper.vm.createOlGeometry({type: "Polygon", coordinates: [[[0, 1], [1, 1], [1, 0], [0, 1]]]}),
            multiPolygonGeometry = wrapper.vm.createOlGeometry({type: "MultiPolygon", coordinates: [[[[0, 1], [1, 1], [1, 0], [0, 1]]], [[[2, 2], [3, 3], [3, 2], [2, 2]]]]}),
            multiPointGeometry = wrapper.vm.createOlGeometry({type: "MultiPoint", coordinates: [[0, 1], [2, 3]]}),
            multiLineStringGeometry = wrapper.vm.createOlGeometry({type: "MultiLineString", coordinates: [[[0, 1], [1, 1], [1, 0]], [[2, 2], [3, 3]]]}),
            geometryCollectionGeometry = wrapper.vm.createOlGeometry({type: "GeometryCollection", geometries: [{type: "Point", coordinates: [0, 1]}, {type: "LineString", coordinates: [[0, 1], [1, 1]]}]}),
            geometryCollectionWithBrokenSubGeometry = wrapper.vm.createOlGeometry({type: "GeometryCollection", geometries: [{type: "Point", coordinates: [0, 1]}, {type: "broken", coordinates: [[0, 1], [1, 1]]}]}),
            brokenGeometry1 = wrapper.vm.createOlGeometry({type: "broken", coordinates: [[[0, 1], [1, 1], [1, 0], [0, 1]]]}),
            brokenGeometry2 = wrapper.vm.createOlGeometry({coordinates: [[0, 1], [1, 1], [1, 0], [0, 1]]}),
            brokenGeometry3 = wrapper.vm.createOlGeometry({type: "broken"}),
            brokenGeometry4 = wrapper.vm.createOlGeometry({});

        expect(pointGeometry).to.be.an("object");
        expect(pointGeometry.getCoordinates()).to.deep.equal([0, 1]);

        expect(lineGeometry).to.be.an("object");
        expect(lineGeometry.getCoordinates()).to.deep.equal([[0, 1], [1, 1], [1, 0]]);

        expect(polygonGeometry).to.be.an("object");
        expect(polygonGeometry.getCoordinates()).to.deep.equal([[[0, 1], [1, 1], [1, 0], [0, 1]]]);

        expect(multiPolygonGeometry).to.be.an("object");
        expect(multiPolygonGeometry.getCoordinates()).to.deep.equal([[[[0, 1], [1, 1], [1, 0], [0, 1]]], [[[2, 2], [3, 3], [3, 2], [2, 2]]]]);

        expect(multiPointGeometry).to.be.an("object");
        expect(multiPointGeometry.getCoordinates()).to.deep.equal([[0, 1], [2, 3]]);

        expect(multiLineStringGeometry).to.be.an("object");
        expect(multiLineStringGeometry.getCoordinates()).to.deep.equal([[[0, 1], [1, 1], [1, 0]], [[2, 2], [3, 3]]]);

        expect(geometryCollectionGeometry).to.be.an("object");
        expect(geometryCollectionGeometry.getGeometries()).to.have.lengthOf(2);
        expect(geometryCollectionGeometry.getGeometries()[0].getCoordinates()).to.deep.equal([0, 1]);
        expect(geometryCollectionGeometry.getGeometries()[1].getCoordinates()).to.deep.equal([[0, 1], [1, 1]]);

        expect(geometryCollectionWithBrokenSubGeometry).to.be.an("object");
        expect(geometryCollectionWithBrokenSubGeometry.getGeometries()).to.have.lengthOf(1);
        expect(geometryCollectionWithBrokenSubGeometry.getGeometries()[0].getCoordinates()).to.deep.equal([0, 1]);

        expect(brokenGeometry1).to.be.null;
        expect(brokenGeometry2).to.be.null;
        expect(brokenGeometry3).to.be.null;
        expect(brokenGeometry4).to.be.null;
    });

    it("checking both datasets changes the checked state of the header checkbox", async () => {
        const headerCheckbox = wrapper.find("thead input[type='checkbox']"),
            checkboxes = wrapper.findAll("tbody input[type='checkbox']"),
            checkboxesWrapper = wrapper.findAll("tbody td.resultTableCheckboxWrapper");

        expect(headerCheckbox.element.checked).to.be.false;
        expect(checkboxes[0].element.checked).to.be.false;
        expect(checkboxes[1].element.checked).to.be.false;

        await checkboxesWrapper[0].trigger("click");

        expect(headerCheckbox.element.checked).to.be.false;
        expect(checkboxes[0].element.checked).to.be.true;
        expect(checkboxes[1].element.checked).to.be.false;

        await checkboxesWrapper[1].trigger("click");

        expect(headerCheckbox.element.checked).to.be.true;
        expect(checkboxes[0].element.checked).to.be.true;
        expect(checkboxes[1].element.checked).to.be.true;

        await checkboxesWrapper[0].trigger("click");

        expect(headerCheckbox.element.checked).to.be.false;
        expect(checkboxes[0].element.checked).to.be.false;
        expect(checkboxes[1].element.checked).to.be.true;
    });

    it("checking the header checkbox changes the checked state of all datasets", async () => {
        const headerCheckbox = wrapper.find("thead input[type='checkbox']"),
            headerCheckboxWrapper = wrapper.find("thead th.resultTableHeaderCheckboxWrapper"),
            checkboxes = wrapper.findAll("tbody input[type='checkbox']");

        expect(headerCheckbox.element.checked).to.be.false;
        expect(checkboxes[0].element.checked).to.be.false;
        expect(checkboxes[1].element.checked).to.be.false;

        await headerCheckboxWrapper.trigger("click");

        expect(headerCheckbox.element.checked).to.be.true;
        expect(checkboxes[0].element.checked).to.be.true;
        expect(checkboxes[1].element.checked).to.be.true;

        await headerCheckboxWrapper.trigger("click");

        expect(headerCheckbox.element.checked).to.be.false;
        expect(checkboxes[0].element.checked).to.be.false;
        expect(checkboxes[1].element.checked).to.be.false;
    });

    describe("hideGeom", () => {
        it("hides the geom layer", () => {
            const layerWithVisibility = {
                get: () => "lzsGeorefLayer",
                setVisible: setVisibleFake,
                getVisible: () => true
            };

            stubMapWithLayers([layerWithVisibility]);
            wrapper.vm.geoRefShown = true;

            wrapper.vm.hideGeom();

            expect(setVisibleFake.calledOnceWith(false)).to.be.true;
            expect(wrapper.vm.geoRefShown).to.be.false;
        });

        it("does nothing when no geom layer exists on the map", () => {
            const unrelatedLayer = {
                // not "lzsGeorefLayer" -> not recognized as geom layer
                get: () => "someOtherLayerId",
                setVisible: setVisibleFake
            };

            stubMapWithLayers([unrelatedLayer]);

            expect(() => wrapper.vm.hideGeom()).to.not.throw();
            expect(setVisibleFake.called).to.be.false;
        });
    });

    describe("showGeomAgain", () => {
        it("makes a hidden geom layer visible again", () => {
            const hiddenLayer = {
                get: () => "lzsGeorefLayer",
                setVisible: setVisibleFake,
                getVisible: () => false
            };

            stubMapWithLayers([hiddenLayer]);

            wrapper.vm.geoRefShown = false;

            wrapper.vm.showGeomAgain();

            expect(setVisibleFake.calledOnceWith(true)).to.be.true;
            expect(wrapper.vm.geoRefShown).to.be.true;
        });

        it("does nothing when no geom layer exists on the map", () => {
            const unrelatedLayer = {
                // not "lzsGeorefLayer" -> not recognized as geom layer
                get: () => "someOtherLayerId",
                setVisible: setVisibleFake,
                getVisible: () => false
            };

            stubMapWithLayers([unrelatedLayer]);

            wrapper.vm.geoRefShown = false;

            expect(() => wrapper.vm.showGeomAgain()).to.not.throw();
            expect(setVisibleFake.called).to.be.false;
            expect(wrapper.vm.geoRefShown).to.be.false;
        });

        it("does nothing when the layer is already visible", () => {
            const visibleLayer = {
                get: () => "lzsGeorefLayer",
                setVisible: setVisibleFake,
                getVisible: () => true
            };

            stubMapWithLayers([visibleLayer]);

            wrapper.vm.geoRefShown = true;

            wrapper.vm.showGeomAgain();

            expect(setVisibleFake.called).to.be.false;
            expect(wrapper.vm.geoRefShown).to.be.true;
        });
    });
});
