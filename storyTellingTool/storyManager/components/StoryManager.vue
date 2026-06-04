<script>
import AddCardButton from "../../../cosi/shared/modules/cards/components/AddCardButton.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InfoCard from "../../shared/card/components/InfoCard.vue";
import InfoText from "../../shared/card/components/InfoText.vue";
import {mapGetters, mapActions} from "vuex";

export default {
    name: "StoryManager",
    components: {
        AddCardButton,
        FlatButton,
        InfoCard,
        InfoText
    },
    computed: {
        ...mapGetters("Modules/StoryManager", [
            "storyList"
        ])
    },
    methods: {
        ...mapActions("Menu", ["changeCurrentComponent"]),
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
            />
        </div>
        <InfoText
            v-if="!storyList.length"
            class="mb-4"
            :text="$t('additional:modules.storyManager.emptyStory')"
        />
        <div class="story-list flex-grow-1 overflow-auto pb-2">
            <div
                v-for="(story, index) in storyList"
                :key="index"
                class="mb-4 w-100 mx-0"
            >
                <InfoCard
                    card-type="story"
                    :card-title="story?.title"
                    :card-text="story?.text"
                    :card-image="story?.image"
                    :photo-credit="story?.photoCredit"
                    :alt-text="story?.altText"
                    :card-items="getCardItems(story)"
                    :editable="true"
                    @edit="() => ''"
                    @download="() => ''"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
</style>
