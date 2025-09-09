# Healthcare Platform - Frontend Documentation

## 📋 Table of Contents

- [Overvie│ │ ├── ServicesPage.js # Healthcare services
  │ │ ├── DigitalRegistrationPage.js # Patient registration
  │ │ └── PagesComingSoon.js # Placeholder for future pages(#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Dependencies](#dependencies)
- [Configuration](#configuration)
- [Authentication System](#authentication-system)
- [Components](#components)
- [Pages](#pages)
- [Services](#services)
- [Styling](#styling)
- [Environment Setup](#environment-setup)
- [Available Scripts](#available-scripts)
- [Features](#features)
- [API Integration](#api-integration)

## 🏥 Overview

The Healthcare Platform Frontend is a modern React-based web application that provides a comprehensive patient portal for healthcare services. It enables users to:

- Register and authenticate securely
- Search and book appointments with doctors
- View their medical information and appointment history
- Interact with an AI-powered chat agent
- Manage their profile and personal information

## 🛠 Technology Stack

### Core Framework

- **React 19.1.0** - Modern UI library with latest features
- **React DOM 19.1.0** - DOM rendering for React
- **React Router DOM 7.7.1** - Client-side routing and navigation

### Authentication & Database

- **Firebase 12.0.0** - Complete backend-as-a-service platform
  - Firebase Authentication (Email/Password)
  - Firestore Database (NoSQL document database)
  - Real-time data synchronization

### UI Framework & Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Material-UI (MUI) 7.2.0** - React component library
  - @emotion/react 11.14.0
  - @emotion/styled 11.14.1

### Development & Testing

- **React Scripts 5.0.1** - Development toolchain
- **Testing Library** - Comprehensive testing utilities
  - @testing-library/react 16.3.0
  - @testing-library/jest-dom 6.6.3
  - @testing-library/user-event 13.5.0

## 📁 Project Structure

```
frontend-app/
├── public/
│   ├── index.html              # Main HTML template
│   ├── favicon.ico             # Application icon
│   ├── manifest.json           # PWA manifest
│   └── images/                 # Static images
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── BookingCalendar.js  # Appointment booking modal
│   │   ├── ChatAgent.js        # AI chat interface
│   │   ├── CustomCalendar.js   # Date picker component
│   │   ├── DatabaseMigration.js # Database utility component
│   │   ├── DoctorCard.js       # Doctor information display
│   │   ├── FloatingChatButton.js # Chat toggle button
│   │   ├── Footer.js           # Site footer
│   │   ├── Navbar.js           # Navigation header
│   │   └── PersonalizedContentDemo.js # Demo content
│   ├── pages/                  # Application pages/screens
│   │   ├── Landing.js          # Home/landing page
│   │   ├── LoginPage.js        # User authentication
│   │   ├── RegisterPage.js     # User registration
│   │   ├── DashboardPage.js    # Patient dashboard
│   │   ├── AppointmentBookingPage.js # Appointment booking
│   │   ├── AppointmentListPage.js # Appointment history
│   │   ├── AppointmentListPageNew.js # New appointment list UI
│   │   ├── AppointmentListPageOld.js # Legacy appointment list
│   │   ├── ProfilePage.js      # User profile management
│   │   ├── DoctorsPage.js      # Doctor directory
│   │   ├── ServicesPage.js     # Healthcare services
│   │   ├── DigitalRegistrationPage.js # Patient registration
│   │   └── PagesComingSoon.js  # Placeholder for future pages
│   ├── services/               # API and business logic
│   │   ├── doctorsService.js   # Doctor-related API calls
│   │   └── patientService.js   # Patient-related API calls
│   ├── data/                   # Static data and mock data
│   ├── hooks/                  # Custom React hooks
│   ├── scripts/                # Utility scripts
│   ├── App.js                  # Main application component
│   ├── AppRoutes.js            # Route definitions
│   ├── AuthContext.js          # Authentication context
│   ├── ChatContext.js          # Chat state management
│   ├── firebaseConfig.js       # Firebase configuration
│   ├── index.js                # Application entry point
│   └── index.css               # Global styles
├── package.json                # Dependencies and scripts
├── tailwind.config.js          # Tailwind CSS configuration
└── README.md                   # Project documentation
```

## 📦 Dependencies

### Production Dependencies

```json
{
  "@emotion/react": "^11.14.0", // CSS-in-JS for MUI
  "@emotion/styled": "^11.14.1", // Styled components for MUI
  "@mui/material": "^7.2.0", // Material-UI components
  "firebase": "^12.0.0", // Firebase SDK
  "react": "^19.1.0", // React library
  "react-dom": "^19.1.0", // React DOM rendering
  "react-router-dom": "^7.7.1", // Routing library
  "react-scripts": "5.0.1", // Build tools
  "web-vitals": "^2.1.4" // Performance metrics
}
```

### Development Dependencies

```json
{
  "@testing-library/dom": "^10.4.0", // DOM testing utilities
  "@testing-library/jest-dom": "^6.6.3", // Jest DOM matchers
  "@testing-library/react": "^16.3.0", // React testing utilities
  "@testing-library/user-event": "^13.5.0" // User interaction testing
}
```

## ⚙️ Configuration

### Environment Variables (.env.local)

```bash
# Database Configuration
REACT_APP_USE_FIRESTORE=true

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyCjmqH0NDd3JMHjTqsPddFQjaWO7u2z3VU
REACT_APP_FIREBASE_AUTH_DOMAIN=healthcare-patient-portal.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=healthcare-patient-portal
REACT_APP_FIREBASE_STORAGE_BUCKET=healthcare-patient-portal.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=141631215651
REACT_APP_FIREBASE_APP_ID=1:141631215651:web:053d4029589feb206cf996

# API URLs
REACT_APP_DOCTORS_API_URL=https://us-central1-healthcare-patient-portal.cloudfunctions.net/doctorsService

# Development Settings
NODE_ENV=development
```

### Tailwind CSS Configuration

- **Custom animations**: float, fadeIn
- **Responsive design**: Mobile-first approach
- **Color palette**: Healthcare-focused color scheme
- **Typography**: Medical professional styling

## 🔐 Authentication System

### Firebase Authentication

- **Provider**: Email/Password authentication
- **Features**:
  - User registration with email verification
  - Secure login/logout
  - Password reset functionality (removed in current version)
  - Session persistence
  - Protected routes

### AuthContext

- **Purpose**: Global authentication state management
- **Features**:
  - Current user state
  - Authentication status
  - Login/logout functions
  - ID token management
  - Protected route handling

## 🧩 Components

### Core Components

#### BookingCalendar.js

- **Purpose**: Modal for appointment booking
- **Features**:
  - 4-step booking process (Date → Time → Details → Confirmation)
  - Auto-population of user information
  - Real-time availability checking
  - Firestore integration for saving appointments
- **Props**: `doctor`, `onClose`, `onBookingComplete`

#### ChatAgent.js

- **Purpose**: AI-powered chat interface
- **Features**:
  - Real-time messaging with healthcare AI
  - Doctor search through natural language
  - Multiple message type support
  - Rich content rendering (doctor cards, availability)
  - Auto-scroll and typing indicators
- **Integration**: Dialogflow CX webhook

#### DoctorCard.js

- **Purpose**: Display doctor information
- **Features**:
  - Doctor profile with photo, specialty, ratings
  - Next available appointment display
  - Quick booking integration
  - Responsive design with hover effects
- **Props**: `doctor` object with all doctor details

#### CustomCalendar.js

- **Purpose**: Date picker for appointments
- **Features**:
  - Custom styling to match healthcare theme
  - Disabled past dates
  - Availability highlighting
  - Mobile-responsive

#### FloatingChatButton.js

- **Purpose**: Toggle chat interface
- **Features**:
  - Fixed position chat button
  - Unread message indicators
  - Smooth animations
  - Accessibility compliance

### Navigation Components

#### Navbar.js

- **Purpose**: Main navigation header
- **Features**:
  - Responsive hamburger menu
  - User authentication status
  - Healthcare branding
  - Route navigation

#### Footer.js

- **Purpose**: Site footer with links and information
- **Features**:
  - Contact information
  - Legal links
  - Social media integration
  - Responsive grid layout

## 📄 Pages

### Authentication Pages

#### LoginPage.js

- **Purpose**: User authentication
- **Features**:
  - Email/password login
  - Input validation
  - Error handling
  - Redirect to dashboard on success
  - Link to registration

#### RegisterPage.js

- **Purpose**: New user registration
- **Features**:
  - Comprehensive patient information form
  - Firebase Authentication integration
  - Patient profile creation
  - Form validation
  - Auto-redirect after registration

### Main Application Pages

#### DashboardPage.js

- **Purpose**: Patient main portal
- **Features**:
  - Patient overview
  - Medical information display
  - Quick access to appointments
  - Health metrics
  - Settings management
- **Tabs**: Overview, Medical, Appointments, Tests, Metrics, Insurance, Documents, Settings

#### AppointmentBookingPage.js

- **Purpose**: Comprehensive appointment booking
- **Features**:
  - Specialty selection
  - Doctor filtering by location and availability
  - Date/time selection
  - Patient information collection
  - Booking confirmation
- **Integration**: Real-time doctor availability from Firestore

#### AppointmentListPage.js

- **Purpose**: Appointment history and management
- **Features**:
  - Past and upcoming appointments
  - Appointment details
  - Cancellation functionality
  - PDF export capabilities

#### ProfilePage.js

- **Purpose**: User profile management
- **Features**:
  - Personal information editing
  - Medical history management
  - Contact information updates
  - Account settings

#### DoctorsPage.js

- **Purpose**: Doctor directory and search
- **Features**:
  - Doctor listings with filters
  - Specialty-based search
  - Location filtering
  - Rating and review display
  - Quick booking options

### Landing & Information Pages

#### Landing.js

- **Purpose**: Marketing and introduction page
- **Features**:
  - Hero section with call-to-action
  - Service highlights
  - Doctor showcases
  - Testimonials
  - Registration prompts

#### ServicesPage.js

- **Purpose**: Healthcare services information
- **Features**:
  - Service categories
  - Detailed descriptions
  - Pricing information (if applicable)
  - Booking integration

## 🛜 Services

### doctorsService.js

- **Purpose**: Doctor-related API operations
- **Functions**:
  - `getAllDoctors()` - Fetch all doctors from Firestore
  - `getDoctorsBySpecialty(specialty)` - Filter doctors by specialty
  - `getDoctorAvailability(doctorId, date)` - Check specific availability
  - `searchDoctors(criteria)` - Advanced doctor search

### patientService.js

- **Purpose**: Patient-related API operations
- **Functions**:
  - `createPatientProfile(patientId, formData)` - Create new patient
  - `getPatientProfile(patientId)` - Retrieve patient data
  - `updatePatientProfile(patientId, updates)` - Update patient info
  - `addBooking(patientId, bookingData)` - Add new appointment
  - `getPatientAppointments(patientId)` - Get appointment history
  - `formatBookingData()` - Standardize booking format

## 🎨 Styling

### Tailwind CSS Implementation

- **Utility Classes**: Extensive use of Tailwind utilities
- **Custom Components**: Healthcare-specific styling
- **Responsive Design**: Mobile-first approach
- **Color Scheme**: Medical professional palette
- **Animations**: Smooth transitions and micro-interactions

### Custom Animations

```css
@keyframes float {
  '0%, 100%': { transform: 'translateY(0px)' },
  '50%': { transform: 'translateY(-10px)' }
}

@keyframes fadeIn {
  from: { opacity: '0', transform: 'translateY(20px)' },
  to: { opacity: '1', transform: 'translateY(0)' }
}
```

### Material-UI Integration

- **Theme Customization**: Healthcare-focused theme
- **Component Override**: Custom styling for MUI components
- **Consistent Design**: Unified design language

## 🚀 Environment Setup

### Prerequisites

- Node.js 16+ and npm
- Firebase project with Firestore enabled
- Google Cloud Project for Cloud Functions

### Installation

```bash
# Clone repository
git clone https://github.com/tomrud88/healthcare-test.git
cd healthcare-test/healthcare-test-repo/frontend-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase configuration

# Start development server
npm start
```

### Development Environment

- **Port**: 3000 (default React development server)
- **Hot Reload**: Enabled for development
- **Error Overlay**: React error boundary integration
- **Source Maps**: Enabled for debugging

## 📜 Available Scripts

```bash
# Development
npm start          # Start development server (localhost:3000)
npm test           # Run test suite with Jest
npm run build      # Create production build
npm run eject      # Eject from Create React App (irreversible)

# Testing
npm test -- --coverage     # Run tests with coverage report
npm test -- --watchAll     # Run tests in watch mode
```

## ✨ Features

### Core Healthcare Features

- **Patient Registration**: Comprehensive onboarding
- **Appointment Booking**: Real-time availability checking
- **Doctor Search**: AI-powered search with natural language
- **Medical Records**: Secure patient data management
- **Chat Integration**: 24/7 AI healthcare assistant

### User Experience Features

- **Auto-Form Population**: Logged-in users get pre-filled forms
- **Responsive Design**: Works on all device sizes
- **Real-time Updates**: Live data synchronization
- **Progressive Web App**: PWA capabilities
- **Accessibility**: WCAG compliance efforts

### Security Features

- **Firebase Authentication**: Enterprise-grade security
- **Protected Routes**: Authentication-required pages
- **Data Encryption**: Secure data transmission
- **Input Validation**: Client and server-side validation

## 🔌 API Integration

### Firebase Integration

- **Authentication**: Email/password with session management
- **Firestore Database**: Real-time NoSQL database
- **Cloud Functions**: Serverless backend integration

### External APIs

- **Dialogflow CX**: Natural language processing for chat
- **Google Cloud Functions**: Serverless API endpoints
- **Healthcare Services**: Custom healthcare API integration

### Data Flow

1. **User Authentication** → Firebase Auth
2. **Patient Data** → Firestore `/patients` collection
3. **Doctor Data** → Firestore `/doctors` collection
4. **Appointments** → Firestore `/appointments` collection
5. **Chat Interactions** → Dialogflow CX → Cloud Functions

## 🏗 Architecture Patterns

### State Management

- **React Context**: Authentication and global state
- **Local State**: Component-specific state with useState
- **Firebase Realtime**: Live data synchronization

### Component Architecture

- **Functional Components**: Modern React with hooks
- **Custom Hooks**: Reusable state logic
- **Context Providers**: Global state management
- **Error Boundaries**: Graceful error handling

### Performance Optimization

- **Code Splitting**: Lazy loading for routes
- **Memoization**: React.memo for expensive components
- **Optimized Builds**: Production build optimization
- **Caching Strategy**: Firebase caching and local storage

## 🔧 Configuration Files

### Package.json Scripts

- Build configuration for production
- Test configuration with Jest
- ESLint configuration for code quality
- Browserslist for browser compatibility

### Tailwind Config

- Custom color palette
- Typography settings
- Responsive breakpoints
- Animation configurations

## 📱 Mobile Responsiveness

### Responsive Design Strategy

- **Mobile-First**: Design starts with mobile
- **Breakpoints**: sm, md, lg, xl breakpoints
- **Touch-Friendly**: Appropriate touch targets
- **Performance**: Optimized for mobile networks

### Mobile-Specific Features

- **Touch Gestures**: Swipe navigation where appropriate
- **Keyboard Handling**: Mobile keyboard optimization
- **Viewport Meta**: Proper mobile viewport configuration
- **App-like Experience**: PWA capabilities

---

## 📞 Support & Maintenance

### Development Team Contact

- **Repository**: https://github.com/tomrud88/healthcare-test
- **Issue Tracking**: GitHub Issues
- **Documentation**: This README and inline code comments

### Version Information

- **Current Version**: 0.1.0
- **React Version**: 19.1.0
- **Last Updated**: September 2025
- **License**: Private

---

_This documentation is maintained alongside the codebase and should be updated with any significant changes to the application architecture or features._
