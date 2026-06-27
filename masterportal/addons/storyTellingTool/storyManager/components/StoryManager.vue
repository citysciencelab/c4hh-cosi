<script>
import AlertMessage from "../../../cosi/shared/modules/alerts/components/AlertMessage.vue";
import AddCardButton from "../../../cosi/shared/modules/cards/components/AddCardButton.vue";
import axios from "axios";
import {createStoryZip, extractStoryZip} from "../shared/js/storyZipCreator.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InfoCard from "../../shared/card/components/InfoCard.vue";
import InfoText from "../../shared/card/components/InfoText.vue";
import StoryPlayer from "../../storyPlayer/components/StoryPlayer.vue";
import {mapGetters, mapMutations} from "vuex";
import StoryCreator from "../../storyCreator/components/StoryCreator.vue";

export default {
    name: "StoryManager",
    components: {
        AlertMessage,
        AddCardButton,
        FlatButton,
        InfoCard,
        InfoText,
        StoryCreator,
        StoryPlayer
    },
    data () {
        return {
            currentView: "manager",
            playingStoryIndex: null,
            showImportError: false
        };
    },
    computed: {
        ...mapGetters("Modules/StoryManager", [
            "fixedStoryFiles",
            "fixedStoryLoaded",
            "fixedStoryPath",
            "currentStoryIndex",
            "storyList"
        ]),
        /**
         * Returns the story object to pass to StoryCreator.
         * Empty object for new stories, existing entry for edits.
         * @returns {Object} The story object.
         */
        editingStory () {
            if (typeof this.currentStoryIndex === "number") {
                return JSON.parse(JSON.stringify(this.storyList[this.currentStoryIndex]?.story || {}));
            }
            return {title: "", description: "", author: "", imageSrc: "", imageAlt: "", imageCopyright: "", chapters: []};
        },
        /**
         * Returns the image assets to pass to StoryCreator.
         * @returns {Object} The image assets object.
         */
        editingImageAssetsById () {
            if (typeof this.currentStoryIndex === "number") {
                return Object.assign({}, this.storyList[this.currentStoryIndex]?.imageAssetsById);
            }
            return {};
        }
    },
    activated () {
        // Hook required by masterportal for keep-alive support
    },
    deactivated () {
        // Hook required by masterportal for keep-alive support
    },
    mounted () {
        this.getFixedStoryList(this.fixedStoryPath, this.fixedStoryFiles);
    },
    methods: {
        ...mapMutations("Modules/StoryManager", ["setCurrentStoryIndex", "setFixedStoryLoaded", "setStoryList"]),
        /**
         * Opens the creator for a new story.
         * @returns {void}
         */
        createNewStory () {
            this.setCurrentStoryIndex(undefined);
            this.currentView = "creator";
        },
        /**
         * Handles save-story event from StoryCreator.
         * Persists the story snapshot, revoking any orphaned ObjectURLs.
         * @param {Object} storySnapshot - Final story data.
         * @param {Object} imageAssetsSnapshot - Final image assets.
         * @returns {void}
         */
        onSaveStory (storySnapshot, imageAssetsSnapshot) {
            if (typeof this.currentStoryIndex === "number") {
                const oldAssets = this.storyList[this.currentStoryIndex]?.imageAssetsById || {};

                Object.keys(oldAssets).forEach(id => {
                    if (!imageAssetsSnapshot[id]) {
                        URL.revokeObjectURL(oldAssets[id].objectURL);
                    }
                });
            }

            const entry = {story: storySnapshot, imageAssetsById: imageAssetsSnapshot};

            if (typeof this.currentStoryIndex === "number") {
                const updatedList = [...this.storyList];

                updatedList[this.currentStoryIndex] = entry;
                this.setStoryList(updatedList);
            }
            else {
                this.setStoryList([...this.storyList, entry]);
            }
            this.setCurrentStoryIndex(undefined);
            this.currentView = "manager";
        },
        /**
         * Handles abort-editing event from StoryCreator.
         * @returns {void}
         */
        onAbortEditing () {
            this.setCurrentStoryIndex(undefined);
            this.currentView = "manager";
        },
        /**
         * Downloads one story as ZIP from its stored export payload.
         * @param {Object} storyEntry - Story list entry.
         * @returns {Promise<void>}
         */
        async downloadStory (storyEntry) {
            const story = storyEntry?.story,
                imageAssetsById = storyEntry?.imageAssetsById || {};

            if (!story) {
                return;
            }

            const zipBlob = await createStoryZip(
                    story,
                    imageAssetsById
                ),
                filename = `${this.toSafeFileName(story?.title)}.zip`,
                objectURL = URL.createObjectURL(zipBlob),
                element = document.createElement("a");

            element.setAttribute("href", objectURL);
            element.setAttribute("download", filename);
            element.style.display = "none";
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            URL.revokeObjectURL(objectURL);
        },
        /**
         * @param {Number} index - the index of the story in the list.
         * Sets the current story index and opens story creator.
         * @returns {void}
         */
        editStory (index) {
            this.setCurrentStoryIndex(index);
            this.currentView = "creator";
        },
        /**
         * Opens the selected story directly in the story player.
         * @param {Number} index - the index of the story in the list.
         * @returns {void}
         */
        playStory (index) {
            this.playingStoryIndex = index;
        },
        /**
         * Gets the card items in object from story.
         * @param {Object} val - the story object.
         * @return {Object} the card item object
         */
        getCardItems (val) {
            return {
                author: val?.author,
                creation: val?.created,
                numberOfChapters: val?.chapters?.length || 0
            };
        },
        /**
         * Sets the fixed story list.
         * @param {String} storyPath - the relative path in portalconfigs to contain fixed stories.
         * @param {String[]} files - the fixed story files name.
         * @returns {Promise<void>}.
         */
        async getFixedStoryList (storyPath, files) {
            if (this.fixedStoryLoaded || typeof storyPath !== "string" || !Array.isArray(files)) {
                return;
            }

            const stories = await Promise.all(
                files.map(async (filename) => {
                    const file = `${storyPath}/${filename}.zip`;

                    try {
                        const response = await axios.get(file, {
                            responseType: "blob"
                        });

                        try {
                            const {storyJson, imageAssetsById} =
                                await extractStoryZip(response.data);

                            storyJson.editable = false;

                            this.setFixedStoryLoaded(true);
                            return {
                                story: storyJson,
                                imageAssetsById
                            };
                        }
                        catch (error) {
                            this.showImportError = true;
                            return null;
                        }
                    }
                    catch (e) {
                        console.warn(
                            `Zip files at ${storyPath} could not be loaded. Please check that it is a valid zip file.`
                        );
                        return null;
                    }
                })
            );

            this.setStoryList([
                ...stories.filter(Boolean),
                ...this.storyList
            ]);
        },
        /**
         * Handles selected import file.
         * @param {Event} event - Input change event.
         * @returns {Promise<void>}
         */
        async onStoryImportFileChange (event) {
            const inputElement = event?.target,
                selectedFile = inputElement?.files?.[0];

            if (!selectedFile) {
                return;
            }

            try {
                const {storyJson, imageAssetsById} = await extractStoryZip(selectedFile);

                this.setStoryList([
                    {
                        story: storyJson,
                        imageAssetsById
                    },
                    ...this.storyList
                ]);
                this.showImportError = false;
            }
            catch (error) {
                this.showImportError = true;
            }
            finally {
                inputElement.value = "";
            }
        },
        /**
         * Sanitizes story titles for use as file names.
         * @param {String} title - Raw story title.
         * @returns {String} Safe filename base.
         */
        toSafeFileName (title) {
            const fallbackName = "story";

            if (!title || typeof title !== "string") {
                return fallbackName;
            }

            const safeName = title
                .trim()
                .replace(/[\\/:*?"<>|]+/g, "-")
                .replace(/\s+/g, " ")
                .slice(0, 120);

            return safeName || fallbackName;
        }
    }
};
</script>

<template lang="html">
    <div
        id="story-manager"
        class="d-flex flex-column"
    >
        <div v-if="playingStoryIndex !== null">
            <StoryPlayer
                :story-conf-prop="storyList[playingStoryIndex]?.story"
                :image-assets-by-id="storyList[playingStoryIndex]?.imageAssetsById"
            />
        </div>
        <StoryCreator
            v-else-if="currentView === 'creator'"
            :story="editingStory"
            :image-assets-by-id="editingImageAssetsById"
            @save-story="onSaveStory"
            @abort-editing="onAbortEditing"
        />
        <template v-else-if="currentView === 'manager'">
            <div class="mb-2">
                <h6 class="fw-bold text-dark">
                    {{ $t('additional:modules.storyManager.mainTitle') }}
                </h6>
                <p class="text-muted small mb-0">
                    {{ $t('additional:modules.storyManager.mainDescription') }}
                </p>
            </div>
            <AddCardButton
                class="mt-3 mb-3 w-100 mx-0"
                :text="$t('additional:modules.storyManager.createStoryTitle')"
                :descr="$t('additional:modules.storyManager.createStoryDescription')"
                @click="createNewStory"
            />
            <hr>
            <div class="mt-2 mb-3">
                <h6 class="fw-bold d-flex align-items-center mb-1 text-dark">
                    <i class="bi bi-play-btn me-2 fs-5" />
                    {{ $t('additional:modules.storyManager.selectStoryTitle') }}
                </h6>
                <p class="text-muted small mb-4">
                    {{ $t('additional:modules.storyManager.selectStoryDescription') }}
                </p>
                <FlatButton
                    :icon="'bi-box-arrow-in-down'"
                    :aria-label="$t('additional:modules.storyManager.importButton')"
                    :text="$t('additional:modules.storyManager.importButton')"
                    :interaction="() => $refs.storyImportInput?.click()"
                />
                <input
                    ref="storyImportInput"
                    type="file"
                    class="d-none"
                    accept=".zip,application/zip"
                    @change="onStoryImportFileChange"
                >
                <AlertMessage
                    v-if="showImportError"
                    class="mt-2"
                    :closeable="true"
                    :text="$t('additional:modules.storyManager.importErrorText')"
                    :title="$t('additional:modules.storyManager.importErrorTitle')"
                    type="error"
                    @closed="showImportError = false"
                />
            </div>
            <InfoText
                v-if="!storyList?.length"
                class="mb-4"
                :text="$t('additional:modules.storyManager.emptyStory')"
            />
            <div class="story-list flex-grow-1 overflow-auto pb-2">
                <div
                    v-for="(storyEntry, index) in storyList"
                    :key="index"
                    class="mb-4 w-100 mx-0"
                >
                    <InfoCard
                        card-type="story"
                        :card-title="storyEntry?.story?.title"
                        :card-text="storyEntry?.story?.text"
                        :card-image="storyEntry?.imageAssetsById?.[storyEntry?.story?.imageSrc]?.objectURL"
                        :copyright="storyEntry?.story?.imageCopyright"
                        :alt="storyEntry?.story?.imageAlt"
                        :card-items="getCardItems(storyEntry?.story)"
                        :editable="storyEntry?.story?.editable"
                        @click="() => playStory(index)"
                        @play="() => playStory(index)"
                        @edit="() => editStory(index)"
                        @download="() => downloadStory(storyEntry)"
                    />
                </div>
            </div>
        </template>
    </div>
</template>

<style lang="scss" scoped>
</style>
