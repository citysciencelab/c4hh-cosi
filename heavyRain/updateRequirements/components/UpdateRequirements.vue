<script>
import HrCard from "../../shared/components/HrCard.vue";
import HrHeader from "../../shared/components/HrHeader.vue";
import HrSnackbar from "../../shared/components/HrSnackbar.vue";
import {mapGetters} from "vuex";
import UpdateEdit from "./UpdateEdit.vue";

export default {
    name: "UpdateRequirements",
    components: {
        HrCard,
        HrHeader,
        HrSnackbar,
        UpdateEdit
    },
    data () {
        return {
            currentView: "main",
            currentOpinion: undefined,
            showSnackbar: false,
            snackbarMessage: "",
            snackbarColor: "success"
        };
    },
    computed: {
        ...mapGetters("Modules/UpdateRequirements", ["informationType"])
    },
    mounted () {
        this.currentOpinion = this.informationType[0];
    },
    methods: {
        /**
         * Shows a snackbar message.
         * @param {String} message the message to display
         * @param {String} color the snackbar color
         * @returns {void}
         */
        showSnackbarMessage (message, color = "success") {
            this.snackbarMessage = message;
            this.snackbarColor = color;
            this.showSnackbar = true;
        }
    }
};
</script>

<template lang="html">
    <div>
        <template v-if="currentView === 'main'">
            <HrHeader
                :text="$t('additional:modules.updateRequirements.description')"
                :button-text="$t('additional:modules.updateRequirements.createMessage')"
                @click:button="currentView = 'create-new'"
            />

            <hr class="my-3">
            <h5 class="d-flex align-items-center gap-2 mb-3">
                <i class="bi bi-flag-fill" />
                {{ $t('additional:modules.updateRequirements.reportInfoHeading') }}
            </h5>

            <HrCard
                title="Name Lorem Ipsum"
                edit-aria-label="Bearbeiten"
            >
                <template #above-title>
                    <div class="ratio ratio-16x9 border rounded overflow-hidden mb-3">
                        <img
                            src="https://picsum.photos/id/1031/1200/675"
                            alt="Strassenansicht"
                            class="w-100 h-100"
                            style="object-fit: cover;"
                        >
                    </div>
                    <div
                        v-if="typeof currentOpinion !== 'undefined'"
                        class="d-flex flex-column justify-content-end align-items-center gap-2"
                    >
                        <small class="text-body-secondary">{{ currentOpinion.cat }}</small>
                        <span
                            class="badge rounded-pill fw-normal px-3 py-2"
                            :style="{background: currentOpinion.color}"
                        >
                            {{ currentOpinion.name }}
                        </span>
                    </div>
                </template>

                <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
                    <span class="text-body-secondary">erstellt am:</span>
                    <span>04.04.2025</span>
                    <span class="text-body-secondary">|</span>
                    <span class="text-body-secondary">Initiator:</span>
                    <span>Lorem Ipsum</span>
                </div>

                <p class="mb-3">
                    <span class="text-body-secondary">letzte Aktualisierung:</span>
                    <span class="ms-1">11.03.2026</span>
                </p>

                <p class="mb-3">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.
                    Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.
                </p>

                <p class="mb-3">
                    <a
                        href="https://www.infolink.de"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        www.infolink.de
                    </a>
                </p>

                <p class="mb-0">
                    Ansprechpartner
                </p>
            </HrCard>
        </template>
        <template v-else-if="currentView === 'create-new'">
            <UpdateEdit
                @showSnackbarMessage="showSnackbarMessage"
                @click:save="currentView = 'main'"
                @click:cancel="currentView = 'main'"
            />
        </template>

        <HrSnackbar
            :model-value="showSnackbar"
            :message="snackbarMessage"
            :color="snackbarColor"
            @update:model-value="val => showSnackbar = val"
        />
    </div>
</template>

<style lang="scss" scoped>
.headline {
    color: $secondary;
    font-family: $font-family_accent;
}
</style>

