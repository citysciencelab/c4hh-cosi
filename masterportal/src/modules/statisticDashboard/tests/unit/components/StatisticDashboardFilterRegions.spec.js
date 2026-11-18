import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import StatisticDashboardFilterRegions from "@modules/statisticDashboard/components/StatisticDashboardFilterRegions.vue";
import indexStatisticDashboard from "@modules/statisticDashboard/store/indexStatisticDashboard.js";
import {Multiselect} from "vue-multiselect";
import sinon from "sinon";


describe("src/modules/statiscticDashboard/components/StatisticDashboardFilterRegions.vue", () => {
    const factory = {
        createVuexStore: () => {
            return createStore({
                modules: {
                    Maps: {
                        namespaced: true,
                        getters: {
                            projection: () => {
                                return {
                                    id: "http://www.opengis.net/gml/srs/epsg.xml#25832",
                                    name: "EPSG:25832",
                                    projName: "utm",
                                    getCode: () => "EPSG:25832"
                                };
                            }
                        }
                    },
                    Modules: {
                        namespaced: true,
                        modules: {
                            StatisticDashboard: {
                                ...indexStatisticDashboard,
                                state: structuredClone(indexStatisticDashboard.state)
                            }
                        }
                    }
                }
            });
        }
    };

    describe.skip("Component DOM", () => {
        it("should exist", () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(StatisticDashboardFilterRegions, {
                    propsData: {
                        regions: []
                    },
                    global: {
                        plugins: [store]
                    }
                });

            expect(wrapper.exists()).to.be.true;
        });

        it("should find one vue multiselect component and no buttos for top level regions", () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(StatisticDashboardFilterRegions, {
                    propsData: {
                        regions: [{
                            attrName: "atlantis",
                            name: "Atlantis",
                            values: [],
                            selectedValues: []
                        }]
                    },
                    global: {
                        plugins: [store]
                    }
                });

            expect(wrapper.findAllComponents(Multiselect)).to.be.an("array").with.lengthOf(1);
            expect(wrapper.find("button").exists()).to.be.false;
        });

        it("should find two vue multiselect components and no buttos for top level regions", () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(StatisticDashboardFilterRegions, {
                    propsData: {
                        regions: [
                            {
                                attrName: "atlantis",
                                name: "Atlantis",
                                values: [],
                                selectedValues: []
                            },
                            {
                                attrName: "auenland",
                                name: "Auenland",
                                values: [],
                                selectedValues: []
                            }
                        ]
                    },
                    global: {
                        plugins: [store]
                    }
                });

            expect(wrapper.findAllComponents(Multiselect)).to.be.an("array").with.lengthOf(2);
            expect(wrapper.find("button").exists()).to.be.false;
        });

        it("should find one vue multiselect components and buttos for top level regions", () => {
            const store = factory.createVuexStore(),
                wrapper = shallowMount(StatisticDashboardFilterRegions, {
                    propsData: {
                        regions: [
                            {
                                attrName: "atlantis",
                                name: "Atlantis",
                                values: [{label: "Hamen"}, {label: "Bremburg"}],
                                selectedValues: [],
                                child: {}
                            },
                            {
                                attrName: "auenland",
                                name: "Auenland",
                                values: [],
                                selectedValues: []
                            }
                        ]
                    },
                    global: {
                        plugins: [store]
                    }
                });

            expect(wrapper.findAllComponents(Multiselect)).to.be.an("array").with.lengthOf(1);
            expect(wrapper.findAll("button")).to.be.an("array").with.lengthOf(3);
            expect(wrapper.findAll("button").at(1).text()).to.be.equal("Hamen");
            expect(wrapper.findAll("button").at(2).text()).to.be.equal("Bremburg");
        });
    });
    describe("methods", () => {
        describe("hasRegionChild", () => {
            it("should return true if given object has the key child", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(StatisticDashboardFilterRegions, {
                        propsData: {
                            regions: []
                        },
                        global: {
                            plugins: [store]
                        }
                    });

                expect(wrapper.vm.hasRegionChild({child: true})).to.be.true;
            });
            it("should return false if given object has no key child", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(StatisticDashboardFilterRegions, {
                        propsData: {
                            regions: []
                        },
                        global: {
                            plugins: [store]
                        }
                    });

                expect(wrapper.vm.hasRegionChild({})).to.be.false;
            });
        });
        describe("isAllSelected", () => {
            const values = [
                {value: "Schwerin", title: "Schwerin"},
                {value: "Anklam", title: "Anklam"}
            ];
            let wrapper;

            beforeEach(() => {
                wrapper = shallowMount(StatisticDashboardFilterRegions, {
                    global: {
                        plugins: [factory.createVuexStore()]
                    }
                });
            });

            it("should return false for invalid regions", () => {
                [undefined, null, "", [], {}].forEach(value => {
                    expect(wrapper.vm.isAllSelected(value)).to.be.false;
                });
            });

            it("should return false if the region has no values", () => {
                expect(wrapper.vm.isAllSelected({values: [], selectedValues: []})).to.be.false;
            });

            it("should return false if not all values are selected", () => {
                expect(wrapper.vm.isAllSelected({values, selectedValues: [values[0]]})).to.be.false;
            });

            it("should return true if all values are selected", () => {
                expect(wrapper.vm.isAllSelected({values, selectedValues: [...values]})).to.be.true;
            });
        });
        describe.skip("setSelectedValuesToRegion", () => {
            it("should call 'setSelectedRegions' if given region has no child", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(StatisticDashboardFilterRegions, {
                        propsData: {
                            regions: []
                        },
                        global: {
                            plugins: [store]
                        }
                    }),
                    stubSetSelectedRegions = sinon.stub(wrapper.vm, "setSelectedRegions");

                wrapper.vm.setSelectedValuesToRegion([], {});

                expect(stubSetSelectedRegions.calledOnce).to.be.true;
                expect(stubSetSelectedRegions.calledWith([])).to.be.true;
            });

            it("should call 'setSelectedRegions' if given region has child", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(StatisticDashboardFilterRegions, {
                        propsData: {
                            regions: []
                        },
                        global: {
                            plugins: [store]
                        }
                    }),
                    stubSetSelectedRegions = sinon.stub(wrapper.vm, "setSelectedRegions");

                wrapper.vm.setSelectedValuesToRegion([], {child: {}});

                expect(stubSetSelectedRegions.calledOnce).to.be.true;
                expect(stubSetSelectedRegions.calledWith([])).to.be.true;
            });

            it("should call 'getValuesFromLayer' if given value is not empty array", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(StatisticDashboardFilterRegions, {
                        propsData: {
                            regions: []
                        },
                        global: {
                            plugins: [store]
                        }
                    }),
                    stubGetValuesFromLayer = sinon.stub(wrapper.vm, "getValuesFromLayer");

                wrapper.vm.setSelectedValuesToRegion(["value"], {child: {}});

                expect(stubGetValuesFromLayer.calledOnce).to.be.true;
            });
        });
        describe("updatesRegionSelectedValues", () => {
            it("should remove the correct value", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(StatisticDashboardFilterRegions, {
                        propsData: {
                            regions: []
                        },
                        global: {
                            plugins: [store]
                        }
                    }),
                    selectedValues = [{title: "Mordor"}, {title: "Manhatten"}],
                    values = [{title: "Mordor"}],
                    newSelectedValues = wrapper.vm.updatesRegionSelectedValues(selectedValues, values);

                expect(newSelectedValues).to.deep.equal([{title: "Mordor"}]);

            });

            it("should neither remove or add any value", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(StatisticDashboardFilterRegions, {
                        propsData: {
                            regions: []
                        },
                        global: {
                            plugins: [store]
                        }
                    }),
                    selectedValues = [{title: "Mordor"}, {title: "Manhatten"}],
                    values = [{title: "Mordor"}, {title: "Manhatten"}, {title: "Wilhelmsburg"}],
                    newSelectedValues = wrapper.vm.updatesRegionSelectedValues(selectedValues, values);

                expect(newSelectedValues).to.deep.equal([{title: "Mordor"}, {title: "Manhatten"}]);
            });

            it("should remove all selected values", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(StatisticDashboardFilterRegions, {
                        propsData: {
                            regions: []
                        },
                        global: {
                            plugins: [store]
                        }
                    }),
                    selectedValues = [{label: "Mordor"}, {label: "Manhatten"}],
                    values = [],
                    newSelectedValues = wrapper.vm.updatesRegionSelectedValues(selectedValues, values);

                expect(newSelectedValues).to.deep.equal([]);
            });
        });
        describe("updatesTopLevelRegionSelectedValues", () => {
            it("should call 'setSelectedValuesToRegion' with the correct params", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(StatisticDashboardFilterRegions, {
                        propsData: {
                            regions: []
                        },
                        global: {
                            plugins: [store]
                        }
                    }),
                    stubSetSelectedValuesToRegion = sinon.stub(wrapper.vm, "setSelectedValuesToRegion"),
                    region = {
                        selectedValues: [{value: "Mordor"}, {value: "Manhatten"}]
                    };

                wrapper.vm.updatesTopLevelRegionSelectedValues({value: "Mordor"}, region);

                expect(stubSetSelectedValuesToRegion.calledWith([{value: "Manhatten"}], region)).to.be.true;
            });

            it("should call 'setSelectedValuesToRegion' with the correct params", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(StatisticDashboardFilterRegions, {
                        propsData: {
                            regions: []
                        },
                        global: {
                            plugins: [store]
                        }
                    }),
                    stubSetSelectedValuesToRegion = sinon.stub(wrapper.vm, "setSelectedValuesToRegion"),
                    region = {
                        selectedValues: [{value: "Mordor"}, {value: "Manhatten"}]
                    };

                wrapper.vm.updatesTopLevelRegionSelectedValues({value: "Wilhelmsburg"}, region);

                expect(stubSetSelectedValuesToRegion.calledWith([{value: "Mordor"}, {value: "Manhatten"}, {value: "Wilhelmsburg"}], region)).to.be.true;
            });
        });
        describe("toggleButtonActive", () => {
            it("should get the string 'active-button'", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(StatisticDashboardFilterRegions, {
                        propsData: {
                            regions: []
                        },
                        global: {
                            plugins: [store]
                        }
                    }),
                    classString = wrapper.vm.toggleButtonActive({value: "Mordor"}, [{value: "Mordor"}, {value: "Manhatten"}]);

                expect(classString).to.be.equal("active-button");
            });

            it("should get an empty string", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(StatisticDashboardFilterRegions, {
                        propsData: {
                            regions: []
                        },
                        global: {
                            plugins: [store]
                        }
                    }),
                    classString = wrapper.vm.toggleButtonActive({value: "Mordor"}, [{value: "Manhatten"}]);

                expect(classString).to.be.equal("");
            });
        });
        describe("selectAll", () => {
            it("should call 'setSelectedValuesToRegion' with the correct parameter", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(StatisticDashboardFilterRegions, {
                        propsData: {
                            regions: []
                        },
                        global: {
                            plugins: [store]
                        }
                    }),
                    stubSetSelectedValuesToRegion = sinon.stub(wrapper.vm, "setSelectedValuesToRegion"),
                    region = {
                        values: [{value: "test1"}, {value: "test2"}],
                        selectedValues: [{value: "Mordor"}]
                    };

                wrapper.vm.selectAll(region);

                expect(stubSetSelectedValuesToRegion.calledWith([{value: "Mordor"}, {value: "test1"}, {value: "test2"}], region)).to.be.true;
            });
        });
        describe.skip("requestScheme", () => {
            it("should return false if the first param is not an object", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(StatisticDashboardFilterRegions, {
                        propsData: {
                            regions: []
                        },
                        global: {
                            plugins: [store]
                        }
                    });

                expect(wrapper.vm.requestScheme([])).to.be.false;
                expect(wrapper.vm.requestScheme(null)).to.be.false;
                expect(wrapper.vm.requestScheme(true)).to.be.false;
                expect(wrapper.vm.requestScheme(false)).to.be.false;
                expect(wrapper.vm.requestScheme("1234")).to.be.false;
                expect(wrapper.vm.requestScheme(1234)).to.be.false;
                expect(wrapper.vm.requestScheme(undefined)).to.be.false;
            });
            it("should return false if the second param is false", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(StatisticDashboardFilterRegions, {
                        propsData: {
                            regions: []
                        },
                        global: {
                            plugins: [store]
                        }
                    });

                expect(wrapper.vm.requestScheme({}, false)).to.be.false;
            });
            it("should return true if given region has all selected and parent snippets aswell", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(StatisticDashboardFilterRegions, {
                        propsData: {
                            regions: []
                        },
                        global: {
                            plugins: [store]
                        }
                    });

                expect(wrapper.vm.requestScheme({
                    attrName: "auenland",
                    name: "Auenland",
                    values: ["foo"],
                    selectedValues: ["foo"]
                }, true)).to.be.true;
            });
            it("should return true if given region has all selected and parent snippets aswell", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(StatisticDashboardFilterRegions, {
                        propsData: {
                            regions: [
                                {
                                    attrName: "atlantis",
                                    name: "Atlantis",
                                    values: ["foo"],
                                    selectedValues: ["foo"]
                                },
                                {
                                    attrName: "auenland",
                                    name: "Auenland",
                                    values: ["foo"],
                                    selectedValues: ["foo"]
                                }
                            ]
                        },
                        global: {
                            plugins: [store]
                        }
                    });

                expect(wrapper.vm.requestScheme({
                    attrName: "auenland",
                    name: "Auenland",
                    values: ["foo"],
                    selectedValues: ["foo"]
                }, true)).to.be.true;
            });
            it("should return false if given region has all selected and one parent snippet doesnt", () => {
                const store = factory.createVuexStore(),
                    wrapper = shallowMount(StatisticDashboardFilterRegions, {
                        propsData: {
                            regions: [
                                {
                                    attrName: "atlantis",
                                    name: "Atlantis",
                                    values: ["foo", "bar"],
                                    selectedValues: ["foo"]
                                },
                                {
                                    attrName: "auenland",
                                    name: "Auenland",
                                    values: ["foo"],
                                    selectedValues: ["foo"]
                                }
                            ]
                        },
                        global: {
                            plugins: [store]
                        }
                    });

                expect(wrapper.vm.requestScheme({
                    attrName: "auenland",
                    name: "Auenland",
                    values: ["foo"],
                    selectedValues: ["foo"]
                }, true)).to.be.false;
            });
        });
    });
});
