import { use, useState } from 'react';
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
    const [games, setGames] = useState(10);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    async function fetchSummonerData(update = false) {
        try {
            const summonerResponse = await fetch(`${API_URL}/summoner/${region}/${gameName}/${tag}${update ? '?update=true' : ''}`)
            const summonerData = await summonerResponse.json()
            if (!summonerResponse.ok) {
                throw new Error(summonerData.detail || 'Failed to fetch summoner data')
            }
            setSummonerData(summonerData);
            return summonerData;
        } catch (error) {
            setError(error.message)
        }
    }

    async function fetchMatchHistory(region, puuid, games, update = false) {
        try{
            const matchResponse = await fetch(`${API_URL}/match/${region}/${puuid}/${games}${update ? '?update=true' : ''}`)
            const matchData = await matchResponse.json()
            if (!matchResponse.ok) {
                throw new Error(matchData.detail || 'Failed to fetch match history')
            }
            setMatchHistory(matchData);
        }
        catch (error) {
            setError(error.message)
        }
    }

    async function fetchSumStatData(puuid, update = false) {
        try{
            const summStatResponse = await fetch(`${API_URL}/summoner/champstats/${puuid}${update ? '?update=true' : ''}`)
            const summStatData = await summStatResponse.json()
            if (!summStatResponse.ok) {
                throw new Error(summStatData.detail || 'Failed to fetch summoner stats')
            }
            setSummStatData(summStatData);
        }
        catch (error) {
            setError(error.message)
        }
    }

    async function fetchAllData(update = false, gamesCount = games) {
        try {
            const summonerData = await fetchSummonerData(update);
            
            if (summonerData && summonerData.puuid) {
                await Promise.all([
                    fetchMatchHistory(region, summonerData.puuid, gamesCount, update),
                    fetchSumStatData(summonerData.puuid, update)
                ]);
            }
        } catch (error) {
            setError(error.message);
        }
    }

    useEffect(() => {
        setSummonerData(null);
        setMatchHistory(null);
        setSummStatData(null);
        setError(null);
        setGames(10);
        
        fetchAllData(false, 10);
    }, [region, gameName, tag]);

    useEffect(() => {
        if (summonerData?.puuid && games > 10) {
            fetchMatchHistory(region, summonerData.puuid, games);
        }
    }, [games, summonerData?.puuid, region]);

    const incrementGames = () => {
        setGames(prevGames => prevGames + 10);
    }

    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <>
            <SummonerDisplay
                summonerData={summonerData}
                onUpdate={() => fetchAllData(true)}
            />
            <SummStatDisplay summStatData={summStatData} />
            <MatchHistory matches={matchHistory} puuid={summonerData?.puuid} onIncrement={incrementGames} />
        </>
    )
}