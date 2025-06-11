import { useState, useEffect } from 'react';
import RunesDisplay from './RunesDisplay.jsx';

export default function Overview({ player, timelineData }) {
    const [championData, setChampionData] = useState(null);
    const [abilitySequence, setAbilitySequence] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const championResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/15.7.1/data/en_US/champion/${player.championName}.json`);
                const championData = await championResponse.json();

                setChampionData(championData.data[player.championName]);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
        fetchData();
    }, [player.championName]);

    useEffect(() => {
        if (!timelineData || !player) return;

        const sequence = timelineData.frames
            .flatMap(frame => frame.events)
            .filter(event =>
                event.type === 'SKILL_LEVEL_UP' &&
                event.participantId === player.participantId
            )
            .map(event => event.skillSlot);

        setAbilitySequence(sequence);
    }, [timelineData]);

    if (!championData || !abilitySequence) return null;

    const abilities = ['Q', 'W', 'E', 'R'];

    return (
        <div>
            <h3 className="text-xl font-bold mb-4">Match Overview</h3>
            <div className="flex gap-8">
                <RunesDisplay playerRunes={player.perks} />
                <div className="flex flex-col items-center gap-4">
                    <h4 className="text-lg font-semibold text-blue-400">Abilities</h4>
                    <div className="flex flex-col gap-1">
                        {abilities.map((key, index) => (
                            <div key={key} className="flex items-center gap-1">
                                <img
                                    src={`https://ddragon.leagueoflegends.com/cdn/15.7.1/img/spell/${championData.spells[index].image.full}`}
                                    alt={`Ability ${key}`}
                                    className="w-8 h-8"
                                />
                                <div className="flex gap-1">
                                    {[...Array(18)].map((_, level) => {
                                        const isLeveledAtThisLevel = abilitySequence[level] === index + 1;
                                        return (
                                            <div
                                                key={level}
                                                className={`w-8 h-8 ${isLeveledAtThisLevel
                                                    ? 'bg-blue-500'
                                                    : 'bg-gray-600'
                                                    }`}
                                            >
                                                {isLeveledAtThisLevel && (
                                                    <span className="text-[10px] text-white flex items-center justify-center h-full">
                                                        {level + 1}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}