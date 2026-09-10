import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import StoryPlayer from "../../../components/StoryPlayerFeature.vue";

describe("addons/storyPlayer/tests/unit/components/StoryPlayerFeature.spec.js", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(StoryPlayer, {
            props: {
                featureAttributes: {}
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }

        sinon.restore();
    });

    describe("Component DOM", () => {
        it("StoryPlayerFeature should exist", () => {
            expect(wrapper.exists()).to.be.true;
        });

        it("should find h5", () => {
            expect(wrapper.find("h5").exists()).to.be.true;
        });

        it("should find table", () => {
            expect(wrapper.find("table").exists()).to.be.true;
        });

        it("should find shared component FlatButton", () => {
            expect(wrapper.findComponent({name: "FlatButton"}).exists()).to.be.true;
        });

        it("should not render feature image if no image is provided", () => {
            expect(wrapper.find(".feature-image").exists()).to.be.false;
        });

        it("should render feature image if image objectURL is available", async () => {
            await wrapper.setProps({
                featureAttributes: {
                    image: {
                        id: "image-1",
                        alt: "Test image",
                        copyright: "Test Copyright"
                    }
                },
                imageAssetsById: {
                    "image-1": {
                        objectURL: "test-image-url"
                    }
                }
            });

            expect(wrapper.find(".feature-image").exists()).to.be.true;
            expect(wrapper.find(".feature-image img").exists()).to.be.true;
        });
    });

    describe("Interaction", () => {
        it("should emit function closePopup", async () => {
            await wrapper.findComponent({name: "FlatButton"}).props("interaction")();

            expect(wrapper.emitted("closePopup")).to.have.lengthOf(1);
        });
    });
});
