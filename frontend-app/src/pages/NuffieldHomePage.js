import React from "react";
import { Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NuffieldHomePage() {
  const navigate = useNavigate();

  const handleHospitalsClick = () => {
    navigate("/hospitals"); // Navigate to the hospitals page (original landing page)
  };

  const handleGymsClick = () => {
    navigate("/gyms"); // Navigate to the gyms page
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleBookOnlineClick = () => {
    navigate("/book-appointment");
  };

  return (
    <div className="font-sans">
      {/* Top header */}
      <header className="bg-green-600 text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          {/* Logo */}
          <div className="flex items-center space-x-2 font-bold text-lg">
            <span className="bg-white text-green-600 font-bold px-2 py-1 rounded">
              NH
            </span>
            <span>Nuffield Health</span>
          </div>

          {/* Search bar */}
          <div className="flex-1 mx-6 relative">
            <input
              type="text"
              placeholder="What would you like to do today?"
              className="w-full rounded-full py-2 px-4 text-gray-700"
            />
            <Search
              className="absolute right-3 top-2.5 text-gray-500"
              size={20}
            />
          </div>

          {/* Login */}
          <button
            onClick={handleLoginClick}
            className="bg-white text-green-600 px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-gray-100 transition-colors"
          >
            <User size={18} />
            <span>Login</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="bg-white text-gray-700">
          <div className="max-w-7xl mx-auto flex justify-center space-x-8 px-6 py-3 font-medium">
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
            <button className="hover:text-green-600 transition-colors">
              Services
            </button>
            <button className="hover:text-green-600 transition-colors">
              Advice
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
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
              Get the rest of the year half price when you start a 12-month gym
              membership and enjoy fully-equipped gyms, classes, sauna, steam,
              swim and more.
            </p>
            <button className="bg-white text-green-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors">
              Join today
            </button>
            <p className="text-xs mt-4 underline">
              Terms and Conditions and Exclusions apply
            </p>
          </div>
        </div>
      </section>

      {/* Consultant Section */}
      <section className="max-w-7xl mx-auto py-16 px-6 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h3 className="text-2xl font-bold mb-4">Book to see a consultant</h3>
          <p className="mb-6 text-gray-600">
            Making an appointment to suit you has never been easier. Choose your
            consultant or let us help find your specialist – all from your
            device.
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

      {/* Promo Section */}
      <section className="bg-gray-100 py-16 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Swimming */}
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
            <button className="text-green-600 font-semibold underline hover:text-green-700 transition-colors">
              Find your nearest pool
            </button>
          </div>

          {/* Training Packs */}
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
            <button className="text-green-600 font-semibold underline hover:text-green-700 transition-colors">
              Buy now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
