import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import {createStore} from "vuex";
import VerkehrsstaerkenTheme from "../../../components/VerkehrsstaerkenTheme.vue";


config.global.mocks.$t = key => key;

describe("addons/gfiThemes/verkehrsstaerken/components/VerkehrsstaerkenTheme.vue", () => {

    const mappedProps = {"Zählstelle": "2693", "Bezeichnung": "Beim Schlump NO Schäferkampsallee T179", "Art": "Kurzpegel", "DTV 2008": "17000", "DTVw 2008": "19000", "Schwerverkehrsanteil am DTVw 2008": "5 %", "DTV 2009": "17000", "DTVw 2009": "19000", "Schwerverkehrsanteil am DTVw 2009": "6 %", "DTV 2010": "17000", "DTVw 2010": "18000", "Schwerverkehrsanteil am DTVw 2010": "6 %", "DTV 2011": "17000", "DTVw 2011": "19000", "Schwerverkehrsanteil am DTVw 2011": "5 %", "DTV 2012": "16000", "DTVw 2012": "18000", "Schwerverkehrsanteil am DTVw 2012": "5 %", "DTV 2013": "16000", "DTVw 2013": "18000", "Schwerverkehrsanteil am DTVw 2013": "5 %", "DTV 2014": "16000", "DTVw 2014": "18000", "Schwerverkehrsanteil am DTVw 2014": "5 %", "DTV 2015": "16000", "DTVw 2015": "18000", "Schwerverkehrsanteil am DTVw 2015": "5 %", "DTV 2016": "18000", "DTVw 2016": "20000", "Schwerverkehrsanteil am DTVw 2016": "6 %", "Baustelleneinfluss 2016": "*", "DTV 2017": "16000", "DTVw 2017": "18000", "Schwerverkehrsanteil am DTVw 2017": "5 %", "DTV 2018": "16000", "DTVw 2018": "17000", "Schwerverkehrsanteil am DTVw 2018": "5 %"};
    let wrapper, store;

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                Menu: {
                    namespaced: true,
                    getters: {
                        mainExpanded: () => false,
                        currentSecondaryMenuWidth: () => sinon.stub().returns(0.25)
                    },
                    actions: {
                        toggleMenu: sinon.stub(),
                        setCurrentMenuWidth: sinon.stub()
                    }
                }
            }
        });

        wrapper = shallowMount(VerkehrsstaerkenTheme, {
            props: {
                feature: {
                    getMappedProperties: () => mappedProps
                }
            },
            computed: {
                isMobile: () => false,
                currentLocale: () => "de"
            },
            global: {
                plugins: [store]
            }
        });
    });
    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should exist", () => {
        expect(wrapper.find("div").exists()).to.be.true;
    });

    it("should show tabs", async () => {
        expect(wrapper.findAll("ul")[0].exists()).to.be.true;
        expect(wrapper.findAll("li").length).to.equal(2);
        expect(wrapper.findAll("li")[0].text()).to.equal("additional:modules.tools.gfi.themes.verkehrsstaerken.table");
        expect(wrapper.findAll("li")[1].text()).to.equal("additional:modules.tools.gfi.themes.verkehrsstaerken.diagram");
        expect(wrapper.find(".tab-content").exists()).to.be.true;
    });

    it("should contain download button", () => {
        expect(wrapper.find("flat-button-stub").exists()).to.be.true;
    });

    it("change tabs should change className", async () => {
        const tab = wrapper.findAll("a")[1];

        expect(wrapper.find("#verkehrsstaerken-table-tab").attributes().class).to.contain("active");

        expect(wrapper.find("#verkehrsstaerken-diagram-tab").attributes().class).not.to.contain("active");

        tab.trigger("click");
        await wrapper.vm.$nextTick();

        expect(wrapper.find("#verkehrsstaerken-table-tab").attributes().class).not.to.contain("active");

        expect(wrapper.find("#verkehrsstaerken-diagram-tab").attributes().class).to.contain("active");
    });
    describe("fullView", () => {
        let layerPillsMock, footerMock;

        beforeEach(() => {
            layerPillsMock = {style: {display: ""}};
            footerMock = {style: {display: ""}};
            sinon.stub(document, "getElementById").callsFake((id) => {
                if (id === "layer-pills") {
                    return layerPillsMock;
                }
                if (id === "module-portal-footer") {
                    return footerMock;
                }
                return null;
            });
        });
        it("should have a fullscreenview-button", () => {

            expect(wrapper.find("#gfi-view-full").exists()).to.be.true;
        });
        it("should hide footer on switch to fullView", () => {
            const fullViewSpy = sinon.spy(wrapper.vm, "fullView"),
                footer = document.getElementById("module-portal-footer");

            wrapper.vm.fullView();

            expect(fullViewSpy.calledOnce).to.be.true;
            expect(footer.style.display).to.equal("none");
            expect(wrapper.vm.fullViewActivated).to.be.true;
        });
        it("should hide layerPills on switch to fullView", () => {
            const fullViewSpy = sinon.spy(wrapper.vm, "fullView"),
                layerPills = document.getElementById("layer-pills");

            wrapper.vm.fullView();

            expect(fullViewSpy.calledOnce).to.be.true;
            expect(layerPills.style.display).to.equal("none");
            expect(wrapper.vm.fullViewActivated).to.be.true;
        });
        it("should show footer and layerPills after two fullView() calls", async () => {
            const fullViewSpy = sinon.spy(wrapper.vm, "fullView"),
                layerPills = document.getElementById("layer-pills"),
                footer = document.getElementById("module-portal-footer");

            wrapper.vm.fullView();

            await wrapper.vm.$nextTick();

            wrapper.vm.fullView();

            expect(fullViewSpy.calledTwice).to.be.true;
            expect(layerPills.style.display).to.equal("");
            expect(footer.style.display).to.equal("");
            expect(wrapper.vm.fullViewActivated).to.be.false;
        });
        it("should call setCurrentMenuWidth with correct arguments when fullView is activated", () => {
            const setCurrentMenuWidthStub = sinon.stub(wrapper.vm, "setCurrentMenuWidth");

            wrapper.vm.fullView();

            expect(setCurrentMenuWidthStub.calledOnce).to.be.true;
            expect(setCurrentMenuWidthStub.calledWith({
                type: "secondaryMenu",
                attributes: {width: 95}
            })).to.be.true;
        });
    });

});
