<script>
import AlertMessage from "../../../cosi/shared/modules/alerts/components/AlertMessage.vue";
import AddCardButton from "../../../cosi/shared/modules/cards/components/AddCardButton.vue";
import axios from "axios";
import {createStoryZip, extractStoryZip} from "../shared/js/storyZipCreator.js";
import ConfirmModal from "@shared/modules/modals/components/ConfirmModal.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InfoCard from "../../shared/card/components/InfoCard.vue";
import InfoText from "../../shared/card/components/InfoText.vue";
import {mapGetters, mapMutations, mapActions} from "vuex";
import StoryCreator from "../../storyCreator/components/StoryCreator.vue";
import Toast from "../../shared/toasts/components/ToastsElement.vue";

export default {
    name: "StoryManager",
    components: {
        AlertMessage,
        AddCardButton,
        ConfirmModal,
        FlatButton,
        InfoCard,
        InfoText,
        StoryCreator,
        Toast
    },
    data () {
        return {
            currentView: "manager",
            showImportError: false,
            showImportWarning3D: false,
            showLeaveToolModal: false,
            pendingNavigation: null,
            savedStoryIndex: null
        };
    },
    computed: {
        ...mapGetters(["controlsConfig"]),
        ...mapGetters("Modules/StoryManager", [
            "fixedStoryFiles",
            "fixedStoryLoaded",
            "fixedStoryPath",
            "currentStoryIndex",
            "storyList",
            "menuSide",
            "enableCreator",
            "enableImport"
        ]),
        ...mapGetters("Modules/StoryManager", {storyManagerTitle: "name"}),
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
        },
        /**
         * Returns true when the user is actively creating or editing a story.
         * @returns {Boolean} True if in creator view.
         */
        isInEditMode () {
            return this.currentView === "creator";
        }
    },
    watch: {
        /**
         * Auto-hides the autosave hint after 5 seconds.
         * @param {Number|null} val - The newly saved story index.
         * @returns {void}
         */
        savedStoryIndex (val) {
            if (val !== null) {
                setTimeout(() => {
                    this.savedStoryIndex = null;
                }, 5000);
            }
        }
    },
    activated () {
        // Hook required by masterportal for keep-alive support
    },
    deactivated () {
        // this.currentView = "manager";
    },
    mounted () {
        this.getFixedStoryList(this.fixedStoryPath, this.fixedStoryFiles);
        this._navUnsubscribe = this.$store.subscribe((mutation, state) => {
            if (!this.menuSide || !this.isInEditMode) {
                return;
            }

            // Back navigation via mp-menu-navigation-link (navigateBack action)
            if (
                mutation.type === "Menu/switchToPreviousComponent" &&
                mutation.payload === this.menuSide
            ) {
                const newComponent = state.Menu[this.menuSide]?.navigation?.currentComponent;

                if (!newComponent || newComponent.type === "storyManager") {
                    return;
                }
                this.pendingNavigation = {
                    type: newComponent.type,
                    side: this.menuSide,
                    props: newComponent.props
                };
                this.changeCurrentComponent({
                    type: "storyManager",
                    side: this.menuSide,
                    props: {name: this.storyManagerTitle}
                });
                this.showLeaveToolModal = true;
            }

            // Close button (mp-menu-navigation-reset-button) via resetMenu action
            if (
                mutation.type === "Menu/switchToRoot" &&
                mutation.payload === this.menuSide
            ) {
                this.pendingNavigation = {type: "root", side: this.menuSide, props: []};
                this.changeCurrentComponent({
                    type: "storyManager",
                    side: this.menuSide,
                    props: {name: this.storyManagerTitle}
                });
                this.showLeaveToolModal = true;
            }
        });
    },
    beforeUnmount () {
        this._navUnsubscribe?.();
    },
    methods: {
        ...mapMutations("Modules/StoryManager", ["setCurrentStoryIndex", "setFixedStoryLoaded", "setStoryList"]),
        ...mapMutations("Modules/StoryPlayer", ["setImageAssetsById", "setStoryConf", "setCurrentStoryName"]),
        ...mapActions("Menu", ["changeCurrentComponent", "resetMenu"]),

        /**
         * Called when the user confirms leaving the tool via the navigation modal.
         * Resets the creator view and replays the intercepted navigation.
         * @returns {void}
         */
        confirmLeaveTool () {
            this.showLeaveToolModal = false;
            this.currentView = "manager";
            const nav = this.pendingNavigation;

            this.pendingNavigation = null;
            if (!nav) {
                return;
            }
            if (nav.type === "root") {
                this.resetMenu(nav.side);
            }
            else {
                this.changeCurrentComponent({
                    type: nav.type,
                    side: nav.side,
                    props: nav.props
                });
            }
        },
        /**
         * Called when the user cancels leaving the tool via the navigation modal.
         * @returns {void}
         */
        cancelLeaveTool () {
            this.showLeaveToolModal = false;
            this.pendingNavigation = null;
        },
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
            let hasChanges = true;

            if (typeof this.currentStoryIndex === "number") {
                const originalEntry = this.storyList[this.currentStoryIndex],
                      originalAssets = originalEntry?.imageAssetsById || {};

                Object.keys(originalAssets).forEach(id => {
                    if (!imageAssetsSnapshot[id]) {
                        URL.revokeObjectURL(originalAssets[id].objectURL);
                    }
                });

                const snapshotCopy = Object.assign({}, storySnapshot),
                      originalCopy = Object.assign({}, originalEntry?.story);

                delete snapshotCopy.created;
                delete originalCopy.created;

                const storyChanged = JSON.stringify(snapshotCopy) !== JSON.stringify(originalCopy),
                      assetsChanged = JSON.stringify(Object.keys(imageAssetsSnapshot).sort()) !== JSON.stringify(Object.keys(originalAssets).sort());

                hasChanges = storyChanged || assetsChanged;
            }

            const entry = {story: storySnapshot, imageAssetsById: imageAssetsSnapshot},
                  updatedList = [...this.storyList];

            if (typeof this.currentStoryIndex === "number") {
                updatedList[this.currentStoryIndex] = entry;
                if (hasChanges) {
                    this.savedStoryIndex = this.currentStoryIndex;
                }
            }
            else {
                updatedList.unshift(entry);
                this.savedStoryIndex = 0;
            }
            this.setStoryList(updatedList);
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
            if (!this.enableCreator) {
                return;
            }
            this.setCurrentStoryIndex(index);
            this.currentView = "creator";
        },
        /**
         * Opens the selected story directly in the story player.
         * @param {Number} index - the index of the story in the list.
         * @returns {void}
         */
        playStory (index) {
            this.setStoryConf(this.storyList[index].story);
            this.setImageAssetsById(this.storyList[index].imageAssetsById);
            this.setCurrentStoryName(this.storyList[index].name || null);
            this.changeCurrentComponent({
                type: "storyPlayer",
                side: this.menuSide,
                props: {name: this.$t("additional:modules.storyPlayer.name")}
            });
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
                                imageAssetsById,
                                name: filename
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

            this.showImportWarning3D = false;

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

                if (Array.isArray(storyJson?.chapters)) {
                    this.showImportWarning3D = storyJson?.chapters.some(chapter => chapter.is3D === true) && this.controlsConfig?.button3d !== true;
                }
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
        class="d-flex flex-column position-relative"
    >
        <Toast
            v-if="savedStoryIndex !== null"
            class="position-fixed toast"
            type="info"
            :text="$t('additional:modules.storyCreator.autosaveHint')"
        />
        <ConfirmModal
            :show-modal="showLeaveToolModal"
            :modal-title="$t('additional:modules.storyManager.confirmLeaveTitle')"
            :modal-content="$t('additional:modules.storyManager.confirmLeaveContent')"
            :button-confirm-label="$t('additional:modules.storyManager.confirmLeaveConfirm')"
            :button-cancel-label="$t('additional:modules.storyManager.confirmLeaveCancel')"
            @clicked-confirm="confirmLeaveTool"
            @clicked-cancel="cancelLeaveTool"
        />
        <StoryCreator
            v-if="currentView === 'creator'"
            ref="storyCreator"
            :story="editingStory"
            :image-assets-by-id="editingImageAssetsById"
            @save-story="onSaveStory"
            @abort-editing="onAbortEditing"
        />
        <template v-else-if="currentView === 'manager'">
            <div class="mb-2">
                <h5>
                    {{ $t('additional:modules.storyManager.mainTitle') }}
                </h5>
                <p>
                    {{ $t('additional:modules.storyManager.mainDescription') }}
                </p>
            </div>
            <AddCardButton
                v-if="enableCreator"
                class="my-3 w-100 mx-0"
                :text="$t('additional:modules.storyManager.createStoryTitle')"
                :descr="$t('additional:modules.storyManager.createStoryDescription')"
                @click="createNewStory"
            />
            <hr>
            <div class="mt-2 mb-3">
                <h5 class="d-flex align-items-center mb-2">
                    <i class="bi bi-play-btn me-2 fs-4 pt-1" />
                    {{ $t('additional:modules.storyManager.selectStoryTitle') }}
                </h5>
                <p class="text-muted small mb-4">
                    {{ $t('additional:modules.storyManager.selectStoryDescription') }}
                </p>
                <FlatButton
                    v-if="enableImport"
                    :icon="'bi-box-arrow-in-down'"
                    :aria-label="$t('additional:modules.storyManager.importButton')"
                    :text="$t('additional:modules.storyManager.importButton')"
                    :interaction="() => $refs.storyImportInput?.click()"
                />
                <input
                    v-if="enableImport"
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
                <AlertMessage
                    v-if="showImportWarning3D"
                    class="mt-2"
                    :closeable="true"
                    :text="$t('additional:modules.storyManager.importWarning3D')"
                    type="warning"
                    @closed="showImportWarning3D = false"
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
                        :editable="storyEntry?.story?.editable && enableCreator"
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
.toast {
    top: 10px;
    right: 140px;
    z-index: 10;
}
.story-manager-hint-area {
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
