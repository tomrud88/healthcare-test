// scripts/migrateGymsToFirestore.js
import { gyms } from "../data/gyms";
import { GymsService } from "../services/gymsService";

export const migrateGymsToFirestore = async () => {
  console.log("Starting migration of gyms to Cloud Database...");

  try {
    // Use the migrateLocalData endpoint for batch migration
    console.log(`📋 Migrating ${gyms.length} gyms...`);

    const result = await GymsService.migrateLocalData(gyms);

    console.log("\n📊 Migration Summary:");
    console.log(`✅ Successfully migrated: ${result.successful} gyms`);
    console.log(`❌ Failed to migrate: ${result.errors} gyms`);
    console.log(`📋 Total gyms processed: ${result.total}`);

    if (result.errors === 0) {
      console.log("\n🎉 All gyms successfully migrated to Cloud Database!");
    } else {
      console.log(
        "\n⚠️ Migration completed with some errors. Please check the logs above."
      );
      if (result.errorDetails && result.errorDetails.length > 0) {
        console.log("Error details:", result.errorDetails);
      }
    }

    return {
      success: result.successful,
      errors: result.errors,
      total: result.total,
      details: result,
    };
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
};

export const verifyGymMigration = async () => {
  console.log("Verifying gym migration...");

  try {
    // Get all gyms from cloud database
    const cloudGyms = await GymsService.getAllGyms();
    const originalCount = gyms.length;
    const cloudCount = cloudGyms.length;

    console.log(`📊 Verification Results:`);
    console.log(`📋 Original gyms: ${originalCount}`);
    console.log(`☁️ Cloud gyms: ${cloudCount}`);

    const match = originalCount === cloudCount;

    if (match) {
      console.log("✅ Gym migration verification successful!");
    } else {
      console.log("❌ Gym migration verification failed - counts don't match");
    }

    return {
      match,
      originalCount,
      firestoreCount: cloudCount,
      cloudGyms,
    };
  } catch (error) {
    console.error("Verification failed:", error);
    throw error;
  }
};

export const clearAllGyms = async () => {
  console.log("⚠️ This will delete ALL gyms from the cloud database!");

  try {
    // Get all gyms first
    const allGyms = await GymsService.getAllGyms();

    if (allGyms.length === 0) {
      console.log("📋 No gyms found in cloud database.");
      return { deleted: 0, total: 0 };
    }

    let deletedCount = 0;
    let errorCount = 0;

    console.log(`🗑️ Deleting ${allGyms.length} gyms...`);

    for (const gym of allGyms) {
      try {
        await GymsService.deleteGym(gym.id);
        console.log(`✅ Deleted: ${gym.name}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Failed to delete: ${gym.name}`, error);
        errorCount++;
      }
    }

    console.log("\n📊 Deletion Summary:");
    console.log(`✅ Successfully deleted: ${deletedCount} gyms`);
    console.log(`❌ Failed to delete: ${errorCount} gyms`);

    return {
      deleted: deletedCount,
      errors: errorCount,
      total: allGyms.length,
    };
  } catch (error) {
    console.error("Clear operation failed:", error);
    throw error;
  }
};
