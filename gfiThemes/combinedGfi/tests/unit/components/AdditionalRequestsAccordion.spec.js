import {mount} from "@vue/test-utils";
import {expect} from "chai";
import AdditionalRequestsAccordion from "../../../components/AdditionalRequestsAccordion.vue";

describe("addons/gfiThemes/combinedGfi/components/AdditionalRequestsAccordion.vue", () => {
    let wrapper;

    /**
     * Mock translate function
     * @param {string} key - Translation key
     * @returns {string} The key itself
     */
    function mockTranslate (key) {
        return key;
    }

    const mockResults = [
        {
            text: "Test Result 1",
            url: "https://example.com/api1",
            infoText: "Info about result 1"
        },
        {
            text: "Test Result 2",
            url: "https://example.com/api2",
            infoText: ""
        }
    ];

    beforeEach(() => {
        wrapper = mount(AdditionalRequestsAccordion, {
            props: {
                additionalRequestResults: mockResults,
                translateFunction: mockTranslate
            }
        });
    });

    afterEach(() => {
        wrapper.unmount();
    });

    it("renders the component when results are provided", () => {
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.find(".additional-requests").exists()).to.be.true;
    });

    it("does not render when no results are provided", () => {
        const emptyWrapper = mount(AdditionalRequestsAccordion, {
            props: {
                additionalRequestResults: [],
                translateFunction: mockTranslate
            }
        });

        expect(emptyWrapper.find(".additional-requests").exists()).to.be.false;
        emptyWrapper.unmount();
    });

    it("renders correct number of results", () => {
        const resultContainers = wrapper.findAll(".additional-request");

        expect(resultContainers.length).to.equal(2);
    });

    it("displays result text and URL correctly", () => {
        const resultContainers = wrapper.findAll(".additional-request"),
            firstResult = resultContainers[0],
            resultText = firstResult.find(".result-text"),
            sourceLine = firstResult.find(".source-line");

        expect(resultContainers.length).to.be.greaterThan(0);
        expect(resultText.text()).to.equal("Test Result 1");
        expect(sourceLine.text()).to.include("https://example.com/api1");
    });

    it("shows info icon when infoText is available", () => {
        const resultContainers = wrapper.findAll(".additional-request"),
            firstResult = resultContainers[0],
            infoIcon = firstResult.find(".info-icon");

        expect(resultContainers.length).to.be.greaterThan(0);
        expect(infoIcon.exists()).to.be.true;
    });

    it("handles info hover correctly", async () => {
        const infoContainers = wrapper.findAll(".info-text-container"),
            infoContainer = infoContainers[0];

        expect(infoContainers.length).to.be.greaterThan(0);

        await infoContainer.trigger("mouseenter");
        expect(wrapper.vm.infoHoverIndex).to.equal(0);

        await infoContainer.trigger("mouseleave");
        expect(wrapper.vm.infoHoverIndex).to.be.null;
    });
});
