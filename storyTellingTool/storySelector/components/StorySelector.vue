<script>
import {mapGetters, mapMutations} from "vuex";
import mutations from "../store/mutations";
import axios from "axios";

export default {
    name: "StorySelector",
    data () {
        return {
            baseURL: "",
            proceedingname: "",
            proceedingurl: "",
            stories: [],
            toolheadline: "",
            styleCSS: undefined
        };
    },
    computed: {
        ...mapGetters("Modules/StorySelector", ["storyIndexURL"]),
        ...mapGetters("Menu", [
            "secondaryExpanded"
        ]),
        cssVars () {
            return {
                "--selector-tool-header": this.secondaryExpanded ? "flex" : "none"
            };
        }
    },
    mounted () {
        this.fetchDataFromUrl(this.storyIndexURL)
            .then(data => {
                this.baseURL = data.storybaseurl;
                this.proceedingname = data.proceedingname;
                this.proceedingurl = data.proceedingurl;
                this.stories = data.stories;
                this.toolheadline = data.toolheadline;
                this.styleCSS = data.styleCSS ? data.styleCSS : undefined;

                if (this.styleCSS) {
                    const element = document.createElement("link");

                    element.setAttribute("rel", "stylesheet");
                    element.setAttribute("type", "text/css");
                    element.setAttribute("href", this.styleCSS);
                    document.getElementsByTagName("head")[0].appendChild(element);
                }
            });
    },
    activated () {
        // Handle KeepAlive visibility. Triggered if component is activated
        const heading = document.getElementById("mp-menu-navigation-secondaryMenu");

        // The header of the secondary menu should be hidden in the story selector
        if (heading) {
            heading.style = "display: none;";
        }
    },
    deactivated () {
        // Handle KeepAlive visibility. Triggered if component is deactivated
        const heading = document.getElementById("mp-menu-navigation-secondaryMenu");

        // The header of the secondary menu should be shown again when leaving the story selector
        // so that other modules can use it as the default in the masterportal
        if (heading) {
            heading.style.removeProperty("display");
        }
    },
    methods: {
        ...mapMutations("Modules/StorySelector", Object.keys(mutations)),
        async fetchDataFromUrl (url) {
            try {
                const response = await axios.get(url);

                return response.data;
            }
            catch (error) {
                console.error("Error fetching data:", error);

                return null;
            }
        },
        openStory (story) {
            if (this.baseURL && story && story.nid) {
                window.open(this.baseURL + story.nid, "_self");
            }
            else {
                // Optionally, show an error or do nothing
                console.warn("Cannot open story: baseURL or story.nid is undefined");
            }
        }
    }
};
</script>

<template lang="html">
    <div
        id="story-selector"
    >
        <div
            class="storyToolHeader"
            :style="cssVars"
        >
            <a
                class="dipasLogo"
                href="https://dipas.org/"
                target="_blank"
                :style="cssVars"
            >
                <img
                    src="../assets/DIPAS-Logo-RGB.png"
                    alt="DIPAS Logo"
                >
            </a>
        </div>

        <span v-if="stories.length === 0">
            {{ $t("additional:modules.storySelector.noStoriesAvailable") }}
        </span>

        <div class="storyList">
            <div
                v-for="(story) in stories"
                :key="story.nid"
                class="story-box"
            >
                <figure>
                    <img
                        class="title-image"
                        :src="story.coverImagePath"
                        :alt="story.coverImageAlt"
                    >

                    <figcaption v-if="story.coverImageCaption">
                        <span> {{ story.coverImageCaption }}</span>
                    </figcaption>

                    <figcaption v-if="story.coverImageCopyright">
                        <span> ©  {{ story.coverImageCopyright }}</span>
                    </figcaption>
                </figure>

                <div class="storydescription">
                    <span class="storyTitle"> {{ story.title }} </span>
                    <p class="abstract">
                        {{ story.description }}
                    </p>
                </div>

                <button
                    @click="openStory(story)"
                >
                    {{ $t("additional:modules.storySelector.openStoryButton") }}
                </button>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>

.storyToolHeader {
    height: 3.125rem;
    display: var(--selector-tool-header);
    flex-direction: row;
    position: sticky;
    top: 0;
    z-index: 1000;
    width: 100%;
    padding-top: 0.625rem;
    background-color: white;
    justify-content: flex-end;
    padding-right: 1.5rem;
    margin-bottom: 0.5rem;

    a.dipasLogo {
        display: flex;
        align-items: center;
        height: 2rem;
        position: static;

        img {
            max-width: 7.5rem;
            max-height: 2rem;
            width: auto;
            height: auto;
            object-fit: contain;
            display: block;
        }
    }
}

    #story-selector {
        .storyList {
            .story-box {
                border-radius: 0.313rem;
                border: none;
                box-shadow: 0 0.188rem 0.375rem #00000029;
                width: 100%;
                margin-bottom: 1.25rem;
                position: relative;
                background-color: white;

                figure {
                    img.title-image {
                        object-fit: cover;
                        height: fit-content;
                        align-self: center;
                        width: 100%;
                        height: 11rem;
                        border-radius: 0.313rem 0.313rem 0 0;
                    }

                    figcaption {
                        text-align: right;
                        padding: 0.125rem 0.625rem 0 0;
                        font-size: 0.75rem;
                    }
                }
                .storydescription {
                    margin: 0 0 0.625rem 0.625rem;
                    padding: 0.625rem;

                    .storyTitle {
                        font-size: 1.25rem;
                        font-weight: bold;
                        color: var(--DipasColorsFont, #212529);
                    }

                    p.abstract {
                        font-size: 0.875rem;;
                        color: var(--DipasColorsFont, #212529);
                        white-space: pre-line;
                        line-height: 1.6;
                        padding-bottom: 0.9375rem;
                        overflow-y: auto;
                        overflow-x: hidden;
                        overflow-wrap: break-word;
                        border-radius: 0;
                        -webkit-line-clamp: 5;
                        line-clamp: 5;
                        -webkit-box-orient: vertical;
                        margin-bottom: 2rem;
                    }
                }

                button {
                    position: absolute;
                    bottom: 1rem;
                    right: 1rem;
                    background-color: var(--DipasColorsPrimary2, #e10019);
                    color: var(--DipasColorsPrimary2TextColor,  #ffffff);
                    font-size: 0.75rem;
                    font-weight: bold;
                    padding: 0.4rem 1rem 0.3rem;
                    border-radius: 0.313rem;
                    border: none;

                    &:hover {
                        background-color: var(--DipasColorsPrimaryButtonHover, #b4081b);
                    }
                }
            }
        }

        i.bi-x-circle-fill::before {
            color: grey;
            font-size: 1.5rem;
        }
    }
</style>
