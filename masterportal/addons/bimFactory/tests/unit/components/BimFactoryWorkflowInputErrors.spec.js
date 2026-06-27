import {config, mount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import BimFactoryWorkflowInputErrors from "../../../components/BimFactoryWorkflowInputErrors.vue";

config.global.mocks.$t = key => key;

describe("BimFactoryWorkflowInputErrors.vue", () => {
    let wrapper;

    const
        mockComponentWithErrors = [
            {msg: "Fehler 1", type: "string_type"},
            {msg: "Fehler 2", type: "number_type"}
        ],
        mockComponentNoErrors = [],
        store = createStore({}),
        globalMocks = {
            plugins: [store]
        };

    /**
     * Mounts the component with the given config
     * @param {Object} configProp - The configuration object for the component
     * @returns {wrapper} - A Vue Test Utils wrapper instance for the mounted component
     */
    function mountComponent (configProp) {
        return mount(BimFactoryWorkflowInputErrors, {
            props: {
                config: configProp
            },
            global: globalMocks
        });
    }

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("checks error messages exists", () => {
        wrapper = mountComponent(mockComponentWithErrors);

        expect(wrapper.find("div.BimFactoryWorkflowInputErrors").exists()).to.be.true;
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.findAll(".errorline").length).to.equal(2);
        expect(wrapper.text()).to.include("Fehler 1");
        expect(wrapper.text()).to.include("Fehler 2");
    });

    it("checks no .errorlines exists if errors are empty", () => {
        wrapper = mountComponent(mockComponentNoErrors);

        expect(wrapper.exists()).to.be.true;
        expect(wrapper.findAll(".errorline").length).to.equal(0);
    });

});
