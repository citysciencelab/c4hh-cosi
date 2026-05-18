import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import StoryCreatorChapter from "../../../components/StoryCreatorChapter.vue";
import store from "@appstore/index.js";

config.global.mocks.$t = key => key;

describe("addons/storyCreator/components/StoryCreatorChapter.vue", () => {
    let localStore, wrapper;

    beforeAll(() => {
        i18next.init({
            lng: "cimode",
            debug: false
        });
    });

    beforeEach(() => {
        localStore = createStore({
            namespaced: true,
            getters: {
                configuredModules: () => sinon.stub()
            }
        });
        wrapper = shallowMount(StoryCreatorChapter, {
            global: {
                plugins: [localStore]
            }
        });
        store.getters = {
            "common:modules.legend.name": () => "Legend",
            "common:modules.contact.name": () => "Contact",
            "common:modules.print.name": () => "Print"
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            expect(wrapper.exists()).to.be.true;
        });

        it("should find shared component FlatButton", () => {
            expect(wrapper.findComponent({name: "FlatButton"}).exists()).to.be.true;
        });

        it("should find vue multiselect component", () => {
            expect(wrapper.findComponent({name: "Multiselect"}).exists()).to.be.true;
            expect(wrapper.findAllComponents({name: "Multiselect"})).to.be.lengthOf(2);

        });
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            expect(wrapper.exists()).to.be.true;
        });

        it("should find shared component FlatButton", () => {
            expect(wrapper.findComponent({name: "FlatButton"}).exists()).to.be.true;
        });

        it("should find vue multiselect component", () => {
            expect(wrapper.findComponent({name: "Multiselect"}).exists()).to.be.true;
            expect(wrapper.findAllComponents({name: "Multiselect"})).to.be.lengthOf(2);

        });
    });

    describe("Methods", () => {
        describe("getLayerList", () => {
            it("should return empty array", () => {
                expect(wrapper.vm.getLayerList(null)).to.deep.equal([]);
                expect(wrapper.vm.getLayerList(0)).to.deep.equal([]);
                expect(wrapper.vm.getLayerList("")).to.deep.equal([]);
                expect(wrapper.vm.getLayerList({})).to.deep.equal([]);
                expect(wrapper.vm.getLayerList(false)).to.deep.equal([]);
                expect(wrapper.vm.getLayerList(undefined)).to.deep.equal([]);
            });

            it("should return sorted layer list in array", () => {
                const layerList = [
                        {id: 1, typ: "WMS", name: "B Layer"},
                        {id: 2, typ: "WFS", name: "A Layer"},
                        {id: 3, typ: "WMS", name: "A Layer"},
                        {id: 4, typ: "WMS", name: "C Layer"}
                    ],
                    results = [
                        {layerId: 3, label: "A Layer"},
                        {layerId: 1, label: "B Layer"},
                        {layerId: 4, label: "C Layer"}
                    ];

                expect(wrapper.vm.getLayerList(layerList)).to.deep.equal(results);
            });
        });

        describe("getToolList", () => {
            it("should return empty array", () => {
                expect(wrapper.vm.getToolList(null)).to.deep.equal([]);
                expect(wrapper.vm.getToolList(0)).to.deep.equal([]);
                expect(wrapper.vm.getToolList("")).to.deep.equal([]);
                expect(wrapper.vm.getToolList({})).to.deep.equal([]);
                expect(wrapper.vm.getToolList(false)).to.deep.equal([]);
                expect(wrapper.vm.getToolList(undefined)).to.deep.equal([]);
            });

            it("should return tool list in array", () => {
                const toolList = [
                        {type: "legend"},
                        {type: "contact"},
                        {type: "print"}
                    ],
                    results = [
                        {label: "Contact", toolId: "contact"},
                        {label: "Legend", toolId: "legend"},
                        {label: "Print", toolId: "print"}
                    ];

                expect(wrapper.vm.getToolList(toolList)).to.deep.equal(results);
            });
        });
    });
});
