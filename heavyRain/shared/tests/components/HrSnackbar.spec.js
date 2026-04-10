import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import HrSnackbar from "../../components/HrSnackbar.vue";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("addons/heavyRain/shared/components/HrSnackbar.vue", () => {
    let wrapper;

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    describe("Component DOM & Props", () => {
        it("should not render if modelValue is false", () => {
            wrapper = shallowMount(HrSnackbar, {
                props: {
                    modelValue: false,
                    message: "Test Message"
                }
            });
            expect(wrapper.find(".hr-snackbar").exists()).to.be.false;
        });

        it("should render correctly if modelValue is true and message is set", () => {
            wrapper = shallowMount(HrSnackbar, {
                props: {
                    modelValue: true,
                    message: "Success Content"
                }
            });
            expect(wrapper.find(".hr-snackbar").exists()).to.be.true;
            expect(wrapper.find(".hr-snackbar__message").text()).to.equal("Success Content");
        });

        it("should apply the correct color class", () => {
            wrapper = shallowMount(HrSnackbar, {
                props: {
                    modelValue: true,
                    message: "Warn",
                    color: "warning"
                }
            });
            expect(wrapper.find(".hr-snackbar").classes()).to.contain("hr-snackbar--warning");
        });
    });

    describe("Interactions & Emits", () => {
        it("should emit update:modelValue when close button is clicked", async () => {
            wrapper = shallowMount(HrSnackbar, {
                props: {
                    modelValue: true,
                    message: "Closable",
                    closable: true
                }
            });

            const closeButton = wrapper.find(".hr-snackbar__close");

            await closeButton.trigger("click");

            expect(wrapper.emitted("update:modelValue")).to.have.lengthOf(1);
            expect(wrapper.emitted("update:modelValue")[0]).to.deep.equal([false]);
        });
    });

    describe("Timer Logic", () => {
        let clock;

        beforeEach(() => {
            clock = sinon.useFakeTimers();
        });

        afterEach(() => {
            clock.restore();
        });

        it("should emit update:modelValue after the default timeout", async () => {
            wrapper = shallowMount(HrSnackbar, {
                props: {
                    modelValue: false,
                    message: "Auto Hide",
                    timeout: 3000
                }
            });

            await wrapper.setProps({modelValue: true});

            clock.tick(3000);

            const emitted = wrapper.emitted("update:modelValue");

            expect(emitted).to.not.be.undefined;
            expect(emitted).to.have.lengthOf(1);
            expect(emitted[0]).to.deep.equal([false]);
        });
    });
});
