import { useState } from 'react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SummonerDisplay from './SummonerDisplay.jsx';
import MatchHistory from './MatchHistory.jsx';

export default function DisplaySearch() {
    const { region, gameName, tag } = useParams();
    const [summonerData, setSummonerData] = useState(null);
    const [matchHistory, setMatchHistory] = useState(null);
    const [error, setError] = useState(null);

    async function fetchSummonerData(update = false) {
        try {
            const summonerResponse = await fetch(`http://localhost:8000/summoner/${region}/${gameName}/${tag}${update ? '?update=true' : ''}`)
            const summonerData = await summonerResponse.json()
            if (!summonerResponse.ok) {
                throw new Error(summonerData.detail || 'Failed to fetch summoner data')
            }
            setSummonerData(summonerData);

            const matchResponse = await fetch(`http://localhost:8000/match/${region}/${summonerData.puuid}${update ? '?update=true' : ''}`)
            const matchData = await matchResponse.json()
            if (!matchResponse.ok) {
                throw new Error(matchData.detail || 'Failed to fetch match history')
            }
            setMatchHistory(matchData);

        } catch (error) {
            setError(error.message)
        }
    }

    useEffect(() => {
        setError(null);
        setSummonerData(null);
        setMatchHistory(null);
        fetchSummonerData();
    }, [region, gameName, tag]);

    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <>
            <SummonerDisplay
                summonerData={summonerData}
                onUpdate={() => fetchSummonerData(true)}
            />
            <MatchHistory matches={matchHistory} />
        </>
    )
}