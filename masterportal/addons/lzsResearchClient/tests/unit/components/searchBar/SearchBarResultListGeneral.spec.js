import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";

import SearchBarResultListGeneralComponent from "../../../../components/searchBar/components/SearchBarResultListGeneral.vue";

describe("addons/lzsResearchClient/searchBar/components/SearchBarResultListGeneral.vue", () => {
    let wrapper;

    const searchResults = [
            {
                "category": "Straße",
                "id": "BeidemNeuenKrahnStraße",
                "index": 0,
                "name": "Bei dem Neuen Krahn",
                "searchInterfaceId": "gazetteer",
                "displayedInfo": "",
                "icon": "bi-signpost",
                "imagePath": "",
                "toolTip": "",
                "events": {
                }

            },
            {
                "category": "Adresse",
                "id": "BeidemNeuenKrahn2Adresse",
                "index": 1,
                "name": "Bei dem Neuen Krahn 2",
                "searchInterfaceId": "gazetteer",
                "displayedInfo": "",
                "icon": "bi-signpost",
                "imagePath": "",
                "toolTip": "",
                "events": {
                }
            },
            {
                "category": "topicTree",
                "id": "ABC",
                "index": 1,
                "name": "The topic",
                "searchInterfaceId": "topicTree",
                "displayedInfo": "",
                "icon": "bi-signpost",
                "imagePath": "",
                "toolTip": "",
                "events": {
                }
            }
        ],
        resultItems = searchResults;

    describe("test the rendering with different parameters", () => {
        it("renders the SearchBarResultListGeneral with 3 SearchBarResultListGeneralItem", async () => {
            wrapper = shallowMount(SearchBarResultListGeneralComponent, {
                props: {
                    resultItems
                },
                global: {
                    mocks: {
                        $t: key => key
                    }
                }
            });

            await wrapper.vm.$nextTick();

            expect(wrapper.find(".lzs-research-client-results-general-container").exists()).to.be.true;
            expect(wrapper.findAll("search-bar-result-list-general-item-stub").length).to.equals(3);
        });
    });
});
