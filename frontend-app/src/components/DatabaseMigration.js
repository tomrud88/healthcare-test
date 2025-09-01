// src/components/DatabaseMigration.js
import React, { useState } from "react";
import {
  migrateDoctorsToFirestore,
  verifyMigration,
  clearAllDoctors,
} from "../scripts/migrateDoctorsToFirestore";

const DatabaseMigration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);

  const handleMigration = async () => {
    setIsLoading(true);
    setMigrationStatus(null);

    try {
      const result = await migrateDoctorsToFirestore();
      setMigrationStatus({
        type: "success",
        message: `Migration completed! ${result.success}/${result.total} doctors migrated successfully.`,
        details: result,
      });
    } catch (error) {
      setMigrationStatus({
        type: "error",
        message: `Migration failed: ${error.message}`,
        details: error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    setIsLoading(true);
    setVerificationStatus(null);

    try {
      const result = await verifyMigration();
      setVerificationStatus({
        type: result.match ? "success" : "error",
        message: result.match
          ? "Verification successful! All doctors migrated correctly."
          : `Verification failed! Expected ${result.originalCount}, found ${result.firestoreCount}`,
        details: result,
      });
    } catch (error) {
      setVerificationStatus({
        type: "error",
        message: `Verification failed: ${error.message}`,
        details: error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (
      !window.confirm(
        "⚠️ Are you sure you want to delete ALL doctors from Firestore? This action cannot be undone!"
      )
    ) {
      return;
    }

    setIsLoading(true);

    try {
      const deletedCount = await clearAllDoctors();
      setMigrationStatus({
        type: "success",
        message: `Cleanup completed! ${deletedCount} doctors deleted.`,
        details: { deletedCount },
      });
      setVerificationStatus(null);
    } catch (error) {
      setMigrationStatus({
        type: "error",
        message: `Cleanup failed: ${error.message}`,
        details: error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Database Migration Tools
        </h2>
        <p className="text-gray-600">
          Use these tools to migrate doctor data from local files to Google
          Cloud Firestore.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={handleMigration}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Processing..." : "Migrate Doctors to Firestore"}
        </button>

        <button
          onClick={handleVerification}
          disabled={isLoading}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Processing..." : "Verify Migration"}
        </button>

        <button
          onClick={handleClearAll}
          disabled={isLoading}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Processing..." : "Clear All Doctors"}
        </button>
      </div>

      {/* Migration Status */}
      {migrationStatus && (
        <div
          className={`p-4 rounded-lg mb-4 ${
            migrationStatus.type === "success"
              ? "bg-green-100 border border-green-200 text-green-800"
              : "bg-red-100 border border-red-200 text-red-800"
          }`}
        >
          <h3 className="font-semibold mb-2">Migration Status</h3>
          <p>{migrationStatus.message}</p>
          {migrationStatus.details && (
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">Details</summary>
              <pre className="mt-2 text-sm bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(migrationStatus.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Verification Status */}
      {verificationStatus && (
        <div
          className={`p-4 rounded-lg mb-4 ${
            verificationStatus.type === "success"
              ? "bg-green-100 border border-green-200 text-green-800"
              : "bg-red-100 border border-red-200 text-red-800"
          }`}
        >
          <h3 className="font-semibold mb-2">Verification Status</h3>
          <p>{verificationStatus.message}</p>
          {verificationStatus.details && (
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">Details</summary>
              <pre className="mt-2 text-sm bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(verificationStatus.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
          <li>
            <strong>Migrate Doctors:</strong> Upload all doctor data from local
            files to Firestore
          </li>
          <li>
            <strong>Verify Migration:</strong> Check that all doctors were
            migrated correctly
          </li>
          <li>
            <strong>Clear All Doctors:</strong> Delete all doctors from
            Firestore (use with caution!)
          </li>
        </ol>

        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-200 rounded text-yellow-800 text-sm">
          <strong>⚠️ Important:</strong> Make sure your Firebase project is
          properly configured and you have write permissions to Firestore.
        </div>
      </div>
    </div>
  );
};

export default DatabaseMigration;
