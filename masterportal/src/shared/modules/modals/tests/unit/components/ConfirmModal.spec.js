import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import ConfirmModal from "@shared/modules/modals/components/ConfirmModal.vue";

config.global.mocks.$t = key => key;

describe("src/shared/modules/modals/components/ConfirmModal.vue", () => {

    it("should output the correct labels and header", () => {
        const wrapper = shallowMount(ConfirmModal, {
            props: {
                showModal: true,
                modalTitle: "Title set via prop",
                modalContent: "Content set via prop",
                modalStyle: "max-width: 350px",
                buttonConfirmLabel: "Demo Confirm",
                buttonCancelLabel: "Demo Cancel"
            }
        });

        expect(wrapper.element.innerHTML).to.include("Demo Confirm");
        expect(wrapper.element.innerHTML).to.include("Demo Cancel");
        expect(wrapper.find("#modal-confirm-title").text()).to.equal("Title set via prop");
        expect(wrapper.find("#modal-confirm-content").text()).to.equal("Content set via prop");
        expect(wrapper.find(".modal-inner-wrapper").attributes().style).to.include("max-width: 350px");
    });

    it("should toggle visibility using showModal", async () => {
        const wrapper = shallowMount(ConfirmModal, {
            props: {
                showModal: false,
                modalStyle: "max-width: 350px",
                buttonConfirmLabel: "Demo Confirm",
                buttonCancelLabel: "Demo Cancel"
            }
        });

        expect(wrapper.find("#modal-confirm").classes()).to.not.include("showing");

        await wrapper.setProps({showModal: true});

        await wrapper.vm.$nextTick();

        expect(wrapper.find("#modal-confirm").classes()).to.include("showing");
    });

    it("uses modalTitle and modalContent unless those are overwritten by slots", () => {
        let wrapper = shallowMount(ConfirmModal, {
            props: {
                showModal: false,
                modalTitle: "Title set via prop",
                modalContent: "Content set via prop"
            }
        });

        expect(wrapper.find("#modal-confirm-title").text()).to.equal("Title set via prop");
        expect(wrapper.find("#modal-confirm-content").text()).to.equal("Content set via prop");

        wrapper = mount(ConfirmModal, {
            props: {
                showModal: false,
                modalTitle: "Title set via prop",
                modalContent: "Content set via prop"
            },
            slots: {
                title: "Title set via slot",
                default: "Content set via slot"
            }
        });

        expect(wrapper.find("#modal-confirm-title").text()).to.equal("Title set via slot");
        expect(wrapper.find("#modal-confirm-content").text()).to.equal("Content set via slot");
    });
});
