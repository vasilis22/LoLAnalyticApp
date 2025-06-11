import { useState } from 'react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SummonerDisplay from './SummonerDisplay.jsx';
import MatchHistory from './MatchHistory.jsx';
    
export default function DisplaySearch(){
    const { region, gameName, tag} = useParams();
    const [summonerData, setSummonerData] = useState(null);
    const [matchHistory, setMatchHistory] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchSummonerData() {
            setError(null);
            setSummonerData(null);
            setMatchHistory(null);
            try {
                const summonerResponse = await fetch(`http://localhost:8000/summoner/${region}/${gameName}/${tag}`)
                const summonerData = await summonerResponse.json()
                if (!summonerResponse.ok) {
                    throw new Error(summonerData.detail || 'Failed to fetch summoner data')
                }
                setSummonerData(summonerData);

                const matchResponse = await fetch(`http://localhost:8000/match/${region}/${summonerData.puuid}`)
                const matchData = await matchResponse.json()
                if (!matchResponse.ok) {
                    throw new Error(matchData.detail || 'Failed to fetch match history')
                }
                setMatchHistory(matchData);
                
            } catch (error) {
                setError(error.message)
            }
        }
        fetchSummonerData();
    }, [region, gameName, tag]);

    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <>
        <SummonerDisplay summonerData={summonerData} />
        <MatchHistory matches={matchHistory} />
        </>
    )
}