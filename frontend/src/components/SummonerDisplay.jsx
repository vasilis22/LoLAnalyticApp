import IronIcon from '../assets/Ranked Emblems Latest/Rank=Iron.png';
import BronzeIcon from '../assets/Ranked Emblems Latest/Rank=Bronze.png';
import SilverIcon from '../assets/Ranked Emblems Latest/Rank=Silver.png';
import GoldIcon from '../assets/Ranked Emblems Latest/Rank=Gold.png';
import PlatinumIcon from '../assets/Ranked Emblems Latest/Rank=Platinum.png';
import EmeraldIcon from '../assets/Ranked Emblems Latest/Rank=Emerald.png';
import DiamondIcon from '../assets/Ranked Emblems Latest/Rank=Diamond.png';
import MasterIcon from '../assets/Ranked Emblems Latest/Rank=Master.png';
import GrandmasterIcon from '../assets/Ranked Emblems Latest/Rank=Grandmaster.png';
import ChallengerIcon from '../assets/Ranked Emblems Latest/Rank=Challenger.png';

function getRankIcon(tier) {
    const icons = {
        'IRON': IronIcon,
        'BRONZE': BronzeIcon,
        'SILVER': SilverIcon,
        'GOLD': GoldIcon,
        'PLATINUM': PlatinumIcon,
        'EMERALD': EmeraldIcon,
        'DIAMOND': DiamondIcon,
        'MASTER': MasterIcon,
        'GRANDMASTER': GrandmasterIcon,
        'CHALLENGER': ChallengerIcon
    };
    return icons[tier];
};

export default function SummonerDisplay({ summonerData, onUpdate}) {
    if (!summonerData) return null;

    return (
        <div className="mt-8 p-6 bg-gray-700 rounded-lg shadow-xl max-w-4xl mx-auto text-white">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-600">
                <h2 className="text-2xl font-bold">
                    {summonerData.game_name}#{summonerData.tagline}
                </h2>
                <button
                    onClick={onUpdate}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition-colors"
                >
                    Update
                </button>
            </div>

            <div className="flex items-center gap-8">
                <div className="flex flex-col items-center min-w-[200px]">
                    <img 
                        src={`https://ddragon.leagueoflegends.com/cdn/15.7.1/img/profileicon/${summonerData.profile_icon_id}.png`}
                        alt="Summoner Icon"
                        className="w-24 h-24 rounded-full border-4 border-gray-600"
                    />
                    <p className="text-gray-300 mt-4">Level {summonerData.summoner_level}</p>
                </div>

                <div className="flex flex-1 gap-8">
                    <div className="flex-1 p-6 rounded min-w-[300px]">
                        <h3 className="text-xl font-semibold mb-4">Ranked Solo</h3>
                        {summonerData.ranked_solo ? (
                            <div className="flex items-center gap-6">
                                <img 
                                    src={getRankIcon(summonerData.ranked_solo.tier)}
                                    alt={`${summonerData.ranked_solo.tier} Rank`}
                                    className="w-24 h-24"
                                />
                                <div className="flex-1">
                                    <p className="text-lg">{summonerData.ranked_solo.tier} {summonerData.ranked_solo.rank}</p>
                                    <p className="text-gray-400">{summonerData.ranked_solo.leaguePoints} LP</p>
                                    <p className="mt-2">
                                        {summonerData.ranked_solo.wins}W {summonerData.ranked_solo.losses}L
                                        ({(summonerData.ranked_solo.wins / (summonerData.ranked_solo.wins + summonerData.ranked_solo.losses) * 100).toFixed(0)}%)
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400">Unranked</p>
                        )}
                    </div>

                    <div className="flex-1 p-6 rounded min-w-[300px]">
                        <h3 className="text-xl font-semibold mb-4">Ranked Flex</h3>
                        {summonerData.ranked_flex ? (
                            <div className="flex items-center gap-6">
                                <img 
                                    src={getRankIcon(summonerData.ranked_flex.tier)}
                                    alt={`${summonerData.ranked_flex.tier} Rank`}
                                    className="w-24 h-24"
                                />
                                <div className="flex-1">
                                    <p className="text-lg">{summonerData.ranked_flex.tier} {summonerData.ranked_flex.rank}</p>
                                    <p className="text-gray-400">{summonerData.ranked_flex.leaguePoints} LP</p>
                                    <p className="mt-2">
                                        {summonerData.ranked_flex.wins}W {summonerData.ranked_flex.losses}L
                                        ({(summonerData.ranked_flex.wins / (summonerData.ranked_flex.wins + summonerData.ranked_flex.losses) * 100).toFixed(0)}%)
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400">Unranked</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}