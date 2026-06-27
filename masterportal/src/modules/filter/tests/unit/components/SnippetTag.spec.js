import {config, shallowMount} from "@vue/test-utils";
import SnippetTag from "@modules/filter/components/SnippetTag.vue";
import {expect} from "chai";

config.global.mocks.$t = key => key;

describe("src/modules/generalFilter/components/SnippetTag.vue", () => {
    describe("constructor", () => {
        it("should have correct default values", () => {
            const wrapper = shallowMount(SnippetTag, {});

            expect(wrapper.vm.filterId).to.equal(undefined);
            expect(wrapper.vm.rule).to.deep.equal({});
        });
    });
    describe("computed", () =>{
        describe("valueTags", () => {
            it("should return rule.value by default", () => {
                const wrapper = shallowMount(SnippetTag, {props: {rule: {value: [1, 2]}}});

                expect(wrapper.vm.valueTags).to.deep.equal([1, 2]);
            });
            it("should return tagTitle if existing", () => {
                const wrapper = shallowMount(SnippetTag, {props: {rule: {tagTitle: "Titel"}}});

                expect(wrapper.vm.valueTags).to.deep.equal(["Titel"]);
            });
        });
    });
    describe("removeTag", () => {
        it("should emit deleteRule", async () => {
            const wrapper = shallowMount(SnippetTag, {props: {rule: {tagTitle: "Titel"}}}),
                buttonClick = wrapper.find(".btn-tags");

            buttonClick.trigger("click");
            expect(wrapper.emitted().deleteRule).to.be.an("array").and.to.have.lengthOf(1);
        });
        it("should emit deleteValue", () => {
            const wrapper = shallowMount(SnippetTag, {props: {
                    filterId: 1,
                    rule: {snippetId: 2, value: ["3", "4"]}
                }}),
                buttonClick = wrapper.find(".btn-tags");

            buttonClick.trigger("click");
            expect(wrapper.emitted().deleteValue).to.deep.equal([
                [2, 1, "3"]
            ]);
        });
    });
});
