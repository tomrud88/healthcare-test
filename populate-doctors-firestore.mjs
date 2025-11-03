// populate-doctors-firestore.mjs
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";

// Firebase config for your new project
const firebaseConfig = {
  apiKey: "AIzaSyBLdLNx-VtLfljLar8BKkk1ev6pEEQnAsg",
  authDomain: "healthcare-poc-477108.firebaseapp.com",
  projectId: "healthcare-poc-477108",
  storageBucket: "healthcare-poc-477108.firebasestorage.app",
  messagingSenderId: "750964638675",
  appId: "1:750964638675:web:b938cd4640572730ef6526",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Doctors data based on your existing structure
const doctors = [
  // Dentists
  {
    id: "den-001",
    name: "Dr. Emily Carter, BDS",
    specialty: "Physiotherapist",
    city: "London",
    clinic: "Covent Garden Physiotherapist",
    address: "9, Endell Street, London, WC2H 9SA",
    rating: 4.9,
    reviews: 180,
    image: "https://placehold.co/150x150/5B73FF/FFFFFF?text=Dr.E",
    bio: "Dr. Carter specializes in comprehensive physiotherapy with a focus on musculoskeletal rehabilitation and movement therapy.",
    modalities: ["in_person"],
    pricing: {
      nonMember: {
        initialAssessment: {
          price: 79,
          currency: "GBP",
          duration: "45 minutes",
          description: "Initial Assessment - 45 minutes",
        },
        followUp: {
          price: 52,
          currency: "GBP",
          duration: "30 minutes",
          description: "Follow Up - 30 minutes",
        },
      },
      member: {
        initialAssessment: {
          price: 63.2,
          currency: "GBP",
          duration: "45 minutes",
          description: "Initial Assessment - 45 minutes",
        },
        followUp: {
          price: 41.6,
          currency: "GBP",
          duration: "30 minutes",
          description: "Follow Up - 30 minutes",
        },
      },
    },
    availability: {
      "2025-11-05": ["09:00", "10:30", "14:00", "15:30"],
      "2025-11-06": ["09:00", "11:00", "13:30", "16:00"],
      "2025-11-07": ["08:30", "10:00", "14:30"],
      "2025-11-08": ["09:30", "11:30", "15:00", "16:30"],
      "2025-11-11": ["09:00", "13:00", "14:30"],
    },
  },
  {
    id: "den-002",
    name: "Dr. James Wilson, BDS",
    specialty: "Dentist",
    city: "Manchester",
    clinic: "Manchester Smile Centre",
    rating: 4.8,
    reviews: 165,
    image: "https://placehold.co/150x150/00B074/FFFFFF?text=Dr.J",
    bio: "Dr. Wilson provides advanced dental treatments including orthodontics and oral surgery.",
    modalities: ["in_person", "telemedicine"],
    availability: {
      "2025-11-05": ["10:00", "11:30", "15:00"],
      "2025-11-06": ["09:30", "14:00", "16:30"],
      "2025-11-07": ["08:00", "10:30", "13:00", "15:30"],
      "2025-11-08": ["09:00", "11:00", "14:30"],
      "2025-11-12": ["10:00", "13:30", "15:00", "16:00"],
    },
  },
  {
    id: "den-003",
    name: "Dr. Sophie Bennett, BDS, MSc",
    specialty: "Dentist",
    city: "Birmingham",
    clinic: "Birmingham Dental Practice",
    rating: 4.7,
    reviews: 142,
    image: "https://placehold.co/150x150/FFC107/FFFFFF?text=Dr.S",
    bio: "Dr. Bennett specializes in restorative dentistry and pediatric dental care with over 10 years experience.",
    modalities: ["in_person"],
    availability: {
      "2025-11-06": ["09:00", "10:30", "15:45"],
      "2025-11-07": ["08:30", "11:00", "14:00", "16:30"],
      "2025-11-08": ["09:30", "13:00", "15:30"],
      "2025-11-11": ["10:00", "11:30", "14:30", "16:00"],
      "2025-11-13": ["09:00", "10:30", "13:30"],
    },
  },

  // General Practitioners
  {
    id: "gp-001",
    name: "Dr. Lucy Morgan, MRCGP",
    specialty: "General Practitioner",
    city: "London",
    clinic: "Soho Health Centre",
    rating: 5.0,
    reviews: 320,
    image: "https://placehold.co/150x150/DC3545/FFFFFF?text=Dr.L",
    bio: "Dr. Morgan provides comprehensive primary care with expertise in family medicine and preventive health.",
    modalities: ["in_person", "telemedicine"],
    availability: {
      "2025-11-05": ["08:30", "10:00", "14:15", "16:30"],
      "2025-11-06": ["09:00", "11:30", "13:00", "15:30"],
      "2025-11-07": ["08:00", "10:30", "14:00", "16:00"],
      "2025-11-08": ["09:30", "11:00", "13:30", "15:00"],
      "2025-11-11": ["08:30", "10:00", "14:30", "16:30"],
    },
  },
  {
    id: "gp-002",
    name: "Dr. Adam Collins, MRCGP",
    specialty: "General Practitioner",
    city: "London",
    clinic: "Camden Care Practice",
    rating: 4.8,
    reviews: 245,
    image: "https://placehold.co/150x150/6C757D/FFFFFF?text=Dr.A",
    bio: "Dr. Collins focuses on chronic disease management and men's health with a patient-centered approach.",
    modalities: ["in_person"],
    availability: {
      "2025-11-05": ["09:00", "11:00", "15:00"],
      "2025-11-06": ["10:00", "13:30", "16:00"],
      "2025-11-07": ["08:30", "10:30", "14:30"],
      "2025-11-08": ["09:30", "11:30", "15:30"],
      "2025-11-12": ["09:00", "13:00", "14:00"],
    },
  },
  {
    id: "gp-003",
    name: "Dr. Rebecca Hayes, MBBS",
    specialty: "General Practitioner",
    city: "Bristol",
    clinic: "Bristol Family Medicine",
    rating: 4.9,
    reviews: 198,
    image: "https://placehold.co/150x150/17A2B8/FFFFFF?text=Dr.R",
    bio: "Dr. Hayes specializes in women's health and family planning with extensive experience in community medicine.",
    modalities: ["in_person", "telemedicine"],
    availability: {
      "2025-11-05": ["09:30", "11:30", "16:30"],
      "2025-11-06": ["08:00", "10:00", "14:00", "15:30"],
      "2025-11-07": ["09:00", "11:00", "13:30", "16:00"],
      "2025-11-08": ["10:30", "14:30", "16:30"],
      "2025-11-11": ["08:30", "11:30", "15:00"],
    },
  },
  {
    id: "gp-004",
    name: "Dr. David Kumar, MRCGP",
    specialty: "General Practitioner",
    city: "Leeds",
    clinic: "Leeds Medical Centre",
    rating: 4.7,
    reviews: 167,
    image: "https://placehold.co/150x150/28A745/FFFFFF?text=Dr.D",
    bio: "Dr. Kumar provides holistic family medicine with special interests in diabetes care and mental health.",
    modalities: ["in_person", "telemedicine"],
    availability: {
      "2025-11-06": ["08:45", "10:15", "13:45", "15:15"],
      "2025-11-07": ["09:00", "11:30", "14:00", "16:30"],
      "2025-11-08": ["08:30", "10:00", "13:00", "15:30"],
      "2025-11-11": ["09:30", "11:00", "14:30", "16:00"],
      "2025-11-12": ["08:45", "10:30", "13:30"],
    },
  },

  // Dermatologists
  {
    id: "der-001",
    name: "Dr. Sarah Patel, MD",
    specialty: "Dermatologist",
    city: "London",
    clinic: "Harley Street Dermatology",
    rating: 4.9,
    reviews: 156,
    image: "https://placehold.co/150x150/E83E8C/FFFFFF?text=Dr.S",
    bio: "Dr. Patel is a leading dermatologist specializing in skin cancer detection and cosmetic dermatology.",
    modalities: ["in_person", "telemedicine"],
    availability: {
      "2025-11-05": ["11:00", "14:30", "16:00"],
      "2025-11-06": ["09:30", "11:30", "15:00"],
      "2025-11-07": ["10:00", "13:00", "14:30", "16:30"],
      "2025-11-08": ["09:00", "11:00", "15:30"],
      "2025-11-11": ["10:30", "13:30", "15:00"],
    },
  },
  {
    id: "der-002",
    name: "Dr. Michael Thompson, FRCP",
    specialty: "Dermatologist",
    city: "Edinburgh",
    clinic: "Edinburgh Skin Clinic",
    rating: 4.8,
    reviews: 134,
    image: "https://placehold.co/150x150/6F42C1/FFFFFF?text=Dr.M",
    bio: "Dr. Thompson focuses on complex skin conditions and dermatopathology with research interests in eczema treatment.",
    modalities: ["in_person", "telemedicine"],
    availability: {
      "2025-11-05": ["10:30", "14:00", "15:30"],
      "2025-11-07": ["09:00", "11:30", "13:30", "16:00"],
      "2025-11-08": ["10:00", "14:30", "16:30"],
      "2025-11-11": ["09:30", "11:00", "15:00"],
      "2025-11-12": ["10:30", "13:00", "14:30"],
    },
  },

  // ENT Specialists
  {
    id: "ent-001",
    name: "Dr. Helen Foster, FRCS",
    specialty: "ENT Specialist",
    city: "London",
    clinic: "London ENT Specialists",
    rating: 4.9,
    reviews: 178,
    image: "https://placehold.co/150x150/FD7E14/FFFFFF?text=Dr.H",
    bio: "Dr. Foster specializes in advanced ENT procedures including sinus surgery and hearing restoration.",
    modalities: ["in_person"],
    availability: {
      "2025-11-05": ["10:00", "13:15", "15:45"],
      "2025-11-06": ["09:30", "11:30", "14:30", "16:30"],
      "2025-11-07": ["08:30", "10:30", "13:00", "15:00"],
      "2025-11-08": ["09:00", "11:00", "14:00", "16:00"],
      "2025-11-11": ["10:30", "13:30", "15:30"],
    },
  },

  // Ophthalmologists
  {
    id: "oph-001",
    name: "Dr. Amanda Price, FRCOphth",
    specialty: "Ophthalmologist",
    city: "Manchester",
    clinic: "Manchester Eye Hospital",
    rating: 5.0,
    reviews: 189,
    image: "https://placehold.co/150x150/007BFF/FFFFFF?text=Dr.A",
    bio: "Dr. Price is an expert in retinal surgery and diabetic eye disease with cutting-edge treatment approaches.",
    modalities: ["in_person"],
    availability: {
      "2025-11-05": ["09:00", "12:00", "15:00"],
      "2025-11-06": ["10:30", "13:30", "16:00"],
      "2025-11-07": ["08:30", "11:00", "14:30"],
      "2025-11-08": ["09:30", "12:30", "15:30"],
      "2025-11-11": ["10:00", "13:00", "16:30"],
    },
  },
  {
    id: "oph-002",
    name: "Dr. Christopher Lee, MBBS",
    specialty: "Ophthalmologist",
    city: "Birmingham",
    clinic: "Birmingham Vision Centre",
    rating: 4.8,
    reviews: 203,
    image: "https://placehold.co/150x150/FF6B6B/FFFFFF?text=Dr.C",
    bio: "Dr. Lee specializes in cataract surgery and glaucoma management with the latest minimally invasive techniques.",
    modalities: ["in_person", "telemedicine"],
    availability: {
      "2025-11-06": ["09:00", "11:00", "14:45"],
      "2025-11-07": ["10:30", "13:00", "15:30", "17:00"],
      "2025-11-08": ["08:30", "10:00", "14:00", "16:30"],
      "2025-11-11": ["09:30", "12:00", "15:00"],
      "2025-11-13": ["10:00", "13:30", "16:00"],
    },
  },

  // Cardiologists
  {
    id: "car-001",
    name: "Dr. Elizabeth Turner, FRCP",
    specialty: "Cardiologist",
    city: "London",
    clinic: "Heart & Vascular Institute London",
    rating: 4.9,
    reviews: 267,
    image: "https://placehold.co/150x150/845EC8/FFFFFF?text=Dr.E",
    bio: "Dr. Turner is a leading cardiologist specializing in interventional cardiology and heart failure management.",
    modalities: ["in_person", "telemedicine"],
    availability: {
      "2025-11-05": ["09:30", "11:30", "14:30"],
      "2025-11-06": ["10:00", "13:00", "15:30", "17:00"],
      "2025-11-07": ["08:30", "10:30", "14:00", "16:00"],
      "2025-11-08": ["09:00", "11:00", "15:00"],
      "2025-11-11": ["10:30", "13:30", "16:30"],
    },
  },
  {
    id: "car-002",
    name: "Dr. Andrew Morrison, MD",
    specialty: "Cardiologist",
    city: "Edinburgh",
    clinic: "Edinburgh Cardiac Centre",
    rating: 4.8,
    reviews: 234,
    image: "https://placehold.co/150x150/F39C12/FFFFFF?text=Dr.A",
    bio: "Dr. Morrison focuses on preventive cardiology and cardiac rehabilitation with a holistic treatment approach.",
    modalities: ["in_person"],
    availability: {
      "2025-11-06": ["09:00", "10:15", "14:30"],
      "2025-11-07": ["11:00", "13:30", "16:00"],
      "2025-11-08": ["08:30", "10:30", "15:30"],
      "2025-11-11": ["09:30", "11:30", "14:00", "16:30"],
      "2025-11-12": ["10:15", "13:00", "15:00"],
    },
  },

  // Neurologists
  {
    id: "neu-001",
    name: "Dr. Victoria Singh, FRCP",
    specialty: "Neurologist",
    city: "Bristol",
    clinic: "Bristol Neurology Clinic",
    rating: 4.9,
    reviews: 156,
    image: "https://placehold.co/150x150/E74C3C/FFFFFF?text=Dr.V",
    bio: "Dr. Singh specializes in movement disorders and multiple sclerosis with expertise in the latest therapeutic approaches.",
    modalities: ["in_person", "telemedicine"],
    availability: {
      "2025-11-05": ["10:00", "13:00", "15:30"],
      "2025-11-06": ["09:30", "11:30", "14:30", "16:30"],
      "2025-11-07": ["08:30", "10:30", "13:30", "15:00"],
      "2025-11-08": ["09:00", "11:00", "14:00", "16:00"],
      "2025-11-11": ["10:30", "13:00", "15:30"],
    },
  },
  {
    id: "neu-002",
    name: "Dr. Thomas Evans, MBBS",
    specialty: "Neurologist",
    city: "Leeds",
    clinic: "Leeds Brain & Spine Centre",
    rating: 4.7,
    reviews: 189,
    image: "https://placehold.co/150x150/16A085/FFFFFF?text=Dr.T",
    bio: "Dr. Evans focuses on epilepsy treatment and cognitive disorders with research interests in neurodegenerative diseases.",
    modalities: ["in_person"],
    availability: {
      "2025-11-07": ["09:00", "11:30", "15:30"],
      "2025-11-08": ["10:00", "13:00", "16:00"],
      "2025-11-11": ["08:30", "10:30", "14:30"],
      "2025-11-12": ["09:30", "11:00", "15:00", "17:00"],
      "2025-11-13": ["10:30", "13:30", "16:30"],
    },
  },
];

async function populateDoctorsFirestore() {
  console.log("🏥 Starting to populate Firestore with doctors data...");

  try {
    let successCount = 0;
    let errorCount = 0;

    for (const doctor of doctors) {
      try {
        // Use the doctor's ID as the document ID
        const docRef = doc(db, "doctors", doctor.id);
        await setDoc(docRef, doctor);
        console.log(`✅ Added doctor: ${doctor.name} (${doctor.id})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error adding doctor ${doctor.name}:`, error);
        errorCount++;
      }
    }

    console.log("\n🎉 Firestore population completed!");
    console.log(`✅ Successfully added: ${successCount} doctors`);
    console.log(`❌ Failed to add: ${errorCount} doctors`);
    console.log(`📊 Total doctors: ${doctors.length}`);

    console.log("\n🔍 You can view the data at:");
    console.log(
      `https://console.firebase.google.com/project/healthcare-poc-477108/firestore`
    );
  } catch (error) {
    console.error("❌ Failed to populate Firestore:", error);
  }
}

// Run the population function
populateDoctorsFirestore();
