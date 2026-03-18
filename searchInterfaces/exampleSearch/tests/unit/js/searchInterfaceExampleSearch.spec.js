import {expect} from "chai";
import SearchInterface from "../../../../../../src/modules/searchBar/searchInterfaces/searchInterface.js";
import searchInterfaceExampleSearch from "../../../js/searchInterfaceExampleSearch.js";

describe("addons/searchInterfaces/exampleSearch/searchInterfaceExampleSearch.js", () => {
    let SearchInterface1 = null;

    beforeAll(() => {
        SearchInterface1 = new searchInterfaceExampleSearch();
    });

    afterEach(() => {
        SearchInterface1.clearSearchResults();
    });

    describe("prototype", () => {
        it("searchInterfaceExampleSearch should has the prototype SearchInterface", () => {
            expect(SearchInterface1).to.be.an.instanceof(SearchInterface);
        });
    });

    describe("createPossibleActions", () => {
        it("should create possible events from search result", () => {
            const searchResult = {
                name: "Result Name1",
                category: "example",
                coordinates: [566601.20, 5928101.43]
            };

            expect(SearchInterface1.createPossibleActions(searchResult)).to.deep.equals(
                {
                    setMarker: {
                        coordinates: [566601.20, 5928101.43]
                    },
                    zoomToResult: {
                        coordinates: [566601.20, 5928101.43]
                    }
                }
            );
        });
    });
});
