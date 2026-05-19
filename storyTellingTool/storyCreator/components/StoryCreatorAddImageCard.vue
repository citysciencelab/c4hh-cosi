<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

export default {
    name: "StoryCreatorAddImageCard",
    components: {
        FlatButton,
        FileUpload,
        InputText
    },
    data () {
        return {
            showCard: true
        };
    }
};
</script>
<template lang="html">
    <div
        v-if="showCard"
        class="card border-0 rounded-3 bg-light"
    >
        <div class="card-body p-4 position-relative">
            <button
                type="button"
                class="btn-close position-absolute top-0 end-0 m-2"
                aria-label="Close"
                @click="showCard = false"
            />
            <h5 class="card-title mb-3">
                {{ $t('additional:modules.storyCreator.headlines.addImages') }}
            </h5>
            <div>
                <FileUpload
                    :id="'Story-Creator-Image-Upload'"
                    :change="() => undefined"
                    :drop="() => undefined"
                />
            </div>
            <InputText
                id="image-name"
                class="mt-2"
                :label="$t('additional:modules.storyCreator.labels.altText')"
                :placeholder="$t('additional:modules.storyCreator.labels.altText')"
            />
            <InputText
                id="image-name"
                class="mt-2"
                :label="$t('additional:modules.storyCreator.labels.photoCredit')"
                :placeholder="$t('additional:modules.storyCreator.labels.photoCredit')"
            />
            <div class="d-flex justify-content-center">
                <FlatButton
                    class="mt-2"
                    icon="bi bi-save"
                    :text="$t('additional:modules.storyCreator.buttons.add')"
                    @click="() => ''"
                />
            </div>
        </div>
    </div>
</template>
<style lang="scss" scoped>
</style>
