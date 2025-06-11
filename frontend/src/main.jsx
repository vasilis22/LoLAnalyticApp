import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import SearchBar from './components/SearchBar.jsx'
import ChampionTierList from './components/ChampionTierList.jsx'
import DisplaySearch from './components/DisplaySearch.jsx'
import ChampionDetails from './components/ChampionDetails.jsx'

const router = createBrowserRouter([
  {path: '/', element: 
    <div className="bg-gray-600 min-h-screen">
      <SearchBar />
      <ChampionTierList />
    </div>
  },
  {path: '/summoner/:region/:gameName/:tag', element: 
    <div className="bg-gray-600 min-h-screen">
      <SearchBar />
      <DisplaySearch />
    </div>
  },
  {path: '/champions/:championId', element:
    <div className="bg-gray-600 min-h-screen">
      <SearchBar />
      <ChampionDetails />
    </div>
  }
  ])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
