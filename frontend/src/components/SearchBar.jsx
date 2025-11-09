import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function SearchBar() {
    const [summonerName, setSummonerName] = useState('')
    const [selectedRegion, setSelectedRegion] = useState('eun1')
    const navigate = useNavigate()

    function handleSearch(e) {
        e.preventDefault()
        const [gameName, tag] = summonerName.split('#')
        navigate(`/summoner/${selectedRegion}/${gameName}/${tag}`)
    }

    return (
        <div className="flex flex-col items-center">
            <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-800 p-3 sm:p-5 w-full gap-3 sm:gap-0">
                <div className="w-full sm:w-auto">
                    <Link to="/" className="block w-full sm:w-auto text-center px-3 sm:px-4 py-2 text-sm sm:text-lg text-white bg-blue-500 rounded hover:bg-blue-600">Tierlist</Link>
                </div>
                <form className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Gamename#tag"
                        value={summonerName}
                        onChange={(e) => setSummonerName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch(e)
                            }
                        }}
                        className="w-full sm:w-auto sm:mr-4 p-2 text-sm sm:text-lg rounded border bg-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex flex-row gap-2 w-full sm:w-auto">
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="flex-1 sm:flex-initial sm:mr-4 p-2 text-sm sm:text-lg rounded border bg-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="eun1">EUN1</option>
                            <option value="euw1">EUW1</option>
                            <option value="br1">BR1</option>
                            <option value="jp1">JP1</option>
                            <option value="kr">KR</option>
                            <option value="la1">LA1</option>
                            <option value="la2">LA2</option>
                            <option value="na1">NA1</option>
                            <option value="oc1">OC1</option>
                            <option value="tr1">TR1</option>
                            <option value="ru">RU</option>
                        </select>
                        <button
                            onClick={handleSearch}
                            className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-sm sm:text-lg text-white bg-blue-500 rounded hover:bg-blue-600"
                        >
                            Search
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}