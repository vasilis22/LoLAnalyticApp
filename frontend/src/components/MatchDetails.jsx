import Overview from './Overview';
import Charts from './Charts';
import { useState, useEffect } from 'react';

export default function MatchDetails({ match, player }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [timelineData, setTimelineData] = useState(null);
    const [error, setError] = useState(null);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    useEffect(() => {
        async function fetchTimeline() {
            try {
                const response = await fetch(`${API_URL}/timeline/${match.match_id}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || 'Failed to fetch timeline data');
                }

                setTimelineData(data);
            } catch (err) {
                setError(err.message);
            }
        }

        fetchTimeline();
    }, [match.match_id]);

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'Charts', label: 'Charts' }
    ];

    return (
        <div className="mt-2 p-4 bg-gray-800/50 rounded-lg">
            <div className="flex gap-4 border-b border-gray-700 mb-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-2 px-4 text-white hover:text-blue-400 transition-colors ${activeTab === tab.id
                            ? 'border-b-2 border-blue-500 text-blue-400'
                            : 'text-gray-400'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {error ? (
                <div className="text-red-400">{error}</div>
            ) : (
                <div className="text-white">
                    {activeTab === 'overview' && <Overview match={match} player={player} timelineData={timelineData} />}
                    {activeTab === 'Charts' && <Charts match={match.match_data} timelineData={timelineData} player={player} />}
                </div>
            )}
        </div>
    );
}