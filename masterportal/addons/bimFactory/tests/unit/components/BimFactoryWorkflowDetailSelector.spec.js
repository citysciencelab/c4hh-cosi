import {config, shallowMount} from "@vue/test-utils";
import BimFactoryWorkflowDetailSelector from "../../../components/BimFactoryWorkflowDetailSelector.vue";
import {expect} from "chai";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("BimFactoryWorkflowDetailSelector.vue", () => {
    let wrapper;
    const workflowConfig = {
        containerId: "testContainerId",
        component: {
            type: "testType",
            maschineName: "TestMaschine",
            defaultValue: 2,
            details: [
                {
                    value: 1,
                    imageSource: "img1.png",
                    title: "Title 1"
                },
                {
                    value: 2,
                    imageSource: "img2.png",
                    title: "Title 2"
                }
            ]
        }
    };

    beforeEach(() => {
        wrapper = shallowMount(BimFactoryWorkflowDetailSelector, {
            props: {
                config: workflowConfig
            },
            global: {
                mocks: {
                    $store: {
                        // eslint-disable-next-line no-empty-function
                        commit: () => {}
                    }
                }
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("checks buttons", () => {
        const buttons = wrapper.findAll("button.item");

        expect(buttons.length).to.equal(workflowConfig.component.details.length);

        buttons.forEach((button, idx) => {
            expect(button.text()).to.include(workflowConfig.component.details[idx].title);
            expect(button.attributes("type")).to.equal("button");
            expect(button.classes()).to.include("item");
        });
    });

    it("checks images and captions details", () => {
        workflowConfig.component.details.forEach((detail, idx) => {
            const
                img = wrapper.findAll("img.itemImage")[idx],
                caption = wrapper.findAll(".imageCaption")[idx];

            expect(img.attributes("src")).to.equal(detail.imageSource);
            expect(img.attributes("alt")).to.equal(detail.title);
            expect(img.attributes("title")).to.equal(detail.title);
            expect(caption.text()).to.equal(detail.title);
        });
    });

    it("checks selectedValue with incomming default value", () => {
        expect(wrapper.vm.selectedValue).to.equal(workflowConfig.component.defaultValue);
    });

    it("update selectedValue when a button is clicked", async () => {
        const buttons = wrapper.findAll("button.item");

        await buttons[0].trigger("click");
        expect(wrapper.vm.selectedValue).to.equal(workflowConfig.component.details[0].value);
    });

    it("check props to SliderItem", () => {
        const slider = wrapper.findComponent({name: "SliderItem"});

        expect(slider.exists()).to.be.true;
        expect(slider.props("value")).to.equal(workflowConfig.component.defaultValue);
        expect(slider.props("min")).to.equal(1);
        expect(slider.props("max")).to.equal(workflowConfig.component.details.length);
        expect(slider.props("step")).to.equal(1);
        expect(slider.props("showMarkers")).to.equal(true);
    });

    it("checks updateSelectedValue()", () => {
        wrapper.vm.updateSelectedValue(33);
        expect(wrapper.vm.selectedValue).to.equal(33);
    });

    it("commits clearComponentErrors() to the store on updateSelectedValue", async () => {
        const commitSpy = sinon.spy();

        wrapper = shallowMount(BimFactoryWorkflowDetailSelector, {
            props: {config: workflowConfig},
            global: {
                mocks: {
                    $store: {commit: commitSpy},
                    $t: k => k
                }
            }
        });

        await wrapper.vm.updateSelectedValue(2);

        expect(commitSpy.calledWith("Modules/BimFactory/clearComponentErrors", {
            containerId: workflowConfig.containerId,
            machineName: workflowConfig.component.machineName,
            emptyError: true
        })).to.be.true;
    });

    it("commits updateWorkflowFormData() to the store on updateSelectedValue()", async () => {
        const commitSpy = sinon.spy();

        wrapper = shallowMount(BimFactoryWorkflowDetailSelector, {
            props: {config: workflowConfig},
            global: {
                mocks: {
                    $store: {commit: commitSpy},
                    $t: k => k
                }
            }
        });

        await wrapper.vm.updateSelectedValue(2);

        expect(commitSpy.calledWith("Modules/BimFactory/updateWorkflowFormData", {
            containerId: workflowConfig.containerId,
            machineName: workflowConfig.component.machineName,
            value: 2
        })).to.be.true;
    });
});
