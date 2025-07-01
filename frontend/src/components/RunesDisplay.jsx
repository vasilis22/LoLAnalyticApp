import { useEffect } from "react";
import { useState } from "react";

const STAT_SHARD_ICONS = {
    5001: 'StatModsHealthPlusIcon',
    5005: 'StatModsAttackSpeedIcon',
    5007: 'StatModsCDRScalingIcon',
    5008: 'StatModsAdaptiveForceIcon',
    5010: 'StatModsMovementSpeedIcon',
    5011: 'StatModsHealthScalingIcon',
    50013: 'StatModsTencantIcon',
};

export default function RunesDisplay({ playerRunes }) {
    const [primaryTree, setPrimaryTree] = useState(null);
    const [secondaryTree, setSecondaryTree] = useState(null);
    const [runesData, setRunesData] = useState(null);
    const statPerksArray = Object.values(playerRunes.statPerks).reverse();

    useEffect(() => {
        async function fetchRunesData() {
            try {
                const response = await fetch('https://ddragon.leagueoflegends.com/cdn/15.7.1/data/en_US/runesReforged.json');
                if (!response.ok) {
                    throw new Error('Failed to fetch runes data');
                }
                const data = await response.json();
                setRunesData(data);
            } catch (error) {
                console.error('Error fetching runes data:', error);
            }
        }
        fetchRunesData();
    }, []);

    useEffect(() => {
        if (!runesData) return;

        const [primary, secondary] = playerRunes.styles.map(style => {
            const tree = runesData.find(t => t.id === style.style);
            if (!tree) return null;

            const runes = style.selections.map(selection => {
                for (const slot of tree.slots) {
                    const rune = slot.runes.find(r => r.id === selection.perk);
                    if (rune) {
                        return {
                            id: rune.id,
                            icon: `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`,
                            name: rune.name
                        };
                    }
                }
            })

            return {
                treeName: tree.name,
                treeIcon: `https://ddragon.leagueoflegends.com/cdn/img/${tree.icon}`,
                runes
            };
        });

        setPrimaryTree(primary);
        setSecondaryTree(secondary);
    }, [runesData, playerRunes]);

    if (!primaryTree && !secondaryTree) {
        return <div className="text-center text-gray-500">No runes data available.</div>;
    }

    console.log("Primary Tree:", primaryTree);
    console.log("Secondary Tree:", secondaryTree);

    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                    {primaryTree && (
                        <>
                            <img
                                src={primaryTree.treeIcon}
                                alt={primaryTree.treeName}
                                className="w-6 h-6"
                            />
                            <h4 className="text-lg font-semibold text-blue-400">
                                {primaryTree.treeName}
                            </h4>
                        </>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    {primaryTree?.runes.map((rune, index) => (
                        <img
                            key={index}
                            src={rune?.icon}
                            alt={rune?.name}
                            className="w-8 h-8 rounded-full"
                            title={rune?.name}
                        />
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                        {secondaryTree && (
                            <>
                                <img
                                    src={secondaryTree.treeIcon}
                                    alt={secondaryTree.treeName}
                                    className="w-6 h-6"
                                />
                                <h4 className="text-lg font-semibold text-blue-400">
                                    {secondaryTree.treeName}
                                </h4>
                            </>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        {secondaryTree?.runes.map((rune, index) => (
                            <img
                                key={index}
                                src={rune?.icon}
                                alt={rune?.name}
                                className="w-8 h-8 rounded-full"
                                title={rune?.name}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <h4 className="text-lg font-semibold text-blue-400">Shards</h4>
                    <div className="flex gap-2">
                        {statPerksArray.map((shardId, index) => (
                            <img
                                key={index}
                                src={`https://ddragon.leagueoflegends.com/cdn/img/perk-images/StatMods/${STAT_SHARD_ICONS[shardId]}.png`}
                                alt={`Stat ${shardId}`}
                                className="w-6 h-6 rounded-full"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}