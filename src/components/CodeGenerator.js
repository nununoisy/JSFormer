import React from 'react';

import * as Comlink from 'comlink';
// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from 'worker-loader!./Worker';

import hljs from 'highlight.js/lib/core';
import C from 'highlight.js/lib/languages/c';

hljs.registerLanguage('c', C);

export default function CodeGenerator(props) {
    const { imageMetadata } = props;

    const [generating, setGenerating] = React.useState(false);
    const [prefix, setPrefix] = React.useState('image');
    const [code, setCode] = React.useState('// Upload an image');
    const [highlightedCode, setHighlightedCode] = React.useState(
        hljs.highlight('// Upload an image', { language: 'c' }).value
    );
    const [codeStyle, setCodeStyle] = React.useState("knr");
    const [copied, setCopied] = React.useState(false);

    React.useEffect(() => {
        setGenerating(true);

        const worker = new Worker();
        const { GenerateCode } = Comlink.wrap(worker);

        GenerateCode(imageMetadata, prefix, codeStyle).then(({code, highlightedCode}) => {
            setCode(code);
            setHighlightedCode(highlightedCode);
            setGenerating(false);
        });

        return () => {
            worker.terminate();
        }
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
            { generating ? (
                <p>Generating...</p>
            ) : (
                <>
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
                </>
            )}
        </div>
    )
}