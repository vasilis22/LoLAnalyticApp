import { useState } from 'react';
import Layout from './components/Layout';
import SearchBar from './components/SearchBar';
import ChampionTierList from './components/ChampionTierList';
import SummonerDisplay from './components/SummonerDisplay';
import MatchHistory from './components/MatchHistory';
import './App.css';

export default function App() {
    const [showTierList, setShowTierList] = useState(true);
    const [summonerData, setSummonerData] = useState(null);
    const [matchHistory, setMatchHistory] = useState(null);

    function handleSummonerFound(summoner, matches){
        setSummonerData(summoner);
        setMatchHistory(matches);
        setShowTierList(false);
    };

    function handleTierlistClick(){
        setShowTierList(true);
    };

    return (
        <Layout>
            <SearchBar onSummonerFound={handleSummonerFound} onTierlistClick={handleTierlistClick} />
            
            {showTierList ? (
                <ChampionTierList />
            ) : (
                <>
                    {summonerData && <SummonerDisplay summonerData={summonerData} />}
                    {matchHistory && <MatchHistory matches={matchHistory} />}
                </>
            )}
        </Layout>
    );
}