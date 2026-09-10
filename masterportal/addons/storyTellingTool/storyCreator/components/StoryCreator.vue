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
import Toast from "../../shared/toasts/components/ToastsElement.vue";

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
        Toast
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
            title: this.story?.title || this.$t("additional:modules.storyCreator.labels.storyname"),
            description: this.story?.description || "",
            author: this.story?.author || "",
            imageAlt: this.story?.imageAlt || "",
            imageCopyright: this.story?.imageCopyright || "",
            imageSrc: this.story?.imageSrc || "",
            chapterContent: JSON.parse(JSON.stringify(this.story?.chapters || [])),
            imageLoaded: false,
            editingChapterIndex: false,
            workingImageAssetsById: Object.assign({}, this.imageAssetsById),
            showAutosaveHint: false,
            liveChapterTitle: null
        };
    },
    computed: {
        ...mapGetters("Modules/StoryManager", ["menuSide"]),
        /**
         * Returns the title of the chapter currently being edited, or a fallback.
         * @returns {String} The current chapter title.
         */
        currentEditingChapterTitle () {
            if (this.liveChapterTitle !== null) {
                return this.liveChapterTitle || this.$t("additional:modules.storyCreator.chapter.title");
            }
            if (this.editingChapterIndex !== false) {
                return this.chapterContent[this.editingChapterIndex]?.title
                    || this.$t("additional:modules.storyCreator.chapter.title");
            }
            return this.$t("additional:modules.storyCreator.chapter.title");
        },
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
    watch: {
        title (newVal) {
            if (newVal && newVal.length > 200) {
                this.$nextTick(() => {
                    this.title = newVal.substring(0, 200);
                });
            }
        },
        showAutosaveHint (val) {
            if (val) {
                setTimeout(() => {
                    this.showAutosaveHint = false;
                }, 5000);
            }
        }
    },
    mounted () {
        this.imageLoaded = typeof this.workingImageAssetsById?.[this.imageSrc]?.objectURL !== "undefined";
    },
    methods: {
        ...mapMutations("Modules/StoryPlayer", ["setImageAssetsById", "setStoryConf"]),
        ...mapActions("Menu", ["changeCurrentComponent"]),
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
            this._initialChapterSnapshot = null;
            this.liveChapterTitle = null;
            this.currentView = "chapter";
            this.$nextTick(() => {
                const chapterComp = this.$refs.chapterComp;

                if (chapterComp) {
                    this._initialChapterSnapshot = JSON.stringify(chapterComp.collectChapterData());
                }
            });
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
            this.showAutosaveHint = true;
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
            this._initialChapterSnapshot = null;
            this.liveChapterTitle = null;
            this.currentView = "chapter";
            this.$nextTick(() => {
                const chapterComp = this.$refs.chapterComp;

                if (chapterComp) {
                    this._initialChapterSnapshot = JSON.stringify(chapterComp.collectChapterData());
                }
            });
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
            this.title = this.$t("additional:modules.storyCreator.labels.storyname");
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
                subject: val.map?.layers.length > 1 ? val.map.layers.length - 1 + " " + i18next.t("common:modules.layerSelection.datalayer") : "",
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
         * Gets the photo credit of the chapter overview image. Images embedded in feature content are ignored.
         * @param {Object} val - The chapter object.
         * @return {String} The photo credit.
        */
        getChapterOverviewPhotoCredit (val) {
            if (!isObject(val) || !Array.isArray(val?.content)) {
                return "";
            }

            const imageContent = val.content.find(content => content?.type === "image");

            return imageContent?.attrs?.copyright || "";
        },

        /**
         * Saves the story with current local data.
         * Emits final snapshot to parent for persistence.
         * @returns {void}
         */
        saveStory () {
            const storySnapshot = {
                title: this.title.trim() || this.$t("additional:modules.storyCreator.labels.storyname"),
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
         * Auto-saves the current chapter data into chapterContent, then switches to story view.
         * Used by breadcrumb navigation to preserve changes without emitting save-chapter.
         * @returns {void}
         */
        autosaveChapterAndGoToStory () {
            const chapterComp = this.$refs.chapterComp;
            let hasChanges = false;

            if (chapterComp) {
                const chapter = chapterComp.collectChapterData();

                if (this.editingChapterIndex !== false) {
                    hasChanges = JSON.stringify(chapter) !== this._initialChapterSnapshot;
                    this.chapterContent.splice(this.editingChapterIndex, 1, chapter);
                }
                else {
                    hasChanges = true;
                    this.chapterContent = [...this.chapterContent, chapter];
                }
                this.editingChapterIndex = false;
            }
            this.currentView = "story";
            this.showAutosaveHint = hasChanges;
        },
        /**
         * Auto-saves the current chapter (if in chapter view) and then saves the story.
         * Used by the parent (StoryManager) when main-menu navigation is intercepted.
         * @returns {void}
         */
        autosaveForNavigation () {
            if (this.currentView === "chapter") {
                const chapterComp = this.$refs.chapterComp;

                if (chapterComp) {
                    const chapter = chapterComp.collectChapterData();

                    if (this.editingChapterIndex !== false) {
                        this.chapterContent.splice(this.editingChapterIndex, 1, chapter);
                    }
                    else {
                        this.chapterContent = [...this.chapterContent, chapter];
                    }
                    this.editingChapterIndex = false;
                }
                this.currentView = "story";
            }
            this.saveStory();
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
            this.setStoryConf(this.previewStory);
            this.setImageAssetsById(this.workingImageAssetsById);
            this.changeCurrentComponent({
                type: "storyPlayer",
                side: this.menuSide,
                props: {name: this.$t("additional:modules.storyPlayer.name")}
            });
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
    <div id="story-creator position-relative">
        <Toast
            v-if="showAutosaveHint"
            class="position-fixed toast"
            type="info"
            :text="$t('additional:modules.storyCreator.autosaveHint')"
        />
        <nav
            class="story-breadcrumb d-flex align-items-center mb-1"
            aria-label="breadcrumb"
        >
            <ol class="breadcrumb mb-0 small">
                <li class="breadcrumb-item">
                    <a
                        href="#"
                        class="story-breadcrumb__link"
                        @click.prevent="autosaveForNavigation"
                    >{{ $t('additional:modules.storyManager.title') }}</a>
                </li>
                <li
                    v-if="currentView === 'story'"
                    class="breadcrumb-item active"
                    aria-current="page"
                >
                    {{ $t('additional:modules.storyCreator.storyNav') }}: {{ title }}
                </li>
                <template v-else-if="currentView === 'chapter'">
                    <li class="breadcrumb-item">
                        <a
                            href="#"
                            class="story-breadcrumb__link"
                            @click.prevent="autosaveChapterAndGoToStory"
                        >{{ $t('additional:modules.storyCreator.storyNav') }}: {{ title }}</a>
                    </li>
                    <li
                        class="breadcrumb-item active"
                        aria-current="page"
                    >
                        {{ $t('additional:modules.storyCreator.chapterNav') }}: {{ currentEditingChapterTitle }}
                    </li>
                </template>
            </ol>
        </nav>
        <div v-if="currentView === 'story'">
            <h5 class="mb-4">
                {{ $t("additional:modules.storyCreator.labels.editStory") }}
            </h5>
            <p class="mb-4">
                {{ $t("additional:modules.storyCreator.introText") }}
            </p>
            <InputText
                id="storyTitle"
                v-model.trim="title"
                :label="$t('additional:modules.storyCreator.labels.storyTitle')"
                :placeholder="$t('additional:modules.storyCreator.labels.storyname')"
                class="mb-3"
                @blur="title = title || $t('additional:modules.storyCreator.labels.storyname')"
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
                        :copyright="getChapterOverviewPhotoCredit(element)"
                        :photo-credit="getChapterOverviewPhotoCredit(element)"
                        :editable="true"
                        @edit="editChapter(index)"
                        @click="editChapter(index)"
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
                    class="mt-3"
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
                    :icon="'bi-arrow-left-circle'"
                    :secondary="true"
                    :aria-label="story?.title
                        ? $t('additional:modules.storyCreator.buttons.discardChanges')
                        : $t('additional:modules.storyCreator.buttons.discardStory')"
                    :text="story?.title
                        ? $t('additional:modules.storyCreator.buttons.discardChanges')
                        : $t('additional:modules.storyCreator.buttons.discardStory')"
                    :interaction="() => $emit('abort-editing')"
                />
            </div>
        </div>
        <div v-else-if="currentView === 'chapter'">
            <StoryCreatorChapter
                ref="chapterComp"
                :edit-index="editingChapterIndex"
                :create-image-asset="createImageAsset"
                :image-assets-by-id="workingImageAssetsById"
                :initial-chapter="editingChapterIndex !== false ? chapterContent[editingChapterIndex] : null"
                @save-chapter="handleSaveChapter"
                @cancel-chapter="handleCancelChapter"
                @update:chapter-title="liveChapterTitle = $event"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.toast {
    top: 10px;
    right: 140px;
    z-index: 10;
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

.story-creator-hint-area {
    min-height: 2.5rem;
    display: flex;
    align-items: center;
}

.hint-fade-enter-active {
    transition: opacity 0.4s ease;
}

.hint-fade-leave-active {
    transition: opacity 1s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
    opacity: 0;
}
</style>

<style lang="scss">
.story-breadcrumb {
    font-size: 1rem;
    --bs-breadcrumb-divider: ">";

    .breadcrumb {
        flex-wrap: nowrap;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &-item + &-item::before {
            color: $link-color;
        }

        &-item.active {
            color: $dark_blue;
            max-width: 20rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            display: inline-block;
        }
    }

    &__link {
        color: $link-color;
        text-decoration: none;
        max-width: 12rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: inline-block;

        &:hover {
            text-decoration: underline;
        }
    }
}
</style>
