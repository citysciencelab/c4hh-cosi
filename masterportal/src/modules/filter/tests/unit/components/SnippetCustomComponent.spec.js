import {expect} from "chai";
import {markRaw} from "vue";
import {mount} from "@vue/test-utils";
import SnippetCustomComponent from "../../../components/SnippetCustomComponent.vue";

describe("SnippetCustomComponent", () => {
    it("renders the dynamic component with given name and props", () => {
        const TestComponent = {
                template: "<div class='test'>Hello</div>"
            },
            wrapper = mount(SnippetCustomComponent, {
                propsData: {
                    componentName: markRaw(TestComponent),
                    propsObject: {foo: "bar"}
                }
            });

        expect(wrapper.find(".test").exists()).to.be.true;
    });

    it("passes propsObject to the dynamic component", () => {
        const TestComponent = {
                props: ["foo"],
                template: "<div>{{ foo }}</div>"
            },
            wrapper = mount(SnippetCustomComponent, {
                propsData: {
                    componentName: markRaw(TestComponent),
                    propsObject: {foo: "baz"}
                }
            });

        expect(wrapper.text()).to.equal("baz");
    });
});

