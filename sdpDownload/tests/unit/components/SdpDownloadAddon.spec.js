import Vuex from "vuex";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import SDPComponent from "../../../components/SdpDownload.vue";
import SdpDownload from "../../../store/index.js";
import sinon from "sinon";
import {expect} from "chai";

const localVue = createLocalVue();

localVue.use(Vuex);
// mock vue-i18n
config.mocks.$t = key => key;

describe("SdpDownload.vue", () => {

    const mockConfigJson = {
        Portalconfig: {
            menu: {
                tools: {
                    children: {
                        SdpDownload:
                            {
                                "name": "SDP Download",
                                "icon": "bi-download"
                            }
                    }
                }
            }
        }
    };
    let store;

    beforeEach(() => {
        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        SdpDownload
                    }
                }
            },
            state: {
                configJson: mockConfigJson,
                selectedAreaGeoJson: {}
            }
        });
        store.commit("Modules/SdpDownload/setActive", true);

    });

    it("should find Tool component", () => {
        const wrapper = shallowMount(SDPComponent, {store, localVue}),
            toolWrapper = wrapper.findComponent({name: "ToolTemplate"});

        expect(toolWrapper.exists()).to.be.true;

    });

    it("renders the SDPAddon", () => {
        const wrapper = shallowMount(SDPComponent, {store, localVue});

        expect(wrapper.find("#sdp-download").exists()).to.be.true;

    });
    it("SDPAddon contains correct amount (4 formats) of available options in format select", () => {
        const wrapper = shallowMount(SDPComponent, {store, localVue});

        expect(wrapper.findAll("select#formatSelection > option").length).to.be.equal(4);

    });
    it("SDPAddon contains div for graphical selection", () => {
        const wrapper = shallowMount(SDPComponent, {store, localVue});

        expect(wrapper.find(".form-control").exists()).to.be.true;

    });
    it("should call requestCompressedData function if selectedDownload is clicked", async () => {
        // declaration of sinon spy before wrapper otherwise the test fails
        const spyDownload = sinon.stub(SDPComponent.methods, "requestCompressedData"),
            wrapper = shallowMount(SDPComponent, {store, localVue}),
            button = wrapper.find("#button-selectedDownload");

        await button.trigger("click");
        expect(spyDownload.calledOnce).to.be.true;

        spyDownload.restore();
    });
    it("should call download function if Neuwerk format button is clicked", async () => {
        const spyDownload = sinon.stub(SDPComponent.methods, "requestCompressIslandData"),
            wrapper = shallowMount(SDPComponent, {store, localVue}),
            button = wrapper.find("#button-neuwerk");

        await button.trigger("click");
        expect(spyDownload.calledOnce).to.be.true;

        spyDownload.restore();
    });
    it("should call download function if Scharhoern format button is clicked", async () => {
        const spyDownload = sinon.stub(SDPComponent.methods, "requestCompressIslandData"),
            wrapper = shallowMount(SDPComponent, {store, localVue}),
            button = wrapper.find("#button-scharhoern");

        await button.trigger("click");
        expect(spyDownload.calledOnce).to.be.true;

        spyDownload.restore();
    });
    it("should call download function if tile overview 310 format button is clicked", async () => {
        const spyDownload = sinon.stub(SDPComponent.methods, "requestCompressRasterOverviewData"),
            wrapper = shallowMount(SDPComponent, {store, localVue}),
            button = wrapper.find("#button-310");

        await button.trigger("click");
        expect(spyDownload.calledOnce).to.be.true;

        spyDownload.restore();
    });
    it("should call download function if tile overview 320 format button is clicked", async () => {
        const spyDownload = sinon.stub(SDPComponent.methods, "requestCompressRasterOverviewData"),
            wrapper = shallowMount(SDPComponent, {store, localVue}),
            button = wrapper.find("#button-320");

        await button.trigger("click");
        expect(spyDownload.calledOnce).to.be.true;

        spyDownload.restore();
    });
    it("should call setSelectedFormat function if select is changed", async () => {
        const spy = sinon.spy(SDPComponent.methods, "setSelectedFormat"),
            wrapper = shallowMount(SDPComponent, {store, localVue}),
            select = wrapper.find("#formatSelection");

        await select.trigger("change");
        expect(spy.calledOnce).to.be.true;

        spy.restore();
    });
});
