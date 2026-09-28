/**
 * cultivate.js
 * Copyright 2023-2025 Kevin N. Chen
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// node defaults
import path from 'path';
import { promises as fs } from 'fs';
import { spawn, spawnSync } from 'child_process';

// ejs templating
import ejs from 'ejs';
// get dimensions of image/videos
import imageSize from 'image-size';
import getVideoDimensions from 'get-video-dimensions';
// parse .gitignore files
import parse from 'parse-gitignore';
// fast glob matching
import micromatch from 'micromatch';
// formatting file sizes
import prettyBytes from 'pretty-bytes';
// markdown parsing 
import { marked } from 'marked';
marked.use({
    async: true,
    mangle: false,
    headerIds: false,
});


import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GARDEN_DIR = path.join(__dirname, '..')
const TEMPLATE_DIR = path.join(GARDEN_DIR, 'views');

const TEMPLATE_FILES = ['natural.ejs', 'formal.ejs'];
const COMPILED_TEMPLATES = (await Promise.all(TEMPLATE_FILES.map(async file => {
    const templatePath = path.join(TEMPLATE_DIR, file);
    const template = ejs.compile(await fs.readFile(templatePath, 'utf8'));
    return { file, template };
}))).reduce((acc, { file, template }) => {
    acc[file] = template;
    return acc;
}, {});

const GITIGNORE = parse(await fs.readFile(path.join(GARDEN_DIR, '.gitignore'), 'utf8')).patterns;
const GARDENIGNORE = parse(await fs.readFile(path.join(GARDEN_DIR, '.gardenignore'), 'utf8')).patterns;
const DS_STORE_PARSE = path.join(GARDEN_DIR, 'src', 'DS_Store-parser', 'main.py');

const TOP_PADDING_PX_FREEFORM = 50;


/**
 * Parses a given .DS_Store file into a JSON.
 * 
 * @param {string} path 
 * @returns {object}
 */
