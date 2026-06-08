<script>
import AddCardButton from "../../../cosi/shared/modules/cards/components/AddCardButton.vue";
import dayjs from "dayjs";
import draggable from "vuedraggable";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InfoCard from "../../shared/card/components/InfoCard.vue";
import InfoText from "../../shared/card/components/InfoText.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import isObject from "@shared/js/utils/isObject.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import store from "@appstore/index.js";
import StoryCreatorAddImageCard from "./StoryCreatorAddImageCard.vue";
import StoryCreatorChapter from "./StoryCreatorChapter.vue";
import StoryPlayer from "../../storyPlayer/components/storyPlayer/StoryPlayer.vue";

export default {
    name: "StoryCreator",
    components: {
        AddCardButton,
        Draggable: draggable,
        FlatButton,
        InfoCard,
        InfoText,
        InputText,
        StoryCreatorAddImageCard,
        StoryCreatorChapter,
        StoryPlayer
    },
    data () {
        return {
            title: "",
            description: "",
            author: "",
            imageAlt: "",
            imageCopyright: "",
            imageSrc: "",
            chapterContent: [],
            imageLoaded: false
        };
    },
    computed: {
        ...mapGetters("Modules/StoryCreator", [
            "currentView",
            "imageAssetsById",
            "story"
        ]),
        ...mapGetters("Modules/StoryManager", [
            "storyList"
        ])
    },
    mounted () {
        this.updateStory();
        this.imageLoaded = typeof this.imageAssetsById?.[this.imageSrc]?.objectURL !== "undefined";
    },
    methods: {
        ...mapActions("Menu", ["changeCurrentComponent"]),
        ...mapMutations("Menu", [
            "setNavigationHistoryBySide"
        ]),
        ...mapMutations("Modules/StoryCreator", [
            "removeImageAsset",
            "setCurrentView"
        ]),
        ...mapMutations("Modules/StoryManager", [
            "setStoryList"
        ]),

        /**
         * Adds a new chapter.
         * @returns {void}
         */
        addChapter () {
            this.setCurrentView("chapter");
        },

        /**
         * Adds the uploaded title image attributes.
         * @param {Object} image - The image object containing id, altText, photoCredit, and objectURL.
         * @returns {void}
         */
        addImage (image) {
            this.imageSrc = image.id;
            this.imageAlt = image.altText;
            this.imageCopyright = image.photoCredit;
            this.imageLoaded = true;
        },

        /**
         * Deletes a chapter from the index.
         * @param {Number} index - the index of the chapter in chapter list.
         * @return {void}
         */
        deleteChapter (index) {
            const chapter = this.story.chapters[index];

            if (chapter.content) {
                chapter.content
                    .filter(item => item.type === "image")
                    .forEach(image => {
                        this.removeImageAsset(image.id);
                    });
            }
            this.story.chapters.splice(index, 1);
        },

        /**
         * Discards the current story and resets all data to default values.
         * @return {void}
         */
        discardStory () {
            this.title = "";
            this.description = "";
            this.imageAlt = "";
            this.imageCopyright = "";
            this.imageSrc = "";
            this.author = "";
            this.chapterContent = [];
        },

        /**
         * Gets the deep value from attribute.
         * @param {Object} obj - the content object.
         * @param {String} attr - the searched attribute.
         * @param {String[]} results - the searched results in array.
         * @return {void}
         */
        getAllDeepValues (obj, attr, results = []) {
            if (!Array.isArray(obj) && !isObject(obj)) {
                return results;
            }

            if (attr in obj) {
                results.push(obj[attr]);
            }

            for (const value of Object.values(obj)) {
                this.getAllDeepValues(value, attr, results);
            }

            return results;
        },

        /**
         * Gets the value from attribute of content.
         * @param {Object} val - the object value.
         * @param {String} attr - the searched attribute.
         * @return {void}
         */
        getChapterOverviewAttr (val, attr) {
            if (!isObject(val) || !Array.isArray(val?.content) || !val?.content.length) {
                return "";
            }

            return this.getAllDeepValues(val.content, attr)[0];
        },

        /**
         * Gets the chapter card items from content.
         * @param {Object} val - the object value.
         * @return {void}
         */
        getChapterOverviewCardItems (val) {
            if (!isObject(val) || !isObject(val.map)) {
                return {};
            }

            let toolName = "";

            if (typeof val.map.tool === "string" && val.map.tool.length) {
                const toolId = val.map.tool,
                    capModuleName = toolId.charAt(0).toUpperCase() + toolId.slice(1),
                    key = typeof store.getters["Modules/" + capModuleName + "/name"] !== "undefined" ? store.getters["Modules/" + capModuleName + "/name"] : capModuleName;

                toolName = i18next.t(key);
            }

            return {
                subject: val.map?.layers.length ? val.map.layers.length + " " + i18next.t("common:modules.layerSelection.datalayer") : "",
                map: val.map?.center,
                tool: toolName
            };
        },

        /**
         * Gets the chapter overview image.
         * @param {Object} val - the object value.
         * @return {String} the image source.
         */
        getChapterOverviewImg (val) {
            if (!isObject(val) || !Array.isArray(val.content)) {
                return "";
            }

            const imageId = val?.content.find(v => v.type === "image")?.id;

            if (!imageId) {
                return "";
            }

            return this.imageAssetsById[imageId]?.objectURL;
        },

        /**
         * Saves the story into story list.
         * @returns {void}
         */
        saveStory () {
            this.updateStory();
            const storySnapshot = JSON.parse(JSON.stringify(this.story)),
                imageAssetsSnapshot = {...this.imageAssetsById};

            this.setStoryList([
                ...this.storyList,
                {
                    story: storySnapshot,
                    imageAssetsById: imageAssetsSnapshot
                }
            ]);
            this.changeCurrentComponent({type: "storyManager", side: "secondaryMenu", props: {name: "additional:modules.storyManager.title"}});
            this.setNavigationHistoryBySide({side: "secondaryMenu", newHistory: [{type: "root", props: []}]});
        },

        /**
         * Goes to home page of story creator.
         * @returns {void}
         */
        goToStory () {
            this.setCurrentView("story");
        },

        /**
         * Updates the story in the store with the current data.
         * @returns {void}
         */
        updateStory () {
            this.story.title = this.title;
            this.story.description = this.description;
            this.story.author = this.author;
            this.story.created = dayjs().format("DD.MM.YYYY");
            this.story.imageSrc = this.imageSrc;
            this.story.imageAlt = this.imageAlt;
            this.story.imageCopyright = this.imageCopyright;
            this.story.chapters = this.chapterContent;
        },

        /**
         * Changes to preview mode.
         *  @returns {void}
         */
        openPreview () {
            this.setCurrentView("preview");
        },

        /**
         * Removes the uploaded image and shows the upload area.
         *  @returns {void}
         */
        removeImage () {
            this.imageSrc = "";
            this.imageAlt = "";
            this.imageCopyright = "";
            this.imageLoaded = false;
        }
    }
};
</script>

