import {createStore} from "vuex";
import {mount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import ExampleControl from "../../../components/ExampleControl.vue";


describe("addons/controls/exampleControl/components/ExampleControl.vue", () => {
    const showAlertSpy = sinon.spy();
    let store;


    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                Controls: {
                    namespaced: true,
                    modules: {
                        ExampleControl: {
                            namespaced: true,
                            getters: {
                                icon: sinon.stub()
                            },
                            actions: {
                                showAlert: showAlertSpy
                            }
                        }
                    }
                }
            }
        });
    });


    it("renders the button", () => {
        const wrapper = mount(ExampleControl, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#example-contol-buttons > button").exists()).to.be.true;
        expect(wrapper.findAll("button")).to.have.length(1);
    });

    it("should trigger alerting", async () => {
        const wrapper = mount(ExampleControl, {
            global: {
                plugins: [store]
            }});

        await wrapper.find("#example-contol-buttons > button").trigger("click");

        expect(showAlertSpy.calledOnce).to.be.true;
    });
});
