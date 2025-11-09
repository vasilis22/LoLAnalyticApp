import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchLatestVersion } from '../utils/version';

export default function ChampionTierList() {
    const [champions, setChampions] = useState({});
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('winRate');
    const [roleFilter, setRoleFilter] = useState('All');
    const [version, setVersion] = useState('15.13.1');
    const [sortedChampions, setSortedChampions] = useState([]);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const getWinRateColor = (winRate) => {
        const percentage = winRate * 100;
        if (percentage < 40) return 'text-red-500';
        if (percentage < 45) return 'text-yellow-500';
        if (percentage <= 50) return 'text-green-500';
        return 'text-gray-400';
    };

    const getWinRateBorder = (winrate) => {
        const percentage = winrate * 100;
        if (percentage < 40) return 'hover:border-red-500';
        if (percentage < 45) return 'hover:border-yellow-500';
        if (percentage <= 50) return 'hover:border-green-500';
        return 'hover:border-gray-400';
    }

    useEffect(() => {
        async function fetchChampionData() {
            try {
                const response = await fetch(`${API_URL}/champions/statistics`);
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.detail || 'Failed to fetch champion data');
                }
                
                setChampions(data.champions);
            } catch (err) {
                setError(err.message);
            }
        }
        
        fetchChampionData();
    }, []);

    useEffect(() => {
        async function fetchVersion() {
            const latestVersion = await fetchLatestVersion();
            setVersion(latestVersion);
        }
        fetchVersion();
    }, []);

    useEffect(() => {
        const sorted = Object.values(champions).sort((a, b) => b[sortBy] - a[sortBy]);
        setSortedChampions(sorted);
    }, [champions, sortBy]);

    if (error) return <div className="text-red-500 p-4">{error}</div>;

    return (
        <div className="bg-gray-600 min-h-screen text-white">
            <div className="container mx-auto p-3 sm:p-4">
                <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-gray-700 text-white rounded p-2 text-sm sm:text-base w-full sm:w-auto"
                    >
                        <option value="winRate">Win Rate</option>
                        <option value="pickRate">Pick Rate</option>
                        <option value="banRate">Ban Rate</option>
                    </select>

                    <select 
                        value={roleFilter} 
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-gray-700 text-white rounded p-2 text-sm sm:text-base w-full sm:w-auto"
                    >
                        <option value="All">All Roles</option>
                        <option value="Fighter">Fighter</option>
                        <option value="Tank">Tank</option>
                        <option value="Mage">Mage</option>
                        <option value="Assassin">Assassin</option>
                        <option value="Marksman">Marksman</option>
                        <option value="Support">Support</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {sortedChampions
                        .filter(champ => roleFilter === 'All' || champ.roles.includes(roleFilter))
                        .map(champion => (
                            <Link
                                to={`/champions/${champion.id}`}
                                state={{ championData: champion}}
                                key={champion.id} 
                                className="bg-gray-800 p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row items-center gap-3 sm:gap-4"
                            >
                                <img 
                                    src={champion.image} 
                                    alt={champion.name} 
                                    className="w-14 h-14 sm:w-16 sm:h-16"
                                />
                                <div className="flex-1 max-w-xs text-center sm:text-left">
                                    <h3 className="text-lg sm:text-xl font-bold text-white">{champion.name}</h3>
                                    <p className="text-sm sm:text-base text-gray-400 truncate">{champion.title}</p>
                                </div>
                                
                                <div className="flex-1 w-full sm:w-auto">
                                    <h1 className="text-sm sm:text-base font-semibold text-white mb-2 text-center">Countered By</h1>
                                    <div className="flex flex-wrap gap-2 sm:gap-4 justify-center">
                                        {champion.worstMatchups
                                            .filter (matchup => matchup.win_rate < 0.5)
                                            .map((matchup, index) => (
                                                <Link
                                                    key={index}
                                                    to={`/champions/${matchup.champion}`}
                                                    className="flex flex-col items-center hover:opacity-80 transition-opacity flex-shrink-0"
                                                >
                                                    <img 
                                                        src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${matchup.champion}.png`}
                                                        alt={matchup.champion}
                                                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 border-transparent ${getWinRateBorder(matchup.win_rate)} transition-all`}
                                                    />
                                                    <span className={`text-xs sm:text-sm font-semibold mt-1 ${getWinRateColor(matchup.win_rate)}`}>
                                                        {(matchup.win_rate * 100).toFixed(1)}%
                                                    </span>
                                                </Link>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4 sm:gap-8 w-full sm:w-auto justify-around sm:justify-start">
                                    <div className="text-center">
                                        <p className="text-xs sm:text-sm text-gray-400">Win Rate</p>
                                        <p className="text-sm sm:text-base text-white font-semibold">{(champion.winRate * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs sm:text-sm text-gray-400">Pick Rate</p>
                                        <p className="text-sm sm:text-base text-white font-semibold">{(champion.pickRate * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs sm:text-sm text-gray-400">Ban Rate</p>
                                        <p className="text-sm sm:text-base text-white font-semibold">{(champion.banRate * 100).toFixed(1)}%</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                </div>
            </div>
        </div>
    );
}