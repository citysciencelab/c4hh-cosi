<script>
import AddCardButton from "../../../cosi/shared/modules/cards/components/AddCardButton.vue";
import draggable from "vuedraggable";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {mapGetters, mapMutations} from "vuex";
import StoryCreatorChapter from "./StoryCreatorChapter.vue";
import StoryCreatorChapterCard from "./StoryCreatorChapterCard.vue";

export default {
    name: "StoryCreator",
    components: {
        AddCardButton,
        Draggable: draggable,
        FileUpload,
        FlatButton,
        InputText,
        StoryCreatorChapter,
        StoryCreatorChapterCard
    },
    data () {
        return {
            storyName: "Geschichten mit Karten erzählen",
            storyDescription: "Lorem ipsum dolor sit amet...",
            altText: "Blick über die Hamburger Elbphilharmonie",
            imageSource: "Max Mustermann / Getty Images",
            selectedFile: null,
            chapterContent: [
                {title: "Dies ist ein Titel",
                    text: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum",
                    image: "https://www.hamburg.de/resource/image/1173902/landscape_ratio16x9/1300/731/59436f59c7c0b46a07676bff0913e36d/D4C3C6D304E3E543EF78A67BE4C173EF/eine-visualisierung-eines-radrennens-in-der-hafen-city.png",
                    photoCredit: "neuland concerts",
                    altText: "Eine Visualisierung eines Radrennens in der Hafen City",
                    chapterItems: {subject: "4 Fachdaten", map: "Position", tool: "Strecke/Fläche messen"}
                },
                {title: "Dies ist ein zweiter Titel",
                    text: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr",
                    image: "",
                    photoCredit: "",
                    altText: "",
                    chapterItems: {}
                }
            ]
        };
    },
    computed: {
        ...mapGetters("Modules/StoryCreator", [
            "currentView"
        ])
    },
    methods: {
        ...mapMutations("Modules/StoryCreator", [
            "setCurrentView"
        ]),
        /**
         * Adds a new chapter.
         * @returns {void}
         */
        addChapter () {
            this.setCurrentView("chapter");
        },
        /**
         * Goes to home page of story creator.
         * @returns {void}
         */
        goToStory () {
            this.setCurrentView("story");
        }
    }
};
</script>

<template lang="html">
    <div id="story-creator">
        <nav
            v-if="currentView === 'chapter'"
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
                    {{ $t("additional:modules.storyCreator.chapterNav") }}
                </li>
            </ol>
        </nav>
        <div v-if="currentView === 'story'">
            <p class="mb-4">
                {{ $t("additional:modules.storyCreator.introText") }}
            </p>
            <InputText
                id="storyName"
                v-model="storyName"
                :label="$t('additional:modules.storyCreator.labels.storyName')"
                :placeholder="$t('additional:modules.storyCreator.labels.storyName')"
                class="mb-3"
            />
            <InputText
                id="storyDescription"
                v-model="storyDescription"
                :label="$t('additional:modules.storyCreator.labels.storyDescription')"
                :placeholder="$t('additional:modules.storyCreator.labels.storyDescription')"
                html-type="textarea"
                class="mb-3"
            />
            <FileUpload
                id="Story-creator-file-upload"
                :label="$t('additional:modules.storyCreator.labels.fileDrop')"
                :sub-label="$t('additional:modules.storyCreator.labels.fileSelect')"
                class="mb-3"
                :change="() => undefined"
                :drop="() => undefined"
            />
            <InputText
                id="altText"
                v-model="altText"
                :label="$t('additional:modules.storyCreator.labels.altText')"
                :placeholder="$t('additional:modules.storyCreator.labels.altText')"
                class="mb-3"
            />
            <InputText
                id="imageSource"
                v-model="imageSource"
                :label="$t('additional:modules.storyCreator.labels.photoCredit')"
                :placeholder="$t('additional:modules.storyCreator.labels.photoCredit')"
                class="mb-3"
            />
            <hr>
            <h5 class="py-3">
                {{ $t('additional:modules.storyCreator.headlines.chapterList') }}
            </h5>
            <Draggable
                v-model="chapterContent"
                class="dragArea no-list ps-0 ms-2"
                item-key="name"
                handle=".card"
                :list="chapterContent"
            >
                <template #item="{ element }">
                    <StoryCreatorChapterCard
                        :chapter-title="element.title"
                        :chapter-text="element.text"
                        :chapter-image="element.image"
                        :photo-credit="element.photoCredit"
                        :alt-text="element.altText"
                        :chapter-items="element.chapterItems"
                        @delete="() => ''"
                    />
                </template>
            </Draggable>
            <AddCardButton
                :text="$t('additional:modules.storyCreator.addChapter')"
                @click="addChapter"
            />

            <div class="d-flex flex-column align-items-center pt-3">
                <FlatButton
                    :icon="'bi-collection-play'"
                    :aria-label="$t('additional:modules.storyCreator.preview')"
                    :text="$t('additional:modules.storyCreator.preview')"
                />
                <FlatButton
                    :icon="'bi-cloud-arrow-down'"
                    :aria-label="$t('additional:modules.storyCreator.downloadStory')"
                    :text="$t('additional:modules.storyCreator.downloadStory')"
                />
                <FlatButton
                    :icon="'bi-x-circle'"
                    :secondary="true"
                    :aria-label="$t('additional:modules.storyCreator.discardStory')"
                    :text="$t('additional:modules.storyCreator.discardStory')"
                />
            </div>
        </div>
        <div v-else-if="currentView === 'chapter'">
            <StoryCreatorChapter />
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
</style>
