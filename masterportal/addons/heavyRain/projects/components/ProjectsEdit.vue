<script>
import {convertColor} from "@shared/js/utils/convertColor";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import HrDraw from "../../shared/components/HrDraw.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {mapGetters} from "vuex";
import Multiselect from "vue-multiselect";

export default {
    name: "ProjectsEdit",
    components: {
        FileUpload,
        HrDraw,
        InputText,
        Multiselect
    },
    data () {
        return {
            chosenCriteria: []
        };
    },
    computed: {
        ...mapGetters("Modules/Projects", ["criteria"]),

        /**
         * Gets the stroke color for draw style.
         * @returns {Number[]} the rgb color code.
         */
        strokeColor () {
            if (!this.chosenCriteria.length) {
                return convertColor(this.criteria[0].color, "rgb");
            }

            const index = [];

            this.chosenCriteria.forEach(chosenCri => {
                index.push(this.criteria.findIndex(cri => cri.name === chosenCri.name));
            });

            return convertColor(this.criteria[Math.min(...index)].color, "rgb");
        }
    }
};
</script>

<template lang="html">
    <div class="projects-edit mt-3">
        <div class="mb-4">
            <h5 class="headline mb-3">
                {{ $t('additional:modules.projects.createProject') || $t('additional:modules.projects.editProject') }}
            </h5>
            <p>{{ $t('additional:modules.projects.description') }}</p>
        </div>

        <div>
            <h5 class="mb-3">
                {{ $t('additional:modules.projects.drawTitle') }}
            </h5>
            <HrDraw
                class="mb-4"
                :stroke-color="strokeColor"
            />
        </div>

        <hr class="my-4">

        <div class="row g-3">
            <div class="col-12">
                <h5 class="mb-1">
                    {{ $t('additional:modules.projects.detailsTitle') }}
                </h5>
                <p>{{ $t('additional:modules.projects.detailsDescription') }}</p>
            </div>

            <div class="col-12">
                <InputText
                    id="project-name"
                    :label="$t('additional:modules.projects.labels.projectName')"
                    :placeholder="$t('additional:modules.projects.labels.projectName')"
                />
            </div>

            <div class="col-12 criteria-select">
                <Multiselect
                    id="criteria"
                    v-model="chosenCriteria"
                    :aria-label="$t('additional:modules.projects.labels.criteria')"
                    :options="criteria"
                    name="criteria"
                    :multiple="true"
                    :placeholder="$t('additional:modules.projects.labels.criteria')"
                    :tabindex="-1"
                    :close-on-select="false"
                    :clear-on-select="false"
                    :show-labels="false"
                    :limit="3"
                    :limit-text="count => count + ' ' + $t('common:modules.statisticDashboard.label.more')"
                    :taggable="true"
                    track-by="color"
                    label="name"
                >
                    {{ chosenCriteria }}
                </Multiselect>
            </div>

            <div class="col-12">
                <InputText
                    id="createdBy"
                    :label="$t('additional:modules.projects.labels.createdBy')"
                    :placeholder="$t('additional:modules.projects.labels.createdBy')"
                />
            </div>

            <div class="col-6">
                <InputText
                    id="startDate"
                    type="date"
                    :label="$t('additional:modules.projects.labels.startDate')"
                    :placeholder="'YYYY-MM-DD'"
                />
            </div>
            <div class="col-6">
                <InputText
                    id="endDate"
                    type="date"
                    :label="$t('additional:modules.projects.labels.endDate')"
                    :placeholder="'YYYY-MM-DD'"
                />
            </div>

            <div class="col-12">
                <InputText
                    id="quelle"
                    :label="$t('additional:modules.projects.labels.source')"
                    :placeholder="$t('additional:modules.projects.labels.source')"
                />
            </div>
            <div class="col-12">
                <InputText
                    id="contact"
                    :label="$t('additional:modules.projects.labels.contact')"
                    :placeholder="$t('additional:modules.projects.labels.contact')"
                />
            </div>
            <div class="col-12">
                <InputText
                    id="description"
                    html-type="textarea"
                    :label="$t('additional:modules.projects.labels.description')"
                    :placeholder="$t('additional:modules.projects.labels.description')"
                />
            </div>
            <div class="col-12">
                <InputText
                    id="contactExt"
                    html-type="textarea"
                    :label="$t('additional:modules.projects.labels.contactExt')"
                    :placeholder="$t('additional:modules.projects.labels.contactExt')"
                />
            </div>
            <div class="col-12">
                <InputText
                    id="infolink"
                    :label="$t('additional:modules.projects.labels.infolink')"
                    :placeholder="'https://...'"
                />
            </div>

            <div class="col-12">
                <InputText
                    id="history"
                    html-type="textarea"
                    :label="$t('additional:modules.projects.labels.history')"
                    :placeholder="$t('additional:modules.projects.labels.history')"
                />
            </div>

            <div class="col-12">
                <InputText
                    id="protectedAreas"
                    html-type="textarea"
                    :label="$t('additional:modules.projects.labels.protectedAreas')"
                    :placeholder="$t('additional:modules.projects.labels.protectedAreas')"
                />
            </div>

            <div class="col-12">
                <h5 class="mb-2">
                    {{ $t('additional:modules.projects.labels.fileUpload') }}
                </h5>
                <FileUpload
                    class="mb-5"
                    :change="() => undefined"
                    :drop="() => undefined"
                />
            </div>
        </div>
    </div>
</template>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>

<style lang="scss" scoped>
.projects-edit {
    .form-label {
        color: var(--bs-secondary);
    }
}
.headline {
    color: #3C5F94;
    font-family: "MasterPortalFont Bold", "Arial Narrow Bold", Arial, sans-serif;
}
</style>

<style lang="scss">
.criteria-select .multiselect__strong{
    font-family: "MasterPortalFont Bold";
}

.criteria-select .multiselect__placeholder {
    color: #8f8f8f;
}

.criteria-select .multiselect__tag {
    background: $light_blue;
    padding: 4px 20px 4px 10px;
    border-radius: 50px;
    border: none;
}

.criteria-select .difference-modal .multiselect__tag {
    padding: 4px 26px 4px 10px;
    border-radius: 10px;
}
.criteria-select .multiselect__tag:hover {
    background: $dark_blue;
    color: $white;
}
.criteria-select .multiselect .multiselect__tag i::before {
    vertical-align: middle;
}
.criteria-select .multiselect .multiselect__tag i::after {
    color: $dark_blue;
}
.criteria-select .multiselect__clear {
    position: absolute;
    font-size: 12px;
    top: 12px;
    left: 9px;
}

.criteria-select .multiselect__option--selected.multiselect__option--highlight,
.criteria-select .multiselect__option--selected.multiselect__option--highlight:after,
.criteria-select .multiselect__option:after,
.criteria-select .multiselect__option--selected,
.criteria-select .multiselect__option--selected:after,
.criteria-select .multiselect__tag {
  color: $black;
  font-weight: normal;
}

.criteria-select .multiselect__option--highlight,
.criteria-select .multiselect__option--highlight:after {
    background: $secondary;
}
</style>
