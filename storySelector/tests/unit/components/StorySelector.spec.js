import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import {createStore} from "vuex";

import Component from "../../../components/StorySelector.vue";
import axios from "axios";

describe("addons/dataNarrator/storySelector/tests/unit/components/StorySelector.spec.js", () => {
    let wrapper,
        store;

    beforeEach(() => {
        sinon.stub(axios, "get").resolves({data: {
            stories: [
                {
                    "nid": "26026",
                    "type": "story",
                    "title": "Teststory1",
                    "created": "2025-12-17T08:52:39Z",
                    "langcode": "de",
                    "author": "techadmin",
                    "description": "Diese Story dient zum Test",
                    "coverImagePath": "https://URLzuBild1",
                    "coverImageAlt": "Testbild 1",
                    "coverImageCaption": "Testbild 1",
                    "coverImageCopyright": "gmp",
                    "reading_time": "1"
                },
                {
                    "nid": "21921",
                    "type": "story",
                    "title": "Teststory2",
                    "created": "2024-09-12T09:43:04Z",
                    "langcode": "de",
                    "author": "techadmin",
                    "description": "Dies ist eine Teststory 2",
                    "coverImagePath": "https://URLzuBild2",
                    "coverImageAlt": "Testbild 2",
                    "coverImageCaption": "Testbild 2",
                    "coverImageCopyright": "abc",
                    "reading_time": "2"
                },
                {
                    "nid": "12375",
                    "type": "story",
                    "title": "Teststory3",
                    "created": "2023-04-11T12:53:01Z",
                    "langcode": "de",
                    "author": "techadmin",
                    "description": "Teststory 3",
                    "coverImagePath": "https://URLzuBild3",
                    "coverImageAlt": "Testbild 3",
                    "coverImageCaption": "Testbild 3",
                    "coverImageCopyright": "xyz",
                    "reading_time": "19"
                }
            ]
        }});

        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        StorySelector: {
                            namespaced: true,
                            state: () => ({
                                storyIndexURL: "testURL"
                            }),
                            getters: {
                                storyIndexURL: state => state.storyIndexURL
                            },
                            mutations: {
                                setStoryIndexURL (state, payload) {
                                    state.storyIndexURL = payload;
                                }
                            }
                        }
                    }
                },
                Menu: {
                    namespaced: true,
                    getters: {
                        secondaryExpanded: () => true
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            props: {
            },
            global: {
                mocks: {
                    $t: key => key
                },
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        axios.get.restore();
        if (wrapper) {
            wrapper.unmount();
        }
    });


    it("StorySelector should exist", async () => {
        expect(wrapper.exists()).to.be.true;
    });

    /**
     * Waits for several Vue nextTicks to ensure all asynchronous DOM updates and axios responses
     * are processed before running assertions. This is needed because the component fetches data
     * asynchronously in its lifecycle hooks and updates the DOM after the axios call resolves.
     */
    async function waitForDomUpdate () {
        for (let i = 0; i < 3; i++) {
            await wrapper.vm.$nextTick();
        }
    }

    it("renders the correct number of story-box divs", async () => {
        await waitForDomUpdate();
        const storyBoxes = wrapper.findAll(".story-box");

        expect(storyBoxes.length).to.equal(3);
    });

    it("renders the correct number of img tags (logo + covers)", async () => {
        await waitForDomUpdate();
        const imgTags = wrapper.findAll("img");

        // 3 story images + 1 logo image
        expect(imgTags.length).to.equal(4);

        // Check that the first img is the logo
        expect(imgTags[0].attributes("alt")).to.equal("DIPAS Logo");
        // Check that the next three are the story images
        expect(imgTags[1].attributes("alt")).to.equal("Testbild 1");
        expect(imgTags[2].attributes("alt")).to.equal("Testbild 2");
        expect(imgTags[3].attributes("alt")).to.equal("Testbild 3");
    });

    it("renders the correct story titles and descriptions", async () => {
        await waitForDomUpdate();
        const storyTitles = wrapper.findAll(".storyTitle");

        expect(storyTitles.length).to.equal(3);
        expect(storyTitles[0].text()).to.equal("Teststory1");
        expect(storyTitles[1].text()).to.equal("Teststory2");
        expect(storyTitles[2].text()).to.equal("Teststory3");

        const abstracts = wrapper.findAll(".abstract");

        expect(abstracts.length).to.equal(3);
        expect(abstracts[0].text()).to.equal("Diese Story dient zum Test");
        expect(abstracts[1].text()).to.equal("Dies ist eine Teststory 2");
        expect(abstracts[2].text()).to.equal("Teststory 3");
    });

});
