import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import StoryCreatorAddImageCard from "../../../components/StoryCreatorAddImageCard.vue";
import sinon from "sinon";
import {afterEach, beforeEach, describe} from "vitest";

config.global.mocks.$t = key => key;

describe("addons/storyCreator/components/StoryCreatorAddImageCard.vue", () => {
    let wrapper,
        localStore;

    beforeEach(() => {
        localStore = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        StoryCreator: {
                            namespaced: true,
                            state: {
                                imageAssetsById: {}
                            },
                            getters: {
                                imageAssetsById: (state) => state.imageAssetsById
                            },
                            mutations: {
                                removeImageAsset (state, id) {
                                    const objectURL = state.imageAssetsById[id]?.objectURL;

                                    if (objectURL) {
                                        URL.revokeObjectURL(objectURL);
                                    }
                                    delete state.imageAssetsById[id];
                                }
                            },
                            actions: {
                                addImageAsset ({state}, blob) {
                                    const id = "test-uuid",
                                        objectURL = "blob:test-created-url",
                                        originalName = typeof blob?.name === "string" && blob.name.trim() !== "" ? blob.name : `${id}.bin`,
                                        archivePath = `images/${id}__${originalName}`;

                                    state.imageAssetsById[id] = {
                                        blob,
                                        objectURL,
                                        mimeType: blob.type || "application/octet-stream",
                                        originalName,
                                        archivePath
                                    };

                                    return Promise.resolve(id);
                                }
                            }
                        }
                    }
                }
            }
        });
        wrapper = shallowMount(StoryCreatorAddImageCard, {
            global: {
                plugins: [localStore]
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            expect(wrapper.exists()).to.be.true;
        });

        it("should render close button if closeable is true", () => {
            expect(wrapper.find(".btn-close").exists()).to.be.true;
        });

        it("should not render close button if closeable is false", () => {
            const nonCloseableWrapper = shallowMount(StoryCreatorAddImageCard, {
                props: {
                    closeable: false
                },
                global: {
                    plugins: [localStore]
                }
            });

            expect(nonCloseableWrapper.find(".btn-close").exists()).to.be.false;
        });

        it("should emit 'click:close' event when the close button is clicked", async () => {
            const closeBtn = wrapper.find(".btn-close");

            await closeBtn.trigger("click");

            expect(wrapper.emitted()).to.have.property("click:close");
        });

        it("should render addImages headline if closeable is true", () => {
            expect(wrapper.find(".card-title").text()).to.include("additional:modules.storyCreator.headlines.addImages");
        });

        it("should render addImageTitle headline if closeable is false", () => {
            const nonCloseableWrapper = shallowMount(StoryCreatorAddImageCard, {
                props: {
                    closeable: false
                },
                global: {
                    plugins: [localStore]
                }
            });

            expect(nonCloseableWrapper.find(".card-title").text()).to.include("additional:modules.storyCreator.headlines.addImageTitle");
        });

        it("should render the FileUpload component", () => {
            expect(wrapper.findComponent({name: "FileUpload"}).exists()).to.be.true;
        });

        it("should render two InputText components", () => {
            expect(wrapper.findAllComponents({name: "InputText"}).length).to.equal(2);
        });

        it("should render the FlatButton component only if imageLoaded is true", async () => {
            expect(wrapper.findComponent({name: "FlatButton"}).exists()).to.be.false;

            await wrapper.setData({imageLoaded: true});

            expect(wrapper.findComponent({name: "FlatButton"}).exists()).to.be.true;
        });

        it("should not render AlertMessage components", () => {
            expect(wrapper.findComponent({name: "AlertMessage"}).exists()).to.be.false;
        });

        it("should render AlertMessage components", async () => {
            await wrapper.setData({isValidated: false});

            expect(wrapper.findComponent({name: "AlertMessage"}).exists()).to.be.true;
        });
    });

    describe("Computed Properties", () => {
        it("should set computed 'enableAdd' to false", () => {
            expect(wrapper.vm.enableAdd).to.be.false;
        });

        it("should set computed 'enableAdd' to true", async () => {
            await wrapper.setData({
                image: {
                    altText: "altText",
                    photoCredit: "photoCredit"
                }
            });

            expect(wrapper.vm.enableAdd).to.be.true;
        });
    });

    describe("Component Methods", () => {
        it("discardImage should revoke objectURL and emit click:close", async () => {
            const revokeObjectURLSpy = sinon.spy(URL, "revokeObjectURL"),
                file = new File(["test"], "test.png", {type: "image/png"}),
                event = {target: {files: [file]}};

            await wrapper.vm.loadImage(event);
            wrapper.vm.discardImage();

            expect(revokeObjectURLSpy.calledWith("blob:test-created-url")).to.be.true;
            expect(wrapper.emitted()).to.have.property("click:close");
        });

        it("loadImage should set isValidated false", () => {
            const file = new File(["file-content"], {type: "json"}),
                event = {
                    target: {
                        files: [file]
                    }
                };

            wrapper.vm.loadImage(event);

            expect(wrapper.vm.isValidated).to.be.false;
        });

        it("loadImage should set imageLoaded, image id and objectURL", async () => {
            const file = new File(["file-content"], "test-image.png", {type: "image/png"}),
                event = {
                    target: {
                        files: [file]
                    }
                };

            await wrapper.vm.loadImage(event);

            expect(wrapper.vm.imageLoaded).to.be.true;
            expect(wrapper.vm.image.id).to.equal("test-uuid");
            expect(wrapper.vm.isValidated).to.be.true;
            expect(localStore.state.Modules.StoryCreator.imageAssetsById["test-uuid"].blob).to.equal(file);
            expect(localStore.state.Modules.StoryCreator.imageAssetsById["test-uuid"].objectURL).to.equal("blob:test-created-url");
            expect(localStore.state.Modules.StoryCreator.imageAssetsById["test-uuid"].mimeType).to.equal("image/png");
            expect(localStore.state.Modules.StoryCreator.imageAssetsById["test-uuid"].originalName).to.equal("test-image.png");
            expect(localStore.state.Modules.StoryCreator.imageAssetsById["test-uuid"].archivePath).to.equal("images/test-uuid__test-image.png");
        });
    });
});
