import React from 'react';

import hljs from 'highlight.js/lib/core';
import C from 'highlight.js/lib/languages/c';

hljs.registerLanguage('c', C);

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

export default function CodeGenerator(props) {
    const { imageMetadata } = props;

    const [prefix, setPrefix] = React.useState('tamagotchiegg');
    const [code, setCode] = React.useState('// Upload an image');
    const [highlightedCode, setHighlightedCode] = React.useState(
        hljs.highlight('// Upload an image', { language: 'c' }).value
    );
    const [codeStyle, setCodeStyle] = React.useState("knr");
    const [copied, setCopied] = React.useState(false);

    React.useEffect(async () => {
        console.log(imageMetadata);
        if (imageMetadata === null) {
            setCode('// Upload an image');
            return;
        }

        const { palette, imageData, w, h, colorDepth } = imageMetadata;

        let newCode = [
            '/** Generated with JSReformer',
            '  * https://github.com/nununoisy/JSReformer',
            '  *',
            `  * Image: ${prefix}`,
            `  * ${w}x${h}@${colorDepth}bpp (${2**colorDepth} colors)`,
            `  */`,
            '', '',
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
            ''
        ].join('\n');

        setCode(newCode);
        setHighlightedCode(hljs.highlight(newCode, { language: 'c' }).value);
    }, [imageMetadata, prefix, codeStyle]);

    React.useEffect(() => {
        if (copied) {
            const copyTimeout = setTimeout(() => setCopied(false), 5000);
            return () => clearTimeout(copyTimeout);
        }
    }, [copied]);

    return (
        <div className="codeGeneratorContainer">
            <label>
                Prefix:
                <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                />
            </label>
            <label>
                Indentation style:
                <select
                    value={codeStyle}
                    onChange={(e) => setCodeStyle(e.target.value)}
                >
                    <option value="knr">K&R (brackets on same line)</option>
                    <option value="allman">Allman (brackets on next line)</option>
                </select>
            </label>
            <button
                onClick={() => {
                    navigator.clipboard.writeText(code)
                        .then(() => setCopied(true))
                        .catch((e) => console.log("Copy failed", e));
                }}
            >
                {copied ? 'Copied!' : 'Copy to clipboard'}
            </button>
            <pre className="hljs">
                <code
                    className="language-c"
                    dangerouslySetInnerHTML={{ __html : highlightedCode }}
                />
            </pre>
        </div>
    )
}