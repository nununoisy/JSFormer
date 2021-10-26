import React from 'react';

import * as Comlink from 'comlink';
// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from 'worker-loader!./Worker';
import PaletteGrid from "./PaletteGrid";

export default function ImageReformer(props) {
    const { imageURL, onChange } = props;

    const [rendering, setRendering] = React.useState(false);
    const [colorDepth, setColorDepth] = React.useState(8);
    const [dithKernEnabled, setDithKernEnabled] = React.useState(false);
    const [dithKern, setDithKern] = React.useState("FloydSteinberg");
    const [outHeight, setOutHeight] = React.useState(16);
    const [outWidth, setOutWidth] = React.useState(16);

    const [palette, setPalette] = React.useState([]);
    const [outputImageUrl, setOutputImageURL] = React.useState(null);

    const canvasRef = React.useRef(null);

    React.useEffect(() => {
        setRendering(true);

        const worker = new Worker();
        const { ReformImage } = Comlink.wrap(worker);

        const image = new Image();
        image.onload = async () => {
            if (canvasRef && canvasRef.current) {
                const canvas = canvasRef.current;
                canvas.height = image.height;
                canvas.width = image.width;
                const ctx = canvas.getContext('2d');

                ctx.drawImage(image, 0, 0);

                const {
                    palette,
                    outputImageDataURL,
                    paletteList,
                    imageData
                } = await ReformImage(
                    ctx.getImageData(0, 0, image.width, image.height),
                    parseInt(colorDepth, 10),
                    dithKernEnabled ? dithKern : null,
                    outHeight,
                    outWidth
                );

                setPalette(palette);
                setOutputImageURL(outputImageDataURL);

                if (onChange) {
                    onChange({
                        palette: paletteList,
                        imageData,
                        w: outWidth,
                        h: outHeight,
                        colorDepth
                    });
                }

                setRendering(false);
            }
        };
        image.src = imageURL;

        return () => {
            worker.terminate();
        }
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
                    <PaletteGrid palette={palette} />
                    <p>{`Reduced image (${outWidth}x${outHeight}@${colorDepth}bpp (${2**colorDepth} colors)):`}</p>
                    <a
                        href={outputImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Open in new tab"
                    >
                        <img
                            src={outputImageUrl}
                            className="outputImage"
                            alt="Output"
                        />
                    </a>
                </>
            )}
        </div>
    )
}