<script>
import AlertMessage from "../../../cosi/shared/modules/alerts/components/AlertMessage.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {mapGetters} from "vuex";

export default {
    name: "StoryCreatorAddImageCard",
    components: {
        AlertMessage,
        FlatButton,
        FileUpload,
        InputText
    },
    emits: ["addImage", "click:close"],
    data () {
        return {
            image: {
                altText: "",
                photoCredit: ""
            },
            imageLoaded: false,
            isValidated: true
        };
    },
    computed: {
        ...mapGetters("Modules/StoryCreator", [
            "objectURLById"
        ])
    },

    methods: {
        /**
         * Emits the "addImage" event with the image data and stores the object URL in the store.
         */
        addImage () {
            this.objectURLById[this.image.id] = this.image.objectURL;
            this.$emit("addImage", this.image);
        },

        /**
         * Emits the "click:close" event and revokes the object URL.
         */
        discardImage () {
            URL.revokeObjectURL(this.image.objectURL);
            this.$emit("click:close");
        },

        /**
         * Loads the image and creates an object URL for it.
         * @param {Event} event
         */
        loadImage (event) {
            const file = event?.dataTransfer?.files?.[0] ?? event?.target?.files?.[0];

            if (!file || !file?.type.startsWith("image/")) {
                this.isValidated = false;
                return;
            }

            this.imageLoaded = true;
            this.image.objectURL = URL.createObjectURL(file);
            this.image.id = crypto.randomUUID();
            this.isValidated = true;
        }
    }
};
</script>
<template lang="html">
    <div class="card border-0 rounded-3 bg-light">
        <div class="card-body p-4 position-relative">
            <button
                type="button"
                class="btn-close position-absolute top-0 end-0 m-2"
                aria-label="Close"
                @click="discardImage"
            />

            <h5 class="card-title mb-3">
                {{ $t('additional:modules.storyCreator.headlines.addImages') }}
            </h5>
            <div v-if="!imageLoaded">
                <FileUpload
                    :id="'Story-Creator-Image-Upload'"
                    :change="loadImage"
                    :drop="loadImage"
                    :multiple="false"
                    accept="image/*"
                />
            </div>
            <div v-else>
                <img
                    :src="image.objectURL"
                    :alt="image.altText"
                    class="img-thumbnail d-block mx-auto mb-3 w-25"
                >
            </div>
            <InputText
                id="image-name"
                v-model="image.altText"
                class="mt-2"
                :label="$t('additional:modules.storyCreator.labels.altText')"
                :placeholder="$t('additional:modules.storyCreator.labels.altText')"
            />
            <InputText
                id="image-name"
                v-model="image.photoCredit"
                class="mt-2"
                :label="$t('additional:modules.storyCreator.labels.photoCredit')"
                :placeholder="$t('additional:modules.storyCreator.labels.photoCredit')"
            />
            <AlertMessage
                v-if="!isValidated"
                :closeable="true"
                :text="$t('additional:modules.storyCreator.labels.wrongFormat')"
                :title="$t('additional:modules.storyCreator.labels.wrongFormatTitle')"
                type="error"
                @closed="isValidated = true"
            />
            <div
                v-if="imageLoaded"
                class="d-flex justify-content-center"
            >
                <FlatButton
                    class="mt-2"
                    icon="bi bi-save"
                    :text="$t('additional:modules.storyCreator.buttons.add')"
                    :interaction="() => addImage()"
                />
            </div>
        </div>
    </div>
</template>
<style lang="scss" scoped>
</style>
