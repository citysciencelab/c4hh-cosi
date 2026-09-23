import {shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {rawLayerList} from "@masterportal/masterportalapi/src/index.js";
import wfs from "@masterportal/masterportalapi/src/layer/wfs";
import PotentialDamagedBuilding from "../../components/PotentialDamagedBuilding.vue";

describe("addons/heavyRain/potentialDamagedBuilding/components/PotentialDamagedBuilding.vue", () => {
    let wrapper;
    let store;
    let itemList;
    let replaceByIdInLayerConfig;
    let placingPointMarker;
    let removePointMarker;
    let getLayerWhere;
    let sendTransaction;

    /**
     * Creates a feature double for component method tests.
     * @param {Object} properties - The feature properties.
     * @returns {Object} A feature-like test double.
     */
    function createFeature (properties = {}) {
        return {
            properties: {...properties},
            get (key) {
                return this.properties[key];
            },
            getProperties () {
                return {...this.properties};
            },
            set (key, value) {
                this.properties[key] = value;
            },
            unset (key) {
                delete this.properties[key];
            }
        };
    }
    beforeEach(() => {
        replaceByIdInLayerConfig = sinon.spy();
        placingPointMarker = sinon.spy();
        removePointMarker = sinon.spy();
        itemList = [{
            name: "first",
            selected: true,
            wmsId: "wms-1",
            wmsLayer: {
                attributes: {
                    gfiAttributes: {
                        sk_aktuell: 1,
                        sk_aktdatum: {
                            name: "2025-09-18"
                        },
                        sk_basis: "Basis",
                        sk_angepasst: 1,
                        sk_anpdatum: {
                            name: "2025-09-17"
                        },
                        kommentar: "note",
                        gfk: "GF1",
                        bezgfk: "Gebaeudefunktion",
                        wgf: "WG1",
                        bezwgf: "Wohngebaeude",
                        bezofl: "Oberflaeche",
                        bezbat: "Bauart",
                        check_ug: "Nein"
                    }
                }
            },
            wfstId: "wfst-1"
        }, {
            name: "second",
            selected: false,
            wmsId: "wms-2",
            wmsLayer: {
                attributes: {
                    gfiAttributes: {}
                }
            },
            wfstId: "wfst-2"
        }];
        getLayerWhere = sinon.stub(rawLayerList, "getLayerWhere");
        sendTransaction = sinon.stub(wfs, "sendTransaction").resolves();
        store = createStore({
            actions: {
                replaceByIdInLayerConfig
            },
            modules: {
                Maps: {
                    namespaced: true,
                    getters: {
                        clickCoordinate: () => undefined,
                        projection: () => ({getCode: () => "EPSG:25832"}),
                        resolution: () => 1
                    },
                    actions: {
                        removePointMarker,
                        placingPointMarker
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        PotentialDamagedBuilding: {
                            namespaced: true,
                            getters: {
                                itemList: () => itemList
                            }
                        }
                    }
                }
            }
        });
        const selectedFeature = createFeature({
            sk_aktuell: 4,
            sk_aktdatum: "2026-09-18",
            sk_basis: "Basis",
            sk_angepasst: 3,
            sk_anpdatum: "2026-09-17",
            kommentar: "note",
            gfk: "GF1",
            bezgfk: "Gebaeudefunktion",
            wgf: "WG1",
            bezwgf: "Wohngebaeude",
            bezofl: "Oberflaeche",
            bezbat: "Bauart",
            check_ug: "Nein"
        });

        wrapper = shallowMount(PotentialDamagedBuilding, {
            global: {
                plugins: [store]
            },
            data: () => ({selectedFeature})
        });
    });

    afterEach(() => {
        if (typeof wrapper !== "undefined") {
            wrapper.unmount();
        }
        sinon.restore();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            expect(wrapper.exists()).to.be.true;
        });
        it("should find a buttongroup", () => {
            expect(wrapper.findComponent({name: "ButtonGroup"}).exists()).to.be.true;
        });
        it("should find overview cards", () => {
            expect(wrapper.findAll(".overview-card")).lengthOf(2);
        });
        it("should find cards", () => {
            expect(wrapper.findAll(".card")).lengthOf(2);
        });
        it("should find reset button", () => {
            expect(wrapper.find("#reset").exists()).to.be.true;
        });
        it("should find save button", () => {
            expect(wrapper.find("#save").exists()).to.be.true;
        });
    });

    describe("unmounted", () => {
        it("should remove the point marker and hide the selected layer", () => {
            const hideSelectedLayer = sinon.stub(wrapper.vm, "hideSelectedItem");

            wrapper.unmount();

            expect(removePointMarker.calledOnce).to.be.true;
            expect(hideSelectedLayer.calledOnce).to.be.true;
        });
    });

    describe("computed properties", () => {
        it("should return item names and the selected item", () => {
            expect(wrapper.vm.itemNameList).to.deep.equal([{name: "first"}, {name: "second"}]);
            expect(wrapper.vm.selectedItem).to.deep.equal(itemList[0]);
        });

        it("should return configured GFI attributes", () => {
            expect(wrapper.vm.gfiAttributes).to.deep.equal(itemList[0].wmsLayer.attributes.gfiAttributes);
        });

        it("should return feature values and formatted dates", () => {
            expect(wrapper.vm.lastUpdatedDamageClass).to.equal(4);
            expect(wrapper.vm.lastUpdatedDate).to.equal("2026-09-18");
            expect(wrapper.vm.formattedAdjustmentDate).to.equal("17.09.2026");
        });

        it("should return empty values when no feature data exists", () => {
            wrapper.vm.selectedFeature = undefined;
            expect(wrapper.vm.lastUpdatedDamageClass).to.equal("");
            expect(wrapper.vm.lastUpdatedDate).to.equal("");
            expect(wrapper.vm.formattedAdjustmentDate).to.equal("");
        });
    });


    describe("lifecycle and watcher", () => {
        it("should toggle layer visibility on mount", () => {
            expect(replaceByIdInLayerConfig.callCount).to.equal(2);
            expect(replaceByIdInLayerConfig.firstCall.args[1]).to.deep.equal({
                layerConfigs: [{
                    id: "wms-1",
                    layer: {
                        id: "wms-1",
                        visibility: true
                    }
                }]
            });
        });

        it("should remove the point marker on unmount", () => {
            wrapper.unmount();
            expect(removePointMarker.calledOnce).to.be.true;
        });

        it("should place a marker and fetch a feature when the coordinate changes", () => {
            const fetchFeature = sinon.stub(wrapper.vm, "fetchFeature"),
                coordinate = [10, 20];

            wrapper.vm.$options.watch.clickCoordinate.handler.call(wrapper.vm, coordinate);

            expect(placingPointMarker.calledWith(sinon.match.any, coordinate)).to.be.true;
            expect(fetchFeature.calledWith(wrapper.vm.selectedItem, coordinate, 1, wrapper.vm.projection)).to.be.true;
        });

        it("should not fail for an undefined coordinate", () => {
            const fetchFeature = sinon.stub(wrapper.vm, "fetchFeature");

            expect(() => wrapper.vm.$options.watch.clickCoordinate.handler.call(wrapper.vm, undefined)).not.to.throw();
            expect(placingPointMarker.calledWith(sinon.match.any, undefined)).to.be.true;
            expect(fetchFeature.calledWith(wrapper.vm.selectedItem, undefined, 1, wrapper.vm.projection)).to.be.true;
        });
    });

    describe("methods", () => {
        describe("prefixFeatureProperties", () => {
            it("should prefix all feature properties", () => {
                const feature = createFeature({sk_aktuell: 4, kommentar: "note"});

                wrapper.vm.prefixFeatureProperties(feature, "de.hh.up:");

                expect(feature.properties).to.deep.equal({
                    "de.hh.up:sk_aktuell": 4,
                    "de.hh.up:kommentar": "note"
                });
            });

            it("should keep an empty feature unchanged", () => {
                const feature = createFeature();

                wrapper.vm.prefixFeatureProperties(feature, "de.hh.up:");

                expect(feature.properties).to.deep.equal({});
            });
        });

        describe("setDataFromFeature", () => {
            it("should clear component data when the feature is undefined", () => {
                wrapper.vm.setDataFromFeature(undefined);

                expect(wrapper.vm.adjustedDamageClass).to.equal("");
                expect(wrapper.vm.adjustedDate).to.equal("");
                expect(wrapper.vm.comment).to.equal("");
            });

            it("should use empty values for missing feature properties", () => {
                wrapper.vm.setDataFromFeature(createFeature());

                expect(wrapper.vm.adjustedDamageClass).to.equal("");
                expect(wrapper.vm.adjustedDate).to.equal("");
                expect(wrapper.vm.comment).to.equal("");
            });
        });

        describe("setDataToFeature", () => {
            beforeEach(() => {
                sinon.useFakeTimers({now: new Date("2026-09-22T12:00:00"), toFake: ["Date"]});
            });

            it("should set feature data with the configured namespace", () => {
                const feature = createFeature();

                wrapper.vm.adjustedDamageClass = 5;
                wrapper.vm.comment = "updated";
                wrapper.vm.setDataToFeature(feature, "de.hh.up:");

                expect(feature.get("de.hh.up:sk_angepasst")).to.equal(5);
                expect(feature.get("de.hh.up:sk_anpdatum")).to.equal("2026-09-22");
                expect(feature.get("de.hh.up:kommentar")).to.equal("updated");
            });

            it("should write empty values when component data is missing", () => {
                const feature = createFeature();

                wrapper.vm.adjustedDamageClass = undefined;
                wrapper.vm.comment = undefined;
                wrapper.vm.setDataToFeature(feature, "");

                expect(feature.get("sk_angepasst")).to.be.undefined;
                expect(feature.get("sk_anpdatum")).to.equal("2026-09-22");
                expect(feature.get("kommentar")).to.be.undefined;
            });
        });


        describe("toggleLayerVisibility", () => {
            it("should toggle visibility for every item", () => {
                replaceByIdInLayerConfig.resetHistory();

                wrapper.vm.toggleLayerVisibility(itemList);

                expect(replaceByIdInLayerConfig.callCount).to.equal(2);
            });

            it("should not dispatch for an empty item list", () => {
                replaceByIdInLayerConfig.resetHistory();

                wrapper.vm.toggleLayerVisibility([]);

                expect(replaceByIdInLayerConfig.called).to.be.false;
            });
        });

        describe("hideSelectedItem", () => {
            it("should hide the selected item layer", () => {
                wrapper.vm.hideSelectedItem(wrapper.vm.selectedItem);

                expect(replaceByIdInLayerConfig.calledWith(sinon.match.any, {
                    layerConfigs: [{
                        id: "wms-1",
                        layer: {
                            id: "wms-1",
                            visibility: false
                        }
                    }]
                })).to.be.true;
            });
        });

        describe("toggleSelectedItem", () => {
            it("should select the requested item and deselect the others", () => {
                wrapper.vm.toggleSelectedItem(itemList[1], itemList);

                expect(itemList[0].selected).to.be.false;
                expect(itemList[1].selected).to.be.true;
            });

            it("should throw for an unknown item", () => {
                expect(() => wrapper.vm.toggleSelectedItem(undefined, itemList)).to.throw();
            });
        });
        describe("updatePotentialDamagedBuilding", () => {
            it("should update a potential damaged building and send a transaction", () => {
                const feature = createFeature({sk_aktuell: 4});
                const item = {...itemList[0], wfstConfig: {url: "wfs-url"}};

                wrapper.vm.updatePotentialDamagedBuilding(item, feature);

                expect(sendTransaction.calledWith("EPSG:25832", feature, "wfs-url", item.wfstConfig, "selectedUpdate")).to.be.true;
                expect(feature.get("de.hh.up:sk_aktuell")).to.equal(4);
            });

            it("should load missing WFS configuration before sending a transaction", () => {
                const feature = createFeature();
                const item = {...itemList[0]};
                const wfstConfig = {url: "wfs-url"};

                getLayerWhere.returns(wfstConfig);
                wrapper.vm.updatePotentialDamagedBuilding(item, feature);

                expect(getLayerWhere.calledWith({id: item.wfstId})).to.be.true;
                expect(item.wfstConfig).to.equal(wfstConfig);
            });
        });
        describe("updateSelectedItem", () => {
            it("should update the selected item and remove its marker", () => {
                const toggleSelectedItem = sinon.stub(wrapper.vm, "toggleSelectedItem"),
                    toggleLayerVisibility = sinon.stub(wrapper.vm, "toggleLayerVisibility");

                wrapper.vm.updateSelectedItem("second", itemList);

                expect(toggleSelectedItem.calledWith(itemList[1], itemList)).to.be.true;
                expect(toggleLayerVisibility.calledWith(itemList)).to.be.true;
                expect(wrapper.vm.selectedFeature).to.be.undefined;
                expect(removePointMarker.called).to.be.true;
            });

            it("should throw for an unknown item name", () => {
                expect(() => wrapper.vm.updateSelectedItem("unknown", itemList)).to.throw();
            });
        });
    });
});
