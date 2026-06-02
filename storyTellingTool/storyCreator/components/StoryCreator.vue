<script>
import AddCardButton from "../../../cosi/shared/modules/cards/components/AddCardButton.vue";
// import {createStoryZip} from "../shared/js/storyZipCreator.js";
import dayjs from "dayjs";
import draggable from "vuedraggable";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InfoCard from "../../shared/card/components/InfoCard.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {mapActions, mapGetters, mapMutations} from "vuex";
import StoryCreatorChapter from "./StoryCreatorChapter.vue";
import StoryCreatorImportTest from "./StoryCreatorImportTest.vue";

export default {
    name: "StoryCreator",
    components: {
        AddCardButton,
        Draggable: draggable,
        FileUpload,
        FlatButton,
        InfoCard,
        InputText,
        StoryCreatorChapter,
        StoryCreatorImportTest
    },
    data () {
        return {
            title: "Geschichten mit Karten erzählen",
            description: "Lorem ipsum dolor sit amet...",
            author: "Max Mustermann",
            imageAlt: "Blick über die Hamburger Elbphilharmonie",
            imageCopyright: "Max Mustermann / Getty Images",
            imageSrc: "./img.png",
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
         * Saves the story into story list.
         * @returns {void}
         */
        saveStory () {
            this.updateStory();
            this.setStoryList([...this.storyList, this.story]);
            this.changeCurrentComponent({type: "storyManager", side: "secondaryMenu", props: {name: "additional:modules.storyManager.title"}});
            this.setNavigationHistoryBySide({side: "secondaryMenu", newHistory: [{type: "root", props: []}]});
            /*
            this.updateStory();

            const zipBlob = await createStoryZip(this.story, this.imageAssetsById),
                filename = this.title + ".zip",
                objectURL = URL.createObjectURL(zipBlob),
                element = document.createElement("a");

            element.setAttribute("href", objectURL);
            element.setAttribute("download", filename);
            element.style.display = "none";
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            URL.revokeObjectURL(objectURL);
            */
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
            <FileUpload
                id="Story-creator-file-upload"
                :label="$t('additional:modules.storyCreator.labels.fileDrop')"
                :sub-label="$t('additional:modules.storyCreator.labels.fileSelect')"
                class="mb-3"
                :change="() => undefined"
                :drop="() => undefined"
            />
            <InputText
                id="imageAlt"
                v-model="imageAlt"
                :label="$t('additional:modules.storyCreator.labels.altText')"
                :placeholder="$t('additional:modules.storyCreator.labels.altText')"
                class="mb-3"
            />
            <InputText
                id="imageCopyright"
                v-model="imageCopyright"
                :label="$t('additional:modules.storyCreator.labels.photoCredit')"
                :placeholder="$t('additional:modules.storyCreator.labels.photoCredit')"
                class="mb-3"
            />
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
                        :card-title="element.title"
                        :card-text="element.text"
                        :card-image="element.image"
                        :photo-credit="element.photoCredit"
                        :alt-text="element.altText"
                        :card-items="element.chapterItems"
                        @delete="() => deleteChapter(index)"
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
        <StoryCreatorImportTest />
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
