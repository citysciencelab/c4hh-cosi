<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import {extractStoryZip} from "../shared/js/storyZipCreator.js";
import tipTapJsonToHtml from "../shared/modules/tipTapEditor/js/tipTapJsonToHtml.js";

export default {
    name: "StoryCreatorImportTest",
    components: {
        AccordionItem,
        FileUpload
    },
    data () {
        return {
            showStory: false,
            imageAssetsById: {},
            story: {
                chapters: []
            }
        };
    },
    methods: {
        tipTapJsonToHtml,

        async onImportFile (event) {
            const file = event?.dataTransfer?.files?.[0] ?? event?.target?.files?.[0];

            if (!file) {
                return;
            }

            try {
                const {storyJson, imageAssetsById} = await extractStoryZip(file);

                this.story = storyJson;
                this.imageAssetsById = imageAssetsById;
                this.showStory = true;
            }
            catch (error) {
                console.error("Failed to import story zip.", error);
            }
        }
    }
};
</script>

<template lang="html">
    <div class="story-import-test mt-4">
        <AccordionItem
            id="story-import-test"
            icon="bi-box-arrow-in-down"
            title="Import Test"
        >
            <FileUpload
                id="story-creator-import-test-upload"
                label="Import story zip"
                sub-label="Select file"
                :change="onImportFile"
                :drop="onImportFile"
            />
            <div
                v-if="showStory"
                class="mt-3"
            >
                <h6>Imported Story</h6>
                <div
                    v-for="(chapter, chapterIndex) in story.chapters"
                    :key="`chapter-${chapterIndex}`"
                    class="mb-3"
                >
                    <strong>{{ chapter.title }}</strong>
                    <template
                        v-for="(item, itemIndex) in chapter.content"
                        :key="`content-${chapterIndex}-${itemIndex}`"
                    >
                        <div v-if="item.type === 'image'">
                            <img
                                :src="imageAssetsById[item.id]?.objectURL"
                                :alt="item.attrs?.alt"
                                class="img-thumbnail d-block mx-auto my-2 w-100"
                            >
                        </div>
                        <div v-else-if="item.type === 'doc'">
                            <div v-html="tipTapJsonToHtml(item)" />
                        </div>
                    </template>
                </div>
            </div>
        </AccordionItem>
    </div>
</template>

<style lang="scss" scoped>
</style>
