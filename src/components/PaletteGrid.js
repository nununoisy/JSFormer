import React from 'react';
import ReactTooltip from "react-tooltip";

export default function PaletteGrid(props) {
    const { palette } = props;

    return (
        <>
            <ReactTooltip effect="solid" />
            <div className={`paletteGrid${palette.length === 2 ? ' paletteGrid2Color' : ''}`}>
                {palette.map((color, idx) => (
                    <div
                        className="paletteGridItem"
                        style={{ backgroundColor: `#${color}`}}
                        data-tip={`Color #${idx}: #${color}`}
                    />
                ))}
            </div>
        </>
    )
}