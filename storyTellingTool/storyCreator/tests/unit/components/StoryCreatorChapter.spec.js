import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import StoryCreatorChapter from "../../../components/StoryCreatorChapter.vue";
import store from "@appstore/index.js";

config.global.mocks.$t = key => key;

describe("addons/storyCreator/components/StoryCreatorChapter.vue", () => {
    let localStore, map, wrapper;

    beforeAll(() => {
        i18next.init({
            lng: "cimode",
            debug: false
        });
    });

    beforeEach(() => {
        localStore = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        StoryCreator: {
                            namespaced: true,
                            getters: {
                                currentChapter: (state) => state.currentChapter,
                                story: (state) => state.story
                            },
                            mutations: {
                                setCurrentChapter (state, value) {
                                    state.currentChapter = value;
                                },
                                setCurrentView (state, value) {
                                    state.currentView = value;
                                }
                            },
                            state: {
                                currentChapter: {
                                    "title": "",
                                    "content": [],
                                    "map": {
                                        "center": null,
                                        "zoomLevel": null,
                                        "layers": null,
                                        "tool": null
                                    }
                                },
                                story: {
                                    chapters: []
                                }
                            }
                        }
                    }
                }
            },
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
        mapCollection.clear();
        map = {
            id: "ol",
            mode: "2D",
            on: sinon.stub(),
            un: sinon.stub(),
            getView: () => {
                return {
                    getZoom: () => sinon.stub(),
                    getCenter: () => []
                };
            }
        };
        mapCollection.addMap(map, "2D");
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            expect(wrapper.exists()).to.be.true;
        });

        it("should find shared component Accordion", () => {
            expect(wrapper.findComponent({name: "AccordionItem"}).exists()).to.be.true;
            expect(wrapper.findAllComponents({name: "AccordionItem"})).to.be.lengthOf(2);
        });

        it("should find shared component FlatButton", () => {
            expect(wrapper.findComponent({name: "FlatButton"}).exists()).to.be.true;
            expect(wrapper.findAllComponents({name: "FlatButton"})).to.be.lengthOf(3);
        });

        it("should find vue multiselect component", () => {
            expect(wrapper.findComponent({name: "Multiselect"}).exists()).to.be.true;
            expect(wrapper.findAllComponents({name: "Multiselect"})).to.be.lengthOf(2);
        });

        it("should find title element", () => {
            expect(wrapper.find(".chapter-title").exists()).to.be.true;
            expect(wrapper.find(".chapter-title").text()).to.equal("additional:modules.storyCreator.chapter.title");
        });

        it("shows the position hint if positionChanged is true", async () => {
            await wrapper.setData({
                coordinate: "1,2",
                zoomlevel: "5",
                confirmedCoordinate: "3,4",
                confirmedZoomlevel: "5"
            });
            await wrapper.vm.$nextTick();
            expect(wrapper.find(".position-hint").exists()).to.be.true;
        });

        it("disables the FlatButton if isButtonDisabled is true", async () => {
            await wrapper.setData({
                coordinate: "1,2",
                zoomlevel: "5",
                confirmedCoordinate: "1,2",
                confirmedZoomlevel: "5"
            });
            await wrapper.vm.$nextTick();
            const btn = wrapper.findComponent({name: "FlatButton"});

            expect(btn.attributes("disabled")).to.not.be.undefined;
        });
    });

    describe("Computed", () => {
        describe("positionChanged", () => {
            it("returns false if no confirmed values", () => {
                wrapper.setData({coordinate: "", zoomlevel: "", confirmedCoordinate: "", confirmedZoomlevel: ""});
                expect(wrapper.vm.positionChanged).to.be.false;
            });

            it("returns true if coordinate or zoomlevel changed", () => {
                wrapper.setData({coordinate: "1,2", zoomlevel: "5", confirmedCoordinate: "3,4", confirmedZoomlevel: "5"});
                expect(wrapper.vm.positionChanged).to.be.true;
            });

            it("returns false if coordinate and zoomlevel are unchanged", () => {
                wrapper.setData({coordinate: "1,2", zoomlevel: "5", confirmedCoordinate: "1,2", confirmedZoomlevel: "5"});
                expect(wrapper.vm.positionChanged).to.be.false;
            });

            it("returns false if no confirmed values", () => {
                wrapper.setData({coordinate: "", zoomlevel: "", confirmedCoordinate: "", confirmedZoomlevel: ""});
                expect(wrapper.vm.isButtonDisabled).to.be.false;
            });
        });

        describe("isButtonDisabled", () => {
            it("returns false if no confirmed values", () => {
                wrapper.setData({coordinate: "", zoomlevel: "", confirmedCoordinate: "", confirmedZoomlevel: ""});
                expect(wrapper.vm.isButtonDisabled).to.be.false;
            });

            it("returns true if coordinate and zoomlevel are unchanged", () => {
                wrapper.setData({coordinate: "1,2", zoomlevel: "5", confirmedCoordinate: "1,2", confirmedZoomlevel: "5"});
                expect(wrapper.vm.isButtonDisabled).to.be.true;
            });

            it("isButtonDisabled returns false if coordinate or zoomlevel changed", () => {
                wrapper.setData({coordinate: "1,2", zoomlevel: "6", confirmedCoordinate: "1,2", confirmedZoomlevel: "5"});
                expect(wrapper.vm.isButtonDisabled).to.be.false;
            });
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

        describe("saveChapter", () => {
            it("should set the attribute to current chapter", async () => {
                await wrapper.setData({
                    title: "title",
                    confirmedCoordinate: "123, 456",
                    confirmedZoomlevel: 2,
                    selectedLayer: [{layerId: 1}, {layerId: 2}],
                    selectedTool: {toolId: "tool"}
                });

                wrapper.vm.saveChapter();

                expect(wrapper.vm.currentChapter).to.deep.equal({
                    content: [],
                    title: "title",
                    map: {
                        "center": "123, 456",
                        "zoomLevel": 2,
                        "layers": [1, 2],
                        "tool": "tool"
                    }
                });

                expect(wrapper.vm.story).to.deep.equal(
                    {
                        chapters: [
                            {
                                content: [],
                                title: "title",
                                map: {
                                    "center": "123, 456",
                                    "zoomLevel": 2,
                                    "layers": [1, 2],
                                    "tool": "tool"
                                }
                            }
                        ]
                    }
                );
            });
        });
    });
});
