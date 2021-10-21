import React from 'react';

import Jimp from 'jimp/es';
import RgbQuant from 'rgbquant';

function typeOf(val) {
    return Object.prototype.toString.call(val).slice(8,-1);
}

function drawPixels(idxi8, width0, width1) {
    var idxi32 = new Uint32Array(idxi8.buffer);

    width1 = width1 || width0;

    var can = document.createElement("canvas"),
        can2 = document.createElement("canvas"),
        ctx = can.getContext("2d"),
        ctx2 = can2.getContext("2d");

    can.width = width0;
    can.height = Math.ceil(idxi32.length / width0);
    can2.width = width1;
    can2.height = Math.ceil(can.height * width1 / width0);

    ctx.imageSmoothingEnabled = ctx.mozImageSmoothingEnabled = ctx.webkitImageSmoothingEnabled = ctx.msImageSmoothingEnabled = false;
    ctx2.imageSmoothingEnabled = ctx2.mozImageSmoothingEnabled = ctx2.webkitImageSmoothingEnabled = ctx2.msImageSmoothingEnabled = false;

    var imgd = ctx.createImageData(can.width, can.height);

    if (typeOf(imgd.data) == "CanvasPixelArray") {
        var data = imgd.data;
        for (var i = 0, len = data.length; i < len; ++i)
            data[i] = idxi8[i];
    }
    else {
        var buf32 = new Uint32Array(imgd.data.buffer);
        buf32.set(idxi32);
    }

    ctx.putImageData(imgd, 0, 0);

    ctx2.drawImage(can, 0, 0, can2.width, can2.height);

    return can2;
}

export default function ImageReformer(props) {
    const { imageURL, onChange } = props;

    const [rendering, setRendering] = React.useState(false);
    const [colorDepth, setColorDepth] = React.useState(8);
    const [dithKernEnabled, setDithKernEnabled] = React.useState(false);
    const [dithKern, setDithKern] = React.useState("FloydSteinberg");
    const [outHeight, setOutHeight] = React.useState(16);
    const [outWidth, setOutWidth] = React.useState(16);

    const [paletteImageURL, setPaletteImageURL] = React.useState(null);
    const [outputImageUrl, setOutputImageURL] = React.useState(null);

    const canvasRef = React.useRef(null);

    React.useEffect(async () => {
        setRendering(true);
        const image = new Image();
        image.onload = async () => {
            if (canvasRef && canvasRef.current) {
                const canvas = canvasRef.current;
                canvas.height = image.height;
                canvas.width = image.width;
                const ctx = canvas.getContext('2d');

                ctx.drawImage(image, 0, 0);

                const q = new RgbQuant({
                    colors: 2**colorDepth,
                    dithKern: dithKernEnabled ? dithKern : null,
                    palette: ((colorDepth == 1) ? [[0,0,0],[255,255,255]] : []),
                    reIndex: true
                });
                q.sample(canvas);
                const pal = q.palette();
                const paletteCanvas = drawPixels(pal, (colorDepth == 1) ? 2 : 16, (colorDepth == 1) ? 16 : 128);
                setPaletteImageURL(paletteCanvas.toDataURL());

                const reduced = q.reduce(image);
                const reducedCanvas = drawPixels(reduced, image.width);

                const reducedImage = await Jimp.read({url: reducedCanvas.toDataURL()});
                const resizedImage = await reducedImage
                    .resize(outWidth, outHeight, Jimp.RESIZE_NEAREST_NEIGHBOR);

                setOutputImageURL(await resizedImage.getBase64Async(Jimp.MIME_PNG));
                setRendering(false);

                let paletteList = [];
                let imageData = [];
                resizedImage.scan(0, 0, resizedImage.bitmap.width, resizedImage.bitmap.height, (x, y, idx) => {
                    const red = resizedImage.bitmap.data[idx];
                    const green = resizedImage.bitmap.data[idx + 1];
                    const blue = resizedImage.bitmap.data[idx + 2];

                    const rawColor = ((red << 16) | (green << 8) | blue) >>> 0; // force unsigned
                    if (!paletteList.includes(rawColor))
                        paletteList.push(rawColor);

                    const pixDataIndex = (y * resizedImage.bitmap.width) + x;

                    switch (parseInt(colorDepth,10)) {
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
                    }

                    if (x == resizedImage.bitmap.width - 1 && y == resizedImage.bitmap.height - 1 && onChange) {
                        while (paletteList.length < 2**colorDepth) {
                            paletteList.push(0);
                        }

                        onChange({
                            palette: paletteList,
                            imageData,
                            w: outWidth,
                            h: outHeight,
                            colorDepth
                        });
                        console.log(paletteList, imageData);
                    }
                });
            }
        };
        image.src = imageURL;
    }, [imageURL, colorDepth, dithKern, dithKernEnabled, outHeight, outWidth]);

    return (
        <div className="reformer">
            <label>
                Image output size:
                <input
                    type="number"
                    value={outWidth}
                    onChange={(e) => setOutWidth(parseInt(e.target.value,10))}
                    className="dimensionInput"
                />
                x
                <input
                    type="number"
                    value={outHeight}
                    onChange={(e) => setOutHeight(parseInt(e.target.value,10))}
                    className="dimensionInput"
                />
            </label>
            <label>
                Color depth:
                <select
                    value={colorDepth}
                    onChange={(e) => setColorDepth(e.target.value)}
                    className="bitdepthInput"
                >
                    <option value={1}>2 colors (1bpp)</option>
                    <option value={4}>16 colors (4bpp)</option>
                    <option value={8}>256 colors (8bpp)</option>
                </select>
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={dithKernEnabled}
                    onChange={(e) => setDithKernEnabled(e.target.checked)}
                />
                Use
                <select
                    value={dithKern}
                    onChange={(e) => setDithKern(e.target.value)}
                    disabled={!dithKernEnabled}
                    className="dithKernSelect"
                >
                    <option value="FloydSteinberg">Floyd-Steinberg</option>
                    <option value="FalseFloydSteinberg">False Floyd-Steinberg</option>
                    <option value="Stucki">Stucki</option>
                    <option value="Atkinson">Atkinson</option>
                    <option value="Jarvis">Jarvis</option>
                    <option value="Burkes">Burkes</option>
                    <option value="Sierra">Sierra</option>
                    <option value="TwoSierra">2-row Sierra</option>
                    <option value="SierraLite">Sierra Lite</option>
                </select>
                dithering
            </label>
            <p>Input image:</p>
            <div className="inputCanvasContainer">
                <canvas ref={canvasRef}>
                    <p>
                        Your browser needs to support HTML5 canvas to use this tool.
                        Please upgrade or use a different browser.
                    </p>
                </canvas>
            </div>
            { rendering ? (
                <p>Rendering...</p>
            ) : (
                <>
                    <p>Palette:</p>
                    <img src={paletteImageURL} className="paletteImage" />
                    <p>{`Reduced image (${outWidth}x${outHeight}@${colorDepth}bpp (${2**colorDepth} colors)):`}</p>
                    <a
                        href={outputImageUrl}
                        target="_blank"
                        title="Open in new tab"
                    >
                        <img src={outputImageUrl} className="outputImage" />
                    </a>
                </>
            )}
        </div>
    )
}