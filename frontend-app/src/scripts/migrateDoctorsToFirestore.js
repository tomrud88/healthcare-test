// src/scripts/migrateDoctorsToFirestore.js
import { doctors } from "../data/doctors";
import { DoctorsService } from "../services/doctorsService";

export const migrateDoctorsToFirestore = async () => {
  console.log("Starting migration of doctors to Cloud Database...");

  try {
    // Use the new migrateLocalData endpoint for batch migration
    console.log(`📋 Migrating ${doctors.length} doctors...`);

    const result = await DoctorsService.migrateLocalData(doctors);

    console.log("\n📊 Migration Summary:");
    console.log(`✅ Successfully migrated: ${result.successful} doctors`);
    console.log(`❌ Failed to migrate: ${result.failed} doctors`);
    console.log(`📋 Total doctors processed: ${result.total}`);

    if (result.failed === 0) {
      console.log("\n🎉 All doctors successfully migrated to Cloud Database!");
    } else {
      console.log(
        "\n⚠️ Migration completed with some errors. Please check the logs above."
      );
      if (result.errors && result.errors.length > 0) {
        console.log("Error details:", result.errors);
      }
    }

    return {
      success: result.successful,
      errors: result.failed,
      total: result.total,
      details: result,
    };
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
};

export const verifyMigration = async () => {
  console.log("Verifying migration...");

  try {
    // Get all doctors from cloud database
    const cloudDoctors = await DoctorsService.getAllDoctors();
    const originalCount = doctors.length;
    const cloudCount = cloudDoctors.length;

    console.log(`📊 Verification Results:`);
    console.log(`📋 Original doctors: ${originalCount}`);
    console.log(`☁️ Cloud doctors: ${cloudCount}`);

    const match = originalCount === cloudCount;

    if (match) {
      console.log("✅ Migration verification successful!");
    } else {
      console.log("❌ Migration verification failed - counts don't match");
    }

    return {
      match,
      originalCount,
      firestoreCount: cloudCount,
      cloudDoctors,
    };
  } catch (error) {
    console.error("Verification failed:", error);
    throw error;
  }
};

export const clearAllDoctors = async () => {
  console.log("⚠️ This will delete ALL doctors from the cloud database!");

  try {
    // Get all doctors first
    const allDoctors = await DoctorsService.getAllDoctors();

    if (allDoctors.length === 0) {
      console.log("📋 No doctors found in cloud database.");
      return { deleted: 0, total: 0 };
    }

    let deletedCount = 0;
    let errorCount = 0;

    console.log(`🗑️ Deleting ${allDoctors.length} doctors...`);

    for (const doctor of allDoctors) {
      try {
        await DoctorsService.deleteDoctor(doctor.id);
        console.log(`✅ Deleted: ${doctor.name}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Failed to delete: ${doctor.name}`, error);
        errorCount++;
      }
    }

    console.log("\n📊 Deletion Summary:");
    console.log(`✅ Successfully deleted: ${deletedCount} doctors`);
    console.log(`❌ Failed to delete: ${errorCount} doctors`);

    return {
      deleted: deletedCount,
      errors: errorCount,
      total: allDoctors.length,
    };
  } catch (error) {
    console.error("Clear operation failed:", error);
    throw error;
  }
};
