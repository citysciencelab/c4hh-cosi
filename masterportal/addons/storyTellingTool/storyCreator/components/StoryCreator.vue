<script>
import AddCardButton from "../../../cosi/shared/modules/cards/components/AddCardButton.vue";
import dayjs from "dayjs";
import draggable from "vuedraggable";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InfoCard from "../../shared/card/components/InfoCard.vue";
import InfoText from "../../shared/card/components/InfoText.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import isObject from "@shared/js/utils/isObject.js";
import store from "@appstore/index.js";
import StoryCreatorAddImageCard from "./StoryCreatorAddImageCard.vue";
import StoryCreatorChapter from "./StoryCreatorChapter.vue";
import StoryPlayer from "../../storyPlayer/components/StoryPlayer.vue";

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
    props: {
        /**
         * Initial story data to edit. Creator maintains local copy.
         * @type {Object}
         */
        story: {
            type: Object,
            required: true
        },
        /**
         * Initial image assets. Creator maintains local copy during editing.
         * @type {Object}
         */
        imageAssetsById: {
            type: Object,
            required: true
        }
    },
    emits: [
        "save-story",
        "abort-editing"
    ],
    data () {
        return {
            currentView: "story",
            title: this.story?.title || "",
            description: this.story?.description || "",
            author: this.story?.author || "",
            imageAlt: this.story?.imageAlt || "",
            imageCopyright: this.story?.imageCopyright || "",
            imageSrc: this.story?.imageSrc || "",
            chapterContent: JSON.parse(JSON.stringify(this.story?.chapters || [])),
            imageLoaded: false,
            editingChapterIndex: false,
            workingImageAssetsById: Object.assign({}, this.imageAssetsById)
        };
    },
    computed: {
        /**
         * Returns the story object for preview with the current data.
         * @returns {Object} the story object for preview.
         */
        previewStory () {
            return {
                title: this.title,
                description: this.description,
                author: this.author,
                created: dayjs().format("DD.MM.YYYY"),
                imageSrc: this.imageSrc,
                imageAlt: this.imageAlt,
                imageCopyright: this.imageCopyright,
                chapters: this.chapterContent
            };
        }
    },
    mounted () {
        this.imageLoaded = typeof this.workingImageAssetsById?.[this.imageSrc]?.objectURL !== "undefined";
    },
    methods: {
        /**
         * Sanitizes a filename for safe ZIP entry paths.
         * @param {String} originalName - The original filename.
         * @returns {String} A sanitized filename.
         */
        sanitizeFileName (originalName) {
            const fallback = "unnamed.bin";

            if (typeof originalName !== "string") {
                return fallback;
            }

            const sanitizedName = originalName
                .replace(/[\\/:*?"<>|\u0000-\u001F]/g, "_")
                .trim();

            return sanitizedName || fallback;
        },

        /**
         * Creates a new image id, generates its preview ObjectURL and returns full asset metadata.
         * @param {Blob} blob - The image Blob.
         * @returns {Object} Object with id and metadata {id, blob, objectURL, mimeType, originalName, archivePath}.
         */
        createImageAsset (blob) {
            const id = crypto.randomUUID(),
                objectURL = URL.createObjectURL(blob),
                originalName = typeof blob?.name === "string" && blob.name.trim() !== "" ? blob.name : `${id}.bin`,
                sanitizedOriginalName = this.sanitizeFileName(originalName),
                archivePath = `images/${id}__${sanitizedOriginalName}`,
                assetData = {
                    id,
                    blob,
                    objectURL,
                    mimeType: blob.type || "application/octet-stream",
                    originalName,
                    archivePath
                };

            this.workingImageAssetsById = {
                ...this.workingImageAssetsById,
                [id]: assetData
            };

            return assetData;
        },

        /**
         * Adds a new chapter.
         * @returns {void}
         */
        addChapter () {
            this.currentView = "chapter";
        },

        /**
         * Handles save-chapter event from StoryCreatorChapter.
         * Appends or replaces the chapter in chapterContent and returns to story view.

         * @param {Object} chapter - The chapter data.
         * @returns {void}
         */
        handleSaveChapter (chapter) {
            if (this.editingChapterIndex !== false) {
                this.chapterContent.splice(this.editingChapterIndex, 1, chapter);
                this.editingChapterIndex = false;
            }
            else {
                this.chapterContent = [...this.chapterContent, chapter];
            }
            this.currentView = "story";
        },

        /**
         * Handles cancel-chapter event from StoryCreatorChapter.
         * @returns {void}
         */
        handleCancelChapter () {
            this.editingChapterIndex = false;
            this.currentView = "story";
        },
        /**
         * Adds the uploaded title image attributes.
         * @param {Object} image - The image object containing id, alt, copyright, and objectURL.
         * @returns {void}
         */
        addImage (image) {
            this.imageSrc = image.id;
            this.imageAlt = image.alt;
            this.imageCopyright = image.copyright;
            this.imageLoaded = true;
        },

        /**
         * Loads the chapter data into the store for editing.
         * @param {Number} index - The index of the chapter to edit.
         * @returns {void}
         */
        editChapter (index) {
            this.editingChapterIndex = index;

            this.currentView = "chapter";
        },

        /**
         * Deletes a chapter from the index.
         * Does not revoke ObjectURLs during editing - parent handles cleanup after save.
         * @param {Number} index - the index of the chapter in chapter list.
         * @return {void}
         */
        deleteChapter (index) {
            this.chapterContent.splice(index, 1);
            this.editingChapterIndex = false;
        },

        /**
         * Discards the current story and resets all data to default values.
         * @return {void}
         */
        clearForm () {
            this.title = "";
            this.description = "";
            this.author = "";
            this.imageAlt = "";
            this.imageCopyright = "";
            this.imageSrc = "";
            this.imageLoaded = false;
            this.chapterContent = [];
            this.currentView = "story";
            this.workingImageAssetsById = {};
            this.editingChapterIndex = false;
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
                map: val.map?.center?.length ? i18next.t("additional:modules.storyCreator.labels.mapPosition") : "",
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

            return this.workingImageAssetsById[imageId]?.objectURL;
        },

        /**
         * Saves the story with current local data.
         * Emits final snapshot to parent for persistence.
         * @returns {void}
         */
        saveStory () {
            const storySnapshot = {
                title: this.title,
                description: this.description,
                author: this.author,
                created: dayjs().format("DD.MM.YYYY"),
                imageSrc: this.imageSrc,
                imageAlt: this.imageAlt,
                imageCopyright: this.imageCopyright,
                chapters: this.chapterContent
            };
            const imageAssetsSnapshot = {...this.workingImageAssetsById};

            this.$emit("save-story", storySnapshot, imageAssetsSnapshot);
        },

        /**
         * Goes to home page of story creator.
         * @returns {void}
         */
        goToStory () {
            this.currentView = "story";
        },

        /**
         * Changes to preview mode.
         *  @returns {void}
         */
        openPreview () {
            this.currentView = "preview";
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
                        :class="{'breadcrumb-link--disabled': currentView === 'chapter'}"
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
                :create-image-asset="createImageAsset"
                :image-assets-by-id="workingImageAssetsById"
                :initial-image="{id: imageSrc, alt: imageAlt, copyright: imageCopyright}"
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
                <h5>  {{ $t('additional:modules.storyCreator.headlines.coverOfStory') }} </h5>
                <button
                    type="button"
                    class="btn-close position-absolute top-0 end-0 m-1 chapter-title-image-close"
                    :aria-label="$t('common:button.close')"
                    @click.stop="removeImage()"
                />
                <img
                    :src="workingImageAssetsById?.[imageSrc]?.objectURL"
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
                v-model="chapterContent"
                class="dragArea no-list chapter-list-item ps-0"
                item-key="name"
                handle=".card-wrapper"
            >
                <template #item="{ element, index }">
                    <InfoCard
                        card-type="chapter"
                        :alt="getChapterOverviewAttr(element, 'alt')"
                        :card-image="getChapterOverviewImg(element)"
                        :card-items="getChapterOverviewCardItems(element)"
                        :card-text="getChapterOverviewAttr(element, 'text')"
                        :card-title="element.title"
                        :copyright="getChapterOverviewAttr(element, 'copyright')"
                        :photo-credit="getChapterOverviewAttr(element, 'copyright')"
                        :editable="true"
                        @edit="editChapter(index)"
                        @delete="() => deleteChapter(index)"
                    />
                </template>
            </Draggable>
            <InfoText
                v-if="!chapterContent?.length"
                class="mb-4"
                :text="$t('additional:modules.storyCreator.labels.emptyChapter')"
            />
            <AddCardButton
                class="py-5 chapter-list-item"
                :text="$t('additional:modules.storyCreator.addChapter')"
                @click="addChapter"
            />
            <hr class="w-100">
            <div class="d-flex flex-column align-items-center p-2">
                <FlatButton
                    :icon="'bi-collection-play'"
                    :aria-label="$t('additional:modules.storyCreator.preview')"
                    :text="$t('additional:modules.storyCreator.preview')"
                    :interaction="openPreview"
                    :disabled="!title || !chapterContent?.length"
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
                    :aria-label="$t('additional:modules.storyCreator.clearForm')"
                    :text="$t('additional:modules.storyCreator.clearForm')"
                    :interaction="() => clearForm()"
                />
                <FlatButton
                    :icon="'bi-arrow-left-circle'"
                    :secondary="true"
                    :aria-label="$t('additional:modules.storyCreator.buttons.abort')"
                    :text="$t('additional:modules.storyCreator.buttons.abort')"
                    :interaction="() => $emit('abort-editing')"
                />
            </div>
        </div>
        <div v-else-if="currentView === 'chapter'">
            <StoryCreatorChapter
                :edit-index="editingChapterIndex"
                :create-image-asset="createImageAsset"
                :image-assets-by-id="workingImageAssetsById"
                :initial-chapter="editingChapterIndex !== false ? chapterContent[editingChapterIndex] : null"
                @save-chapter="handleSaveChapter"
                @cancel-chapter="handleCancelChapter"
            />
        </div>
        <div
            v-else-if="currentView === 'preview'"
        >
            <StoryPlayer
                :story-conf-prop="previewStory"
                :image-assets-by-id="workingImageAssetsById"
            />
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
    .breadcrumb-link--disabled {
        pointer-events: none;
        opacity: 0.5;
        cursor: default;

        &:hover {
            text-decoration: none;
        }
    }
    .breadcrumb-item + .breadcrumb-item::before {
    content: "|";
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
    img {
        max-height: 50vh;
        object-fit: contain;
    }
}
.chapter-list-item {
    padding-left: 2.5rem;
    padding-right: 2.5rem;
}
</style>
