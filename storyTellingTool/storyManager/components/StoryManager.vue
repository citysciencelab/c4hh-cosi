<script>
import AddCardButton from "../../../cosi/shared/modules/cards/components/AddCardButton.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InfoCard from "../../shared/card/components/InfoCard.vue";
import {mapGetters} from "vuex";

export default {
    name: "StoryManager",
    components: {
        AddCardButton,
        FlatButton,
        InfoCard
    },
    data () {
        return {
            mockStories: [
                {
                    id: 1,
                    title: "Story 1",
                    description: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat...",
                    author: "LGV - Landesbetrieb Geoinformation und Vermessung",
                    date: "12.04.2026",
                    chapters: 10,
                    image: "https://picsum.photos/id/1015/400/160",
                    copyright: "© Getty Images"
                },
                {
                    id: 12,
                    title: "Story 12",
                    description: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat...",
                    author: "",
                    date: "12.04.2026",
                    chapters: 5,
                    image: "https://picsum.photos/id/1016/400/160",
                    copyright: "© Getty Images"
                },
                {
                    id: 123,
                    title: "Story 123",
                    description: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat...",
                    author: "",
                    date: "12.04.2026",
                    chapters: 3,
                    image: "https://picsum.photos/id/1018/400/160",
                    copyright: "© Getty Images"
                }
            ]
        };
    },
    computed: {
        ...mapGetters("Modules/StoryManager", [
            "storyList"
        ])
    },
    methods: {
        createNewStory () {
            // todos
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
