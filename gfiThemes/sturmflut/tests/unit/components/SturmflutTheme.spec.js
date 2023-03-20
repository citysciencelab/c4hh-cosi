import {shallowMount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";
import SturmflutTheme from "../../../components/SturmflutTheme.vue";

const localVue = createLocalVue();

describe("addons/sturmflut/components/SturmflutTheme.vue", () => {
    let wrapper;

    it("should render all possible html elements", () => {
        wrapper = shallowMount(SturmflutTheme, {
            propsData: {
                feature: {
                    getMappedProperties: function () {
                        return {
                            audio_link: "example.audio",
                            beschreibung: "Example Description",
                            bildformat: "quer",
                            bild_copyright: "Example Copyright",
                            bild_link: "example.image",
                            strasse: "Example Street",
                            titel: "Example Title"
                        };
                    }
                }
            },
            localVue,
            mocks: {
                $t: (msg) => msg
            }
        });

        expect(wrapper.find("h1").exists()).to.be.true;
        expect(wrapper.find("#sturmflut-theme-table-street").exists()).to.be.true;
        expect(wrapper.find("#sturmflut-theme-table-image").exists()).to.be.true;
        expect(wrapper.find("#sturmflut-theme-table-image-landscape").exists()).to.be.true;
        expect(wrapper.find("#sturmflut-theme-table-image-zoom").exists()).to.be.true;
        expect(wrapper.find("#sturmflut-theme-table-image-copyright").exists()).to.be.true;
        expect(wrapper.find("#sturmflut-theme-table-description").exists()).to.be.true;
        expect(wrapper.find("#sturmflut-theme-table-audio").exists()).to.be.true;

        expect(wrapper.find("h1").text()).equals("Example Title");
        expect(wrapper.find("#sturmflut-theme-table-street").text()).equals("Example Street");
        expect(wrapper.find("#sturmflut-theme-table-image").attributes().href).equals("example.image");
        expect(wrapper.find("#sturmflut-theme-table-image-copyright").text()).equals("Bild: Example Copyright");
        expect(wrapper.find("#sturmflut-theme-table-description").text()).equals("Example Description");
        expect(wrapper.find("#sturmflut-theme-table-audio").attributes().href).equals("example.audio");
    });

    it("should render only description, no image and audio", () => {
        wrapper = shallowMount(SturmflutTheme, {
            propsData: {
                feature: {
                    getMappedProperties: function () {
                        return {
                            beschreibung: "Example Description",
                            strasse: "Example Street",
                            titel: "Example Title"
                        };
                    }
                }
            },
            localVue,
            mocks: {
                $t: (msg) => msg
            }
        });

        expect(wrapper.find("h1").exists()).to.be.true;
        expect(wrapper.find("#sturmflut-theme-table-street").exists()).to.be.true;
        expect(wrapper.find("#sturmflut-theme-table-description").exists()).to.be.true;

        expect(wrapper.find("#sturmflut-theme-table-image").exists()).to.be.false;
        expect(wrapper.find("#sturmflut-theme-table-image-landscape").exists()).to.be.false;
        expect(wrapper.find("#sturmflut-theme-table-image-portrait").exists()).to.be.false;
        expect(wrapper.find("#sturmflut-theme-table-image-zoom").exists()).to.be.false;
        expect(wrapper.find("#sturmflut-theme-table-image-copyright").exists()).to.be.false;
        expect(wrapper.find("#sturmflut-theme-table-audio").exists()).to.be.false;

        expect(wrapper.find("h1").text()).equals("Example Title");
        expect(wrapper.find("#sturmflut-theme-table-street").text()).equals("Example Street");
    });

    it("should render only description and image, no audio", () => {
        wrapper = shallowMount(SturmflutTheme, {
            propsData: {
                feature: {
                    getMappedProperties: function () {
                        return {
                            beschreibung: "Example Description",
                            bildformat: "hoch",
                            bild_copyright: "Example Copyright",
                            bild_link: "example.image",
                            strasse: "Example Street",
                            titel: "Example Title"
                        };
                    }
                }
            },
            localVue,
            mocks: {
                $t: (msg) => msg
            }
        });

        expect(wrapper.find("h1").exists()).to.be.true;
        expect(wrapper.find("#sturmflut-theme-table-street").exists()).to.be.true;
        expect(wrapper.find("#sturmflut-theme-table-image").exists()).to.be.true;
        expect(wrapper.find("#sturmflut-theme-table-image-portrait").exists()).to.be.true;
        expect(wrapper.find("#sturmflut-theme-table-image-zoom").exists()).to.be.true;
        expect(wrapper.find("#sturmflut-theme-table-image-copyright").exists()).to.be.true;
        expect(wrapper.find("#sturmflut-theme-table-description").exists()).to.be.true;

        expect(wrapper.find("#sturmflut-theme-table-audio").exists()).to.be.false;

        expect(wrapper.find("h1").text()).equals("Example Title");
        expect(wrapper.find("#sturmflut-theme-table-street").text()).equals("Example Street");
        expect(wrapper.find("#sturmflut-theme-table-image").attributes().href).equals("example.image");
        expect(wrapper.find("#sturmflut-theme-table-image-copyright").text()).equals("Bild: Example Copyright");
        expect(wrapper.find("#sturmflut-theme-table-description").text()).equals("Example Description");
    });
});
