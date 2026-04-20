<script>
import HrCard from "../../shared/components/HrCard.vue";
import HrFooter from "../../shared/components/HrFooter.vue";
import HrHeader from "../../shared/components/HrHeader.vue";
import ProjectsEdit from "./ProjectsEdit.vue";
import HrSnackbar from "../../shared/components/HrSnackbar.vue";

export default {
    // eslint-disable-next-line vue/multi-word-component-names
    name: "Projects",
    components: {
        HrCard,
        HrFooter,
        HrHeader,
        HrSnackbar,
        ProjectsEdit
    },
    data () {
        return {
            currentView: "main",
            showSnackbar: false,
            snackbarMessage: "",
            snackbarColor: "success"
        };
    },
    methods: {
        /**
         * Handles the save action.
         * @returns {void}
         */
        onSave () {
            this.showSnackbarMessage("Projekt wurde erfolgreich gespeichert.");
            this.currentView = "main";
        },
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
        <div v-if="currentView === 'main'">
            <HrHeader
                :text="$t('additional:modules.projects.description')"
                :button-text="$t('additional:modules.projects.createProject')"
                @click:button="currentView = 'edit'"
            />
            <HrCard
                title="Projektname"
                edit-aria-label="Projekt bearbeiten"
                @click:edit="currentView = 'edit'"
            >
                <template #above-title>
                    <div class="d-flex flex-wrap gap-2">
                        <span class="badge rounded-pill text-bg-primary fw-normal px-3 py-2">
                            Bauprojekte (Umsetzungsmassnahmen)
                        </span>
                        <span class="badge rounded-pill text-bg-primary fw-normal px-3 py-2">
                            Bereiche aus Postfach
                        </span>
                    </div>
                </template>

                <div class="row g-3 mb-3">
                    <div class="col-6">
                        <p class="mb-0 small fw-semibold">
                            Eingetragen von
                        </p>
                        <p class="mb-0 text-body-secondary">
                            Lorem Ipsum
                        </p>
                    </div>
                    <div class="col-6">
                        <p class="mb-0 small fw-semibold">
                            Aktualisierung
                        </p>
                        <p class="mb-0">
                            23.02.2026
                        </p>
                    </div>
                    <div class="col-6">
                        <p class="mb-0 small fw-semibold">
                            Baubeginn
                        </p>
                        <p class="mb-0">
                            01.01.2025
                        </p>
                    </div>
                    <div class="col-6">
                        <p class="mb-0 small fw-semibold">
                            Bauende
                        </p>
                        <p class="mb-0">
                            01.08.2025
                        </p>
                    </div>
                    <div class="col-6">
                        <p class="mb-0 small fw-semibold">
                            Ansprechpartner
                        </p>
                        <p class="mb-0 text-body-secondary">
                            Lorem ipsum dolor sit amet
                        </p>
                    </div>
                </div>

                <section class="mb-3">
                    <h6 class="mb-1 fw-semibold">
                        Kurzbeschreibung / Art der Massnahme
                    </h6>
                    <p class="mb-2">
                        Lorem ipsum dolor sit amet, consetetur sadipscing elitr...
                    </p>
                    <a
                        href="https://www.infolink.de"
                        target="_blank"
                        rel="noopener noreferrer"
                    >www.infolink.de</a>
                </section>

                <section class="mb-3">
                    <h6 class="mb-1 fw-semibold">
                        Quelle
                    </h6>
                    <p class="mb-0">
                        Lorem ipsum dolor sit amet...
                    </p>
                </section>

                <section class="mb-3">
                    <h6 class="mb-1 fw-semibold">
                        Kontakt extern
                    </h6>
                    <p class="mb-0">
                        Lorem ipsum dolor sit amet...
                    </p>
                </section>

                <section class="mb-3">
                    <h6 class="mb-1 fw-semibold">
                        Historie - Zeitpunkt und Meldungen
                    </h6>
                    <p class="mb-0">
                        Lorem ipsum dolor sit amet...
                    </p>
                </section>

                <section class="mb-0">
                    <h6 class="mb-1 fw-semibold">
                        Bereiche, wo die Kriterien des Schutzniveaus erreicht sind
                    </h6>
                    <p class="mb-0">
                        Lorem ipsum dolor sit amet, consetetur sadipscing elitr
                    </p>
                </section>
            </HrCard>
        </div>

        <div v-else-if="currentView === 'edit'">
            <ProjectsEdit />
            <HrFooter
                v-model:snackbar-visible="showSnackbar"
                :cancel-text="$t('additional:modules.projects.cancelButtonLabel')"
                :save-text="$t('additional:modules.projects.saveButtonLabel')"
                :snackbar-message="snackbarMessage"
                :snackbar-color="snackbarColor"
                @click:save="onSave"
                @click:cancel="currentView = 'main'"
            />
        </div>

        <HrSnackbar
            :model-value="showSnackbar"
            :message="snackbarMessage"
            :color="snackbarColor"
            @update:model-value="val => showSnackbar = val"
        />
    </div>
</template>
