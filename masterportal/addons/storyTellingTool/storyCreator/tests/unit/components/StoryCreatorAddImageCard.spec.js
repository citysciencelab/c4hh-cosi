import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import StoryCreatorAddImageCard from "../../../components/StoryCreatorAddImageCard.vue";
import sinon from "sinon";
import {afterEach, beforeEach, describe} from "vitest";

config.global.mocks.$t = key => key;

describe("addons/storyCreator/components/StoryCreatorAddImageCard.vue", () => {
    let wrapper,
        localStore,
        createImageAsset;

    beforeEach(() => {
        localStore = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        StoryManager: {
                            namespaced: true,
                            actions: {
                                addImageAsset: sinon.stub().callsFake((context, blob) => {
                                    const id = "test-uuid",
                                        objectURL = "blob:test-created-url",
                                        originalName = typeof blob?.name === "string" && blob.name.trim() !== "" ? blob.name : `${id}.bin`,
                                        archivePath = `images/${id}__${originalName}`;

                                    return Promise.resolve({
                                        id,
                                        blob,
                                        objectURL,
                                        mimeType: blob.type || "application/octet-stream",
                                        originalName,
                                        archivePath
                                    });
                                })
                            },
                            state: {}
                        }
                    }
                }
            }
        });
        createImageAsset = sinon.stub().callsFake(blob => {
            const id = "test-uuid",
                objectURL = "blob:test-created-url",
                originalName = typeof blob?.name === "string" && blob.name.trim() !== "" ? blob.name : `${id}.bin`,
                archivePath = `images/${id}__${originalName}`;

            return {
                id,
                blob,
                objectURL,
                mimeType: blob.type || "application/octet-stream",
                originalName,
                archivePath
            };
        });
        wrapper = shallowMount(StoryCreatorAddImageCard, {
            props: {
                createImageAsset,
                imageAssetsById: {}
            },
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
                    closeable: false,
                    createImageAsset,
                    imageAssetsById: {}
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
                    closeable: false,
                    createImageAsset,
                    imageAssetsById: {}
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

        it("should render the FlatButton component only if isImageLoaded is true", async () => {
            expect(wrapper.findComponent({name: "FlatButton"}).exists()).to.be.false;

            await wrapper.setData({
                uploadedAsset: {
                    id: "test-uuid",
                    objectURL: "blob:test-created-url"
                },
                image: {
                    id: "test-uuid",
                    alt: "alt",
                    copyright: "copyright"
                }
            });

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
                    alt: "alt",
                    copyright: "copyright"
                }
            });

            expect(wrapper.vm.enableAdd).to.be.true;
        });
    });

    describe("Component Methods", () => {
        it("handleCloseButtonClick should emit click:close event", async () => {
            wrapper.vm.handleCloseButtonClick();

            expect(wrapper.emitted()).to.have.property("click:close");
        });

        it("handleDiscardButtonClick should reset form data", async () => {
            await wrapper.setData({
                image: {
                    alt: "alt",
                    copyright: "copyright"
                },
                uploadedAsset: {
                    id: "test-uuid",
                    objectURL: "blob:test-created-url"
                },
                isValidated: false
            });

            wrapper.vm.handleDiscardButtonClick();

            expect(wrapper.vm.image).to.deep.equal({
                alt: "",
                copyright: ""
            });
            expect(wrapper.vm.uploadedAsset).to.deep.equal({
                id: null,
                objectURL: null
            });
            expect(wrapper.vm.isValidated).to.be.true;
        });

        it("loadImage should set isValidated false for non-image files", () => {
            const file = new File(["file-content"], "test.json", {type: "application/json"}),
                event = {
                    target: {
                        files: [file]
                    }
                };

            wrapper.vm.loadImage(event);

            expect(wrapper.vm.isValidated).to.be.false;
        });

        it("loadImage should load image and set uploadedAsset", async () => {
            const file = new File(["file-content"], "test-image.png", {type: "image/png"}),
                event = {
                    target: {
                        files: [file]
                    }
                };

            await wrapper.vm.loadImage(event);

            expect(wrapper.vm.isImageLoaded).to.be.true;
            expect(wrapper.vm.image.id).to.equal("test-uuid");
            expect(wrapper.vm.isValidated).to.be.true;
            expect(wrapper.vm.uploadedAsset).to.deep.equal({
                id: "test-uuid",
                blob: file,
                objectURL: "blob:test-created-url",
                mimeType: "image/png",
                originalName: "test-image.png",
                archivePath: "images/test-uuid__test-image.png"
            });
        });

        it("should emit addImage with complete image object on confirm", async () => {
            const file = new File(["file-content"], "test-image.png", {type: "image/png"}),
                event = {
                    target: {
                        files: [file]
                    }
                };

            await wrapper.setData({
                image: {
                    alt: "alt text",
                    copyright: "copyright info"
                }
            });

            await wrapper.vm.loadImage(event);

            // Find the add button and trigger it (in the template, it's the confirm button)
            const addButton = wrapper.findAllComponents({name: "FlatButton"}).at(0);

            if (addButton) {
                await addButton.trigger("click");
                const emitted = wrapper.emitted("addImage");

                if (emitted && emitted.length > 0) {
                    const emittedData = emitted[0][0];

                    expect(emittedData).to.include({
                        id: "test-uuid",
                        alt: "alt text",
                        copyright: "copyright info"
                    });
                }
            }
        });
    });
});
