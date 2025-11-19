import { useLocation } from 'react-router-dom';
import RunesDisplay from './RunesDisplay';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchLatestVersion } from '../utils/version';
import ItemTooltip from './ItemTooltip';
import ErrorMessage from './ErrorMessage.jsx';


export default function ChampionDetails() {
    const location = useLocation();
    const [championData, setChampionData] = useState(location.state?.championData || null);
    const { championId } = useParams();
    const [version, setVersion] = useState('15.13.1');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const [error, setError] = useState(null);

    async function fetchChampionData(championId) {
        try {
            const response = await fetch(`${API_URL}/champions/statistics`);
            const data = await response.json();

            if (!response.ok) {
                setError({
                    status: response.status,
                    message: data.detail || 'Failed to fetch champion statistics'
                });
                return;
            }
            setChampionData(data.champions[championId]);
        } catch (error) {
            setError({
                status: 500,
                message: error.message || 'Failed to fetch champion statistics'
            })
        }
    }

        useEffect(() => {
        async function fetchVersion() {
            const latestVersion = await fetchLatestVersion();
            setVersion(latestVersion);
        }
        fetchVersion();
    }, []);

    if (!championData) {
        fetchChampionData(championId);
    }

    if (error) return <ErrorMessage message={error}/>

    if (championData) return (
        <div className="container mx-auto p-3 sm:p-6 max-w-7xl">
            <div className="bg-gray-800 rounded-lg shadow-xl">
                <div className="p-4 sm:p-6 border-b border-gray-700">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">{championData.name}</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-3 sm:p-6">
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                            <img 
                                src={championData.image}
                                alt={championData.name}
                                className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg"
                            />
                            <div className="space-y-2 text-center sm:text-left w-full">
                                <p className="text-sm sm:text-base text-gray-400 italic">{championData.title}</p>
                                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                    {championData.roles.map((role, index) => (
                                        <span 
                                            key={index}
                                            className="px-2 sm:px-3 py-1 bg-gray-700 rounded-full text-xs sm:text-sm text-gray-300"
                                        >
                                            {role}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <p className="text-sm sm:text-base text-gray-400">Win Rate</p>
                                    <p className="text-xl sm:text-2xl text-white">
                                        {(championData.winRate * 100).toFixed(1)}%
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-500">
                                        {championData.gamesPlayed} games
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4 sm:p-6">
                        <RunesDisplay playerRunes={championData.mostUsedRunes[0]['rune_trees']['perks']}/>
                    </div>
                </div>

                <div className="border-t border-gray-700 p-3 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Recommended Build</h2>
                    
                    <div className="space-y-6">
                        <div className="container items-start flex flex-col sm:flex-row gap-4 sm:gap-6">
                            <div className="w-full sm:w-auto">
                                <h3 className="text-base sm:text-lg font-semibold text-white mb-3">Starter Item</h3>
                                <div className="flex gap-2 sm:gap-4">
                                    {championData.mostPickedStarter ? (
                                        <ItemTooltip
                                            itemId={championData.mostPickedStarter.id}
                                            version={version}
                                            showPercentage={true}
                                            percentage={`${((championData.mostPickedStarter.count / championData.gamesPlayed) * 100).toFixed(1)}%`}
                                        />
                                    ) : (
                                        <div className="text-gray-400 text-xs sm:text-sm">No data available</div>
                                    )}
                                </div>
                            </div>

                            <div className="w-full sm:w-auto">
                                <h3 className="text-base sm:text-lg font-semibold text-white mb-3">Core Items</h3>
                                <div className="flex flex-wrap gap-2 sm:gap-4">
                                    {championData.coreItems && championData.coreItems.length > 0 ? (
                                        championData.coreItems.map((item, index) => (
                                           <ItemTooltip 
                                               key={index}
                                               itemId={item.id} 
                                               version={version}
                                               showPercentage={true}
                                               percentage={`${((item.count / championData.gamesPlayed) * 100).toFixed(1)}%`}
                                           />
                                        ))
                                    ) : (
                                        <div className="text-gray-400 text-xs sm:text-sm">No data available</div>
                                    )}
                                </div>
                            </div>

                            <div className="w-full sm:w-auto">
                                <h3 className="text-base sm:text-lg font-semibold text-white mb-3">Boots</h3>
                                <div className="flex gap-2 sm:gap-4">
                                    {championData.mostPickedBoot ? (
                                        <ItemTooltip
                                            itemId={championData.mostPickedBoot.id}
                                            version={version}
                                            showPercentage={true}
                                            percentage={`${((championData.mostPickedBoot.count / championData.gamesPlayed) * 100).toFixed(1)}%`}
                                        />
                                    ) : (
                                        <div className="text-gray-400 text-xs sm:text-sm">No data available</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-base sm:text-lg font-semibold text-white mb-3">Other Build Options</h3>
                            <div className="flex flex-wrap gap-2 sm:gap-4">
                                {championData.itemOptions && championData.itemOptions.length > 0 ? (
                                    championData.itemOptions.map((item, index) => (
                                        <ItemTooltip 
                                            key={index}
                                            itemId={item.id} 
                                            version={version}
                                            showPercentage={true}
                                            percentage={`${((item.count / championData.gamesPlayed) * 100).toFixed(1)}%`}
                                        />
                                    ))
                                ) : (
                                    <div className="text-gray-400 text-xs sm:text-sm">No data available</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}