import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ChampionTierList() {
    const [champions, setChampions] = useState({});
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('winRate');
    const [roleFilter, setRoleFilter] = useState('All');

    useEffect(() => {
        async function fetchChampionData() {
            try {
                const response = await fetch('http://localhost:8000/champions/statistics');
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

    console.log(champions);

    if (error) return <div className="text-red-500">{error}</div>;

    if (!champions) return null;

    const sortedChampions = Object.values(champions).sort((a, b) => b[sortBy] - a[sortBy]);

    console.log("Sorted Champions:", sortedChampions);

    return (
        <div className="bg-gray-600 min-h-screen text-white">
            <div className="container mx-auto p-4">
                <div className="mb-4 flex gap-4">
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-gray-700 text-white rounded p-2"
                    >
                        <option value="winRate">Win Rate</option>
                        <option value="pickRate">Pick Rate</option>
                        <option value="banRate">Ban Rate</option>
                    </select>

                    <select 
                        value={roleFilter} 
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-gray-700 text-white rounded p-2"
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

                <div className="grid grid-cols-1 gap-4">
                    {sortedChampions
                        .filter(champ => roleFilter === 'All' || champ.roles.includes(roleFilter))
                        .map(champion => (
                            <Link
                                to={`/champions/${champion.id}`}
                                state={{ championData: champion}}
                                key={champion.id} 
                                className="bg-gray-800 p-4 rounded-lg flex items-center gap-4"
                            >
                                <img 
                                    src={champion.image} 
                                    alt={champion.name} 
                                    className="w-16 h-16"
                                />
                                <div className="flex-1 max-w-xs">
                                    <h3 className="text-xl font-bold text-white">{champion.name}</h3>
                                    <p className="text-gray-400">{champion.title}</p>
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex gap-4 justify-center">
                                        {champion.worstMatchups
                                            .filter (matchup => matchup.win_rate < 0.5)
                                            .map((matchup, index) => (
                                                <div key={index} className="flex flex-col items-center">
                                                    <img 
                                                        src={`https://ddragon.leagueoflegends.com/cdn/15.7.1/img/champion/${matchup.champion}.png`}
                                                        alt={matchup.champion}
                                                        className="w-12 h-12"
                                                    />
                                                    <span className="text-sm text-red-500 mt-1">
                                                        {(matchup.win_rate * 100).toFixed(2)}%
                                                    </span>
                                                </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-8">
                                    <div className="text-center">
                                        <p className="text-gray-400">Win Rate</p>
                                        <p className="text-white">{(champion.winRate * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-gray-400">Pick Rate</p>
                                        <p className="text-white">{(champion.pickRate * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-gray-400">Ban Rate</p>
                                        <p className="text-white">{(champion.banRate * 100).toFixed(1)}%</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                </div>
            </div>
        </div>
    );
}