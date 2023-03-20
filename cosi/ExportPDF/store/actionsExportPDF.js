import pdfMake from "pdfmake";
<<<<<<< HEAD
import addChapter from "../utils/addChapter";
=======
/**
 *
 * @param {*} context is just a vuex action context
 * @param {*} docDefinition a document definition as as expected by pdfmake package
 * @returns {void}
 */
function downloadPDF (context, docDefinition) {

    pdfMake.createPdf(docDefinition).download("Report.pdf");

}
>>>>>>> cbf2be88 (add new addons_3_0_0 structure-add missing addons)

/**
 *
 *  This function converts data from reportTemplates to pdf
<<<<<<< HEAD
 * @param {Object} _ vuex context
 * @param {Object} chapters reportTempate addon's templateItems definition as payload
 * @returns {void}
 *
 */
function reportTemplateToPDF (_, chapters) {
    let docDefinition = {
=======
 *
 * @param {*} context vuex context
 * @param {*} chapters reportTempate addon's templateItems definition
 * @returns {void}
 *
 */
function reportTemplateToPDF (context, chapters) {

    const docDefinition = {
>>>>>>> cbf2be88 (add new addons_3_0_0 structure-add missing addons)
        content: [],
        pageOrientation: "landscape",
        pageSize: "A4"
    };

<<<<<<< HEAD
    for (const chapter of chapters) {
        docDefinition = addChapter(chapter, docDefinition);
    }

=======
    /**
     * @param {array} chapter is part that gets added to chapters after each iteration through the json array
     * @return {array} the function returns value of chapter
     */
    function addChapter (chapter) {
        // title, desc, tool, settings are attributes of json file of ReportTemplate with optional styles
        const title = {text: chapter.title, style: "header", bold: true, fontSize: 14},
            desc = {text: chapter.description, style: "header"},
            tool = {text: chapter.tool, style: "header"};
        let sourceInfo = "Quelleninformation fehlt.";

        if (chapter.output.sourceInfo) {

            sourceInfo = Object.values(chapter.output.sourceInfo).map((metadata)=>{

                const metadata_no_html_p_tags = metadata;

                // remove html tags
                metadata_no_html_p_tags.Abstrakt = metadata.Abstrakt.replace(/<p>/g, "\n").replace(/<\/p>/g, "\n");
                return Object.values(metadata_no_html_p_tags).map((info, index)=>{
                    return Object.keys(metadata_no_html_p_tags)[index] + ": " + info;
                });
            });
            sourceInfo = sourceInfo.map(x=>{ // add line breaks between sources
                return [x, "\n"];
            });


        }

        docDefinition.content.push(title);
        docDefinition.content.push("\n"); // add line break
        docDefinition.content.push(desc);
        docDefinition.content.push("\n"); // add line break
        docDefinition.content.push(tool);
        docDefinition.content.push("\n"); // add line break
        // docDefinition.content.push(settings);

        // if the property type is table, then we return the array of headers and body. Headers are for the table headers and body is set of values

        if (chapter.output.type === "table") {
            // let headers = [],
            // body = [];
            const headers = Object.keys(chapter.output.result[0]).map(header => ({
                    border: [false, false, false, true],
                    fillColor: "#dddddd",
                    text: header
                })),

                body = chapter.output.result.map(row => Object.values(row));

            docDefinition.content.push({
                table: {
                    headerRows: 1,
                    body: [headers, ...body]
                },
                fontSize: 8,
                pageBreak: "after"
            });


        }

        // if the property type is image, we put the image into content of docDefinition

        if (chapter.output.type === "image") {

            docDefinition.content.push({
                image: chapter.output.result,
                width: 500,
                pageBreak: "after"
            });
        }

        docDefinition.content.push("\n"); // add line break
        docDefinition.content.push("\n"); // add line break
        docDefinition.content.push("Datenquellen:\n\n", sourceInfo);
    }

    chapters.forEach(addChapter);
>>>>>>> cbf2be88 (add new addons_3_0_0 structure-add missing addons)
    // Here we call the pdfMake function to render pdf from the docDefinition
    pdfMake.createPdf(docDefinition).download("ReportTemplate.pdf");
}


export default {
<<<<<<< HEAD
=======
    downloadPDF,
>>>>>>> cbf2be88 (add new addons_3_0_0 structure-add missing addons)
    reportTemplateToPDF

};
