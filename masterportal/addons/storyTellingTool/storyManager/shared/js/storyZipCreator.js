import {strFromU8, strToU8, unzip, zip} from "fflate/browser";

/**
 * Creates a zip file containing a story JSON and associated images.
 * @param {Object} storyJson - The story data as a JSON object
 * @param {Object} imageAssetsById - Mapping of image IDs to image assets ({ blob, objectURL, mimeType, originalName, archivePath })
 * @returns {Promise<Blob>} A promise that resolves to a Blob containing the zip file
 */
export async function createStoryZip (storyJson, imageAssetsById) {
    const imageAssetsMetadataById = Object.fromEntries(
            Object.entries(imageAssetsById).map(([imageId, imageAsset]) => [imageId, {
                mimeType: imageAsset.mimeType,
                originalName: imageAsset.originalName,
                archivePath: imageAsset.archivePath
            }])
        ),
        files = {
            "story.json": strToU8(JSON.stringify(storyJson)),
            "imageAssetsById.json": strToU8(JSON.stringify(imageAssetsMetadataById))
        };

    for (const asset of Object.values(imageAssetsById)) {
        const arrayBuffer = await asset.blob.arrayBuffer();

        files[asset.archivePath] = new Uint8Array(arrayBuffer);
    }

    return new Promise((resolve, reject) => {
        zip(files, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(new Blob([data], {type: "application/zip"}));
            }
        });
    });
}

/**
 * Extracts a story JSON and associated image assets from a zip file.
 * @param {Blob} zipBlob - The zip file as a Blob.
 * @returns {Promise<{storyJson: Object, imageAssetsById: Object}>} The extracted story JSON and image assets mapping.
 */
export async function extractStoryZip (zipBlob) {
    const zipArray = new Uint8Array(await zipBlob.arrayBuffer());

    return new Promise((resolve, reject) => {
        unzip(zipArray, (err, files) => {
            if (err) {
                reject(err);
                return;
            }

            const storyFile = files["story.json"];

            if (!storyFile) {
                reject(new Error("Zip archive does not contain story.json."));
                return;
            }

            const imageAssetsFile = files["imageAssetsById.json"];

            if (!imageAssetsFile) {
                reject(new Error("Zip archive does not contain imageAssetsById.json."));
                return;
            }

            const parsedStoryJson = JSON.parse(strFromU8(storyFile)),
                imageAssetsById = JSON.parse(strFromU8(imageAssetsFile)),
                storyJson = {...parsedStoryJson},
                extractedImageAssetsById = {};

            Object.entries(imageAssetsById).forEach(([imageId, imageAsset]) => {
                const fileContent = files[imageAsset.archivePath];

                if (!fileContent) {
                    return;
                }

                const blob = new Blob([fileContent], {
                    type: imageAsset.mimeType
                });

                extractedImageAssetsById[imageId] = {
                    ...imageAsset,
                    blob,
                    objectURL: URL.createObjectURL(blob)
                };
            });

            resolve({storyJson, imageAssetsById: extractedImageAssetsById});
        });
    });
}