<template lang="html">
    <div id="story-creator">
        <nav
            v-if="currentView === 'chapter' || currentView === 'preview'"
            aria-label="breadcrumb"
            class="mb-4"
        >
            <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item">
                    <a
                        href="#"
                        class="breadcrumb-link"
                        @click.prevent="goToStory"
                    >
                        {{ $t("additional:modules.storyCreator.storyNav") }}
                    </a>
                </li>
                <li
                    class="breadcrumb-item active"
                    aria-current="page"
                >
                    {{ currentView === 'chapter'
                        ? $t("additional:modules.storyCreator.chapterNav")
                        : $t("additional:modules.storyCreator.previewNav") }}
                </li>
            </ol>
        </nav>
        <div v-if="currentView === 'story'">
            <p class="mb-4">
                {{ $t("additional:modules.storyCreator.introText") }}
            </p>
            <InputText
                id="storyTitle"
                v-model="title"
                :label="$t('additional:modules.storyCreator.labels.storyTitle')"
                :placeholder="$t('additional:modules.storyCreator.labels.storyTitle')"
                class="mb-3"
            />
            <InputText
                id="storyDescription"
                v-model="description"
                :label="$t('additional:modules.storyCreator.labels.storyDescription')"
                :placeholder="$t('additional:modules.storyCreator.labels.storyDescription')"
                html-type="textarea"
                class="mb-3"
            />
            <InputText
                id="storyAuthor"
                v-model="author"
                :label="$t('additional:modules.storyCreator.labels.storyAuthor')"
                :placeholder="$t('additional:modules.storyCreator.labels.storyAuthor')"
                class="mb-3"
            />
            <StoryCreatorAddImageCard
                v-if="!imageLoaded"
                :closeable="false"
                :initial-image="{id: imageSrc, altText: imageAlt, photoCredit: imageCopyright}"
                @addImage="addImage"
            />
            <div
                v-else
                class="card rounded-3 border-0 p-4 position-relative chapter-title-image-preview"
                role="button"
                tabindex="0"
                @click="imageLoaded = false"
                @keydown.enter="imageLoaded = false"
                @keydown.space.prevent="imageLoaded = false"
            >
                <button
                    type="button"
                    class="btn-close position-absolute top-0 end-0 m-1 chapter-title-image-close"
                    :aria-label="$t('common:button.close')"
                    @click.stop="removeImage()"
                />
                <img
                    :src="imageAssetsById?.[imageSrc]?.objectURL"
                    :alt="imageAlt"
                    class="rounded w-100 d-block"
                >
                <div class="text-end mt-1 small">
                    © {{ imageCopyright }}
                </div>
            </div>
            <hr>
            <h5 class="py-3">
                {{ $t('additional:modules.storyCreator.headlines.chapterList') }}
            </h5>
            <Draggable
                v-model="story.chapters"
                class="dragArea no-list ps-0 ms-2"
                item-key="name"
                handle=".card"
            >
                <template #item="{ element, index }">
                    <InfoCard
                        card-type="chapter"
                        :alt-text="getChapterOverviewAttr(element, 'alt')"
                        :card-image="getChapterOverviewImg(element)"
                        :card-items="getChapterOverviewCardItems(element)"
                        :card-text="getChapterOverviewAttr(element, 'text')"
                        :card-title="element.title"
                        :photo-credit="getChapterOverviewAttr(element, 'copyright')"
                        @delete="() => deleteChapter(index)"
                    />
                </template>
            </Draggable>
            <InfoText
                v-if="!story?.chapters?.length"
                class="mb-4"
                :text="$t('additional:modules.storyCreator.labels.emptyChapter')"
            />
            <AddCardButton
                :text="$t('additional:modules.storyCreator.addChapter')"
                @click="addChapter"
            />
            <div class="d-flex flex-column align-items-center pt-3">
                <FlatButton
                    :icon="'bi-collection-play'"
                    :aria-label="$t('additional:modules.storyCreator.preview')"
                    :text="$t('additional:modules.storyCreator.preview')"
                    :interaction="openPreview"
                />
                <FlatButton
                    :icon="'bi-cloud-arrow-down'"
                    :aria-label="$t('additional:modules.storyCreator.saveStory')"
                    :text="$t('additional:modules.storyCreator.saveStory')"
                    :interaction="() => saveStory()"
                />
                <FlatButton
                    :icon="'bi-x-circle'"
                    :secondary="true"
                    :aria-label="$t('additional:modules.storyCreator.discardStory')"
                    :text="$t('additional:modules.storyCreator.discardStory')"
                    :interaction="() => discardStory()"
                />
            </div>
        </div>
        <div v-else-if="currentView === 'chapter'">
            <StoryCreatorChapter />
        </div>
        <div
            v-else-if="currentView === 'preview'"
        >
            <StoryPlayer />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.breadcrumb {
    .breadcrumb-link {
        color: $secondary;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
}
.chapter-title-image-preview {
    cursor: pointer;
    .chapter-title-image-close {
        display: none;
    }
    &:hover {
        outline: 1px solid $light_grey;
        .chapter-title-image-close {
            display: block;
        }
    }
}
</style>
