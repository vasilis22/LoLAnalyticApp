import { useState, useEffect, useLayoutEffect, useRef } from 'react';

export default function ItemTooltip({ 
    itemId, 
    version, 
    size = 'w-10 h-10 sm:w-12 sm:h-12',
    showPercentage = false,
    percentage = null,
}) {
    const [itemData, setItemData] = useState(null);
    const [showTooltip, setShowTooltip] = useState(false);

    const tooltipRef = useRef(null);

    useEffect(() => {
        if (showTooltip && !itemData && itemId && itemId !== 0) {
            fetchItemData();
        }
    }, [showTooltip, itemId]);

    useLayoutEffect(() => {
        if (showTooltip && tooltipRef.current && itemData) {
            const tooltip = tooltipRef.current;
            
            const toolTipRect = tooltip.getBoundingClientRect();
            const screenWidth = document.documentElement.clientWidth;
            
            if (toolTipRect.right > screenWidth) {
                tooltip.style.left = `-${toolTipRect.right - screenWidth + 10}px`;
            }
        }
    }, [showTooltip, itemData]);

    async function fetchItemData() {
        try {
            const response = await fetch(
                `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`
            );
            const data = await response.json();
            setItemData(data.data[itemId]);
        } catch (error) {
            console.error('Error fetching item data:', error);
        }
    }

    if (!itemId || itemId === 0) {
        return (
            <div className={`${size} bg-gray-900 rounded`}></div>
        );
    }

    return (
        <div 
            className="relative inline-block bg-gray-700 rounded-lg p-2 sm:p-3"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className={`flex flex-col items-center ${showPercentage ? 'gap-1' : ''}`}>
                <img 
                    src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`}
                    alt={`Item ${itemId}`}
                    className={`${size} rounded`}
                />
                {showPercentage && percentage !== null && (
                    <span className="text-xs sm:text-sm text-gray-400">
                        {percentage}
                    </span>
                )}
            </div>
            
            {showTooltip && itemData && (
                <div className="absolute left-0 bottom-full mb-2 w-56 sm:w-64 pointer-events-none z-50" ref={tooltipRef}>
                    <div className="bg-gray-900 border-2 border-yellow-600 rounded-lg shadow-xl p-2 sm:p-3">
                        <h3 className="text-yellow-400 font-bold text-xs sm:text-sm mb-1 sm:mb-2">
                            {itemData.name}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                            <span className="text-yellow-500 font-semibold text-xs">
                                ⬡ {itemData.gold.total}
                            </span>
                            {itemData.gold.total !== itemData.gold.base && (
                                <span className="text-gray-400 text-xs">
                                    ({itemData.gold.base} + {itemData.gold.total - itemData.gold.base})
                                </span>
                            )}
                        </div>
                        
                        <div 
                            className="text-gray-300 text-xs leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: itemData.description }}
                        />
                        
                        {itemData.plaintext && (
                            <p className="text-green-400 text-xs mt-1 sm:mt-2 italic">
                                {itemData.plaintext}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
