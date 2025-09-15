import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  MapPin,
  Clock,
  Star,
  Users,
  Wifi,
  Car,
  Coffee,
} from "lucide-react";
import { GymsService } from "../services/gymsService";
import { gyms as gymsData } from "../data/gyms";

const GymsPage = () => {
  const [gyms, setGyms] = useState([]);
  const [filteredGyms, setFilteredGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedAmenity, setSelectedAmenity] = useState("All");
  const [cities, setCities] = useState(["All"]);
  const [amenities, setAmenities] = useState(["All"]);

  const filterGyms = useCallback(() => {
    let filtered = gyms;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (gym) =>
          gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          gym.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          gym.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by city
    if (selectedCity !== "All") {
      filtered = filtered.filter((gym) => gym.address.city === selectedCity);
    }

    // Filter by amenity
    if (selectedAmenity !== "All") {
      filtered = filtered.filter((gym) =>
        gym.amenities.includes(selectedAmenity)
      );
    }

    setFilteredGyms(filtered);
  }, [gyms, searchTerm, selectedCity, selectedAmenity]);

  useEffect(() => {
    fetchGyms();
  }, []);

  useEffect(() => {
    filterGyms();
  }, [filterGyms]);

  const fetchGyms = async () => {
    try {
      setLoading(true);

      // Try to fetch from API first
      let gymsFromAPI = [];
      try {
        gymsFromAPI = await GymsService.getAllGyms();
        console.log(`Loaded ${gymsFromAPI.length} gyms from API`);
      } catch (apiError) {
        console.warn("Failed to fetch from API, using local data:", apiError);
        gymsFromAPI = gymsData;
      }

      setGyms(gymsFromAPI);

      // Extract unique cities and amenities for filters
      const uniqueCities = [
        ...new Set(gymsFromAPI.map((gym) => gym.address.city)),
      ];
      const uniqueAmenities = [
        ...new Set(gymsFromAPI.flatMap((gym) => gym.amenities)),
      ];

      setCities(["All", ...uniqueCities]);
      setAmenities(["All", ...uniqueAmenities]);
    } catch (err) {
      console.error("Error loading gyms:", err);
      setError("Failed to load gyms");
    } finally {
      setLoading(false);
    }
  };

  const formatOpeningHours = (hours) => {
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const today = days[new Date().getDay()];
    const todayHours = hours[today] || hours.monday;
    return `${todayHours.open} - ${todayHours.close}`;
  };

  const getFeatureIcon = (feature) => {
    const icons = {
      parking: Car,
      cafe: Coffee,
      app: Wifi,
      twentyFourSeven: Clock,
    };
    return icons[feature] || Users;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading gyms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={fetchGyms}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Your Perfect Gym
          </h1>
          <p className="text-gray-600">
            Discover Nuffield Health fitness and wellbeing centers near you
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search gyms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* City Filter */}
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {/* Amenity Filter */}
            <select
              value={selectedAmenity}
              onChange={(e) => setSelectedAmenity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {amenities.map((amenity) => (
                <option key={amenity} value={amenity}>
                  {amenity}
                </option>
              ))}
            </select>

            {/* Results Count */}
            <div className="flex items-center text-gray-600">
              <span>
                {filteredGyms.length} gym{filteredGyms.length !== 1 ? "s" : ""}{" "}
                found
              </span>
            </div>
          </div>
        </div>

        {/* Gyms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredGyms.map((gym) => (
            <div
              key={gym.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="h-48 bg-gray-200 relative">
                {gym.images && gym.images[0] ? (
                  <img
                    src={gym.images[0]}
                    alt={gym.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500">
                    No image
                  </div>
                )}
                {gym.membership?.promotion?.active && (
                  <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {gym.membership.promotion.description}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {gym.name}
                  </h3>
                  <div className="flex items-center">
                    <Star className="text-yellow-400 fill-current" size={16} />
                    <span className="ml-1 text-sm text-gray-600">
                      {gym.rating} ({gym.reviews})
                    </span>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-center text-gray-600 mb-3">
                  <MapPin size={16} className="mr-2" />
                  <span className="text-sm">{gym.address.fullAddress}</span>
                </div>

                {/* Opening Hours */}
                <div className="flex items-center text-gray-600 mb-4">
                  <Clock size={16} className="mr-2" />
                  <span className="text-sm">
                    Today: {formatOpeningHours(gym.openingHours)}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {gym.description}
                </p>

                {/* Amenities */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Popular Amenities
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {gym.amenities.slice(0, 3).map((amenity) => (
                      <span
                        key={amenity}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {amenity}
                      </span>
                    ))}
                    {gym.amenities.length > 3 && (
                      <span className="text-gray-500 text-xs">
                        +{gym.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="flex items-center space-x-4 mb-4">
                  {Object.entries(gym.features)
                    .slice(0, 4)
                    .map(([feature, available]) => {
                      if (!available) return null;
                      const Icon = getFeatureIcon(feature);
                      return (
                        <div
                          key={feature}
                          className="flex items-center text-green-600"
                          title={feature}
                        >
                          <Icon size={16} />
                        </div>
                      );
                    })}
                </div>

                {/* Pricing */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">From</p>
                      <div className="flex items-center">
                        {gym.membership?.anytime?.["12MonthCommitment"]
                          ?.discountPrice && (
                          <span className="text-lg line-through text-gray-400 mr-2">
                            £
                            {
                              gym.membership.anytime["12MonthCommitment"]
                                .originalPrice
                            }
                          </span>
                        )}
                        <span className="text-2xl font-bold text-green-600">
                          £
                          {gym.membership?.anytime?.["12MonthCommitment"]
                            ?.discountPrice ||
                            gym.membership?.anytime?.["1MonthRolling"]?.price ||
                            "N/A"}
                        </span>
                        <span className="text-gray-600 ml-1">/month</span>
                      </div>
                    </div>
                    <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredGyms.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search size={48} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No gyms found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCity("All");
                setSelectedAmenity("All");
              }}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GymsPage;
