<script>
import HrCard from "../../shared/components/HrCard.vue";
import HrHeader from "../../shared/components/HrHeader.vue";
import HrSnackbar from "../../shared/components/HrSnackbar.vue";
import {mapGetters, mapMutations} from "vuex";
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
            showSnackbar: false,
            snackbarMessage: "",
            snackbarColor: "success"
        };
    },
    computed: {
        ...mapGetters("Modules/UpdateRequirements", ["informationType", "currentRequirement", "currentView"]),

        /**
         * Gets the current opinion.
         * @returns {Object} the current opinion object.
         */
        currentOpinion () {
            return this.informationType.find(type => `${type.cat} ${type.name}` === this.currentRequirement?.formValues?.informationType);
        }
    },
    methods: {
        ...mapMutations("Modules/UpdateRequirements", ["setCurrentRequirement", "setCurrentView"]),

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
                @click:button="setCurrentView('create-new')"
            />
            <hr class="my-3">
            <h5
                v-if="typeof currentRequirement !== 'undefined'"
                class="d-flex align-items-center gap-2 mb-3"
            >
                <i class="bi bi-flag-fill" />
                {{ $t('additional:modules.updateRequirements.reportInfoHeading') }}
            </h5>
            <HrCard
                v-if="typeof currentRequirement !== 'undefined'"
                :title="currentRequirement?.formValues?.name"
                edit-aria-label="Bearbeiten"
                @click:edit="setCurrentView('create-new')"
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
                <template #card>
                    <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
                        <span class="text-body-secondary">
                            {{ $t("additional:modules.updateRequirements.form.createdAt") }}
                        </span>
                        <span>{{ currentRequirement?.formValues?.creationDate }}</span>
                        <span class="text-body-secondary">|</span>
                        <span class="text-body-secondary">Initiator:</span>
                        <span>{{ currentRequirement?.formValues?.initiator }}</span>
                    </div>

                    <p class="mb-3">
                        <span class="text-body-secondary">
                            {{ $t("additional:modules.updateRequirements.form.lastUpdate") }}
                        </span>
                        <span class="ms-1">{{ currentRequirement?.formValues?.lastUpate }}</span>
                    </p>

                    <p class="mb-3">
                        {{ currentRequirement?.formValues?.comment }}
                    </p>

                    <p class="mb-3">
                        <a
                            :href="currentRequirement?.formValues?.infoLink"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {{ currentRequirement?.formValues?.infoLink }}
                        </a>
                    </p>

                    <p class="mb-0">
                        {{ $t("additional:modules.updateRequirements.form.contact") }}
                    </p>
                    <p class="mb-0">
                        {{ currentRequirement?.formValues?.contactPerson }}
                    </p>
                </template>
            </HrCard>
        </template>
        <template v-else-if="currentView === 'create-new'">
            <UpdateEdit
                @showSnackbarMessage="showSnackbarMessage"
                @click:save="setCurrentView('main')"
                @click:cancel="setCurrentView('main')"
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

