import { useState, useLayoutEffect, useRef } from 'react';

export default function RunesTooltip({
    size = "w-8 h-8",
    rune
}) {
    const [showTooltip, setShowTooltip] = useState(false);

    const tooltipRef = useRef(null);

    useLayoutEffect(() => {
        if (showTooltip && tooltipRef.current && rune) {
            const tooltip = tooltipRef.current;

            const tooltipRect = tooltip.getBoundingClientRect();
            const screenWidth = document.documentElement.clientWidth;

            if (tooltipRect.right > screenWidth) {
                tooltip.style.left = `-${tooltipRect.right - screenWidth + 10}px`;
            }
        }
    }, [showTooltip, rune]);

    return (
        <div className="relative inline-block"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <img
                src={rune.icon}
                alt={rune.name}
                className={`${size} rounded-full`}
            />
            {showTooltip && (
                <div className="absolute left-0 top-full mt-2 w-56 sm:w-64 pointer-events-none z-50" ref={tooltipRef}>
                    <div className="bg-gray-900 border-2 border-yellow-600 rounded-lg shadow-xl p-2 sm:p-3">
                        <h3 className="text-yellow-400 font-bold text-xs sm:text-sm mb-1 sm:mb-2">
                            {rune.name}
                        </h3>
                        <div 
                            className="text-gray-300 text-xs leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: rune.longDescription }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}