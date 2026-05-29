<script>
import AddCardButton from "../../../cosi/shared/modules/cards/components/AddCardButton.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "StoryManager",
    components: {
        AddCardButton,
        FlatButton
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
    methods: {
        createNewStory () {
            // todos
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
                v-for="story in mockStories"
                :key="story.id"
                class="card story-card mb-4 w-100 mx-0"
            >
                <div>
                    <img
                        :src="story.image"
                        class="card-img-top object-fit-cover"
                        height="160"
                        alt="Story Preview"
                    >
                </div>
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title fw-bold mb-0 text-dark">
                            {{ story.title }}
                        </h5>
                        <span class="copyright-text">
                            {{ story.copyright }}
                        </span>
                    </div>
                    <p class="card-text text-dark mb-4 story-description">
                        {{ story.description }}
                    </p>
                    <div class="d-flex justify-content-between align-items-end">
                        <div class="story-meta text-muted">
                            <div
                                v-if="story.author"
                                class="text-truncate mb-1"
                                style="max-width: 220px;"
                            >
                                {{ story.author }}
                            </div>
                            <div>
                                {{ $t('additional:modules.storyManager.createdAt') }}
                                {{ story.date }}
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-3">
                            <span class="text-dark d-flex align-items-center folder-info">
                                <i class="bi bi-folder fs-5 me-2" />
                                {{ story.chapters }}
                                {{ $t('additional:modules.storyManager.chapters') }}
                            </span>
                            <div class="d-flex gap-2">
                                <button class="btn action-btn rounded-circle shadow-sm">
                                    <i class="bi bi-pencil fs-6" />
                                </button>
                                <button class="btn action-btn rounded-circle shadow-sm">
                                    <i class="bi bi-download fs-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
#story-manager {
    .story-list {
        max-height: 50vh;
        overflow-y: scroll;
        padding-right: 10px;

        &::-webkit-scrollbar {
            width: 8px;
            display: block;
        }
        &::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
        }
        &::-webkit-scrollbar-thumb {
            background: #a8a8a8;
            border-radius: 4px;
            border: 1px solid #f1f1f1;
        }
        &::-webkit-scrollbar-thumb:hover {
            background: #888888;
        }
    }
    .story-card {
        border: 1px solid #4a74a5;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        .card-body {
            background-color: #e2e7f0;
        }
        .copyright-text {
            font-size: 0.75rem;
            color: #333;
            margin-top: 2px;
        }
        .story-description {
            font-size: 0.95rem;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            line-height: 1.4;
        }
        .story-meta {
            font-size: 0.75rem;
            line-height: 1.2;
        }
        .folder-info {
            font-size: 0.95rem;
        }
        .action-btn {
            width: 42px;
            height: 42px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #ffffff;
            border: none;
            color: #333;
            transition: transform 0.2s, box-shadow 0.2s;

            &:hover {
                background-color: #f8f9fa;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
        }
    }
}
</style>
