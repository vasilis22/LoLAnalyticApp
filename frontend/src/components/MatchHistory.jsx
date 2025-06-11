import { useState } from 'react';
import MatchDetails from './MatchDetails';

const QUEUE_TYPES = {
    0: "Custom Game",
    72: "1v1 Snowdown",
    73: "2v2 Snowdown",
    75: "Hexakill",
    76: "URF",
    78: "One for All",
    83: "Nexus Blitz",
    400: "Draft",
    420: "Ranked Solo",
    440: "Ranked Flex",
    450: "ARAM",
    490: "Quickplay",
    900: "ARURF",
    1020: "One for All",
    1300: "Nexus Blitz",
    1400: "Ultimate Spellbook",
    1700: "Arena",
    1710: "Arena",
    400: "Normal Draft",
    420: "Ranked Solo/Duo",
    430: "Normal Blind",
    440: "Ranked Flex",
    450: "ARAM",
    700: "Clash",
};

export default function MatchHistory({ matches }) {
    const [expandedMatches, setExpandedMatches] = useState(new Set());

    if (!matches || matches.length === 0) return null;

    function toggleMatch(matchId) {
        const newSet = new Set(expandedMatches);
        if (newSet.has(matchId)) {
            newSet.delete(matchId);
        }
        else {
            newSet.add(matchId);
        }
        setExpandedMatches(newSet);
    }

    return (
        <div className="mt-8 flex flex-col gap-4 max-w-5xl mx-auto">
            {matches.map((match) => {
                const player = match.participants[match.playerIndex];
                const isWin = player.win;
                const gameDurationMinutes = Math.floor(match.gameDuration / 60);
                const gameDurationSeconds = match.gameDuration % 60;
                const isExpanded = expandedMatches.has(match.gameId);

                const team1 = match.participants.slice(0, 5);
                const team2 = match.participants.slice(5, 10);

                return (
                    <div key={match.gameId} className="flex flex-col">
                        <div
                            onClick={() => toggleMatch(match.gameId)}
                            className={`p-4 rounded-lg ${isWin ? 'bg-green-800/50' : 'bg-red-800/50'} flex items-start gap-6 cursor-pointer hover:brightness-110 transition-all`}
                        >
                            <div className="flex flex-col items-start min-w-[200px]">
                                <span className="text-lg font-semibold text-white">
                                    {QUEUE_TYPES[match.queueId] || "Custom Game"}
                                </span>
                                <span className={`text-lg ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                                    {isWin ? 'Victory' : 'Defeat'}
                                </span>
                                <span className="text-gray-300">
                                    {gameDurationMinutes}:{gameDurationSeconds.toString().padStart(2, '0')}
                                </span>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-center gap-1">
                                    <img
                                        src={`https://ddragon.leagueoflegends.com/cdn/15.7.1/img/champion/${player.championName}.png`}
                                        alt={player.championName}
                                        className="w-16 h-16 rounded-lg"
                                    />
                                    <span className="text-white font-semibold">
                                        {player.kills} / {player.deaths} / {player.assists}
                                    </span>
                                </div>

                                <div className="flex flex-row items-center gap-2">
                                    <div className="grid grid-cols-3 gap-1">
                                        {[...Array(6)].map((_, index) => (
                                            <div key={index} className="w-8 h-8 bg-gray-900 rounded">
                                                {player[`item${index}`] !== 0 && (
                                                    <img
                                                        src={`https://ddragon.leagueoflegends.com/cdn/15.7.1/img/item/${player[`item${index}`]}.png`}
                                                        alt={`Item ${index + 1}`}
                                                        className="w-full h-full rounded"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="w-8 h-8 bg-gray-900 rounded col-span-2">
                                            {player.item6 !== 0 && (
                                                <img
                                                    src={`https://ddragon.leagueoflegends.com/cdn/15.7.1/img/item/${player.item6}.png`}
                                                    alt="Trinket"
                                                    className="w-full h-full rounded"
                                                />
                                            )}
                                        </div>
                                </div>
                            </div>

                            <div className="flex gap-8">
                                <div className="flex flex-col gap-1">
                                    {team1.map((teammate, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <img
                                                src={`https://ddragon.leagueoflegends.com/cdn/15.7.1/img/champion/${teammate.championName}.png`}
                                                alt={teammate.championName}
                                                className="w-6 h-6 rounded-full"
                                            />
                                            <span className={`text-sm ${teammate.puuid === match.participants[match.playerIndex].puuid ? 'text-yellow-400 font-bold' : 'text-gray-300'}`}>
                                                {teammate.riotIdGameName}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-1">
                                    {team2.map((teammate, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <img
                                                src={`https://ddragon.leagueoflegends.com/cdn/15.7.1/img/champion/${teammate.championName}.png`}
                                                alt={teammate.championName}
                                                className="w-6 h-6 rounded-full"
                                            />
                                            <span className={`text-sm ${teammate.puuid === match.participants[match.playerIndex].puuid ? 'text-yellow-400 font-bold' : 'text-gray-300'}`}>
                                                {teammate.riotIdGameName}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {isExpanded && <MatchDetails match={match} player={player} />}
                    </div>
                );
            })}
        </div>
    );
}