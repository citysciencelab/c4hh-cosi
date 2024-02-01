import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ParcelinfoTheme from "../../../components/ParcelinfoTheme.vue";
import FlatButton from "../../../../../../../src_3_0_0/shared/modules/buttons/components/FlatButton.vue";
config.global.mocks.$t = key => key;
import Map from "ol/Map";
import sinon from "sinon";

describe("addons/parcelinfo/components/ParcelinfoTheme.vue", () => {
    const feature = {
            getMappedProperties () {
                return {
                    "Fläche": "10",
                    "Land": "Hamburg",
                    "Gemarkung": "bValue",
                    "Flurstück": "aValue",
                    "Straße": "Hamburger Straße"
                };
            }
        },
        factory = {
            getShallowMount: (isModuleAvailable = true, mappedProperties = feature.getMappedProperties(), arePropsAvailable = false) => {
                return shallowMount(ParcelinfoTheme, {
                    props: {
                        feature
                    },
                    computed: {
                        isModuleAvailable: () => () => isModuleAvailable,
                        mappedProperties: () => mappedProperties,
                        arePropsAvailable: () => arePropsAvailable
                    }
                });
            }
        };

    beforeEach(() => {
        mapCollection.clear();
        mapCollection.addMap(new Map(), "2D");
    });

    afterEach(() => {
        sinon.restore();
    });


    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find("table").exists()).to.be.true;
        });

        it("should contain gfi attributes", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.findAll("td").at(0).text()).to.equal("Fläche");
            expect(wrapper.findAll("td").at(1).text()).to.equal("10");
            expect(wrapper.findAll("td").at(2).text()).to.equal("Land");
            expect(wrapper.findAll("td").at(3).text()).to.equal("Hamburg");
            expect(wrapper.findAll("td").at(4).text()).to.equal("Gemarkung");
            expect(wrapper.findAll("td").at(5).text()).to.equal("bValue");
            expect(wrapper.findAll("td").at(6).text()).to.equal("Flurstück");
            expect(wrapper.findAll("td").at(7).text()).to.equal("aValue");
            expect(wrapper.findAll("td").at(8).text()).to.equal("Straße");
            expect(wrapper.findAll("td").at(9).text()).to.equal("Hamburger Straße");
        });

        it("should contain button if module is available and gfi displays Flurstück und Gemarkung", async () => {
            const wrapper = factory.getShallowMount(true, undefined, true);

            expect(wrapper.findComponent(FlatButton).exists()).to.be.true;
        });

        it("should not contain button if gfi does not display Flurstück und Gemarkung", async () => {
            const wrapper = factory.getShallowMount(true, undefined, false);

            expect(wrapper.findComponent(FlatButton).exists()).to.be.false;
        });

        it("should not contain button if module is not available", () => {
            const wrapper = factory.getShallowMount(false);

            expect(wrapper.findComponent(FlatButton).exists()).to.be.false;
        });
    });

    describe("Hooks", () => {
        describe("Mounted", () => {
            it("should not has a highlighting layer", () => {
                const wrapper = factory.getShallowMount();

                expect(wrapper.vm.highlightLayer).to.not.be.undefined;
            });
            it("should has a highlighting layer", () => {
                const wrapper = factory.getShallowMount(false);

                expect(wrapper.vm.highlightLayer).to.be.undefined;
            });
            it("should call 'createAndAddLayer' if parcel report tool is available", () => {
                const spyCreateAndAddLayer = sinon.spy(ParcelinfoTheme.methods, "createAndAddLayer");

                factory.getShallowMount();
                expect(spyCreateAndAddLayer.calledOnce).to.be.true;
            });
            it("should not call 'createAndAddLayer' if parcel report tool not is available", () => {
                const spyCreateAndAddLayer = sinon.spy(ParcelinfoTheme.methods, "createAndAddLayer");

                factory.getShallowMount(false);
                expect(spyCreateAndAddLayer.notCalled).to.be.true;
            });
            it("should should call 'getAndAddFeature' if parcel report tool is available and the right feature props are available", () => {
                const stubGetAndAddFeature = sinon.stub(ParcelinfoTheme.methods, "getAndAddFeature");

                factory.getShallowMount(true, true, true);
                expect(stubGetAndAddFeature.called).to.be.true;
            });
            it("should not call 'getAndAddFeature' if parcel report tool is available but the right feature props are not available", () => {
                const stubGetAndAddFeature = sinon.stub(ParcelinfoTheme.methods, "getAndAddFeature");

                factory.getShallowMount();
                expect(stubGetAndAddFeature.notCalled).to.be.true;
            });
        });

        describe("unmounted", () => {
            it("should remove the highlight layer from the map", () => {
                const wrapper = factory.getShallowMount();

                wrapper.unmount();
                expect(mapCollection.getMap("2D").getLayers().getArray()).to.be.an("array").that.is.empty;
            });
        });
    });

    describe("Methods", () => {
        describe("getAndAddFeature", () => {
            it("should call 'getFeatureFromWFS'", () => {
                const stubGetFeatureFromWFS = sinon.stub(ParcelinfoTheme.methods, "getFeatureFromWFS"),
                    wrapper = factory.getShallowMount();

                wrapper.vm.getAndAddFeature({typ: "WFS"});
                expect(stubGetFeatureFromWFS.calledOnce).to.be.true;
            });
            it("should call 'getFeatureFromOAF'", () => {
                const stubGetFeatureFromOAF = sinon.stub(ParcelinfoTheme.methods, "getFeatureFromOAF"),
                    wrapper = factory.getShallowMount();

                wrapper.vm.getAndAddFeature({typ: "OAF"});
                expect(stubGetFeatureFromOAF.calledOnce).to.be.true;
            });
        });
    });
});