/* credit https://stackoverflow.com/a/23452742 & https://stackoverflow.com/a/58571306 */
async function parseDS_Store(path) {
    return new Promise((resolve, reject) => {
        const child = spawn('python3', [DS_STORE_PARSE, path]);
        let json = '';

        child.stdout.on('data', (data) => {
            json += data;
        });

        child.stderr.on('data', (data) => {
            reject(new Error(`stderr: ${data}`));
        });

        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Process exited with code ${code}`));
                return;
            }
            try {
                resolve(JSON.parse(json));
            } catch (error) {
                reject(error);
            }
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}


/**
 * Calculates the relative luminance L as defined by WVAG 2.0.
 * 
 * See https://www.w3.org/TR/WCAG20/#relativeluminancedef
 * 
 * @param {number} R8bit 
 * @param {number} G8bit 
 * @param {number} B8bit 
 * @returns {number}
 */
function calculateRelativeLuminance(R8bit, G8bit, B8bit) {
    const RsRGB = R8bit / 255;
    const GsRGB = G8bit / 255;
    const BsRGB = B8bit / 255;
    const R = RsRGB <= 0.03928 ? RsRGB / 12.92 : Math.pow((RsRGB + 0.055) / 1.055, 2.4);
    const G = GsRGB <= 0.03928 ? GsRGB / 12.92 : Math.pow((GsRGB + 0.055) / 1.055, 2.4);
    const B = BsRGB <= 0.03928 ? BsRGB / 12.92 : Math.pow((BsRGB + 0.055) / 1.055, 2.4);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

async function cultivateDirectory(fileName, dirDS_Store, currPath, relativePath, depth) {
    // recurse! also, cultivate() returns directory length
    const fileCount = await cultivate(
        currPath,
        path.join(relativePath, fileName),
        fileName,
        (dirDS_Store && fileName in dirDS_Store) ? dirDS_Store[fileName]['icvp'] : null,
        depth - 1
    );

    return {
        path: fileName + '/',
        name: fileName + '/',
        type: 'directory',
        contents: (fileCount === 0) ? 'empty' : `${fileCount} item` + ((fileCount > 1) ? 's' : ''),
    };
}

async function cultivateFile(fileName, currPath) {
    let filePath = path.join(currPath, fileName);
    const stats = await fs.stat(filePath);
    const fileInfo = {
        path: fileName,
        name: fileName,
        size: prettyBytes(stats.size, { space: false }),
    };

    const fileExt = fileName.includes('.') ? fileName.split('.').reverse()[0] : '';
    switch (fileExt.toLowerCase()) {
        // image
        case 'jpeg':
        case 'jpg':
        case 'png':
        case 'webp':
        case 'gif':
        case 'apng':
        case 'svg':
        case 'bmp':
        case 'ico':
            fileInfo.type = 'image';
            try {
                let dimensions = imageSize(filePath);
                fileInfo.width = dimensions.width;
                fileInfo.height = dimensions.height;

                // exif quirks with jpeg orientation info
                if (dimensions.orientation == 6 || dimensions.orientation == 8) {
                    [fileInfo.width, fileInfo.height] = [fileInfo.height, fileInfo.width];
                }
            } catch (err) {
                console.log('Error reading image:', filePath);
                console.log(err);
            }
            break;

        // video
        case 'mp4':
        case 'webm':
            fileInfo.type = 'video';
            try {
                let dimensions = await getVideoDimensions(filePath);
                fileInfo.width = dimensions.width;
                fileInfo.height = dimensions.height;
            } catch (err) {
                console.log('Error reading video:', filePath);
                console.log(err);
            }
            break;

        // audio
        case 'mp3':
        case 'wav':
        case 'ogg':
        case 'm4a':
            fileInfo.type = 'audio';
            break;

        // markdown
        case 'md':
            fileInfo.type = 'markdown';
            try {
                const contents = await fs.readFile(filePath, 'utf8');
                fileInfo.contents = await marked.parse(contents);
            } catch (err) {
                console.log('Error reading file:', filePath);
                console.log(err);
            }
            break;

        // raw if no extension
        case '':
            // skip 'LICENSE' files
            if (fileInfo.name === 'LICENSE') {
                fileInfo.type = 'other';
                break;
            }
            fileInfo.type = 'raw';
            try {
                fileInfo.contents = await fs.readFile(filePath, 'utf8');
            } catch (err) {
                console.log('Error reading file:', filePath);
                console.log(err);
            }
            break;

        // don't render text files
        case 'txt':
        // other
        default:
            fileInfo.type = 'other';
    }

    return fileInfo;
}


/**
 * :house_with_garden:
 */
async function cultivate(rootPath, relativePath = '.', currDir = '', icvp = null, depth = 3) {
    if (depth < 0) {
        return 0;
    }

    const dirData = {
        title: (relativePath != '.' ? relativePath + '/' : ''),
    };

    let renderFreeform = false;

    if (icvp) {
        renderFreeform = icvp['arrangeBy'] === 'none' || icvp['arrangeBy'] === 'grid';

        // according to wcag 2.0 both background color and text color must be specified together
        if (icvp['bgType'] == 1) { // type = 0 : Default, 1: Color, 2: Image
            dirData.backgroundColor = `rgb(${icvp['bgR']}, ${icvp['bgG']}, ${icvp['bgB']})`;
            // pick white or black text color based on contrast w/ background color
            if (calculateRelativeLuminance(icvp['bgR'], icvp['bgG'], icvp['bgB']) <= 0.1791) {
                dirData.textColor = 'white';
            } else {
                dirData.textColor = 'black';
            }
        }
    }

    const currPath = path.join(rootPath, currDir);
    const allFileEntries = await fs.readdir(currPath, { withFileTypes: true });

    // parse .DS_Store
    let dirDS_Store = null;
    if (allFileEntries.some(entry => entry.name === '.DS_Store')) {
        dirDS_Store = await parseDS_Store(path.join(currPath, '.DS_Store'));
        if (dirDS_Store === null) {
            renderFreeform = false;
        }
        // console.debug(dirDS_Store);
    }

    // split into filtered directories and files
    const directoriesToProcess = [];
    const filesToProcess = [];
    for (const fileEntry of allFileEntries) {
        const fileName = fileEntry.name;
        if (fileEntry.isDirectory()) {
            if (micromatch.isMatch(fileName, GITIGNORE) ||
                micromatch.isMatch(fileName, GARDENIGNORE) ||
                micromatch.isMatch(fileName + '/', GITIGNORE) ||
                micromatch.isMatch(fileName + '/', GARDENIGNORE)) {
                continue;
            }
            directoriesToProcess.push(fileName);
        } else if (fileEntry.isFile()) {
            if (micromatch.isMatch(fileName, GITIGNORE) ||
                micromatch.isMatch(fileName, GARDENIGNORE)) {
                continue;
            }
            filesToProcess.push(fileName);
        }
    }

    // process them all asynchronously
    let processedFiles = await Promise.all([
        ...directoriesToProcess.map(async directoryName => {
            const fileInfo = await cultivateDirectory(
                directoryName, dirDS_Store, currPath, relativePath, depth
            );
            if (renderFreeform && dirDS_Store && directoryName in dirDS_Store && 'Iloc' in dirDS_Store[directoryName]) {
                fileInfo.location = dirDS_Store[directoryName].Iloc;
            }
            return fileInfo;
        }),
        ...filesToProcess.map(async fileName => {
            const fileInfo = await cultivateFile(fileName, currPath);
            if (renderFreeform && dirDS_Store && fileName in dirDS_Store && 'Iloc' in dirDS_Store[fileName]) {
                fileInfo.location = dirDS_Store[fileName].Iloc;
            }
            return fileInfo;
        })
    ]);
    processedFiles.sort((a, b) => a.name.localeCompare(b.name));
    dirData.files = processedFiles;

    if (renderFreeform && !dirData.files.every(fileInfo => 'location' in fileInfo)) {
        renderFreeform = false;
    }
    const processedFileCount = dirData.files.length;

    // if freeform, do a hack to kinda "center" the contents
    if (renderFreeform) {
        // normalize locations
        const locationsX = dirData.files.map((fileInfo) => fileInfo.location.x);
        const locationsY = dirData.files.map((fileInfo) => fileInfo.location.y);
        const minLocationX = Math.min(...locationsX);
        const maxLocationX = Math.max(...locationsX);
        const minLocationY = Math.min(...locationsY);
        // const maxLocationY = Math.max(...locationsY);
        for (const fileInfo of dirData.files) {
            fileInfo.location.x -= minLocationX;
            fileInfo.location.y -= minLocationY;
            fileInfo.location.y += TOP_PADDING_PX_FREEFORM;
        }
        dirData.centerOffset = (maxLocationX - minLocationX) / 2.0;
    }

    // generate html file from associated template
    const html = COMPILED_TEMPLATES[renderFreeform ? 'natural.ejs' : 'formal.ejs'](dirData);
    const outputPath = path.join(currPath, 'index.html');

    // plant html file
    if (processedFileCount > 0) {
        try {
            console.log('Read', processedFileCount, 'of', allFileEntries.length, 'files from', relativePath);
            await fs.writeFile(outputPath, html);
            console.log('\tPlanted', path.join(relativePath, 'index.html'), `(${renderFreeform ? 'natural' : 'formal'})`);
        } catch (err) {
            console.log(`Could not plant ${outputPath}, skipping. Error:\n\t${err}`);
        }
    }

    return processedFileCount;
}

/**
 * :toolbox:
 */
async function cultivateHelper(root) {
    // check if directory provided is valid
    const stats = await fs.stat(root);
    if (!stats.isDirectory()) {
        console.error(`invalid directory ${root}`);
    }
    const dirname = path.basename(root);

    // try reading the .DS_Store of the previous directory as it contains
    // information about the current directory
    let icvp = null;
    try {
        await fs.access(path.join(root, '..', '.DS_Store'), fs.constants.R_OK);
        const dirDS_Store = await parseDS_Store(path.join(root, '..', '.DS_Store'));
        icvp = dirDS_Store[dirname]['icvp'] ?? null;
    } catch { }

    // plant
    await cultivate(root, '.', '', icvp);
}


const usage = 'how do we turn a directory into a garden?\n' +
    'usage:      node cultivate.js DIR\n' +
    'options:    -h, --help       print help';

if (process.argv.includes('-h') || process.argv.includes('--help')) {
    console.log(usage);
} else if (process.argv.length == 3) {
    try {
        // try getting the path the user provided
        const resolvedPath = await fs.realpath(process.argv[2]);
        await cultivateHelper(resolvedPath);
    } catch (err) {
        console.error(`invalid directory ${process.argv[2]}`);
        console.error(err);
    }
} else {
    console.log(usage);
}
