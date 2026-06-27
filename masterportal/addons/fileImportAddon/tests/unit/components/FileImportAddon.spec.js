import {config, shallowMount} from "@vue/test-utils";
import FileImportAddonComponent from "../../../components/FileImportAddon.vue";
import FileImportAddon from "../../../store/indexFileImportAddon";
import {expect} from "chai";
import {createStore} from "vuex";

config.global.mocks.$t = key => key;

describe("addons/fileImportAddon/components/FileImportAddon.vue", () => {
    const
        mockConfigJson = {
            Portalconfig: {
                menu: {
                    tools: {
                        children: {
                            FileImportAddon:
                            {
                                "title": "translate#addtional:menu.tools.fileImportAddon",
                                "icon": "bi-file-earmark-arrow-up-fill",
                                "renderToWindow": true
                            }
                        }
                    }
                }
            }
        };

    let store;

    beforeEach(() => {
        store = createStore({
            namespaces: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        FileImportAddon
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            }
        });
    });

    it("renders the FileImportAddon", () => {
        const wrapper = shallowMount(FileImportAddonComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#tool-file-import").exists()).to.be.true;
    });

    it("import method is initially set to \"auto\"", () => {
        const wrapper = shallowMount(FileImportAddonComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.vm.selectedFiletype).to.equal("auto");
    });

    it("The layer name will be got from file name", () => {
        const wrapper = shallowMount(FileImportAddonComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.vm.getLayerName("geolayer.kml")).to.equal("geolayer");
    });
});
