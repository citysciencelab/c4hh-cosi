import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import StoryCreatorAddImageCard from "../../../components/StoryCreatorAddImageCard.vue";
import sinon from "sinon";
import {afterEach, beforeEach, describe} from "vitest";

config.global.mocks.$t = key => key;

describe("addons/storyCreator/components/StoryCreatorAddImageCard.vue", () => {
    let wrapper,
        objectURLById,
        localStore;

    beforeEach(() => {
        objectURLById = {};
        localStore = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        StoryCreator: {
                            namespaced: true,
                            getters: {
                                objectURLById: () => objectURLById
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

        it("should emit 'click:close' event when the close button is clicked", async () => {
            const closeBtn = wrapper.find(".btn-close");

            await closeBtn.trigger("click");

            expect(wrapper.emitted()).to.have.property("click:close");
        });
        it("should render the headline", () => {
            expect(wrapper.find(".card-title").text()).to.include("additional:modules.storyCreator.headlines.addImages");
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
    });
    describe("Component Methods", () => {
        it("addImage should store objectURL by id and emit addImage", () => {
            const image = {
                id: "test-id",
                objectURL: "blob:test-url",
                altText: "alt",
                photoCredit: "credit"
            };

            wrapper.vm.image = image;
            wrapper.vm.addImage();

            expect(objectURLById["test-id"]).to.equal("blob:test-url");
            expect(wrapper.emitted("addImage")[0]).to.deep.equal([image]);
        });

        it("discardImage should revoke objectURL and emit click:close", () => {
            const revokeObjectURLSpy = sinon.spy(URL, "revokeObjectURL");

            wrapper.vm.image.objectURL = "blob:test-url";
            wrapper.vm.discardImage();

            expect(revokeObjectURLSpy.calledOnceWithExactly("blob:test-url")).to.be.true;
            expect(wrapper.emitted()).to.have.property("click:close");
        });

        it("loadImage should set imageLoaded, image id and objectURL", () => {
            const createObjectURLSpy = sinon.stub(URL, "createObjectURL").returns("blob:test-created-url"),
                randomUUIDSpy = sinon.stub(crypto, "randomUUID").returns("test-uuid"),
                file = new File(["file-content"], "test-image.png", {type: "image/png"}),
                event = {
                    target: {
                        files: [file]
                    }
                };

            wrapper.vm.loadImage(event);

            expect(wrapper.vm.imageLoaded).to.be.true;
            expect(wrapper.vm.image.objectURL).to.equal("blob:test-created-url");
            expect(wrapper.vm.image.id).to.equal("test-uuid");
            expect(createObjectURLSpy.calledOnceWithExactly(file)).to.be.true;
            expect(randomUUIDSpy.calledOnce).to.be.true;
        });
    });
});
