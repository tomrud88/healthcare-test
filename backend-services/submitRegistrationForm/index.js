// your-healthcare-platform/backend-services/submitRegistrationForm/index.js

const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore();

functions.http('submitRegistrationForm', async (req, res) => {
    // CORS Preflight handling
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*'); // Replace with your frontend domain in production
        res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.set('Access-Control-Max-Age', '3600');
        return res.status(204).send('');
    }

    // Set CORS headers for the actual response
    res.set('Access-Control-Allow-Origin', '*'); // Replace with your frontend domain in production

    try {
        const { patientId, formData } = req.body; // Expecting patientId (Firebase UID) and formData object

        if (!patientId || !formData) {
            return res.status(400).json({ error: 'Missing patientId or formData.' });
        }

        // Reference to the patient's document in Firestore (using Firebase Auth UID)
        const patientRef = db.collection('patients').doc(patientId);

        // Update the document with new registration data.
        // Using `merge: true` will add/update fields without overwriting the entire document.
        await patientRef.set({
            ...formData, // Spread the form data directly into the document
            updatedAt: Firestore.FieldValue.serverTimestamp() // Timestamp for update
        }, { merge: true });

        console.log(`Registration form submitted for patient: ${patientId}`);
        res.status(200).json({ message: 'Registration form submitted successfully.' });

    } catch (error) {
        console.error('Error submitting registration form:', error);
        res.status(500).json({ error: 'Internal server error.', details: error.message });
    }
});