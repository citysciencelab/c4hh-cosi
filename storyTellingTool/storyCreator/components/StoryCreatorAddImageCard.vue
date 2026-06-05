<script>
import AlertMessage from "../../../cosi/shared/modules/alerts/components/AlertMessage.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
    name: "StoryCreatorAddImageCard",
    components: {
        AlertMessage,
        FlatButton,
        FileUpload,
        InputText
    },
    props: {
        closeable: {
            type: Boolean,
            required: false,
            default: true
        },
        initialImage: {
            type: Object,
            required: false,
            default: null
        }
    },
    emits: ["addImage", "click:close"],
    data () {
        return {
            image: {
                altText: "",
                photoCredit: ""
            },
            isValidated: true
        };
    },
    computed: {
        ...mapGetters("Modules/StoryCreator", [
            "imageAssetsById"
        ]),
        /**
         * Returns true if the card is creating a new image.
         * @returns {Boolean} True if no initial image data exists.
         */
        isNewImage () {
            return !this.initialImage?.id;
        },
        /**
         * Returns true if an image id exists and its object URL is available.
         * @returns {Boolean} True if the image can be displayed.
         */
        isImageLoaded () {
            return Boolean(this.image?.id && this.imageAssetsById[this.image.id]?.objectURL);
        },
        /**
         * Returns true if the altText and photoCredit are not empty.
         * @returns {Boolean} True if the altText and photoCredit are not empty.
         */
        enableAdd () {
            if (this.image?.altText.trim() !== "" && this.image?.photoCredit.trim() !== "") {
                return true;
            }

            return false;
        }
    },
    created () {
        if (this.initialImage?.id) {
            this.image = JSON.parse(JSON.stringify(this.initialImage));
        }
    },
    methods: {
        ...mapActions("Modules/StoryCreator", [
            "addImageAsset"
        ]),
        ...mapMutations("Modules/StoryCreator", [
            "removeImageAsset"
        ]),

        /**
         * Handles clicking the close button.
         * @returns {void}
         */
        handleCloseButtonClick () {
            if (this.isNewImage) {
                this.removeImageAsset(this.image.id);
            }

            this.$emit("click:close");
        },

        /**
         * Handles clicking the discard button.
         * @returns {void}
         */
        handleDiscardButtonClick () {
            if (this.isNewImage) {
                this.removeImageAsset(this.image.id);
            }

            this.image = {
                altText: "",
                photoCredit: ""
            };
            this.isValidated = true;
        },

        /**
         * Loads the image and stores it through the StoryCreator action.
         * @param {Event} event
         */
        async loadImage (event) {
            const file = event?.dataTransfer?.files?.[0] ?? event?.target?.files?.[0];

            if (!file || !file?.type.startsWith("image/")) {
                this.isValidated = false;
                return;
            }

            this.isValidated = true;
            const id = await this.addImageAsset(file);

            this.image.id = id;
        }
    }
};
</script>
<template lang="html">
    <div class="card border-0 rounded-3 bg-light">
        <div class="card-body p-4 position-relative">
            <button
                v-if="closeable"
                type="button"
                class="btn-close position-absolute top-0 end-0 m-2"
                aria-label="Close"
                @click="handleCloseButtonClick"
            />

            <h5 class="card-title mb-3">
                {{ closeable
                    ? $t('additional:modules.storyCreator.headlines.addImages')
                    : $t('additional:modules.storyCreator.headlines.addImageTitle') }}
            </h5>
            <div v-if="!isImageLoaded">
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
                    :src="imageAssetsById[image.id]?.objectURL"
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
                v-if="isImageLoaded"
                class="d-flex justify-content-center gap-2"
            >
                <FlatButton
                    class="mt-2"
                    icon="bi bi-save"
                    :text="$t('additional:modules.storyCreator.buttons.confirm')"
                    :disabled="!enableAdd"
                    :interaction="() => $emit('addImage', image)"
                />
                <FlatButton
                    class="mt-2"
                    icon="bi bi-x-circle"
                    :secondary="true"
                    :text="$t('additional:modules.storyCreator.buttons.discardImage')"
                    :interaction="handleDiscardButtonClick"
                />
            </div>
        </div>
    </div>
</template>
<style lang="scss" scoped>
</style>
