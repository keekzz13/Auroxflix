import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Home from './pages/browse/Home.jsx';
import Movies from './pages/browse/Movies.jsx';
import Tv from './pages/browse/Tv.jsx';
import Details from './pages/details/Details.jsx';
import CastDetails from './pages/details/CastDetails.jsx';
import Watchlist from './pages/Watchlist.jsx';
import Search from './pages/Search.jsx';
import Ios from './pages/misc/Ios.jsx';
import Xprime from './pages/embeds/xprime.jsx';
import Zenime from './pages/embeds/zenime.jsx';
import AnimeHome from './pages/anime/home.jsx';
import AnimeDetails from './pages/anime/details.jsx';
import AnimeSearch from './pages/anime/search.jsx';
import NotFound from './pages/404.jsx';
// import OpenSource from './pages/OpenSource.jsx'; // Removed as file deleted
import QuickSearch from './components/QuickSearch.jsx';
import Filter from './pages/browse/Filter.jsx';
import Login from './pages/auth/Login.jsx';
import Signup from './pages/auth/Signup.jsx';
import ContinueWatching from './pages/browse/ContinueWatching.jsx';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/tv" element={<Tv />} />
        <Route path="/filter" element={<Filter />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/continue-watching" element={<ContinueWatching />} />
        <Route path="/movie/:tmdbId" element={<Details />} />
        <Route path="/tv/:tmdbId" element={<Details />} />
        <Route path="/person/:personId" element={<CastDetails />} />
        <Route path="/anime" element={<AnimeHome />} />
        <Route path="/anime/search" element={<AnimeSearch />} />
        <Route path="/anime/:id" element={<AnimeDetails />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/search" element={<Search />} />
        <Route path="/ios" element={<Ios />} />
        <Route path="/e/fox/:tmdbid" element={<Xprime />} />
        <Route path="/e/fox/:tmdbid/:season/:episode" element={<Xprime />} />
        <Route path="/e/zenime/:episodeId/:server/:type" element={<Zenime />} />
        {/* Removed /opensource route */}
        {/* <Route path="/opensource" element={<OpenSource />} /> */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <QuickSearch />
      <Toaster 
        position="bottom-center"
        theme="dark"
        duration={3000}
        unstyled
        closeButton
      />
    </Router>
  )
}
