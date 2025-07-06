import React, { useState, useEffect } from 'react';

export default function SummStatDisplay({ summStatData }) {
    const [selectedSeason, setSelectedSeason] = useState('');
    const [availableSeasons, setAvailableSeasons] = useState([]);
    const [currentSeasonData, setCurrentSeasonData] = useState(null);

    useEffect(() => {
        if (summStatData && summStatData.length > 0) {
            const seasons = summStatData.map(item => item.season);
            
            const sortedSeasons = seasons.sort((a, b) => parseInt(b) - parseInt(a));
            setAvailableSeasons(sortedSeasons);
            
            if (sortedSeasons.length > 0 && !selectedSeason) {
                setSelectedSeason(sortedSeasons[0]);
            }
        }
    }, [summStatData]);

    useEffect(() => {
        if (selectedSeason && summStatData) {
            const seasonData = summStatData.find(item => item.season === selectedSeason);
            setCurrentSeasonData(seasonData?.champion_stats || null);
        }
    }, [selectedSeason, summStatData]);

    const getMostPlayedChampions = (gameMode, limit = 3) => {
        if (!currentSeasonData) return [];
        
        return Object.entries(currentSeasonData)
            .map(([champion, data]) => ({
                champion,
                ...data,
                total: data[gameMode]?.total || 0
            }))
            .filter(item => item.total > 0)
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);
    };

    const getBestPerformingChampions = (gameMode, limit = 3) => {
        if (!currentSeasonData) return [];
        
        return Object.entries(currentSeasonData)
            .map(([champion, data]) => ({
                champion,
                ...data,
                winrate: data[gameMode]?.winrate || 0,
                total: data[gameMode]?.total || 0
            }))
            .filter(item => item.total > 3)
            .sort((a, b) => b.winrate - a.winrate)
            .slice(0, limit);
    };

    if (!summStatData || summStatData.length === 0) {
        return <div className="text-center text-gray-500">No stats found.</div>;
    }

    const mostPlayedNormal = getMostPlayedChampions('normal', 3);
    const bestPerformingNormal = getBestPerformingChampions('normal', 3);
    const bestPerformingRanked = getBestPerformingChampions('420', 3);

    return (
        <div className="mt-8 max-w-4xl mx-auto">
            <div className="bg-gray-700 p-6 rounded-t-lg shadow-xl">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium text-sm">Most Played</h3>
                    <select 
                        value={selectedSeason} 
                        onChange={(e) => setSelectedSeason(e.target.value)}
                        className="bg-gray-700 border border-gray-600 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {availableSeasons.map(season => (
                            <option key={season} value={season}>
                                Season {season}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-4 overflow-x-auto">
                    {mostPlayedNormal.length > 0 ? (
                        mostPlayedNormal.map((championData) => {
                            const modeData = championData.normal || {};
                            const { wins = 0, total = 0, kda = 0, winrate = 0 } = modeData;
                            const losses = total - wins;
                            
                            return (
                                <div key={championData.champion} className="bg-gray-700 rounded-lg p-2 min-w-[120px]">
                                    <div className="flex justify-center mb-2">
                                        <img 
                                            src={championData.image} 
                                            alt={championData.champion}
                                            className="w-16 h-16 rounded-full object-cover"
                                        />
                                    </div>
                                    
                                    <div className="space-y-1 text-xs text-center">
                                        <div className="text-white font-medium">
                                            <span className="text-green-400">{wins}W</span>{' '}
                                            <span className="text-red-400">{losses}L</span>{' '}
                                            <span className="text-blue-400">{(winrate * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="text-gray-300">
                                            {kda.toFixed(2)} KDA
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-gray-400 text-sm py-4">No normal game data</div>
                    )}
                </div>
            </div>

            <div className="bg-gray-700 p-6 shadow-xl border-t border-gray-600">
                <h3 className="text-white font-medium mb-4 text-sm">Best Performance</h3>
                <div className="flex gap-4 overflow-x-auto">
                    {bestPerformingNormal.length > 0 ? (
                        bestPerformingNormal.map((championData) => {
                            const modeData = championData.normal || {};
                            const { wins = 0, total = 0, kda = 0, winrate = 0 } = modeData;
                            const losses = total - wins;
                            
                            return (
                                <div key={championData.champion} className="bg-gray-700 rounded-lg p-2 min-w-[120px]">
                                    <div className="flex justify-center mb-2">
                                        <img 
                                            src={championData.image} 
                                            alt={championData.champion}
                                            className="w-16 h-16 rounded-full object-cover"
                                        />
                                    </div>
                                    
                                    <div className="space-y-1 text-xs text-center">
                                        <div className="text-white font-medium">
                                            <span className="text-green-400">{wins}W</span>{' '}
                                            <span className="text-red-400">{losses}L</span>{' '}
                                            <span className="text-blue-400">{(winrate * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="text-gray-300">
                                            {kda.toFixed(2)} KDA
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-gray-400 text-sm py-4">No normal game data</div>
                    )}
                </div>
            </div>

            <div className="bg-gray-700 p-6 rounded-b-lg shadow-xl border-t border-gray-600">
                <h3 className="text-white font-medium mb-4 text-sm">Best Performance - Ranked</h3>
                <div className="flex gap-4 overflow-x-auto">
                    {bestPerformingRanked.length > 0 ? (
                        bestPerformingRanked.map((championData) => {
                            const modeData = championData['420'] || {};
                            const { wins = 0, total = 0, kda = 0, winrate = 0 } = modeData;
                            const losses = total - wins;
                            
                            return (
                                <div key={championData.champion} className="bg-gray-700 rounded-lg p-2 min-w-[120px]">
                                    <div className="flex justify-center mb-2">
                                        <img 
                                            src={championData.image} 
                                            alt={championData.champion}
                                            className="w-16 h-16 rounded-full object-cover"
                                        />
                                    </div>

                                    <div className="space-y-1 text-xs text-center">
                                        <div className="text-white font-medium">
                                            <span className="text-green-400">{wins}W</span>{' '}
                                            <span className="text-red-400">{losses}L</span>{' '}
                                            <span className="text-blue-400">{(winrate * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="text-gray-300">
                                            {kda.toFixed(2)} KDA
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-gray-400 text-sm py-4">No ranked game data</div>
                    )}
                </div>
            </div>
        </div>
    );
}