import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import FeatureListerComponent from "@modules/featureLister/components/FeatureLister.vue";
import sinon from "sinon";
import {expect} from "chai";


describe("src/modules/featureLister/components/FeatureLister.vue", () => {
    let wrapper, actions, getters, store,
        mountOptions;

    beforeEach(() => {
        actions = {
            switchBackToList: sinon.stub(),
            switchToThemes: sinon.stub(),
            switchToDetails: sinon.stub()
        };
        getters = {
            layer: () => ({name: "Layer 1"}),
            activeTab: () => "themes",
            selectedRow: () => ({id: "1"})
        };
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        FeatureLister: {
                            namespaced: true,
                            actions,
                            getters,
                            state: {}
                        }
                    }
                }
            }
        });
        mountOptions = {
            global: {
                plugins: [store],
                stubs: {
                    NavTab: false
                }
            }
        };
    });
    afterEach(() => {
        if (typeof wrapper !== "undefined") {
            wrapper.unmount();
        }
    });

    it("renders list of visible vector layers", () => {
        wrapper = shallowMount(FeatureListerComponent, mountOptions);

        expect(wrapper.find("#module-feature-lister-themeChooser").exists()).to.be.true;
        expect(wrapper.find("#module-feature-lister-list").exists()).to.be.true;
        expect(wrapper.find("#module-feature-lister-details").exists()).to.be.true;
    });

    it("calls switchToThemes if Theme-Tab was clicked", async () => {
        wrapper = shallowMount(FeatureListerComponent, mountOptions);

        await wrapper.find("#module-feature-lister-themeChooser").trigger("click");
        expect(actions.switchToThemes.called).to.be.true;
    });

    it("calls switchBackToList if List-Tab was clicked", async () => {
        wrapper = shallowMount(FeatureListerComponent, mountOptions);

        await wrapper.find("#module-feature-lister-list").trigger("click");
        expect(actions.switchBackToList.called).to.be.true;
    });

    it("calls switchToDetails if Details-Tab was clicked", async () => {
        wrapper = shallowMount(FeatureListerComponent, mountOptions);

        await wrapper.find("#module-feature-lister-details").trigger("click");
        expect(actions.switchToDetails.called).to.be.true;
    });

    it("calls switchToThemes on unmount", () => {
        wrapper = shallowMount(FeatureListerComponent, mountOptions);

        wrapper.unmount();
        expect(actions.switchToThemes.called).to.be.true;
    });
});
