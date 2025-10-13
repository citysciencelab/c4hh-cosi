import pdfMake from "pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import {getSvg} from "../js/getSvg";

/**
 * Class of PDFMaker. It provides methods to create a PDF with the pdfmake library.
 */
export default class PDFMaker {

    /**
     * Constructor of PDFMaker.
     * @constructor
     * @returns {PDFMaker} an PDFMaker instance.
     */
    constructor () {
        this.content = [];
        this.pageSize = "A4";
        this.pageMargins = [40, 60, 40, 60];
        this.images = {};
        this.borderColor = ["#cdcdcd", "#cdcdcd", "#cdcdcd", "#cdcdcd"];
        this.chapterHeadlineFormat = {decoration: "underline", fontSize: 14, bold: true};
        this.footerInfo = {
            author: ""
        };
    }

    /**
     * Adds the header to the report.
     * @param {String} reportTitle - The title of the report.
     */
    addHeader (reportTitle) {
        this.header = {text: reportTitle, alignment: "right", fontSize: 11, margin: [0, 20, 40, 40], color: "#646464"};
    }

    /**
     * Adds a chapter to the report.
     * @param {String} text - The name of the chapter.
     * @returns {void}
     */
    addChapter (text) {
        this.content.push({...this.chapterHeadlineFormat, text, pageBreak: "before"});
        this.content.push("\n");
    }

    /**
     * Adds a headline in the same format as a chapter headline but without the pagebreak.
     * @param {String} text - The headline text.
     * @returns {void}
     */
    addChapterHeadline (text) {
        this.content.push({...this.chapterHeadlineFormat, text});
        this.content.push("\n");
    }

    /**
     * Adds a headline to the report.
     * @param {String} text - The name of the headline.
     * @returns {void}
     */
    addHeadline (text) {
        this.content.push({text, fontSize: 11, bold: true, margin: [0, 4]});
    }

    /**
     * Adds a paragraph to the report.
     * @param {String} text - The content of the paragraph.
     * @returns {void}
     */
    addParagraph (text) {
        this.content.push({text, fontSize: 11, margin: [0, 4]});
    }

    /**
     * Adds a table to the report.
     * @param {Array[]} body - The content of a table.
     * @param {Number} width - The width of the first column.
     * @returns {void}
     */
    addTable (body, width) {
        const widths = [];

        body[0].forEach((columns, index) => {
            if (index === 0) {
                widths.push(width);
            }
            else {
                widths.push("*");
            }
        });
        this.content.push({
            table: {
                headerRows: 1,
                widths,
                body
            }
        });
        this.content.push("\n\n");
    }

    /**
     * Adds columns. Usefull for aligning items side by side.
     * @param {Object[]} columns A list of objects which each object represents a column.
     * @param {Number} columnGap The gap between the columns.
     * @returns {void}
     */
    addColumns (columns, columnGap) {
        this.content.push({columns, columnGap});
    }

    /**
     * Gets the columns by the passed names.
     * @param {String[]} columnNames - The names of the columns.
     * @returns {Object[]} The columns
     */
    getColumns (columnNames) {
        const columns = [];

        columnNames.forEach(name => {
            columns.push({text: name, alignment: "left", fontSize: 11, bold: true, borderColor: this.borderColor});
        });
        return columns;
    }

    /**
     * Adds a cell to the given row.
     * @param {String} text - The value of the cell.
     * @param {Object[]} row - The given row.
     * @returns {void}
     */
    addCell (row, text, alignment = "right") {
        row.push({text, alignment, fontSize: 11, borderColor: this.borderColor});
    }

    /**
     * Downloads the report as pdf.
     * @param {String} fileName - The name of the report file.
     * @returns {void}
     */
    download (fileName) {
        pdfMake.createPdf(this.getDocDefinition(), "", "", pdfFonts.pdfMake.vfs).download(fileName);
    }

    /**
     * Resets the report content.
     * @returns {void}
     */
    resetDocContent () {
        this.content = [];
    }

    /**
     * Adds an image to the content.
     * @param {String} imageUrl The image url.
     * @param {String} label The label of the imageUrl. Is needed to create unique links.
     * @param {Object} options An options object to adjust the image. For more info see: https://pdfmake.github.io/docs/0.1/document-definition-object/images/
     * @returns {void}
     */
    addImageByUrl (imageUrl, label, options) {
        if (typeof imageUrl === "string") {
            this.images[label] = imageUrl;
        }
        this.content.push({image: label, ...options});
    }

    /**
     * Adds an image url to the image instance of the document.
     * May be usefull to register the image before it get actually used.
     * @param {String} imageUrl The image url.
     * @param {String} label The label to use.
     * @returns {void}
     */
    addImageInstance (imageUrl, label) {
        this.images[label] = imageUrl;
    }

    /**
     * Adds a line break to the document.
     * @param {Number} count The break lines.
     * @returns {void}
     */
    addLineBreak (count = 1) {
        let breakLine = "\n";

        if (Number.isInteger(count) && count > 1) {
            for (let n = 1; n < count; n++) {
                breakLine += "\n";
            }
        }

        this.content.push(breakLine);
    }

    /**
     * Sets the author.
     * @param {string} author - The given author in form.
     * @returns {void}
     */
    setAuthor (auth) {
        this.footerInfo.author = auth;
    }

    /**
     * @private
     * Gets the docDefinition object for PDFMake.
     * @returns {Object} the docDefinition.
     */
    getDocDefinition () {
        return {
            content: this.content,
            pageSize: this.pageSize,
            pageMargins: this.pageMargins,
            images: this.images,
            header: this.header,
            footer: (currentPage, pageCount) => {
                return getSvg(currentPage, pageCount, this.footerInfo.author);
            }
        };
    }
}
