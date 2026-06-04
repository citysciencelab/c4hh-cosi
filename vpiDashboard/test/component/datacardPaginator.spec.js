import DataCardPaginator from "../../components/DataCardPaginator.vue";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";

/**
 * Run only these tests via command:
 * npm run test:watch -- --grep="addons/vpiDashboard/test/ datacard paginator component"
 */
describe("addons/vpiDashboard/test/ paginator component", () => {
    let wrapper = null;

    beforeEach(() => {
        wrapper = shallowMount(DataCardPaginator, {propsData: {
            paginatorData: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            startIndex: 4
        }});
    });

    afterEach(() => {
        wrapper.unmount();
        wrapper = null;
    });

    it("renders the paginator component", () => {
        expect(wrapper.find("#paginator").exists()).to.be.true;
    });
    it("should have a button to roll backward", () => {
        expect(wrapper.find(".previous-paginator-button").exists()).to.be.true;
    });
    it("should have a index displaying data", () => {
        expect(wrapper.find(".paginator-index").exists()).to.be.true;
        expect(wrapper.find(".paginator-index").text()).to.equal("5");
    });
    it("should have a button to roll forward", () => {
        expect(wrapper.find(".next-paginator-button").exists()).to.be.true;
    });
    it("should switch to correct index", async () =>{
        expect(wrapper.vm.currentIndex).to.equal(4);

        const nextButton = wrapper.find(".next-paginator-button"),
            prevButton = wrapper.find(".previous-paginator-button");

        await nextButton.trigger("click");

        expect(wrapper.vm.currentIndex).to.equal(5);
        expect(wrapper.emitted().pager[0]).to.deep.equal([5]);

        await prevButton.trigger("click");

        expect(wrapper.vm.currentIndex).to.equal(4);
        expect(wrapper.emitted().pager[1]).to.deep.equal([4]);
    });

    it("should wrap around when reaching the end", async () => {
        wrapper.setData({currentIndex: 11});
        const nextButton = wrapper.find(".next-paginator-button");

        await nextButton.trigger("click");

        expect(wrapper.vm.currentIndex).to.equal(0);
        expect(wrapper.emitted().pager[0]).to.deep.equal([0]);
    });

    it("should wrap around when going backward from the first index", async () => {
        wrapper.setData({currentIndex: 0});
        const prevButton = wrapper.find(".previous-paginator-button");

        await prevButton.trigger("click");

        expect(wrapper.vm.currentIndex).to.equal(11);
        expect(wrapper.emitted().pager[0]).to.deep.equal([11]);
    });
});
