import { useLocation } from 'react-router-dom';
import RunesDisplay from './RunesDisplay';
import { useParams } from 'react-router-dom';
import { useState } from 'react';


export default function ChampionDetails() {
    const location = useLocation();
    const [championData, setChampionData] = useState(location.state?.championData || null);
    const { championId } = useParams();

    async function fetchChampionData(championId) {
        try {
            const response = await fetch(`http://localhost:8000/champions/statistics`);
            if (!response.ok) {
                throw new Error('Failed to fetch champion data');
            }
            const data = await response.json();
            setChampionData(data.champions[championId]);
        } catch (error) {
            console.error('Error fetching champion data:', error);
            return null;
        }
    }

    if (!championData) {
        fetchChampionData(championId);
    }

    if (!championData) {
        return (
            <div className="container mx-auto p-6">
                <div className="bg-gray-800 rounded-lg shadow-xl p-6">
                    <h1 className="text-3xl font-bold text-white">Champion not found</h1>
                    <p className="text-gray-400">Please select a valid champion.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="bg-gray-800 rounded-lg shadow-xl">
                <div className="p-6 border-b border-gray-700">
                    <h1 className="text-3xl font-bold text-white">{championData.name}</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                    <div className="space-y-6">
                        <div className="flex items-start space-x-6">
                            <img 
                                src={championData.image}
                                alt={championData.name}
                                className="w-32 h-32 rounded-lg"
                            />
                            <div className="space-y-2">
                                <p className="text-gray-400 italic">{championData.title}</p>
                                <div className="flex gap-2">
                                    {championData.roles.map((role, index) => (
                                        <span 
                                            key={index}
                                            className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
                                        >
                                            {role}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <p className="text-gray-400">Win Rate</p>
                                    <p className="text-2xl text-white">
                                        {(championData.winRate * 100).toFixed(1)}%
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {championData.gamesPlayed} games
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-6">
                        <RunesDisplay playerRunes={championData.mostUsedRunes[0]['rune_trees']['perks']}/>
                    </div>
                </div>

                <div className="border-t border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Item Build</h2>
                    <div className="flex gap-4">
                        {championData.mostBoughtItems.map((item, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <img 
                                    src={`https://ddragon.leagueoflegends.com/cdn/15.7.1/img/item/${item.id}.png`}
                                    alt={`Item ${item.id}`}
                                    className="w-12 h-12 rounded border-2 border-gray-600"
                                />
                                <span className="text-sm text-gray-400 mt-1">
                                    {((item.count / championData.gamesPlayed) * 100).toFixed(1)}% 
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}