import React, { useState } from "react";
import { Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NuffieldHomePage = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");

  const handleLoginClick = () => navigate("/login");
  const handleHospitalsClick = () => navigate("/hospitals");
  const handleGymsClick = () => navigate("/gyms");
  const handleServicesClick = () => navigate("/services");
  const handleAdviceClick = () => navigate("/about");
  const handleBookOnlineClick = () => navigate("/book-appointment");

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (searchValue.trim()) {
        navigate(`/services?search=${encodeURIComponent(searchValue.trim())}`);
      }
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">
      <header className="bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                N
              </div>
              <div>
                <p className="text-lg font-semibold">Nuffield Health</p>
                <p className="text-sm text-green-100">
                  Integrated care for every stage of life
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="What would you like to do today?"
                  className="w-full rounded-full py-3 px-4 pr-10 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/70 shadow-sm"
                />
                <Search
                  className="absolute right-3 top-3.5 text-gray-500"
                  size={20}
                />
              </div>
              <button
                onClick={handleLoginClick}
                className="bg-white/95 text-green-600 px-5 py-3 rounded-full flex items-center justify-center gap-2 font-semibold hover:bg-white transition-colors shadow-sm"
              >
                <User size={18} />
                <span>Login</span>
              </button>
            </div>
          </div>
        </div>
        <nav className="bg-white text-gray-700">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-6 px-6 py-3 font-medium">
            <button
              onClick={handleHospitalsClick}
              className="hover:text-green-600 transition-colors"
            >
              Hospitals
            </button>
            <button
              onClick={handleGymsClick}
              className="hover:text-green-600 transition-colors"
            >
              Gyms
            </button>
            <button
              onClick={handleServicesClick}
              className="hover:text-green-600 transition-colors"
            >
              Services
            </button>
            <button
              onClick={handleAdviceClick}
              className="hover:text-green-600 transition-colors"
            >
              Advice
            </button>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative">
          <img
            src="https://www.nuffieldhealth.com/local/d1/bc/7161dd5a45d89d9afb55ae9b8c12/join-a-gym-now-and-save-50-until-2026.png"
            alt="Nuffield Health gym membership promotion"
            className="w-full h-[500px] object-cover"
          />
          <div className="absolute inset-0 flex items-center max-w-7xl mx-auto px-6">
            <div className="bg-green-600 text-white max-w-md p-8 rounded shadow-lg">
              <h2 className="text-2xl font-bold mb-4">
                Exclusive half price membership until 2026
              </h2>
              <p className="mb-6 text-sm leading-relaxed">
                Get the rest of the year half price when you start a 12-month
                gym membership and enjoy fully-equipped gyms, classes, sauna,
                steam, swim and more.
              </p>
              <button
                onClick={handleGymsClick}
                className="bg-white text-green-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors"
              >
                Join today
              </button>
              <p className="text-xs mt-4 underline">
                Terms and Conditions and Exclusions apply
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto py-16 px-6 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-4">
              Book to see a consultant
            </h3>
            <p className="mb-6 text-gray-600">
              Making an appointment to suit you has never been easier. Choose
              your consultant or let us help find your specialist – all from
              your device.
            </p>
            <button
              onClick={handleBookOnlineClick}
              className="bg-green-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-700 transition-colors"
            >
              Book online now
            </button>
          </div>
          <div>
            <img
              src="https://www.nuffieldhealth.com/local/ed/b0/58ad460f43a5b97123cf39a22ad0/the-uks-only-24-month-0-interest-healthcare-provider.png"
              alt="Nuffield Health consultant services"
              className="rounded shadow"
            />
          </div>
        </section>

        <section className="bg-gray-100 py-16 px-6">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
            <div>
              <h4 className="text-green-600 font-bold text-xl mb-2">
                Cool off with a swim
              </h4>
              <p className="text-gray-600 mb-4">
                With pools at 110 fitness and wellbeing centres, relax with a
                gentle swim, enjoy one of our aqua aerobic classes or even hone
                your swimming skills with expert-led lessons, whether you're a
                member or not.
              </p>
              <button
                onClick={handleGymsClick}
                className="text-green-600 font-semibold underline hover:text-green-700 transition-colors"
              >
                Find your nearest pool
              </button>
            </div>

            <div>
              <h4 className="text-green-600 font-bold text-xl mb-2">
                NEW: 1-hour Personal Training packs
              </h4>
              <p className="text-gray-600 mb-4">
                Try out Nuffield Health Personal Training one hour at a time. A
                great way to see if personal training is for you, perfect your
                techniques, or to fit in an extra session around your regular
                workouts.
              </p>
              <button
                onClick={handleServicesClick}
                className="text-green-600 font-semibold underline hover:text-green-700 transition-colors"
              >
                Buy now
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default NuffieldHomePage;
