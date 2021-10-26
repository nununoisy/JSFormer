import * as Comlink from 'comlink';

import Jimp from 'jimp/es';
import RgbQuant from 'rgbquant';

import hljs from 'highlight.js/lib/core';
import C from 'highlight.js/lib/languages/c';

hljs.registerLanguage('c', C);

/**
 * @typedef {
 * null |
 * 'FloydSteinberg' |
 * 'FalseFloydSteinberg' |
 * 'Stucki' |
 * 'Atkinson' |
 * 'Jarvis' |
 * 'Burkes' |
 * 'Sierra' |
 * 'TwoSierra' |
 * 'SierraLite'
 * } DithKern
 */

/**
 * Reform an image.
 * @param image {ImageData} - Input image
 * @param colorDepth {number} - Color depth in bits per pixel (log2 of color count)
 * @param dithKern {DithKern} - Dithering kernel to use
 * @param outHeight {number} - Output image height
 * @param outWidth {number} - Output image width
 * @constructor
 */
const ReformImage = async (image, colorDepth, dithKern, outHeight, outWidth) => {
    const q = new RgbQuant({
        colors: 2**colorDepth,
        dithKern,
        palette: ((colorDepth === 1) ? [[0,0,0],[255,255,255]] : []),
        reIndex: true
    });
    q.sample(image);

    const paletteBuffer = q.palette();
    const palette = [];

    for (let i = 0; i < paletteBuffer.length; i+=4) {
        palette.push(
            Number(paletteBuffer[i]).toString(16).padStart(2,'0') +
            Number(paletteBuffer[i + 1]).toString(16).padStart(2,'0') +
            Number(paletteBuffer[i + 2]).toString(16).padStart(2,'0')
        )
    }

    const reducedBuffer = q.reduce(image);
    const reducedClampedBuffer = new Uint8ClampedArray(reducedBuffer.buffer);
    const rawReducedImage = new ImageData(reducedClampedBuffer, image.width, image.height);
    const reducedImage = await Jimp.read(rawReducedImage);
    const resizedImage = await reducedImage.resize(outWidth, outHeight, Jimp.RESIZE_NEAREST_NEIGHBOR);

    const outputImageDataURL = await resizedImage.getBase64Async(Jimp.MIME_PNG);

    const { paletteList, imageData } = await new Promise((resolve) => {
        const paletteList = [];
        const imageData = [];
        resizedImage.scan(0, 0, resizedImage.bitmap.width, resizedImage.bitmap.height, (x, y, idx) => {
            const red = resizedImage.bitmap.data[idx];
            const green = resizedImage.bitmap.data[idx + 1];
            const blue = resizedImage.bitmap.data[idx + 2];

            const rawColor = ((red << 16) | (green << 8) | blue) >>> 0; // force unsigned
            if (!paletteList.includes(rawColor))
                paletteList.push(rawColor);

            const pixDataIndex = (y * resizedImage.bitmap.width) + x;

            switch (colorDepth) {
                case 1:
                    if ((pixDataIndex % 8) === 0) {
                        imageData.push(paletteList.indexOf(rawColor) << 7)
                    } else {
                        imageData[imageData.length - 1] |= paletteList.indexOf(rawColor) << (7 - (pixDataIndex % 8));
                    }
                    break;
                case 4:
                    if ((pixDataIndex % 2) === 0) {
                        imageData.push(paletteList.indexOf(rawColor) << 4);
                    } else {
                        imageData[imageData.length - 1] |= paletteList.indexOf(rawColor);
                    }
                    break;
                case 8:
                    imageData.push(paletteList.indexOf(rawColor));
                    break;
                default:
                    throw new Error(`Unexpected color depth ${colorDepth}`);
            }

            if (x === resizedImage.bitmap.width - 1 && y === resizedImage.bitmap.height - 1) {
                while (paletteList.length < 2 ** colorDepth) {
                    paletteList.push(0);
                }

                resolve({ paletteList, imageData });
            }
        });
    });

    return {
        palette,
        outputImageDataURL,
        paletteList,
        imageData
    };
}

const generateHexArray = (array, hexLength, cols) => {
    let result = '    ';
    for (let i = 0; i < array.length; ++i) {
        const value = array[i];

        result += '0x' + Number(value).toString(16).padStart(hexLength, '0') + ',';
        if ((i + 1) % cols === 0) {
            result += '\n    ';
        }
    }

    return result.replace(/\n {4}$/,'').replace(/,$/,'');
}

const GenerateCode = async (imageMetadata, prefix, codeStyle) => {
    if (!imageMetadata) {
        return {
            code: '// Upload an image',
            highlightedCode: hljs.highlight('// Upload an image', { language: 'c' }).value
        }
    }

    const { palette, imageData, w, h, colorDepth } = imageMetadata;

    let code = [
        '/** Generated with JSFormer',
        '  * https://github.com/nununoisy/JSFormer',
        '  *',
        `  * Image name: ${prefix}`,
        `  * ${w}x${h}@${colorDepth}bpp (${2**colorDepth} colors)`,
        `  */`,
        '',
        '#include <ti/grlib/grlib.h>',
        '// Change this include as needed if it doesn\'t work',
        '',
        `static const uint8_t pixel_${prefix}${colorDepth}BPP_UNCOMP[] =${codeStyle === 'allman' ? '\n': ' '}{`,
        generateHexArray(imageData, 2, 8),
        '};',
        '',
        `static const uint32_t palette_${prefix}${colorDepth}BPP_UNCOMP[] =${codeStyle === 'allman' ? '\n': ' '}{`,
        generateHexArray(palette, 6, 4),
        '};',
        '',
        `const Graphics_Image ${prefix}${colorDepth}BPP_UNCOMP =${codeStyle === 'allman' ? '\n': ' '}{`,
        `    IMAGE_FMT_${colorDepth}BPP_UNCOMP,`,
        `    ${w},`,
        `    ${h},`,
        `    ${2**colorDepth},`,
        `    palette_${prefix}${colorDepth}BPP_UNCOMP,`,
        `    pixel_${prefix}${colorDepth}BPP_UNCOMP`,
        '};',
        '',
        `// extern const Graphics_Image ${prefix}${colorDepth}BPP_UNCOMP;`,
        '// Use the above line in the source file where you reference the image.'
    ].join('\n');

    return {
        code,
        highlightedCode: hljs.highlight(code, { language: 'c' }).value
    }
}

Comlink.expose({ ReformImage, GenerateCode });