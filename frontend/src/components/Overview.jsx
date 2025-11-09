import { useState, useEffect } from 'react';
import RunesDisplay from './RunesDisplay.jsx';
import { fetchLatestVersion } from '../utils/version';

const ABILITIES = [
    'Q', 'W', 'E', 'R'
];

export default function Overview({ player, timelineData }) {
    const [championData, setChampionData] = useState(null);
    const [abilitySequence, setAbilitySequence] = useState(null);
    const [version, setVersion] = useState('15.13.1');

    useEffect(() => {
        async function fetchVersion() {
            const latestVersion = await fetchLatestVersion();
            setVersion(latestVersion);
        }
        fetchVersion();
    }, []);

    useEffect(() => {
        async function fetchData() {
            try {
                const championResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${player.championName}.json`);
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

    return (
        <div>
            <h3 className="text-lg sm:text-xl font-bold mb-4">Match Overview</h3>
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
                <RunesDisplay playerRunes={player.perks} />
                <div className="flex flex-col gap-4">
                    <h4 className="text-base sm:text-lg font-semibold text-blue-400">Abilities</h4>
                    <div className="overflow-x-auto">
                        <div className="flex flex-col gap-1 min-w-max">
                            {ABILITIES.map((key, index) => (
                                <div key={key} className="flex items-center gap-1">
                                    <img
                                        src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${championData.spells[index].image.full}`}
                                        alt={`Ability ${key}`}
                                        className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                                    />
                                    <div className="flex gap-0.5 sm:gap-1">
                                        {[...Array(18)].map((_, level) => {
                                            const isLeveledAtThisLevel = abilitySequence[level] === index + 1;
                                            return (
                                                <div
                                                    key={level}
                                                    className={`w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 ${isLeveledAtThisLevel
                                                        ? 'bg-blue-500'
                                                        : 'bg-gray-600'
                                                        }`}
                                                >
                                                    {isLeveledAtThisLevel && (
                                                        <span className="text-[8px] sm:text-[10px] text-white flex items-center justify-center h-full">
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
        </div>
    );
}