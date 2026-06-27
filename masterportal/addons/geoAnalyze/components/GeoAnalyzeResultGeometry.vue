<script>
export default {
    name: "GeoAnalyzeResultGeometry",
    props: {
        results: {
            type: Object,
            required: true
        }
    },
    computed: {
        sum_ew_haupt: function () {
            return this.results?.ew?.[0]?.sum_ew_haupt || "keine Daten vorhanden";
        },
        sum_ew_neben: function () {
            return this.results?.ew?.[0]?.sum_ew_neben || "keine Daten vorhanden";
        },
        schools_sum: function () {
            return this.results?.schools?.[0]?.sum_schulen || "keine Daten vorhanden";
        },
        students_sum: function () {
            return this.results?.schools?.[0]?.sum_schueler || "keine Daten vorhanden";
        },
        sum_kita: function () {
            return this.results?.kitas?.[0]?.sum_kita || "keine Daten vorhanden";
        },
        sum_children: function () {
            return this.results?.kitas?.[0]?.sum_kinder || "keine Daten vorhanden";
        },
        sum_hospitals: function () {
            return this.results?.hospitals?.[0]?.sum_krankenhaus || "keine Daten vorhanden";
        },
        sum_hospitals_beds: function () {
            return this.results?.hospitals?.[0]?.sum_planbetten || "keine Daten vorhanden";
        },
        sum_care_facility: function () {
            return this.results?.pflege?.[0]?.sum_pflege || "keine Daten vorhanden";
        },
        sum_care_places: function () {
            return this.results?.pflege?.[0]?.sum_plaetze || "keine Daten vorhanden";
        }
    }
};
</script>

<template lang="html">
    <div class="stats-wrapper py-2 ps-4">
        <dl class="row g-2">
            <dt class="col-sm-7 text-muted">
                Einwohnerzahl Hauptsitz gesamt
            </dt>
            <dd class="col-sm-5 border-start-sm ps-sm-3 text-muted">
                {{ sum_ew_haupt }}
            </dd>

            <dt class="col-sm-7 text-muted">
                Einwohnerzahl Nebensitz gesamt
            </dt>
            <dd class="col-sm-5 border-start-sm ps-sm-3 mb-3 text-muted">
                {{ sum_ew_neben }}
            </dd>

            <div class="col-12">
                <hr class="my-2">
            </div>
            <dt class="col-sm-7 text-muted">
                Summe der Schulen
            </dt>
            <dd class="col-sm-5 border-start-sm ps-sm-3 text-muted">
                {{ schools_sum }}
            </dd>

            <dt class="col-sm-7 text-muted">
                Summe der Schüler
            </dt>
            <dd class="col-sm-5 border-start-sm ps-sm-3 mb-3 text-muted">
                {{ students_sum }}
            </dd>

            <div class="col-12">
                <hr class="my-2">
            </div>
            <dt class="col-sm-7 text-muted">
                Summe der Kitas:
            </dt>
            <dd class="col-sm-5 border-start-sm ps-sm-3 text-muted">
                {{ sum_kita }}
            </dd>

            <dt class="col-sm-7 text-muted">
                Summe der Kinder
            </dt>
            <dd class="col-sm-5 border-start-sm ps-sm-3 mb-3 text-muted">
                {{ sum_children }}
            </dd>

            <div class="col-12">
                <hr class="my-2">
            </div>
            <dt class="col-sm-7 text-muted">
                Summe der Krankenhäuser
            </dt>
            <dd class="col-sm-5 border-start-sm ps-sm-3 text-muted">
                {{ sum_hospitals }}
            </dd>

            <dt class="col-sm-7 text-muted">
                Summe der Planbetten
            </dt>
            <dd class="col-sm-5 border-start-sm ps-sm-3 mb-3 text-muted">
                {{ sum_hospitals_beds }}
            </dd>

            <div class="col-12">
                <hr class="my-2">
            </div>
            <dt class="col-sm-7 text-muted">
                Summe der Pflegeeinrichtungen
            </dt>
            <dd class="col-sm-5 border-start-sm ps-sm-3 text-muted">
                {{ sum_care_facility }}
            </dd>

            <dt class="col-sm-7 text-muted">
                Summe der Pflegeplätze
            </dt>
            <dd class="col-sm-5 border-start-sm ps-sm-3 text-muted">
                {{ sum_care_places }}
            </dd>
        </dl>
    </div>
</template>

<style lang="scss" scoped>
    hr {
        margin-top: 10px;
        margin-bottom: 10px;
    }
</style>
