import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import FeatureDetailView from "@modules/featureLister/components/FeatureDetailView.vue";
import {expect} from "chai";

describe("src/modules/featureLister/components/FeatureDetailView.vue", () => {
    let store, getters;

    beforeEach(() => {
        getters = {
            featureDetails: () => ({
                Name: "Testname",
                Webseite: "https://example.com",
                Telefon: "+49123456789",
                Email: "test@example.com",
                Semikolon: "test;test",
                Pipe: "foo|bar",
                Br: "bar<br>foo",
                Normal: "normaler Text"
            })
        };
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        FeatureLister: {
                            namespaced: true,
                            getters
                        }
                    }
                }
            }
        });
    });

    it("renders all feature detail keys", () => {
        const wrapper = shallowMount(FeatureDetailView, {global: {plugins: [store]}});

        expect(wrapper.text()).to.include("Name");
        expect(wrapper.text()).to.include("Webseite");
        expect(wrapper.text()).to.include("Telefon");
        expect(wrapper.text()).to.include("Email");
        expect(wrapper.text()).to.include("Semikolon");
        expect(wrapper.text()).to.include("Pipe");
        expect(wrapper.text()).to.include("Br");
        expect(wrapper.text()).to.include("Normal");
    });

    it("renders a web link as <a>", () => {
        const wrapper = shallowMount(FeatureDetailView, {global: {plugins: [store]}}),
            link = wrapper.find("a[href=\"https://example.com\"]");

        expect(link.exists()).to.be.true;
        expect(link.text()).to.equal("https://example.com");
    });

    it("renders a phone number as tel-link", () => {
        const wrapper = shallowMount(FeatureDetailView, {global: {plugins: [store]}}),
            tel = wrapper.find("a[href^=\"tel:\"]");

        expect(tel.exists()).to.be.true;
        expect(tel.text()).to.equal("+49123456789");
    });

    it("renders an email as mailto-link", () => {
        const wrapper = shallowMount(FeatureDetailView, {global: {plugins: [store]}}),
            mail = wrapper.find("a[href^=\"mailto:\"]");

        expect(mail.exists()).to.be.true;
        expect(mail.text()).to.equal("test@example.com");
    });

    it("renders semicolon value with toBold", () => {
        const wrapper = shallowMount(FeatureDetailView, {
            global: {plugins: [store]}
        });

        expect(wrapper.html()).to.include("<b>test</b>; test");
    });

    it("renders pipe value with removeVerticalBar", () => {
        const wrapper = shallowMount(FeatureDetailView, {global: {plugins: [store]}});

        expect(wrapper.html()).to.include("foo<br>bar");
    });

    it("renders <br> value as html", () => {
        const wrapper = shallowMount(FeatureDetailView, {global: {plugins: [store]}});

        expect(wrapper.html()).to.include("bar<br>foo");
    });

    it("renders normal value as plain text", () => {
        const wrapper = shallowMount(FeatureDetailView, {global: {plugins: [store]}});

        expect(wrapper.text()).to.include("normaler Text");
    });
});

