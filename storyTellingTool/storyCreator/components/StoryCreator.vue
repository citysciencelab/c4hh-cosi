<script>
import AddCardButton from "../../../cosi/shared/modules/cards/components/AddCardButton.vue";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import StoryCreatorChapter from "./StoryCreatorChapter.vue";

export default {
    name: "StoryCreator",
    components: {
        AddCardButton,
        FileUpload,
        FlatButton,
        InputText,
        StoryCreatorChapter
    },
    data () {
        return {
            storyName: "Geschichten mit Karten erzählen",
            storyDescription: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.",
            altText: "Blick über die Hamburger Elbphilharmonie",
            imageSource: "Max Mustermann / Getty Images",
            selectedFile: null
        };
    },
    methods: {
        addCard () {
            // console.log("add chapter");
        }
    }
};
</script>

<template lang="html">
    <div id="story-creator">
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
        <StoryCreatorChapter />
        <h5 class="pt-4 pb-2">
            {{ $t("additional:modules.storyCreator.chapterTitle") }}
        </h5>
        <AddCardButton
            :text="$t('additional:modules.storyCreator.addChapter')"
            @click="addCard"
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
                :aria-label="$t('additional:modules.storyCreator.discardStory')"
                :text="$t('additional:modules.storyCreator.discardStory')"
            />
        </div>
    </div>
</template>
<style lang="scss" scoped>
</style>

