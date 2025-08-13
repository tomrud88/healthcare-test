// frontend-app/src/pages/AppointmentBookingPage.js
import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../AuthContext"; // To get the logged-in user's UID and email, and getIdToken
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from "@mui/material";

function AppointmentBookingPage() {
  // Destructure getIdToken from AuthContext
  const {
    currentUser,
    loading: authLoading,
    getIdToken,
  } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- Cloud Function URLs from environment variables ---
  const BOOK_APPOINTMENT_API_URL =
    process.env.REACT_APP_BOOK_APPOINTMENT_API_URL;
  const GET_AVAILABLE_APPOINTMENTS_API_URL =
    process.env.REACT_APP_GET_AVAILABLE_APPOINTMENTS_API_URL;

  // Validate that environment variables are set
  if (!BOOK_APPOINTMENT_API_URL || !GET_AVAILABLE_APPOINTMENTS_API_URL) {
    console.error("Missing required environment variables for API URLs");
  }

  // State for available appointments fetched from backend
  const [availableSlots, setAvailableSlots] = useState([]);

  // State for form inputs
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");

  // State for UI feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Effect to fetch available appointments when selectedDate changes
  useEffect(() => {
    const fetchAvailableAppointmentsForDate = async (date) => {
      // Wait until auth status is known and currentUser is loaded
      if (authLoading) return;

      if (!date) {
        setAvailableSlots([]);
        return;
      }

      setLoading(true);
      setError("");
      setAvailableSlots([]);
      setSelectedTime("");

      if (!currentUser) {
        setError("Please log in to view available slots.");
        setLoading(false);
        return;
      }

      try {
        // Get the Firebase ID token
        const idToken = await getIdToken();
        if (!idToken) {
          throw new Error(
            "Could not get authentication token. Please log in again."
          );
        }

        const response = await fetch(GET_AVAILABLE_APPOINTMENTS_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`, // <-- NOW INCLUDING THE ID TOKEN HERE
          },
          body: JSON.stringify({ date: date }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to fetch available appointments."
          );
        }

        const data = await response.json();
        if (data && data.slots) {
          setAvailableSlots(data.slots);
          if (data.slots.length === 0) {
            setError(
              "No available slots for this date. Please choose another."
            );
          }
        } else {
          setAvailableSlots([]);
          setError("Received unexpected data format for available slots.");
        }
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (selectedDate) {
      fetchAvailableAppointmentsForDate(selectedDate);
    } else {
      setAvailableSlots([]);
    }
  }, [
    selectedDate,
    GET_AVAILABLE_APPOINTMENTS_API_URL,
    currentUser,
    authLoading,
    getIdToken,
  ]); // Added currentUser, authLoading, getIdToken to dependencies

  // Function to handle appointment booking submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    if (!currentUser) {
      setError("You must be logged in to book an appointment.");
      setLoading(false);
      return;
    }

    if (!selectedDate || !selectedTime || !serviceType) {
      setError("Please select a date, time, and service type.");
      setLoading(false);
      return;
    }

    try {
      // Get the Firebase ID token
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error(
          "Could not get authentication token. Please log in again."
        );
      }

      const appointmentData = {
        patientId: currentUser.uid, // Send UID from currentUser
        patientEmail: currentUser.email, // Send email from currentUser
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        serviceType: serviceType,
        notes: notes,
      };

      const response = await fetch(BOOK_APPOINTMENT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`, // Include the ID token in the Authorization header
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to book appointment.");
      }

      const result = await response.json();
      setSuccessMessage(result.message || "Appointment booked successfully!");
      // Clear the form after successful booking
      setSelectedDate("");
      setSelectedTime("");
      setServiceType("");
      setNotes("");
      setAvailableSlots([]);
      console.log("Appointment booking successful:", result);
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          p: 3,
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Book a New Appointment
        </Typography>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <CircularProgress size={24} />
            <Typography sx={{ ml: 2 }}>Loading available slots...</Typography>
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {successMessage}
          </Alert>
        )}

        {!currentUser && !authLoading && (
          <Alert severity="info" sx={{ mt: 2, textAlign: "center" }}>
            Please{" "}
            <Link
              to="/login"
              style={{ color: "#007bff", textDecoration: "none" }}
            >
              log in
            </Link>{" "}
            to book an appointment.
          </Alert>
        )}
        {authLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <CircularProgress size={24} />
            <Typography sx={{ ml: 2 }}>Checking login status...</Typography>
          </Box>
        )}

        {currentUser && (
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              marginTop: "20px",
            }}
          >
            <FormControl fullWidth>
              <InputLabel id="service-type-label">Service Type</InputLabel>
              <Select
                labelId="service-type-label"
                id="serviceType"
                value={serviceType}
                label="Service Type"
                onChange={(e) => setServiceType(e.target.value)}
                required
                disabled={loading}
              >
                <MenuItem value="">Select a service</MenuItem>
                <MenuItem value="General Checkup">General Checkup</MenuItem>
                <MenuItem value="Consultation">Consultation</MenuItem>
                <MenuItem value="Vaccination">Vaccination</MenuItem>
                <MenuItem value="Follow-up">Follow-up</MenuItem>
                <MenuItem value="Specialist Referral">
                  Specialist Referral
                </MenuItem>
                <MenuItem value="Diagnostic Test">Diagnostic Test</MenuItem>
                <MenuItem value="Dental Check-up">Dental Check-up</MenuItem>
                <MenuItem value="Physiotherapy">Physiotherapy</MenuItem>
                <MenuItem value="Eye Exam">Eye Exam</MenuItem>
                <MenuItem value="Emergency">Emergency</MenuItem>
              </Select>
            </FormControl>

            <TextField
              id="appointmentDate"
              label="Select Date"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime("");
              }}
              required
              disabled={loading}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().split("T")[0] }}
              fullWidth
            />

            {selectedDate && (
              <FormControl fullWidth>
                <InputLabel id="appointment-time-label">Select Time</InputLabel>
                <Select
                  labelId="appointment-time-label"
                  id="appointmentTime"
                  value={selectedTime}
                  label="Select Time"
                  onChange={(e) => setSelectedTime(e.target.value)}
                  required
                  disabled={loading || availableSlots.length === 0}
                >
                  <MenuItem value="">Select a time</MenuItem>
                  {availableSlots.map((slot, index) => (
                    <MenuItem key={index} value={slot}>
                      {slot}
                    </MenuItem>
                  ))}
                </Select>
                {availableSlots.length === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    No slots available for this date. Please choose another.
                  </Typography>
                )}
              </FormControl>
            )}

            <TextField
              id="notes"
              label="Notes (optional)"
              placeholder="Any specific notes or concerns?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={3}
              disabled={loading}
              fullWidth
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={
                loading ||
                !currentUser ||
                !selectedDate ||
                !selectedTime ||
                !serviceType
              }
              sx={{ mt: 2, py: 1.5 }}
            >
              {loading ? "Booking..." : "Book Appointment"}
            </Button>
          </form>
        )}
      </Box>
    </Container>
  );
}

export default AppointmentBookingPage;
