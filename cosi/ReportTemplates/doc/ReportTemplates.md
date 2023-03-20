**ReportTemplates**

## What ReportTemplates does

ReportTemplates lets you store analysis settings in a structured Document format. You can then repeat them later and export them as a PDF.

## Usage

### Create a Template

1. Select the districts and Datalayers you are interested in.
2. Add a title and a description for an analysis, and select the tool you want to use (i.e. Accessibility Analysis, Dashboard,..)
3. Open that tool and enter all the settings as you want them.
4. Go back to the reportTemplates addon. Click the "refresh" button. The tool settings are now stored in the template.
5. Click the "play" button. The tool is now run, and the results are copied into the template
6. Click the "+" at the bottom to add another chapter and repeat setps 2-5
7. Delete chapters with the trash bin icon
7. Then you can either download the template as a JSON to use later, or export a PDF document.

### Use an existing template

1. Upload the file through the "reportvorlage importieren" field
2. Select the relevant Areas (DistrictSelector) and data layers ("Themen")
3. Go through the chapters and click the "play" button to run each tool according to the given template


### Developers

So far, each report Template is an array stored in `templateItems`, each item makes a chapter. Each chapter is an object with these fields:

1. `title`
2. `description`
3. `toolName` - the name of the tool used for analysis
4. `settings` - the settings used to analyse the tool, as given/accepted by toolBridge `currentSettings()` `runTool()`
5. `output` - the tools results
5.1. `output.type` either "table" or "image" - the two output types currently supported
5.2. `output.result` either the table data as a js object, or the image as a dataURL
5.3. `output.request` the complete request originally made to the toolBridge addon, composed from `toolName` and `settings`

The code is basically just..
- upload and download `templateItems` as json
- display each item with v-for (supporting tables and images as output)
- fetch settings from tools via toolbridge (refresh icon)
- run tool via toolBridge and copy results to `templateItems`
- delete/add chapters (`templateItem` array items) 


### Todos
- hook up with selectionManager, so a data selection can be stored with each chapter
- hook up with ExportPDF
