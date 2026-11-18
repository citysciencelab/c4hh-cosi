import sinon from "sinon";
import {mount} from "@vue/test-utils";
import {expect} from "chai";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";


describe("src/shared/modules/checkboxes/components/SwitchInput.vue", () => {
    let interactionSpy;

    beforeEach(() => {
        interactionSpy = sinon.spy();
    });


    it("should render an input field", () => {
        const id = "perfect-sitch",
            label = "My super nice switch. Switch me!",
            aria = "read me when you need to",
            wrapper = mount(SwitchInput, {
                props: {id, label, aria}
            }),
            input = wrapper.find("input");

        expect(input.exists()).to.be.true;
        expect(input.classes()).to.eql(["form-check-input"]);
        expect(input.attributes("aria-label")).to.equal(aria);
        expect(wrapper.find("label").exists()).to.be.true;
    });

    it("should not render the built-in label when omitLabel is true", () => {
        const wrapper = mount(SwitchInput, {
            props: {id: "custom-label-switch", label: "Built-in label", aria: "Switch description", omitLabel: true}
        });

        expect(wrapper.find("input").exists()).to.be.true;
        expect(wrapper.find("label").exists()).to.be.false;
    });

    it("should render a switch and trigger the given interaction on click", async () => {
        const id = "perfect-sitch",
            label = "My super nice switch. Switch me!",
            aria = "read me when you need to",
            wrapper = mount(SwitchInput, {
                props: {interaction: interactionSpy(), id: id, aria: aria, label: label}
            }),
            input = wrapper.find("input");


        expect(input.exists()).to.be.true;

        input.trigger("input");
        await wrapper.vm.$nextTick();
        expect(interactionSpy.calledOnce).to.be.true;
    });
});
