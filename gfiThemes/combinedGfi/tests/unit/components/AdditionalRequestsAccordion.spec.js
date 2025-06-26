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
            },
            global: {
                stubs: {
                    AccordionItem: {
                        template: "<div><div><slot /></div></div>",
                        props: ["id", "title", "icon", "isOpen", "fontSize", "colouredHeader"]
                    }
                }
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
            },
            global: {
                stubs: {
                    AccordionItem: {
                        template: "<div><div><slot /></div></div>",
                        props: ["id", "title", "icon", "isOpen", "fontSize", "colouredHeader"]
                    }
                }
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

    it("shows info accordion when infoText is available", () => {
        expect(wrapper.vm.hasInfoText).to.be.true;
    });

    it("displays info text correctly", () => {
        const resultsWithInfo = wrapper.vm.additionalRequestResults.filter(result => result.infoText);

        expect(resultsWithInfo.length).to.equal(1);
        expect(resultsWithInfo[0].infoText).to.equal("Info about result 1");
    });
});
