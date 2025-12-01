import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import SummonerDisplay from './SummonerDisplay.jsx';
import MatchHistory from './MatchHistory.jsx';
import SummStatDisplay from './SummStatDisplay.jsx';
import ErrorMessage from './ErrorMessage.jsx';

export default function DisplaySearch() {
    const { region, gameName, tag } = useParams();
    const [summonerData, setSummonerData] = useState(null);
    const [matchHistory, setMatchHistory] = useState(null);
    const [summStatData, setSummStatData] = useState(null);
    const [error, setError] = useState(null);
    const [games, setGames] = useState(10);
    const [queue_id, setQueueId] = useState(420);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const location = useLocation();
    const searchId = location.state?.searchId;

    async function fetchSummonerData(update = false) {
        try {
            const summonerResponse = await fetch(`${API_URL}/summoner/${region}/${gameName}/${tag}${update ? '?update=true' : ''}`)
            const summonerData = await summonerResponse.json()
            if (!summonerResponse.ok) {
                setError({
                    status: summonerResponse.status,
                    message: summonerData.detail || 'Failed to fetch summoner data'
                });
                return;
            }
            setSummonerData(summonerData);
            return summonerData;
        } catch (error) {
            setError({
                status: 500,
                message: error.message
            });
        }
    }

    async function fetchMatchHistory(region, puuid, games, update = false) {
        try{
            const params = new URLSearchParams();
            if (update) {
                params.append('update', 'true');
            }
            if (queue_id) {
                params.append('queue_id', queue_id);
            }
            const url = `${API_URL}/match/${region}/${puuid}/${games}?${params.toString()}`;
            const matchResponse = await fetch(url)
            const matchData = await matchResponse.json()
            if (!matchResponse.ok) {
                setError({
                    status: matchResponse.status,
                    message: matchData.detail || 'Failed to fetch match history'
                });
                return;
            }
            setMatchHistory(matchData);
        }
        catch (error) {
            setError({
                status: 500,
                message: error.message
            });
        }
    }

    async function fetchSumStatData(puuid, update = false) {
        try{
            const summStatResponse = await fetch(`${API_URL}/summoner/champstats/${puuid}${update ? '?update=true' : ''}`)
            const summStatData = await summStatResponse.json()
            if (!summStatResponse.ok) {
                setError({
                    status: summStatResponse.status,
                    message: summStatData.detail || 'Failed to fetch summoner stats'
                });
                return;
            }
            setSummStatData(summStatData);
        }
        catch (error) {
            setError({
                status: 500,
                message: error.message
            });
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
            setError({
                status: 500,
                message: error.message
            });
        }
    }

    useEffect(() => {
        setSummonerData(null);
        setMatchHistory(null);
        setSummStatData(null);
        setError(null);
        setGames(10);
        
        fetchAllData(false, 10);
    }, [region, gameName, tag, searchId]);

    useEffect(() => {
        if (summonerData?.puuid && games > 10) {
            fetchMatchHistory(region, summonerData.puuid, games);
        }
    }, [games, summonerData?.puuid, region]);

    useEffect(() => {
        if (summonerData?.puuid) {
            fetchMatchHistory(region, summonerData.puuid, games);
        }
    }, [queue_id]);

    const incrementGames = () => {
        setGames(prevGames => prevGames + 10);
    }

    if (error) return <ErrorMessage message={error} />;

    return (
        <>
            <SummonerDisplay
                summonerData={summonerData}
                onUpdate={() => fetchAllData(true)}
            />
            <SummStatDisplay summStatData={summStatData} />
            <MatchHistory matches={matchHistory} puuid={summonerData?.puuid} onIncrement={incrementGames} onQueueChange={setQueueId} queue_id={queue_id} />
        </>
    )
}