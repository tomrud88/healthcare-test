// src/pages/ServicesPage.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DoctorsService } from "../services/doctorsService"; // Use dynamic service instead of static data

const ServicesPage = () => {
  // State for doctors data
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch doctors data on component mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const allDoctors = await DoctorsService.getAllDoctors();
        setDoctors(allDoctors);
        setError(null);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError("Failed to load doctor information.");
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);
  // Map service titles to doctor specialty values
  const getSpecialtyFromService = (serviceTitle) => {
    const specialtyMap = {
      "General Practice": "General Practitioner",
      "Dental Care": "Dentist",
      Dermatology: "Dermatologist",
      "ENT (Ear, Nose & Throat)": "ENT Specialist",
      Ophthalmology: "Ophthalmologist",
      Cardiology: "Cardiologist",
      Neurology: "Neurologist",
    };
    return specialtyMap[serviceTitle] || "";
  };

  // Define comprehensive service information for each specialty
  const services = [
    {
      id: "general-practitioner",
      title: "General Practice",
      icon: "🩺",
      description: "Comprehensive primary healthcare for the whole family",
      overview:
        "Our General Practitioners provide comprehensive primary care services, serving as your first point of contact for all health concerns. They offer preventive care, health screenings, chronic disease management, and coordinate specialist referrals when needed.",
      treatments: [
        "Annual health check-ups",
        "Vaccinations and immunizations",
        "Chronic disease management (diabetes, hypertension)",
        "Minor illness and injury treatment",
        "Health screening and prevention",
        "Mental health support",
        "Family planning and contraception",
        "Specialist referrals",
      ],
      colors: "from-blue-500 to-blue-700",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      id: "dentist",
      title: "Dental Care",
      icon: "🦷",
      description:
        "Complete oral healthcare from routine cleanings to advanced procedures",
      overview:
        "Our dental specialists provide comprehensive oral healthcare services, from routine preventive care to advanced restorative and cosmetic procedures. We focus on maintaining optimal oral health through evidence-based treatments and patient education.",
      treatments: [
        "Routine dental cleanings and check-ups",
        "Fillings and restorative dentistry",
        "Root canal therapy",
        "Orthodontics and teeth straightening",
        "Cosmetic dentistry and whitening",
        "Oral surgery and extractions",
        "Pediatric dental care",
        "Emergency dental services",
      ],
      colors: "from-green-500 to-green-700",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
    },
    {
      id: "dermatologist",
      title: "Dermatology",
      icon: "🧴",
      description: "Expert care for skin, hair, and nail conditions",
      overview:
        "Our dermatology department offers comprehensive care for all skin, hair, and nail conditions. We provide both medical and cosmetic dermatology services, utilizing the latest technology and evidence-based treatments for optimal patient outcomes.",
      treatments: [
        "Skin cancer screening and treatment",
        "Acne and rosacea management",
        "Eczema and psoriasis treatment",
        "Mole and skin lesion removal",
        "Cosmetic procedures and anti-aging treatments",
        "Hair loss evaluation and treatment",
        "Dermatopathology services",
        "Pediatric dermatology",
      ],
      colors: "from-pink-500 to-pink-700",
      bgColor: "bg-pink-50",
      textColor: "text-pink-700",
    },
    {
      id: "ent-specialist",
      title: "ENT (Ear, Nose & Throat)",
      icon: "👂",
      description:
        "Specialized care for ear, nose, throat, and head/neck conditions",
      overview:
        "Our ENT specialists diagnose and treat a wide range of conditions affecting the ear, nose, throat, and related structures of the head and neck. We offer both medical and surgical treatments using the most advanced techniques available.",
      treatments: [
        "Hearing loss evaluation and treatment",
        "Sinus surgery and treatment",
        "Tonsil and adenoid procedures",
        "Voice and swallowing disorders",
        "Sleep apnea management",
        "Ear infection treatment",
        "Nasal and sinus endoscopy",
        "Head and neck cancer treatment",
      ],
      colors: "from-orange-500 to-orange-700",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
    },
    {
      id: "ophthalmologist",
      title: "Ophthalmology",
      icon: "👁️",
      description:
        "Complete eye care from routine exams to advanced surgical procedures",
      overview:
        "Our ophthalmology department provides comprehensive eye care services, from routine eye examinations to complex surgical procedures. We utilize state-of-the-art technology to diagnose and treat various eye conditions, ensuring optimal vision health.",
      treatments: [
        "Comprehensive eye examinations",
        "Cataract surgery",
        "Glaucoma management and surgery",
        "Retinal disease treatment",
        "Diabetic eye care",
        "Macular degeneration treatment",
        "LASIK and refractive surgery",
        "Pediatric ophthalmology",
      ],
      colors: "from-purple-500 to-purple-700",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
    },
    {
      id: "cardiologist",
      title: "Cardiology",
      icon: "❤️",
      description: "Expert heart and cardiovascular care",
      overview:
        "Our cardiology team provides comprehensive cardiovascular care, from preventive services to advanced interventional procedures. We specialize in diagnosing and treating all types of heart and vascular conditions using the latest technology and evidence-based approaches.",
      treatments: [
        "Heart disease prevention and screening",
        "Coronary artery disease treatment",
        "Heart failure management",
        "Arrhythmia diagnosis and treatment",
        "Hypertension management",
        "Cardiac catheterization",
        "Echocardiography and stress testing",
        "Cardiac rehabilitation",
      ],
      colors: "from-red-500 to-red-700",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
    },
    {
      id: "neurologist",
      title: "Neurology",
      icon: "🧠",
      description: "Specialized care for brain and nervous system disorders",
      overview:
        "Our neurology department offers comprehensive diagnosis and treatment of disorders affecting the brain, spinal cord, and nervous system. We provide advanced neurological care using cutting-edge technology and multidisciplinary treatment approaches.",
      treatments: [
        "Stroke prevention and treatment",
        "Epilepsy management",
        "Multiple sclerosis care",
        "Migraine and headache treatment",
        "Parkinson's disease management",
        "Memory disorders and dementia care",
        "Neuropathy treatment",
        "Movement disorder therapy",
      ],
      colors: "from-teal-500 to-teal-700",
      bgColor: "bg-teal-50",
      textColor: "text-teal-700",
    },
  ];

  // Get doctor count for each specialty
  const getDoctorCount = (serviceTitle) => {
    if (loading) return "...";
    if (error) return "N/A";

    const specialtyMap = {
      "General Practice": "General Practitioner",
      "Dental Care": "Dentist",
      Dermatology: "Dermatologist",
      "ENT (Ear, Nose & Throat)": "ENT Specialist",
      Ophthalmology: "Ophthalmologist",
      Cardiology: "Cardiologist",
      Neurology: "Neurologist",
    };

    const specialty = specialtyMap[serviceTitle];
    return doctors.filter((doctor) => doctor.specialty === specialty).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6">Our Medical Services</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
            Comprehensive healthcare services across 7 specialties with expert
            medical professionals dedicated to your health and wellbeing
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-200">7</div>
              <div className="text-blue-100">Specialties</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-200">16</div>
              <div className="text-blue-100">Expert Doctors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-200">7</div>
              <div className="text-blue-100">UK Cities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-200">24/7</div>
              <div className="text-blue-100">Care Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Complete Healthcare Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From primary care to specialized treatments, our medical
              professionals provide comprehensive healthcare services tailored
              to your needs
            </p>
          </div>

          <div className="grid gap-8">
            {services.map((service, index) => (
              <div
                key={service.id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ${
                  index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                } lg:flex`}
              >
                {/* Content Section */}
                <div className="lg:w-2/3 p-8">
                  <div className="flex items-center mb-4">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${service.colors} flex items-center justify-center text-2xl mr-4`}
                    >
                      {service.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">
                        {service.title}
                      </h3>
                      <p className="text-gray-600">{service.description}</p>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-6 leading-relaxed">
                    {service.overview}
                  </p>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                      Services Include:
                    </h4>
                    <div className="grid md:grid-cols-2 gap-2">
                      {service.treatments.map((treatment, idx) => (
                        <div
                          key={idx}
                          className="flex items-center text-gray-600"
                        >
                          <span className="text-green-500 mr-2">✓</span>
                          {treatment}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      to="/book-appointment"
                      state={{
                        selectedSpecialty: getSpecialtyFromService(
                          service.title
                        ),
                      }}
                      className={`px-6 py-3 bg-gradient-to-r ${service.colors} text-white rounded-lg hover:shadow-lg transition-all duration-300 text-center font-semibold no-underline`}
                    >
                      Book Appointment
                    </Link>
                    <Link
                      to="/doctors"
                      state={{
                        selectedSpecialty: getSpecialtyFromService(
                          service.title
                        ),
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center font-semibold no-underline"
                    >
                      View Specialists ({getDoctorCount(service.title)})
                    </Link>
                  </div>
                </div>

                {/* Stats/Info Section */}
                <div
                  className={`lg:w-1/3 ${service.bgColor} p-8 flex flex-col justify-center`}
                >
                  <div className="space-y-6">
                    <div className="text-center">
                      <div
                        className={`text-4xl font-bold ${service.textColor} mb-2`}
                      >
                        {getDoctorCount(service.title)}
                      </div>
                      <div className="text-gray-600">Available Specialists</div>
                    </div>

                    <div className="text-center">
                      <div
                        className={`text-2xl font-bold ${service.textColor} mb-2`}
                      >
                        {service.id === "general-practitioner"
                          ? "Same Day"
                          : service.id === "dentist"
                          ? "Next Day"
                          : "This Week"}
                      </div>
                      <div className="text-gray-600">
                        Appointments Available
                      </div>
                    </div>

                    <div className="text-center">
                      <div
                        className={`text-2xl font-bold ${service.textColor} mb-2`}
                      >
                        {service.id === "general-practitioner" ||
                        service.id === "dermatologist"
                          ? "In-Person & Virtual"
                          : "In-Person"}
                      </div>
                      <div className="text-gray-600">Consultation Options</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Book an appointment with one of our specialists today and take the
            first step towards better health
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/book-appointment"
              className="bg-white text-blue-600 px-8 py-4 rounded-2xl hover:bg-gray-100 transition-colors duration-300 shadow-lg font-semibold no-underline"
            >
              Book Appointment Now
            </Link>
            <Link
              to="/doctors"
              className="border border-white text-white px-8 py-4 rounded-2xl hover:bg-white hover:text-blue-600 transition-colors duration-300 font-semibold no-underline"
            >
              Browse Our Doctors
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
