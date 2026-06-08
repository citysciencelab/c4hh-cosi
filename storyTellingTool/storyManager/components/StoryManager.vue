<script>
import AlertMessage from "../../../cosi/shared/modules/alerts/components/AlertMessage.vue";
import AddCardButton from "../../../cosi/shared/modules/cards/components/AddCardButton.vue";
import {createStoryZip, extractStoryZip} from "../shared/js/storyZipCreator.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InfoCard from "../../shared/card/components/InfoCard.vue";
import InfoText from "../../shared/card/components/InfoText.vue";
import {mapGetters, mapActions, mapMutations} from "vuex";

export default {
    name: "StoryManager",
    components: {
        AlertMessage,
        AddCardButton,
        FlatButton,
        InfoCard,
        InfoText
    },
    data () {
        return {
            showImportError: false
        };
    },
    computed: {
        ...mapGetters("Modules/StoryManager", [
            "storyList"
        ])
    },
    methods: {
        ...mapActions("Menu", ["changeCurrentComponent"]),
        ...mapMutations("Modules/StoryManager", ["setStoryList"]),
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
         * Changes the current menu component to the Story Creator to start a new story.
         * @returns {void}
         */
        createNewStory () {
            this.changeCurrentComponent({
                type: "storyCreator",
                side: "secondaryMenu",
                props: {
                    name: "additional:modules.storyCreator.title"
                }
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
        }
    }
};
</script>

<template lang="html">
    <div
        id="story-manager"
        class="d-flex flex-column"
    >
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
            v-if="!storyList.length"
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
                    :photo-credit="storyEntry?.story?.imageCopyright"
                    :alt-text="storyEntry?.story?.imageAlt"
                    :card-items="getCardItems(storyEntry?.story)"
                    :editable="true"
                    @edit="() => ''"
                    @download="() => downloadStory(storyEntry)"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
</style>
