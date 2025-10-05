import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTmdb, getTmdbImage, formatReleaseDate } from '../../utils.jsx';
import { ArrowLeft, Calendar, MapPin, Star, ExternalLink } from 'lucide-react';
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import { SpotlightSkeleton, CategorySkeleton } from '../../components/Skeletons.jsx';
import { MediaCard } from './Cards.jsx';

const CastDetails = () => {
  const { personId } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [credits, setCredits] = useState({ cast: [], crew: [] });
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('movies');

  useEffect(() => {
    const loadPersonData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch person details
        const personDetails = await fetchTmdb(`/person/${personId}?language=en-US&append_to_response=images,external_ids`);
        setPerson(personDetails);
        
        // Fetch person credits
        const creditsData = await fetchTmdb(`/person/${personId}/combined_credits?language=en-US`);
        setCredits(creditsData);
        
        // Set images
        setImages(personDetails.images?.profiles || []);
        
      } catch (err) {
        setError(err.message);
        console.error('Error loading person data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (personId) {
      loadPersonData();
    }
  }, [personId]);

  const calculateAge = (birthday, deathday = null) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const endDate = deathday ? new Date(deathday) : new Date();
    const age = endDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = endDate.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getPopularCredits = (type) => {
    const items = type === 'movies' 
      ? credits.cast?.filter(item => item.media_type === 'movie') || []
      : credits.cast?.filter(item => item.media_type === 'tv') || [];
    
    return items
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 20);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  if (isLoading || !person) {
    return (
      <div className="min-h-screen bg-[#090a0a]">
        <Header />
        <SpotlightSkeleton />
      </div>
    );
  }

  const age = calculateAge(person.birthday, person.deathday);
  const profileImage = getTmdbImage(person.profile_path, 'w500');
  const backdropImage = images.length > 0 ? getTmdbImage(images[0].file_path, 'original') : null;

  return (
    <div className="min-h-screen bg-[#090a0a] pb-12">
      <Header />
      
      {/* Hero Section */}
      <div className="relative w-full h-[70vh] bg-cover bg-center bg-no-repeat flex items-end animate-slide-up" 
           style={{backgroundImage: backdropImage ? `url('${backdropImage}')` : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'}}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#090a0a]/90 via-black/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0a]/90 via-black/40 to-transparent"></div>

        {/* Content */}
        <div className="relative z-10 p-8 w-full flex flex-col md:flex-row items-end gap-8">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            <div className="w-48 h-72 rounded-lg overflow-hidden bg-gray-600 animate-fade-in">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  No Image
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-fade-in-delayed">
              {person.name}
            </h1>
            
            {/* Basic Info */}
            <div className="flex flex-wrap items-center gap-4 mb-6 animate-fade-in-delayed-2 justify-center md:justify-start">
              {person.known_for_department && (
                <span className="bg-gradient-to-r from-[#90cea1] to-[#01b4e4] text-black px-3 py-1 rounded-full font-semibold text-sm">
                  {person.known_for_department}
                </span>
              )}
              {age && (
                <div className="flex items-center gap-1 text-neutral-300">
                  <Calendar className="w-4 h-4" />
                  <span>{age} years old</span>
                </div>
              )}
              {person.place_of_birth && (
                <div className="flex items-center gap-1 text-neutral-300">
                  <MapPin className="w-4 h-4" />
                  <span>{person.place_of_birth}</span>
                </div>
              )}
            </div>

            {/* Biography */}
            {person.biography && (
              <p className="text-white text-lg leading-7 max-w-4xl line-clamp-4 animate-fade-in-delayed-3">
                {person.biography}
              </p>
            )}

            {/* External Links */}
            {person.external_ids && (
              <div className="flex gap-4 mt-6 animate-fade-in-delayed-4 justify-center md:justify-start">
                {person.external_ids.imdb_id && (
                  <a 
                    href={`https://www.imdb.com/name/${person.external_ids.imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/15 text-white px-4 py-2 rounded-full hover:bg-white/25 transition-all flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    IMDb
                  </a>
                )}
                {person.external_ids.instagram_id && (
                  <a 
                    href={`https://www.instagram.com/${person.external_ids.instagram_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/15 text-white px-4 py-2 rounded-full hover:bg-white/25 transition-all flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Instagram
                  </a>
                )}
                {person.external_ids.twitter_id && (
                  <a 
                    href={`https://twitter.com/${person.external_ids.twitter_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/15 text-white px-4 py-2 rounded-full hover:bg-white/25 transition-all flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Twitter
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <div className="px-8 py-8">

        {/* Filmography Tabs */}
        <div className="mb-6">
          <div className="flex gap-4 border-b border-white/20">
            <button
              onClick={() => setActiveTab('movies')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'movies' 
                  ? 'text-white border-b-2 border-white' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Movies ({getPopularCredits('movies').length})
            </button>
            <button
              onClick={() => setActiveTab('tv')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'tv' 
                  ? 'text-white border-b-2 border-white' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              TV Shows ({getPopularCredits('tv').length})
            </button>
          </div>
        </div>

        {/* Filmography Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {getPopularCredits(activeTab).map((item, index) => (
            <div key={`${item.id}-${item.credit_id}`} className="animate-stagger" style={{animationDelay: `${index * 100}ms`}}>
              <MediaCard item={item} variant="grid" />
              <div className="mt-2">
                <p className="text-neutral-400 text-sm">
                  {item.character && `as ${item.character}`}
                  {item.job && `${item.character ? ' • ' : ''}${item.job}`}
                </p>
                {(item.release_date || item.first_air_date) && (
                  <p className="text-neutral-500 text-xs">
                    {formatReleaseDate(item.release_date || item.first_air_date)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {getPopularCredits(activeTab).length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-400">No {activeTab} found for this person.</p>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default CastDetails;
