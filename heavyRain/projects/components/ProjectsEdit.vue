<script>
import HrDraw from "../../shared/components/HrDraw.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";

export default {
    name: "ProjectsEdit",
    components: {
        HrDraw,
        InputText,
        FileUpload
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
            <HrDraw />
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

            <div class="col-12">
                <InputText
                    id="criteria"
                    :label="$t('additional:modules.projects.labels.criteria')"
                    :placeholder="$t('additional:modules.projects.labels.criteria')"
                />
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
