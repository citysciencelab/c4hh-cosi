import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Feature from "ol/Feature.js";
import Polygon from "ol/geom/Polygon.js";
import {Select} from "ol/interaction.js";
import sinon from "sinon";
import ValuationPrint from "../../../components/ValuationPrint.vue";
import {createStore} from "vuex";
import ModalItem from "../../../../../src/shared/modules/modals/components/ModalItem.vue";
import IconButton from "../../../../../src/shared/modules/buttons/components/IconButton.vue";
import WfsSearch from "../../../../../src/modules/wfsSearch/components/WfsSearch.vue";

config.global.mocks.$t = key => key;

describe("addons/valuationPrint/components/ValuationPrint.vue", () => {
    const features = [
            new Feature({
                flstnrzae: "12345",
                gemarkung: "ueberall",
                geometry: new Polygon([[
                    [574626.667, 5927656.188],
                    [574624.441, 5927658.443],
                    [574593.381, 5927689.913],
                    [574603.175, 5927698.901],
                    [574642.559, 5927658.998],
                    [574646.74, 5927654.762],
                    [574653.787, 5927647.622],
                    [574644.331, 5927638.291],
                    [574638.809, 5927643.886],
                    [574626.667, 5927656.188]]])
            }),
            new Feature({
                flstnrzae: "67890",
                gemarkung: "nirgends",
                geometry: new Polygon([[
                    [574729.649, 5927590.856],
                    [574676.641, 5927642.08],
                    [574690.16, 5927655.429],
                    [574705.504, 5927640.191],
                    [574711.97, 5927633.768],
                    [574742.688, 5927603.26],
                    [574729.649, 5927590.856]]])
            })
        ],
        mockMapActions = {
            addInteraction: sinon.spy(),
            removeInteraction: sinon.spy()
        },
        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    actions: mockMapActions,
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
                        namespaced: true,
                        WfsSearch: {
                            namespaced: true,
                            getters: {
                                results: () => []
                            }
                        },
                        ValuationPrint: {
                            namespaced: true,
                            mutations: {
                                setMessageList: sinon.stub(),
                                setSelectedFeatures: sinon.stub(),
                                setMultiSelectParcels: sinon.stub(),
                                setUrlList: sinon.stub(),
                                setPrintedFeature: sinon.stub()
                            }
                        }
                    }
                }
            }
        }),
        factory = {
            getShallowMount: (values = {}, isStatusLogVisible = true, isParcelSearch = false) => {
                return shallowMount(ValuationPrint, {
                    global: {
                        plugins: [store],
                        stubs: {
                            ModalItem: true
                        }
                    },
                    data () {
                        return {
                            selectedFeatures: [],
                            messageList: [],
                            specificAddress: "",
                            printedFeature: [],
                            ...values
                        };
                    },
                    computed: {
                        name: () => "Hallo",
                        icon: () => "small",
                        renderToWindow: () => false,
                        resizableWindow: () => false,
                        showStatusLog: () => isStatusLogVisible,
                        showParcelSearch: () => isParcelSearch,
                        reportPath: () => "config.valuation.json",
                        urlList: () => [],
                        showDownloadAll: () => false
                    },
                    slots: {
                        footer: "<div>Footer</div>"
                    }
                });
            },
            getMount: (values = {}, isStatusLogVisible = true, isParcelSearch = false) => {
                return mount(ValuationPrint, {
                    global: {
                        plugins: [store]
                    },
                    data () {
                        return {
                            ...values,
                            selectedFeatures: [],
                            messageList: [],
                            specificAddress: "",
                            printedFeature: []
                        };
                    },
                    computed: {
                        name: () => "Hallo",
                        icon: () => "small",
                        renderToWindow: () => false,
                        resizableWindow: () => false,
                        showStatusLog: () => isStatusLogVisible,
                        showParcelSearch: () => isParcelSearch,
                        reportPath: () => "config.valuation.json",
                        urlList: () => [],
                        showDownloadAll: () => false
                    }
                });
            }
        };

    let stubSetConfig;

    beforeEach(function () {
        sinon.stub(console, "warn").callsFake(sinon.spy());
        sinon.stub(console, "error").callsFake(sinon.spy());
        stubSetConfig = sinon.stub(ValuationPrint.methods, "setConfig");
        sinon.stub(ValuationPrint.methods, "createParcelLayer");
    });


    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should find Tool component", () => {
            const wrapper = factory.getShallowMount(),
                valuationDiv = wrapper.find("#tool-ValuationPrint");

            expect(valuationDiv.exists()).to.be.true;
        });

        it("should find one list per feature", async () => {
            const wrapper = factory.getShallowMount({});

            await wrapper.setData({
                selectedFeatures: features
            });
            expect(wrapper.findAll(".list-group-item")).to.be.lengthOf(2);
        });

        it("should render the feature properties correctly", async () => {
            const wrapper = factory.getShallowMount({});

            await wrapper.setData({
                selectedFeatures: [features[0]]
            });

            expect(wrapper.findAll(".parcel-label").at(0).text()).to.be.equal("additional:modules.valuationPrint.parcel");
            expect(wrapper.findAll(".font-bold").at(0).text()).to.be.equal("12345");
            expect(wrapper.findAll(".parcel-label").at(1).text()).to.be.equal("additional:modules.valuationPrint.district");
            expect(wrapper.findAll(".font-bold").at(1).text()).to.be.equal("ueberall");
        });

        it("should find one remove button per feature", async () => {
            const wrapper = factory.getShallowMount({});

            await wrapper.setData({
                selectedFeatures: features
            });

            expect(wrapper.findAllComponents(IconButton).length).to.be.equals(2);
        });

        it("should find one start button", async () => {
            const wrapper = factory.getShallowMount({}, true);

            await wrapper.setData({
                selectedFeatures: features
            });

            expect(wrapper.findAll("#start-valuation-print").length).to.be.equals(1);
        });

        it("should not add an error class to the list entry if no error is added", async () => {
            const wrapper = factory.getShallowMount({});

            await wrapper.setData({
                selectedFeatures: [features[0]],
                messageList: [{
                    message: "message",
                    isError: false
                }]
            });
            // wrapper.vm.addMessage("message", false);
            // await wrapper.vm.$forceUpdate();

            expect(wrapper.find(".messageListError").exists()).to.be.false;
        });

        it("should add an error class to the list entry if an error is added and status log is configured to be shown", async () => {
            const wrapper = factory.getShallowMount({});

            wrapper.vm.select.getFeatures().push(features[0]);
            wrapper.vm.addMessage("message", true);
            await wrapper.vm.$forceUpdate();

            expect(wrapper.find(".messageListError").exists()).to.be.true;
        });

        it("should not show any message if no message is added", async () => {
            const wrapper = factory.getShallowMount({});

            expect(wrapper.find(".messageListError").exists()).to.be.false;
            expect(wrapper.find(".messageListEntry").exists()).to.be.false;
        });

        it("should add two urls to the list entry if two urls are added", async () => {
            const wrapper = factory.getShallowMount({});

            wrapper.vm.addUrl("url", "name");
            wrapper.vm.addUrl("url2", "name2");

            await wrapper.vm.$forceUpdate();

            expect(wrapper.findAll(".urlListEntry").length).to.be.equals(2);
        });

        it("should not show any url if no url is added", async () => {
            const wrapper = factory.getShallowMount({});

            expect(wrapper.find(".urlListEntry").exists()).to.be.false;
        });

        it("should render pdf icon if only one url in url list is present", async () => {
            const wrapper = factory.getShallowMount({}, true, true);

            wrapper.vm.addUrl("url", "name");
            await wrapper.vm.$forceUpdate();

            expect(wrapper.findAll(".pdf-icon").length).to.be.equals(1);
        });

        it("should not render pdf icon if more than one url are present", async () => {
            const wrapper = factory.getShallowMount({});

            wrapper.vm.addUrl("url", "name");
            wrapper.vm.addUrl("url2", "name2");
            await wrapper.vm.$forceUpdate();

            expect(wrapper.find(".pdf-icon").exists()).to.be.false;
        });

        it("should render parcel report if showParcelSearch is false", async () => {
            const wrapper = factory.getShallowMount({}, true, false);

            expect(wrapper.find(".parcel-report").exists()).to.be.true;
        });

        it("should render WfsSearch if showParcelSearch is true", async () => {
            const wrapper = factory.getShallowMount({}, true, true);

            expect(wrapper.findComponent(WfsSearch).exists()).to.be.true;
        });

        it("should render progress bar if isInProcessOfCreatingReport and status log is configured not to be shown", async () => {
            const wrapper = factory.getShallowMount({}, false, true);

            wrapper.vm.isInProcessOfCreatingReport = true;
            await wrapper.vm.$forceUpdate();
            expect(wrapper.find(".progress").exists()).to.be.true;
        });

        it("should not render progress bar if status log is configured to be shown even if isInProcessOfCreatingReport", async () => {
            const wrapper = factory.getShallowMount({}, true, true);

            wrapper.vm.isInProcessOfCreatingReport = true;
            await wrapper.vm.$forceUpdate();
            expect(wrapper.find("progress").exists()).to.be.false;
        });

        it("should not find 'all-select' if there are features selected", async () => {
            const wrapper = factory.getMount({});

            expect(wrapper.find(".all-select").exists()).to.be.false;
        });

        it("should find 'all-select' if there are features selected", async () => {
            const wrapper = factory.getMount({});

            wrapper.vm.selectedFeatures.push(features[0]);
            wrapper.vm.selectedFeatures.push(features[1]);
            wrapper.vm.multiSelectParcels = true;

            await wrapper.vm.$forceUpdate();
            expect(wrapper.find(".all-select").exists()).to.be.true;
        });
    });

    describe("modal", () => {
        it("should render", () => {
            const wrapper = factory.getShallowMount({});

            wrapper.vm.showModal = true;
            expect(wrapper.findAllComponents(ModalItem).length).to.be.equals(1);
        });
    });

    describe("configuration of status log", () => {
        it("should render status log if configured to be shown", async () => {
            const wrapper = factory.getShallowMount({}, true);

            wrapper.vm.addMessage("message");
            await wrapper.vm.$forceUpdate();

            expect(wrapper.find(".messageListEntry").exists()).to.be.true;
        });

        it("should not render status log if configured not to be shown", async () => {
            const wrapper = factory.getShallowMount({}, false);

            wrapper.vm.addMessage("message");
            await wrapper.vm.$forceUpdate();

            expect(wrapper.find(".messageListEntry").exists()).to.be.false;
        });
    });

    describe("User Interactions", () => {
        it("should have only one selected layer if user has clicked on two and multiSelect is configured to be false", async () => {
            const wrapper = factory.getMount({}, true);

            wrapper.vm.multiSelectParcels = false;
            wrapper.vm.select.getFeatures().push(features[0]);
            wrapper.vm.select.dispatchEvent({
                type: "select",
                selected: [features[0]]
            });
            wrapper.vm.select.getFeatures().push(features[1]);
            wrapper.vm.select.dispatchEvent({
                type: "select",
                selected: [features[1]]
            });

            expect(wrapper.vm.select.getFeatures().getArray()).to.have.lengthOf(1);
        });

        it("should call 'removeFeature' if user click the remove button", async () => {
            const spyRemoveFeature = sinon.spy(ValuationPrint.methods, "removeFeature"),
                wrapper = factory.getMount({}, true);

            await wrapper.setData({
                selectedFeatures: features
            });
            await wrapper.findAll(".remove")[0].trigger("click");

            expect(spyRemoveFeature.calledOnce).to.be.true;
            spyRemoveFeature.restore();
        });

        it("should call 'getAddress' if user click the start button in list", async () => {
            const spyGetAddress = sinon.stub(ValuationPrint.methods, "getAddress"),
                wrapper = factory.getMount({}, true);

            await wrapper.setData({
                selectedFeatures: [features[0]],
                printedFeature: [features[0]]
            });
            await wrapper.find("#start-valuation-print").trigger("click");

            expect(spyGetAddress.calledOnce).to.be.true;

            spyGetAddress.restore();
        });

        it("should call 'setParcelData' if user click the start button in parcel list and modal is configured to not be required", async () => {
            const spySetParcelData = sinon.spy(ValuationPrint.methods, "setParcelData"),
                wrapper = factory.getMount({isModalRequired: false});

            await wrapper.setData({
                selectedFeatures: [features[0]],
                printedFeature: [features[0]]
            });
            wrapper.findComponent("#start-valuation-print").trigger("click");

            expect(spySetParcelData.calledOnce).to.be.true;

            spySetParcelData.restore();
        });

        it("should select all the parcels in options", async () => {
            const wrapper = factory.getMount({});

            wrapper.vm.selectedFeatures.push(features[0]);
            wrapper.vm.selectedFeatures.push(features[1]);
            wrapper.vm.multiSelectParcels = true;
            await wrapper.vm.$forceUpdate();
            await wrapper.find("#select-all").setChecked();
            expect(wrapper.vm.isAllSelected).to.be.true;
        });
    });

    describe("Watcher", () => {
        describe("parcelSearchFeature", () => {
            let stubParcelSearchFeature;

            beforeEach(function () {
                stubParcelSearchFeature = sinon.stub(ValuationPrint.methods, "handleParcelSearch");
            });


            it("should call handleParcelSearch, if the parcel search delivers a result", () => {
                const wrapper = factory.getShallowMount({});

                wrapper.vm.$options.watch.parcelSearchFeature.handler.call(wrapper.vm, [features[1]]);
                expect(stubParcelSearchFeature.calledOnce).to.be.true;
            });

            it("should not call handleParcelSearch", () => {
                const wrapper = factory.getShallowMount({});

                wrapper.vm.$options.watch.parcelSearchFeature.handler.call(wrapper.vm, undefined);
                expect(stubParcelSearchFeature.called).to.be.false;
            });
        });
    });

    describe("Hooks", () => {
        describe("Created", () => {
            it("should call setSelectInteraction if the component is created", () => {
                const spySetSelectInteraction = sinon.spy(ValuationPrint.methods, "setSelectInteraction");

                factory.getShallowMount({});

                expect(spySetSelectInteraction.calledOnce).to.be.true;

                spySetSelectInteraction.restore();
            });

            it("should call setConfig if the component is created", () => {
                factory.getShallowMount({});

                expect(stubSetConfig.called).to.be.true;
            });
        });
    });

    describe("Methods", () => {
        describe("getFilenameOfPDF", () => {
            it("should return the right file name", () => {
                const wrapper = factory.getShallowMount({});

                expect(wrapper.vm.getFilenameOfPDF("prefix", "2022-07-11")).to.equal("2022-07-11 prefix");
            });
        });

        describe("removeFeature", () => {
            it("should remove a feature from the select interaction", async () => {
                const wrapper = factory.getShallowMount({});

                wrapper.vm.select.getFeatures().push(features[0]);
                wrapper.vm.select.getFeatures().push(features[1]);
                await wrapper.setData({
                    selectedFeatures: features
                });
                wrapper.vm.removeFeature(features[0]);

                expect(wrapper.vm.select.getFeatures().getArray()).to.be.lengthOf(1);
            });
            it("should only remove data from type ol/Feature", () => {
                const wrapper = factory.getShallowMount({});

                wrapper.vm.select.getFeatures().push(features[0]);
                wrapper.vm.select.getFeatures().push(features[1]);
                wrapper.vm.removeFeature(122);
                wrapper.vm.removeFeature({});
                wrapper.vm.removeFeature(true);
                wrapper.vm.removeFeature(undefined);
                wrapper.vm.removeFeature(null);
                wrapper.vm.removeFeature([]);

                expect(wrapper.vm.select.getFeatures().getArray()).to.be.lengthOf(2);
            });
        });

        describe("setParcelData", () => {
            it("should set the parcelData object", () => {
                sinon.stub(ValuationPrint.methods, "formValidation").returns(true);
                const wrapper = factory.getShallowMount({});

                wrapper.vm.setParcelData([features[0]]);

                expect(wrapper.vm.parcelData).to.have.all.keys("center", "geometry", "extent", "feature", "featureList");
            });
            it("should not set the parcelData object", () => {
                const wrapper = factory.getShallowMount({});

                wrapper.vm.setParcelData(122);
                wrapper.vm.setParcelData({});
                wrapper.vm.setParcelData(true);
                wrapper.vm.setParcelData(undefined);
                wrapper.vm.setParcelData(null);
                wrapper.vm.setParcelData([]);

                expect(wrapper.vm.parcelData).to.be.null;
            });
        });

        describe("setSelectInteraction", () => {
            it("should set openlayers select interaction", () => {
                const wrapper = factory.getShallowMount({});

                expect(wrapper.vm.select).to.be.exists;
                expect(wrapper.vm.select instanceof Select).to.be.true;
            });
            it("should call addInteraction", () => {
                const spyAddInteraction = sinon.spy(ValuationPrint.methods, "addInteraction");

                factory.getShallowMount({}, true);

                expect(spyAddInteraction.calledOnce).to.be.true;

                spyAddInteraction.restore();
            });
        });

        describe("addMessage", () => {
            it("should initialize with an empty message list", () => {
                const wrapper = factory.getShallowMount({});

                expect(wrapper.vm.messageList).to.be.an("array").that.is.empty;
            });
            it("should add a message to the messageList", () => {
                const wrapper = factory.getShallowMount({});

                wrapper.vm.addMessage("message");
                expect(wrapper.vm.messageList).to.deep.equal([{message: "message", isError: false}]);
            });
            it("should add a message flaged as error to the messageList", () => {
                const wrapper = factory.getShallowMount({});

                wrapper.vm.addMessage("message", true);
                expect(wrapper.vm.messageList).to.deep.equal([{message: "message", isError: true}]);
            });
        });

        describe("formValidation", () => {
            it("should return false and set matching error only for documentNumber", async () => {
                const wrapper = factory.getShallowMount({});
                let isValid = false;

                await wrapper.setData({
                    specificAddress: "foo"
                });
                isValid = wrapper.vm.formValidation();
                expect(isValid).to.be.false;
                expect(wrapper.vm.errors.documentNumber).to.be.true;
            });
            it("should return false and set matching errors", () => {
                const wrapper = factory.getShallowMount({});
                let isValid = false;

                expect(isValid).to.be.false;
                isValid = wrapper.vm.formValidation();
                expect(wrapper.vm.errors).to.deep.equals({documentNumber: true, address: true});
            });
            it("should return true", () => {
                const wrapper = factory.getShallowMount({});

                wrapper.vm.documentNumber = "foo";
                wrapper.vm.specificAddress = "foo";
                expect(wrapper.vm.formValidation()).to.be.true;
                expect(wrapper.vm.errors).to.deep.equals({documentNumber: false, address: false});
            });
        });

        describe("getParcelByAttributes", () => {
            it("should return the right parcel feature", () => {
                const wrapper = factory.getShallowMount(),
                    parcelFeature = wrapper.vm.getParcelByAttributes(features, "ueberall", "12345");

                expect(parcelFeature).to.deep.equal(features[0]);
            });
            it("should return undefined if no parcel feature was found", () => {
                const wrapper = factory.getShallowMount(),
                    parcelFeature = wrapper.vm.getParcelByAttributes(features, "ueberall", "67890");

                expect(parcelFeature).to.be.undefined;
            });
        });

        describe("clearAndAddFeature", () => {
            it("should clear the feature collection of the select interaction and add the given feature", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.select.getFeatures().push(features[0]);
                wrapper.vm.clearAndAddFeature(features[1]);

                expect(wrapper.vm.select.getFeatures().getArray()).to.be.an("array").with.lengthOf(1);
                expect(wrapper.vm.select.getFeatures().getArray()[0]).to.deep.equal(features[1]);
            });
        });
    });

});
