import pdfMake from "pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import {getSvg} from "../js/getSvg";
pdfMake.addVirtualFileSystem(pdfFonts);
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
        this.chapterHeadlineFormat = {fontSize: 12, bold: true};
        this.footerInfo = {
            author: ""
        };
    }

    /**
     * Adds the main heading to the report.
     * @param {String} text - The name of the main headline.
     * @returns {void}
     */
    addMainHeading (text) {
        this.content.push({text, fontSize: 18, bold: true, margin: [0, 4], color: "#151C27"});
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
     * @param {String|Object} text - The name of the chapter or the name and page orientation of the chapter.
     * @returns {void}
     */
    addChapter (text) {
        if (typeof text === "string") {
            this.content.push({...this.chapterHeadlineFormat, text});
        }
        else {
            this.content.push({...this.chapterHeadlineFormat, ...text});
        }
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
     * Adds a section headline to the report.
     * @param {String} text - The name of the headline.
     * @param {Object} options An options object to adjust the text.
     * @returns {void}
     */
    addSectionHeadline (text, options = {}) {
        this.content.push({text, fontSize: 14, bold: true, margin: [0, 6], ...options});
    }

    /**
     * Creates a headline definition for pdfmake without adding it to the document content.
     * @param {String} text - The name of the headline.
     * @returns {Object} A pdfmake text definition representing the headline.
     */
    getHeadline (text) {
        return {
            text,
            fontSize: 11,
            color: "#3C5F94",
            bold: true,
            margin: [0, 2]
        };
    }

    /**
     * Adds a sub headline to the report.
     * @param {String} text - The name of the sub headline.
     * @returns {void}
     */
    addSubHeadline (text) {
        this.content.push({text, fontSize: 10, bold: true, margin: [0, 3, 4, 0], color: "#3C5F94"});
    }

    /**
     * Adds a paragraph to the report.
     * @param {String} text - The content of the paragraph.
     * @param {Object[]} [coloredParts = []] - Text parts that should be colored.
     * @returns {void}
     */
    addParagraph (text, coloredParts = []) {
        let contentText;

        if (!Array.isArray(coloredParts) || coloredParts.length === 0) {
            contentText = text;
        }
        else {
            let remainingText = text;
            const textArray = [];

            coloredParts.forEach(val => {
                const index = remainingText.indexOf(val.text);

                if (index !== -1) {
                    if (index > 0) {
                        textArray.push({
                            text: remainingText.substring(0, index)
                        });
                    }
                    textArray.push({
                        text: val.text,
                        color: val.color || "#000000",
                        bold: val.bold || false
                    });
                    remainingText = remainingText.substring(index + val.text.length);
                }
            });

            if (remainingText) {
                textArray.push({text: remainingText});
            }

            contentText = textArray;
        }

        this.content.push({
            text: contentText,
            fontSize: 11,
            margin: [0, 4],
            pageOrientation: "portrait"
        });
    }

    /**
     * Adds bulletpoints to the report.
     * @param {String|Object} text - The text.
     * @returns {void}
     */
    addBulletPoints (text) {
        const items = Array.isArray(text) ? text : [text],

            bulletList = {
                ul: items.map(item => ({text: item, fontSize: 10})),
                margin: [0, 5, 0, 5]
            };

        this.content.push(bulletList);
    }

    /**
     * Adds a table to the report.
     * @param {Array[]} body - The content of a table.
     * @param {Number} firstColumnWidth - The width of the first column.
     * @param {String} [oddRowColor="#f5f5f5"] - Background color for odd (1,3,5...) rows.
     * @param {String} [evenRowColor="#ffffff"] - Background color for even (2,4,6...) rows.
     * @param {String} [headerFillColor="#3C5F94"] - Background color for header.
     * @returns {void}
     */
    addTable (body, firstColumnWidth, oddRowColor = "#f5f5f5", evenRowColor = "#ffffff", headerFillColor = "#3C5F94") {
        if (!Array.isArray(body) || body.length === 0) {
            return;
        }

        const widths = [],
            tableBody = body.map((row, rowIndex) => {
                return row.map((cell, colIndex) => {
                    const isHeader = rowIndex === 0,
                        cellObj = typeof cell === "object" ? {...cell} : {text: cell, fontSize: 11};

                    cellObj.unbreakable = true;

                    if (isHeader) {
                        widths[colIndex] = colIndex === 0 ? firstColumnWidth : "auto";
                    }

                    if (isHeader) {
                        cellObj.fillColor = headerFillColor;
                        cellObj.bold = true;
                        cellObj.color = "#ffffff";
                        cellObj.margin = [2, 2, 0, 2];
                    }
                    else {
                        cellObj.fillColor = rowIndex % 2 === 0 ? evenRowColor : oddRowColor;
                    }

                    cellObj.borderColor = this.borderColor;
                    cellObj.lineHeight = 1.1;

                    return cellObj;
                });
            });

        this.content.push({
            table: {
                headerRows: 1,
                widths,
                body: tableBody
            },
            layout: {
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => this.borderColor,
                vLineColor: () => this.borderColor,
                paddingLeft: () => 4,
                paddingRight: () => 4,
                paddingTop: () => 2,
                paddingBottom: () => 2
            }
        });
        this.content.push("\n");
    }

    /**
     * Adds columns. Usefull for aligning items side by side.
     * @param {Object[]} columns A list of objects which each object represents a column.
     * @param {Number} columnGap The gap between the columns.
     * @returns {void}
     */
    addColumns (columns, columnGap) {
        this.content.push({columns, columnGap, margin: [0, 0, 19, 0]});
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
        pdfMake.createPdf(this.getDocDefinition(), "", "").download(fileName);
    }

    /**
     * Resets the report content.
     * @returns {void}
     */
    resetDocContent () {
        this.content = [];
    }

    /**
     * Adds an empty legend page at the end of the report.
     * @returns {void}
     */
    addLegendPage () {
        this.addChapter({text: "Legende"});
        this.addLineBreak();
    }

    /**
     * Adds an image to the content.
     * @param {String} imageUrl The image url.
     * @param {String} label The label of the imageUrl. Is needed to create unique links.
     * @param {Object} options An options object to adjust the image. For more info see: https://pdfmake.github.io/docs/0.1/document-definition-object/images/
     * @param {String} [title = null] Optional title for the image. Image and title always appear together on a site.
     * @param {String} [showBorder = true] Optional border around the image.
     * @returns {void}
     */
    addImageByUrl (imageUrl, label, options, title = null, showBorder = true) {
        if (typeof imageUrl === "string") {
            this.images[label] = imageUrl;
        }

        const block = [];

        if (title) {
            block.push({
                text: title,
                fontSize: 12,
                bold: true,
                margin: [0, 0, 0, 5]
            });
        }

        block.push({
            table: {
                body: [[
                    {image: label, ...options}
                ]]
            },
            layout: showBorder ? {
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => "#868686",
                vLineColor: () => "#868686",
                paddingLeft: () => 0,
                paddingRight: () => 0,
                paddingTop: () => 0,
                paddingBottom: () => 0
            } : {
                hLineWidth: () => 0,
                vLineWidth: () => 0,
                paddingLeft: () => 0,
                paddingRight: () => 0,
                paddingTop: () => 0,
                paddingBottom: () => 0
            }
        });

        this.content.push({
            unbreakable: true,
            stack: block
        });
    }

    /**
     * Creates a colored box.
     * @param {Object} body A body object.
     */
    addBoxLayout (body) {
        const box = {
            table: {
                widths: Array(body[0].length).fill("*"),
                body
            },
            layout: {
                fillColor: () => "#EDF3FF",
                hLineWidth: () => 0,
                vLineWidth: () => 0,
                paddingLeft: () => 8,
                paddingRight: () => 8,
                paddingTop: () => 8,
                paddingBottom: () => 8
            },
            margin: [0, 10, 0, 10]
        };

        this.content.push(box);
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
            footer: (currentPage, pageCount, headlines) => {
                return getSvg(currentPage, pageCount, this.footerInfo.author, headlines.orientation);
            }
        };
    }
}
