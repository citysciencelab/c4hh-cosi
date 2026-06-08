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
                                story: (state) => state.story,
                                subjectLayerCategory: (state) => state.subjectLayerCategory,
                                imageAssetsById: (state) => state.imageAssetsById
                            },
                            mutations: {
                                removeImageAsset (state, id) {
                                    delete state.imageAssetsById[id];
                                },
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
                                imageAssetsById: {},
                                story: {
                                    chapters: []
                                },
                                subjectLayerCategory: {}
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

        it("should configure Draggable to use drag handle only", async () => {
            const content = [
                {
                    id: "doc-1",
                    type: "doc",
                    content: []
                }
            ];

            await wrapper.setData({content});

            const draggableWrapper = wrapper.findComponent({name: "Draggable"});

            expect(draggableWrapper.exists()).to.be.true;
            expect(draggableWrapper.props("itemKey")).to.equal("id");
            expect(draggableWrapper.props("modelValue")).to.deep.equal(content);
        });

        it("should find title element", () => {
            expect(wrapper.find(".chapter-title").exists()).to.be.true;
            expect(wrapper.find(".chapter-title").text()).to.equal("additional:modules.storyCreator.chapter.title");
        });

        it("shows the position hint if positionChanged is true", async () => {
            await wrapper.setData({
                coordinate: [1, 2],
                zoomlevel: "5",
                confirmedCoordinate: [3, 4],
                confirmedZoomlevel: "5"
            });
            await wrapper.vm.$nextTick();
            expect(wrapper.find(".position-hint").exists()).to.be.true;
        });

        it("disables the FlatButton if isButtonDisabled is true", async () => {
            await wrapper.setData({
                coordinate: [1, 2],
                zoomlevel: "5",
                confirmedCoordinate: [1, 2],
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
                wrapper.setData({coordinate: [], zoomlevel: "", confirmedCoordinate: [], confirmedZoomlevel: ""});
                expect(wrapper.vm.positionChanged).to.be.false;
            });

            it("returns true if coordinate or zoomlevel changed", () => {
                wrapper.setData({coordinate: [1, 2], zoomlevel: "5", confirmedCoordinate: [3, 4], confirmedZoomlevel: "5"});
                expect(wrapper.vm.positionChanged).to.be.true;
            });

            it("returns false if coordinate and zoomlevel are unchanged", () => {
                wrapper.setData({coordinate: [1, 2], zoomlevel: "5", confirmedCoordinate: [1, 2], confirmedZoomlevel: "5"});
                expect(wrapper.vm.positionChanged).to.be.false;
            });

            it("returns false if no confirmed values", () => {
                wrapper.setData({coordinate: [], zoomlevel: "", confirmedCoordinate: [], confirmedZoomlevel: ""});
                expect(wrapper.vm.isButtonDisabled).to.be.false;
            });
        });

        describe("isButtonDisabled", () => {
            it("returns false if no confirmed values", () => {
                wrapper.setData({coordinate: [], zoomlevel: "", confirmedCoordinate: [], confirmedZoomlevel: ""});
                expect(wrapper.vm.isButtonDisabled).to.be.false;
            });

            it("returns true if coordinate and zoomlevel are unchanged", () => {
                wrapper.setData({coordinate: [1, 2], zoomlevel: "5", confirmedCoordinate: [1, 2], confirmedZoomlevel: "5"});
                expect(wrapper.vm.isButtonDisabled).to.be.true;
            });

            it("isButtonDisabled returns false if coordinate or zoomlevel changed", () => {
                wrapper.setData({coordinate: [1, 2], zoomlevel: "6", confirmedCoordinate: [1, 2], confirmedZoomlevel: "5"});
                expect(wrapper.vm.isButtonDisabled).to.be.false;
            });
        });
    });

    describe("Methods", () => {
        describe("findAllObjectsByKeyValueDeep", () => {
            it("should return empty array", () => {
                expect(wrapper.vm.findAllObjectsByKeyValueDeep(null)).to.deep.equal([]);
                expect(wrapper.vm.findAllObjectsByKeyValueDeep(0)).to.deep.equal([]);
                expect(wrapper.vm.findAllObjectsByKeyValueDeep("")).to.deep.equal([]);
                expect(wrapper.vm.findAllObjectsByKeyValueDeep({})).to.deep.equal([]);
                expect(wrapper.vm.findAllObjectsByKeyValueDeep(false)).to.deep.equal([]);
                expect(wrapper.vm.findAllObjectsByKeyValueDeep(undefined)).to.deep.equal([]);
            });

            it("should return an array with one element", () => {
                expect(wrapper.vm.findAllObjectsByKeyValueDeep({type: "layer"})).to.deep.equal([{type: "layer", level: 0, $isDisabled: false}]);
            });

            it("should return an array with one element", () => {
                expect(wrapper.vm.findAllObjectsByKeyValueDeep({type: "folder"})).to.deep.equal([{type: "folder", level: 0, $isDisabled: true}]);
            });

            it("should return an array with more element", () => {
                const data = [
                    {
                        type: "folder",
                        elements: [
                            {type: "layer"}
                        ]
                    }
                ];

                expect(wrapper.vm.findAllObjectsByKeyValueDeep(data)).to.deep.equal(
                    [
                        {
                            type: "folder",
                            elements: [
                                {type: "layer", level: 1, $isDisabled: false}
                            ],
                            level: 0,
                            $isDisabled: true
                        },
                        {type: "layer", level: 1, $isDisabled: false}
                    ]
                );
            });
        });

        describe("getParsedLayerList", () => {
            it("should return empty array", () => {
                expect(wrapper.vm.getParsedLayerList(null)).to.deep.equal([]);
                expect(wrapper.vm.getParsedLayerList(0)).to.deep.equal([]);
                expect(wrapper.vm.getParsedLayerList("")).to.deep.equal([]);
                expect(wrapper.vm.getParsedLayerList({})).to.deep.equal([]);
                expect(wrapper.vm.getParsedLayerList(false)).to.deep.equal([]);
                expect(wrapper.vm.getParsedLayerList(undefined)).to.deep.equal([]);
                expect(wrapper.vm.getParsedLayerList([])).to.deep.equal([]);
            });

            it("should return an array with one element", () => {
                expect(wrapper.vm.getParsedLayerList([{type: "layer", id: "1", name: "layer"}])).to.deep.equal([{layerId: "1", label: "layer", level: 0, $isDisabled: false}]);
            });

            it("should return an array with more element", () => {
                const data = [
                    {
                        type: "folder",
                        id: "1",
                        name: "folder",
                        elements: [
                            {type: "layer", id: "2", name: "layer"}
                        ]
                    }
                ];

                expect(wrapper.vm.getParsedLayerList(data)).to.deep.equal(
                    [
                        {layerId: "1", label: "folder", level: 0, $isDisabled: true},
                        {layerId: "2", label: "layer", level: 1, $isDisabled: false}
                    ]
                );
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

        describe("handleContent", () => {
            it("should add content when editor index points to add position", async () => {
                const newContent = {
                    type: "doc",
                    content: [{type: "paragraph", content: [{type: "text", text: "Hello"}]}]
                };

                await wrapper.setData({
                    openContentEditor: {
                        type: "text",
                        index: 0
                    },
                    content: []
                });

                wrapper.vm.handleContent(newContent);

                expect(wrapper.vm.openContentEditor).to.deep.equal({
                    type: "",
                    index: null
                });
                expect(wrapper.vm.content).to.have.lengthOf(1);
                expect(wrapper.vm.content[0].type).to.equal("doc");
                expect(wrapper.vm.content[0].content).to.deep.equal(newContent.content);
            });

            it("should edit existing content when editor index points to an existing item", async () => {
                const existingContent = {
                        type: "doc",
                        content: [{type: "paragraph", content: [{type: "text", text: "Old"}]}]
                    },
                    updatedContent = {
                        type: "doc",
                        content: [{type: "paragraph", content: [{type: "text", text: "Updated"}]}]
                    };

                await wrapper.setData({
                    openContentEditor: {
                        type: "text",
                        index: 0
                    },
                    content: [existingContent]
                });

                wrapper.vm.handleContent(updatedContent);

                expect(wrapper.vm.openContentEditor).to.deep.equal({
                    type: "",
                    index: null
                });
                expect(wrapper.vm.content).to.deep.equal([updatedContent]);
            });
        });

        describe("saveChapter", () => {
            it("should set the attribute to current chapter", async () => {
                await wrapper.setData({
                    title: "title",
                    confirmedCoordinate: [123, 456],
                    confirmedZoomlevel: 2,
                    selectedLayer: [{layerId: 1}, {layerId: 2}],
                    selectedTool: {toolId: "tool"}
                });

                wrapper.vm.saveChapter();

                expect(wrapper.vm.currentChapter).to.deep.equal({
                    content: [],
                    title: "title",
                    map: {
                        "center": [123, 456],
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
                                    "center": [123, 456],
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

        describe("handleImage", () => {
            it("should add an image when editor index points to add position", async () => {
                const image = {
                    id: "img-1",
                    altText: "A test alt text",
                    photoCredit: "Photo credit"
                };

                await wrapper.setData({
                    openContentEditor: {
                        type: "image",
                        index: 0
                    },
                    content: []
                });

                await wrapper.vm.handleImage(image);

                expect(wrapper.vm.openContentEditor).to.deep.equal({
                    type: "",
                    index: null
                });
                expect(wrapper.vm.content).to.deep.equal([
                    {
                        type: "image",
                        id: "img-1",
                        attrs: {
                            alt: "A test alt text",
                            copyright: "Photo credit"
                        }
                    }
                ]);
            });

            it("should edit an existing image when editor index points to an existing item", async () => {
                const image = {
                    id: "img-1",
                    altText: "Updated alt text",
                    photoCredit: "Updated credit"
                };

                await wrapper.setData({
                    openContentEditor: {
                        type: "image",
                        index: 0
                    },
                    content: [
                        {
                            type: "image",
                            id: "img-1",
                            attrs: {
                                alt: "Old alt",
                                copyright: "Old credit"
                            }
                        }
                    ]
                });

                await wrapper.vm.handleImage(image);

                expect(wrapper.vm.openContentEditor).to.deep.equal({
                    type: "",
                    index: null
                });
                expect(wrapper.vm.content).to.deep.equal([
                    {
                        type: "image",
                        id: "img-1",
                        attrs: {
                            alt: "Updated alt text",
                            copyright: "Updated credit"
                        }
                    }
                ]);
            });
        });

        describe("removeContentItem", () => {
            it("should remove an image item and trigger image asset cleanup", async () => {
                const removeImageAssetSpy = sinon.spy(wrapper.vm, "removeImageAsset");

                await wrapper.setData({
                    content: [
                        {
                            type: "image",
                            id: "img-1",
                            attrs: {
                                alt: "Alt",
                                copyright: "Credit"
                            }
                        },
                        {
                            type: "doc",
                            content: [{type: "paragraph", content: [{type: "text", text: "Keep me"}]}]
                        }
                    ]
                });

                wrapper.vm.removeContentItem(0);

                expect(removeImageAssetSpy.calledOnceWithExactly("img-1")).to.be.true;
                expect(wrapper.vm.content).to.deep.equal([
                    {
                        type: "doc",
                        content: [{type: "paragraph", content: [{type: "text", text: "Keep me"}]}]
                    }
                ]);
            });
        });
    });
});
