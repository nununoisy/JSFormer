import React from 'react';

import { useDropzone } from 'react-dropzone';

export default function ImageUpload(props) {
    const { onChange } = props;

    const onDrop = React.useCallback((files) => {
        if (files && files.length > 0 && onChange)
            onChange(window.URL.createObjectURL(files[0]));
    }, [onChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: "image/*", maxFiles: 1 });

    return (
        <div {...getRootProps()} className="uploadContainer">
            <input {...getInputProps()} />
            <div className="uploadDisplayContainer">
                <img src="/static/upload.svg"/>
                { isDragActive ?
                    <p>Drop the image here!</p> :
                    <p>Drag an image here or click to select...</p>
                }
            </div>
        </div>
    )
}