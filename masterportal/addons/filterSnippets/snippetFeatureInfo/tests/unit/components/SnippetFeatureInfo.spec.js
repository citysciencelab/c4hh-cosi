import {mount, shallowMount, config} from "@vue/test-utils";
import SnippetFeatureInfo from "../../../components/SnippetFeatureInfo.vue";
import Feature from "ol/Feature.js";
import {expect} from "chai";

config.global.mocks.$t = key => key;

describe("src/modules/filter/components/SnippetFeatureInfo.vue", () => {
    it("should have correct default values", () => {
        const wrapper = shallowMount(SnippetFeatureInfo, {});

        expect(wrapper.vm.title).to.be.true;
        expect(wrapper.vm.snippetId).to.equal(0);
        expect(wrapper.vm.layerId).to.be.undefined;
        expect(wrapper.vm.visible).to.be.false;
        expect(wrapper.vm.universalSearch).to.be.false;
        expect(wrapper.vm.beautifiedAttrName).to.be.undefined;
    });
    it("should not render snippetFeatureInfoContainer by default", () => {
        const wrapper = mount(SnippetFeatureInfo, {});

        expect(wrapper.find(".snippetFeatureInfoContainer").exists()).to.be.false;
    });
    it("should render snippetFeatureInfoContainer if visible is true", async () => {
        const wrapper = mount(SnippetFeatureInfo, {});

        await wrapper.setData({visible: true});

        expect(wrapper.find(".snippetFeatureInfoContainer").exists()).to.be.true;
    });

    it("should rename object keys", () => {
        const wrapper = shallowMount(SnippetFeatureInfo, {});
        let obj = {
            "foo_123": "bar",
            "foo_ 1_23": "bar"
        };

        obj = wrapper.vm.beautifyObjectKeys(obj);

        expect(obj).to.deep.equal({
            "Foo 123": "bar",
            "Foo  1 23": "bar"
        });
    });

    it("should render feature info if it available", async () => {
        const wrapper = mount(SnippetFeatureInfo, {});

        await wrapper.setData({featureInfo: {"foo": "bar"}});

        expect(wrapper.find("dt").text()).to.be.equal("foo");
        expect(wrapper.find("dd").text()).to.be.equal("bar");
    });

    describe("getUniqueObjectFromAttributes", () => {
        it("should return null if first param is not an array", () => {
            const wrapper = shallowMount(SnippetFeatureInfo, {});

            expect(wrapper.vm.getUniqueObjectFromAttributes(null)).to.be.null;
            expect(wrapper.vm.getUniqueObjectFromAttributes(undefined)).to.be.null;
            expect(wrapper.vm.getUniqueObjectFromAttributes(1234)).to.be.null;
            expect(wrapper.vm.getUniqueObjectFromAttributes("string")).to.be.null;
            expect(wrapper.vm.getUniqueObjectFromAttributes(true)).to.be.null;
            expect(wrapper.vm.getUniqueObjectFromAttributes(false)).to.be.null;
            expect(wrapper.vm.getUniqueObjectFromAttributes({})).to.be.null;
        });
        it("should return null if second param is not an array", () => {
            const wrapper = shallowMount(SnippetFeatureInfo, {});

            expect(wrapper.vm.getUniqueObjectFromAttributes([], null)).to.be.null;
            expect(wrapper.vm.getUniqueObjectFromAttributes([], undefined)).to.be.null;
            expect(wrapper.vm.getUniqueObjectFromAttributes([], 1234)).to.be.null;
            expect(wrapper.vm.getUniqueObjectFromAttributes([], "string")).to.be.null;
            expect(wrapper.vm.getUniqueObjectFromAttributes([], true)).to.be.null;
            expect(wrapper.vm.getUniqueObjectFromAttributes([], false)).to.be.null;
            expect(wrapper.vm.getUniqueObjectFromAttributes([], {})).to.be.null;
        });
        it("should return null if second param is an array but has no length", () => {
            const wrapper = shallowMount(SnippetFeatureInfo, {});

            expect(wrapper.vm.getUniqueObjectFromAttributes([], [])).to.be.null;
        });
        it("should return an object with unique keys and a list of values for each attrName (first param)", () => {
            const wrapper = shallowMount(SnippetFeatureInfo, {}),
                items = [
                    new Feature({foo: "bar"}),
                    new Feature({foo: "bar"}),
                    new Feature({foo: "baz"})
                ],
                expected = {
                    foo: ["bar", "baz"]
                };

            expect(wrapper.vm.getUniqueObjectFromAttributes(["foo"], items)).to.deep.equal(expected);
        });
    });

    describe("checkAttrInSearch", () => {
        it("should return false if there is no universalSearch configured or in wrong format", () => {
            const wrapper = shallowMount(SnippetFeatureInfo, {});

            expect(wrapper.vm.checkAttrInSearch(undefined, "attr")).to.be.false;
            expect(wrapper.vm.checkAttrInSearch(false, "attr")).to.be.false;
            expect(wrapper.vm.checkAttrInSearch("", "attr")).to.be.false;
            expect(wrapper.vm.checkAttrInSearch([], "attr")).to.be.false;
            expect(wrapper.vm.checkAttrInSearch(0, "attr")).to.be.false;
            expect(wrapper.vm.checkAttrInSearch({}, "attr")).to.be.false;
        });

        it("should return false if the attribute is not string", () => {
            const wrapper = shallowMount(SnippetFeatureInfo, {}),
                univeralSearch = {
                    "attrName": "Wissenschaftlicher Name",
                    "prefix": "https://www.google.com/search?q="
                };

            expect(wrapper.vm.checkAttrInSearch(univeralSearch, undefined)).to.be.false;
            expect(wrapper.vm.checkAttrInSearch(univeralSearch, 0)).to.be.false;
            expect(wrapper.vm.checkAttrInSearch(univeralSearch, true)).to.be.false;
            expect(wrapper.vm.checkAttrInSearch(univeralSearch, [])).to.be.false;
            expect(wrapper.vm.checkAttrInSearch(univeralSearch, {})).to.be.false;
        });

        it("should return false if the attribute is not configured in universalSearch", () => {
            const wrapper = shallowMount(SnippetFeatureInfo, {}),
                univeralSearch = {
                    "attrName": "Wissenschaftlicher Name",
                    "prefix": "https://www.google.com/search?q="
                };

            expect(wrapper.vm.checkAttrInSearch(univeralSearch, "attr")).to.be.false;
            expect(wrapper.vm.checkAttrInSearch(univeralSearch, "Wissenschaftlicher")).to.be.false;
            expect(wrapper.vm.checkAttrInSearch(univeralSearch, "Name")).to.be.false;
        });

        it("should return true if the attribute is configured in universalSearch", () => {
            const wrapper = shallowMount(SnippetFeatureInfo, {}),
                univeralSearch = {
                    "attrName": "Wissenschaftlicher Name",
                    "prefix": "https://www.google.com/search?q="
                };

            expect(wrapper.vm.checkAttrInSearch(univeralSearch, "Wissenschaftlicher Name")).to.be.true;
        });
    });
});
