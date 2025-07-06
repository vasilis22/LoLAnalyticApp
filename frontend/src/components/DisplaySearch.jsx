import { useState } from 'react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SummonerDisplay from './SummonerDisplay.jsx';
import MatchHistory from './MatchHistory.jsx';
import SummStatDisplay from './SummStatDisplay.jsx';

export default function DisplaySearch() {
    const { region, gameName, tag } = useParams();
    const [summonerData, setSummonerData] = useState(null);
    const [matchHistory, setMatchHistory] = useState(null);
    const [summStatData, setSummStatData] = useState(null);
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

            const summStatResponse = await fetch(`http://localhost:8000/summoner/champstats/${summonerData.puuid}${update ? '?update=true' : ''}`)
            const summStatData = await summStatResponse.json()
            if (!summStatResponse.ok) {
                throw new Error(summStatData.detail || 'Failed to fetch summoner stats')
            }
            setSummStatData(summStatData);

        } catch (error) {
            setError(error.message)
        }
    }

    useEffect(() => {
        setError(null);
        setSummonerData(null);
        setMatchHistory(null);
        setSummStatData(null);
        fetchSummonerData();
    }, [region, gameName, tag]);

    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <>
            <SummonerDisplay
                summonerData={summonerData}
                onUpdate={() => fetchSummonerData(true)}
            />
            <SummStatDisplay summStatData={summStatData} />
            <MatchHistory matches={matchHistory} puuid={summonerData?.puuid} />
        </>
    )
}