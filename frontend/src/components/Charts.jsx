import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useState, useEffect } from 'react';
import { fetchLatestVersion } from '../utils/version';

const LINECOLORS = {
    1: '#8884d8',
    2: '#82ca9d',
    3: '#ffc658',
    4: '#ff7300',
    5: '#ff0000',
    6: '#00ff00',
    7: '#0000ff',
    8: '#ff00ff',
    9: '#00ffff',
    10:'#ffff00'
};

const CHARTS = {
    minions: {
        title: 'Minions',
    },
    exp: {
        title: 'Experience',
    },
    gold: {
        title: 'Gold',
    },
    damage: {
        title: 'Damage',
    }
}

export default function Charts({match, timelineData, player }) {
    const [selectedParticipantsId, setSelectedParticipants] = useState(new Set([player.participantId]));
    const [version, setVersion] = useState('15.13.1');
    const [activeChart, setActiveChart] = useState('minions');
    const [allyTeam, setAllyTeam] = useState({});
    const [enemyTeam, setEnemyTeam] = useState({});

    useEffect(() => {
        async function fetchVersion() {
            const latestVersion = await fetchLatestVersion();
            setVersion(latestVersion);
        }
        fetchVersion();
    }, []);

    const toggleParticipant = (participantId) => {
        const newSet = new Set(selectedParticipantsId);
        if (newSet.has(participantId)) {
            newSet.delete(participantId);
        } else {
            newSet.add(participantId);
        }
        setSelectedParticipants(newSet);
    }

    useEffect(() => {
        const prepareTeamData = () => {
            if (!timelineData || !match || !player) return {allyTeam: {}, enemyTeam: {}}

            const allyTeam = {};
            const enemyTeam = {};
            const playerTeamId = player.teamId;

            match.info.participants.forEach(participant => {
                const participantData = {
                    participantId: participant.participantId,
                    champName: participant.championName,
                    riotIdGameName: participant.riotIdGameName,
                    teamId: participant.teamId,
                    color: LINECOLORS[participant.participantId]
                };

                if (participant.teamId === playerTeamId) {
                    allyTeam[participant.participantId] = participantData;
                } else {
                    enemyTeam[participant.participantId] = participantData;
                }
            });
            setAllyTeam(allyTeam);
            setEnemyTeam(enemyTeam);
        }
        prepareTeamData();
    }, [timelineData, match, player]);

    const prepareCSDataForSelected = () => {
        if (!timelineData || !timelineData.frames) return [];
        
        return timelineData.frames.map((frame, index) => {
            const datapPoint = {minute: index};

            selectedParticipantsId.forEach(participantId => {
                const playerFrame = frame.participantFrames[participantId];
                if (playerFrame) {
                    if (participantId in allyTeam) {
                        datapPoint[`${allyTeam[participantId].champName}`] = playerFrame.minionsKilled + playerFrame.jungleMinionsKilled;
                    }
                    if (participantId in enemyTeam) {
                        datapPoint[`${enemyTeam[participantId].champName}`] = playerFrame.minionsKilled + playerFrame.jungleMinionsKilled;
                    }
                }
            });
            return datapPoint;
        });
    }

    const prepareExpDataForSelected = () => {
        if (!timelineData || !timelineData.frames) return [];
        
        return timelineData.frames.map((frame, index) => {
            const datapPoint = {minute: index};

            selectedParticipantsId.forEach(participantId => {
                const playerFrame = frame.participantFrames[participantId];
                if (playerFrame) {
                    if (participantId in allyTeam) {
                        datapPoint[`${allyTeam[participantId].champName}`] = playerFrame.xp;
                    }
                    if (participantId in enemyTeam) {
                        datapPoint[`${enemyTeam[participantId].champName}`] = playerFrame.xp;
                    }
                }
            });
            return datapPoint;
        });
    }

    const prepareGoldDataForSelected = () => {
        if (!timelineData || !timelineData.frames) return [];
        
        return timelineData.frames.map((frame, index) => {
            const datapPoint = {minute: index};

            selectedParticipantsId.forEach(participantId => {
                const playerFrame = frame.participantFrames[participantId];
                if (playerFrame) {
                    if (participantId in allyTeam) {
                        datapPoint[`${allyTeam[participantId].champName}`] = playerFrame.totalGold;
                    }
                    if (participantId in enemyTeam) {
                        datapPoint[`${enemyTeam[participantId].champName}`] = playerFrame.totalGold;
                    }
                }
            });
            return datapPoint;
        });
    }

    const prepareDamageDataForSelected = () => {
        if (!timelineData || !timelineData.frames) return [];

        return timelineData.frames.map((frame, index) => {
            const datapPoint = {minute: index};
            selectedParticipantsId.forEach(participantId => {
                const playerFrame = frame.participantFrames[participantId];
                if (playerFrame) {
                    if (participantId in allyTeam) {
                        datapPoint[`${allyTeam[participantId].champName}`] = playerFrame.damageStats.totalDamageDoneToChampions;
                    }
                    if (participantId in enemyTeam) {
                        datapPoint[`${enemyTeam[participantId].champName}`] = playerFrame.damageStats.totalDamageDoneToChampions;
                    }
                }
            });
            return datapPoint;
        });
    }

    const prepareDataForSelected= () => {
        switch (activeChart) {
            case 'minions':
                return prepareCSDataForSelected();
            case 'exp':
                return prepareExpDataForSelected();
            case 'gold':
                return prepareGoldDataForSelected();
            case 'damage':
                return prepareDamageDataForSelected();
            default:
                return [];
        }
    }

    return (
        <div className="justify-center">
            <div className="flex flex-wrap justify-center mb-4 gap-2 sm:gap-3">
                {Object.entries(CHARTS).map(([key, chart]) => (
                    <button
                        key={key}
                        onClick={() => setActiveChart(key)}
                        className={`px-3 sm:px-4 py-2 rounded text-sm sm:text-base ${
                            activeChart === key 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-blue-600'}`}
                    >
                        {chart.title}
                    </button>
                ))}
            </div>
            <div className="flex flex-col sm:flex-row justify-between mb-4 gap-3">
                <div className="flex gap-1 sm:gap-2 mb-2 sm:mb-4 overflow-x-auto">
                    {Object.values(allyTeam).map(participant => (
                        <img
                            key={participant.participantId}
                            src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${participant.champName}.png`}
                            alt={participant.champName}
                            className={`w-10 h-10 sm:w-13 sm:h-13 flex-shrink-0 cursor-pointer rounded-lg border-2 hover:border-blue-500 ${
                                selectedParticipantsId.has(participant.participantId)
                                    ? 'opacity-100'
                                    : 'opacity-50'
                            } `}
                            style ={{ borderColor: participant.color }}
                            onClick={() => toggleParticipant(participant.participantId)}
                        />
                    ))}
                </div>
                <div className="flex gap-1 sm:gap-2 mb-2 sm:mb-4 overflow-x-auto">
                    {Object.values(enemyTeam).map(participant => (
                        <img
                            key={participant.participantId}
                            src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${participant.champName}.png`}
                            alt={participant.champName}
                            className={`w-10 h-10 sm:w-13 sm:h-13 flex-shrink-0 cursor-pointer rounded-lg border-2 hover:border-blue-500 ${
                                selectedParticipantsId.has(participant.participantId)
                                    ? 'opacity-100'
                                    : 'opacity-50'
                            } `}
                            style ={{ borderColor: participant.color }}
                            onClick={() => toggleParticipant(participant.participantId)}
                        />
                    ))}
                </div>
            </div>
            <div className="flex justify-center overflow-x-auto">
                <LineChart
                    width={Math.min(800, window.innerWidth - 40)}
                    height={300}
                    data={prepareDataForSelected()}
                    margin={{ top: 5, right: 10, left: 10, bottom: 20 }}
                >
                    <XAxis
                        stroke="#fff"
                        label={{ value: 'Minutes', position: 'bottom', fill: '#fff' }}
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis
                        stroke="#fff"
                        label={{ value: CHARTS[activeChart].title, angle: -90, position: 'left', fill: '#fff' }}
                        tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                        labelStyle={{ color: '#fff' }}
                    />
                    <Legend 
                        verticalAlign={'top'}
                        wrapperStyle={{ fontSize: '12px' }}
                    />
                    {Array.from(selectedParticipantsId).map(participantId => {
                        const participant = allyTeam[participantId] || enemyTeam[participantId];

                        if (!participant) return null;

                        return (
                            <Line
                                key={participant.participantId}
                                type="monotone"
                                dataKey={`${participant.champName}`}
                                stroke= {participant.color}
                                name={participant.champName}
                                strokeWidth={2}
                            />
                        );
                    })}
                </LineChart>
            </div>
        </div>
    );
}