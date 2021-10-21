import React from 'react';

import ImageUpload from "./components/ImageUpload";
import ImageReformer from "./components/ImageReformer";
import CodeGenerator from "./components/CodeGenerator";

function App() {
    const [imageURL, setImageURL] = React.useState(null);

    const [imageMetadata, setImageMetadata] = React.useState(null);

    return (
        <div className="columns">
            <div>
                <ImageUpload onChange={(url) => setImageURL(url)} />
            </div>
            <div>
                <ImageReformer
                    imageURL={imageURL}
                    onChange={(d) => setImageMetadata(d)}
                />
            </div>
            <div>
                <CodeGenerator
                    imageMetadata={imageMetadata}
                />
            </div>
        </div>
    );
}

export default App;
