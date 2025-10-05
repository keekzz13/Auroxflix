"use client"

import { useState, useEffect } from "react"
import { Play, Plus, Check } from 'lucide-react'
import {
  getTmdbImage,
  fetchTmdb,
  calculateProgressPercent,
  getRemainingTime,
  getImagePath,
  hasEnglishBackdrop,
  getLogoPath,
  isInWatchlist,
  toggleWatchlist,
} from "../utils.jsx"

const CarouselItem = ({
  item,
  variant = "default",
  episodeNumber,
  usePoster = false,
  hideImages = false,
  totalEpisodes = 0,
}) => {
  const [detailedItem, setDetailedItem] = useState(item)
  const [loading, setLoading] = useState(true)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const mediaType = variant === "continue" ? item.mediaType : item.media_type || (item.first_air_date ? "tv" : "movie")
  const title = item.title || item.name
  const releaseDate = item.release_date || item.first_air_date
  const formattedDate = releaseDate ? new Date(releaseDate).getFullYear() : ""

  const progressPercent = variant === "continue" ? calculateProgressPercent(item.watchedDuration, item.fullDuration) : 0

  useEffect(() => {
    if (variant === "episode") return

    const fetchDetailedData = async () => {
      try {
        const detailRoute = `/${mediaType}/${item.id}?append_to_response=images,content_ratings,release_dates&language=en-US&include_image_language=en`
        const detailed = await fetchTmdb(detailRoute)
        setDetailedItem(detailed)
      } catch (error) {
        console.error(error)
        setDetailedItem(item)
      } finally {
        setLoading(false)
      }
    }

    fetchDetailedData()
  }, [item, mediaType])

  useEffect(() => {
    if (item && item.id) {
      setInWatchlist(isInWatchlist(item.id))
    }
  }, [item])

  const imagePath = usePoster ? detailedItem.poster_path || item.poster_path : getImagePath(detailedItem, item)

  const shouldShowImage = !hideImages && totalEpisodes <= 100 && imagePath
  if (!imagePath && variant !== "episode") return null

  const isUsingPosterFallback =
    !usePoster &&
    (!detailedItem.images?.backdrops || detailedItem.images.backdrops.length === 0) &&
    !detailedItem.backdrop_path &&
    !item.backdrop_path &&
    (imagePath === detailedItem.poster_path || imagePath === item.poster_path)

  const rating = detailedItem.vote_average?.toFixed(1) || item.vote_average?.toFixed(1) || "N/A"
  const runtime = detailedItem.runtime
    ? `${Math.floor(detailedItem.runtime / 60)}h ${detailedItem.runtime % 60}m`
    : detailedItem.number_of_seasons
      ? `${detailedItem.number_of_seasons} seasons`
      : ""

  const linkUrl =
    variant === "continue" && mediaType === "tv" && item.season && item.episode
      ? `/tv/${item.id}?season=${item.season}&episode=${item.episode}`
      : `/${mediaType}/${item.id}`

  const handleWatchlistToggle = (e) => {
    e.stopPropagation()
    const isAdded = toggleWatchlist(item)
    setInWatchlist(isAdded)
  }

  if (variant === "episode") {
    const logoPath = getLogoPath(detailedItem)
    const showOverlay = !hasEnglishBackdrop(detailedItem)

    return (
      <div
        className="block transition-all duration-500 hover:scale-[1.02] group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {shouldShowImage ? (
          <div
            className={`relative rounded-2xl overflow-hidden bg-cover bg-center shadow-xl group-hover:shadow-2xl transition-all duration-500 ${usePoster ? "aspect-[2/3] w-32 sm:w-40 md:w-auto" : "aspect-video"}`}
            style={{ backgroundImage: `url(${getTmdbImage(imagePath, "w500")})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

            {showOverlay && (
              <div className="absolute inset-0 flex items-center justify-center">
                {logoPath ? (
                  <img
                    src={getTmdbImage(logoPath, "w300") || "/placeholder.svg"}
                    alt={title}
                    className="w-[70%] max-h-[60%] object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <h2 className="text-white text-lg sm:text-xl md:text-3xl font-semibold text-center px-2 sm:px-4 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105">
                    {title}
                  </h2>
                )}
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-t from-black/90 to-transparent">
              <div className="flex items-center gap-2 sm:gap-3 text-white">
                <div className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-sm rounded-full group-hover:bg-white/30 transition-colors duration-300">
                  <Play className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" />
                </div>
                <span className="text-xs sm:text-sm font-medium">Play Episode {episodeNumber}</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`relative rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-gray-700/50 group-hover:border-gray-600/50 transition-all duration-500 ${usePoster ? "aspect-[2/3] w-32 sm:w-40 md:w-auto" : "aspect-video"}`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-3 sm:p-6">
                <div className="p-2 sm:p-4 bg-white/10 backdrop-blur-sm rounded-full mb-2 sm:mb-4 mx-auto w-fit group-hover:bg-white/20 transition-colors duration-300">
                  <Play className="w-4 h-4 sm:w-8 sm:h-8 text-white/80" fill="currentColor" />
                </div>
                <h2 className="text-white text-sm sm:text-lg font-semibold mb-1 sm:mb-2">Episode {episodeNumber}</h2>
                <p className="text-gray-400 text-xs sm:text-sm">No thumbnail available</p>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-t from-black/90 to-transparent">
              <div className="flex items-center gap-2 sm:gap-3 text-white">
                <div className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-sm rounded-full group-hover:bg-white/30 transition-colors duration-300">
                  <Play className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" />
                </div>
                <span className="text-xs sm:text-sm font-medium">Play Episode {episodeNumber}</span>
              </div>
            </div>
          </div>
        )}
        <div className="mt-2 sm:mt-4 space-y-1 sm:space-y-2">
          <p className="text-gray-400 text-xs sm:text-sm font-medium">Episode {episodeNumber}</p>
          <h3 className="text-white text-sm sm:text-lg font-semibold mb-2 sm:mb-3 line-clamp-2 group-hover:text-blue-300 transition-colors duration-300">
            {title}
          </h3>
          <p className="text-gray-300 text-xs sm:text-sm line-clamp-3 leading-relaxed">{item.overview || detailedItem.overview}</p>
        </div>
      </div>
    )
  }

  if (variant === "continue") {
    if (loading || !detailedItem || !imagePath) {
      return (
        <div className="flex-shrink-0 w-32 sm:w-40 md:w-96 h-32 sm:h-40 md:h-56 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl animate-pulse flex items-center justify-center shadow-xl">
          <div className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 border-2 sm:border-3 border-white/30 border-solid border-t-white rounded-full animate-spin"></div>
        </div>
      )
    }

    const timeRemaining = getRemainingTime(item.watchedDuration, item.fullDuration)
    const logoPath = getLogoPath(detailedItem)
    const showOverlay = !hasEnglishBackdrop(detailedItem)

    return (
      <div
        className="flex-shrink-0 w-32 sm:w-40 md:w-96 animate-scale-in group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <a
          href={linkUrl}
          className={`block relative rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:z-10 bg-cover bg-center shadow-xl hover:shadow-2xl ${usePoster ? "aspect-[2/3] w-32 sm:w-40 md:w-auto" : "aspect-video"}`}
          style={{ backgroundImage: `url(${getTmdbImage(imagePath, "w500")})` }}
        >
          {showOverlay && (
            <div className="absolute inset-0 flex items-center justify-center">
              {logoPath ? (
                <img
                  src={getTmdbImage(logoPath, "w300") || "/placeholder.svg"}
                  alt={detailedItem.title || detailedItem.name}
                  className="w-[70%] max-h-[60%] object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <h2 className="text-white text-sm sm:text-lg md:text-3xl font-semibold text-center px-2 sm:px-4 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105">
                  {detailedItem.title || detailedItem.name}
                </h2>
              )}
            </div>
          )}

          <div
            className={`absolute inset-0 bg-black/80 transition-opacity duration-500 p-2 sm:p-4 md:p-6 pb-6 sm:pb-8 md:pb-10 flex flex-col justify-end items-start ${isHovered ? "opacity-100" : "opacity-0"}`}
          >
            <h3 className="text-white/90 font-medium text-xs sm:text-sm line-clamp-2 mb-1">
              {mediaType === "tv" && item.season && item.episode ? `SEASON ${item.season} EPISODE ${item.episode}` : ""}
            </h3>
            <h3 className="text-white font-semibold text-sm sm:text-lg md:text-2xl mb-1 sm:mb-2 line-clamp-2">
              {detailedItem.title || detailedItem.name}
            </h3>
          </div>

          <div className="absolute bottom-1 sm:bottom-2 md:bottom-3 left-1 sm:left-2 md:left-3 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] text-xs sm:text-sm md:text-base px-2 sm:px-3 py-1 sm:py-2 bg-black/40 backdrop-blur-sm rounded-lg sm:rounded-xl pointer-events-none">
            <span className="font-semibold">Continue watching</span>{" "}
            <span className="text-white/80">({timeRemaining} left)</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-2 bg-black/30 backdrop-blur-sm pointer-events-none">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500 rounded-full shadow-lg"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </a>
      </div>
    )
  }

  const logoPath = getLogoPath(detailedItem)
  const showOverlay = !hasEnglishBackdrop(detailedItem)

  if (variant === "grid") {
    return (
      <div
        className="w-full relative transition-all duration-500 hover:scale-[1.02] group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <a href={linkUrl} className="block">
          <div className="relative rounded-2xl overflow-hidden aspect-video shadow-lg group-hover:shadow-2xl transition-all duration-500">
            {isUsingPosterFallback ? (
              <img
                src={getTmdbImage(imagePath, "w500") || "/placeholder.svg"}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${getTmdbImage(imagePath, "w500")})` }}
              />
            )}

            {showOverlay && !isUsingPosterFallback && (
              <div className="absolute inset-0 flex items-center justify-center">
                {logoPath ? (
                  <img
                    src={getTmdbImage(logoPath, "w300") || "/placeholder.svg"}
                    alt={title}
                    className="w-[70%] max-h-[60%] object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <h2 className="text-white text-lg sm:text-xl font-semibold text-center px-2 sm:px-4 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105">
                    {title}
                  </h2>
                )}
              </div>
            )}

            <div
              className={`absolute inset-0 bg-black/80 transition-opacity duration-500 p-2 sm:p-4 flex flex-col justify-end items-start ${isHovered ? "opacity-100" : "opacity-0"}`}
            >
              <h3 className="text-white font-semibold text-sm sm:text-lg mb-2 sm:mb-3 line-clamp-2">{title}</h3>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1 sm:gap-2 text-xs text-white font-medium">
                  <div className="bg-gradient-to-r from-[#90cea1] to-[#01b4e4] text-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md font-bold tracking-tight text-xs shadow-lg">
                    TMDB
                  </div>
                  <span className="bg-black/40 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">{rating}</span>
                  <span>•</span>
                  <span>{formattedDate}</span>
                  {runtime && (
                    <>
                      <span>•</span>
                      <span className="hidden sm:inline">{runtime}</span>
                    </>
                  )}
                </div>
                <div className="w-4 h-4 sm:w-6 sm:h-6"></div>
              </div>
            </div>

            {loading && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center backdrop-blur-sm">
                <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 sm:border-3 border-white/30 border-solid border-t-white rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </a>

        <button
          onClick={handleWatchlistToggle}
          className={`absolute bottom-2 sm:bottom-4 right-2 sm:right-4 text-white p-1.5 sm:p-2 rounded-full transition-all duration-300 cursor-pointer z-10 shadow-lg backdrop-blur-sm ${
            inWatchlist
              ? "bg-green-500/80 hover:bg-green-500 scale-100"
              : "bg-white/20 hover:bg-white/30 scale-90 hover:scale-100"
          } ${isHovered ? "opacity-100" : "opacity-0"}`}
          aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
        >
          {inWatchlist ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : <Plus className="w-3 h-3 sm:w-4 sm:h-4" />}
        </button>
      </div>
    )
  }

  return (
    <div
      className={`relative transition-all duration-500 hover:scale-[1.02] hover:z-10 group ${usePoster ? "aspect-[2/3] w-32 sm:w-40 md:w-auto" : "aspect-video"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <a
        href={linkUrl}
        className="block rounded-2xl overflow-hidden bg-cover bg-center w-full h-full shadow-lg group-hover:shadow-2xl transition-all duration-500"
        style={{ backgroundImage: `url(${getTmdbImage(imagePath, "w500")})` }}
      >
        {showOverlay && (
          <div className="absolute inset-0 flex items-center justify-center">
            {logoPath ? (
              <img
                src={getTmdbImage(logoPath, "w300") || "/placeholder.svg"}
                alt={title}
                className="w-[70%] max-h-[60%] object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <h2 className="text-white text-lg sm:text-xl md:text-3xl font-semibold text-center px-2 sm:px-4 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105">
                {title}
              </h2>
            )}
          </div>
        )}

        <div
          className={`absolute inset-0 bg-black/80 transition-opacity duration-500 p-3 sm:p-4 md:p-5 flex flex-col justify-end items-start ${isHovered ? "opacity-100" : "opacity-0"}`}
        >
          <h3 className="text-white font-semibold text-sm sm:text-lg md:text-2xl mb-2 sm:mb-3 line-clamp-2">{title}</h3>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 text-xs sm:text-sm text-white font-medium">
              <div className="bg-gradient-to-r from-[#90cea1] to-[#01b4e4] text-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md font-bold tracking-tight text-xs shadow-lg">
                TMDB
              </div>
              <span className="bg-black/40 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">{rating}</span>
              <span>•</span>
              <span>{formattedDate}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{runtime}</span>
            </div>
            <div className="w-4 h-4 sm:w-6 sm:h-6"></div>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center backdrop-blur-sm">
            <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 sm:border-3 border-white/30 border-solid border-t-white rounded-full animate-spin"></div>
          </div>
        )}
      </a>

      <button
        onClick={handleWatchlistToggle}
        className={`absolute bottom-3 sm:bottom-4 md:bottom-5 right-3 sm:right-4 md:right-5 text-white p-1.5 sm:p-2 md:p-2.5 rounded-full transition-all duration-300 cursor-pointer z-10 shadow-lg backdrop-blur-sm ${
          inWatchlist
            ? "bg-green-500/80 hover:bg-green-500 scale-100"
            : "bg-white/20 hover:bg-white/30 scale-90 hover:scale-100"
        } ${isHovered ? "opacity-100" : "opacity-0"}`}
        aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      >
        {inWatchlist ? <Check className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" /> : <Plus className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />}
      </button>
    </div>
  )
}

export default CarouselItem
