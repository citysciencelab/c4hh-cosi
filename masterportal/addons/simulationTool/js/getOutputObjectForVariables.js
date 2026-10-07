/**
 * Collects output variables spread across simulation jobs by output key.
 * @param {Record<string, object>} jobs The simulation jobs.
 * @param {object[]} processes The configured simulation processes.
 * @returns {Record<string, Record<string, unknown>>} Variables grouped by output key.
 */
export default function getOutputObjectForVariables (jobs, processes) {
    const outputObjectForVariables = {};

    Object.values(jobs || {}).forEach(job => {
        const process = processes?.find(processConfig => processConfig.id === job?.jobStatus?.processID),
            displaySettings = process?.displaySettings || {};

        Object.entries(displaySettings).forEach(([outputKey, outputConfig]) => {
            if (!Array.isArray(outputConfig?.spreadOutputVariables)) {
                return;
            }

            outputConfig.spreadOutputVariables.forEach(variable => {
                outputObjectForVariables[outputKey] ||= {};
                outputObjectForVariables[outputKey][variable] = job?.jobResults?.[variable]?.value || job?.jobResults?.[variable];
            });
        });
    });

    return outputObjectForVariables;
}
