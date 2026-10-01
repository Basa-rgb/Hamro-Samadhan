require("dotenv").config();
const mongoose = require("mongoose");
const Department = require("../src/models/Department");
const Category = require("../src/models/Category");
const { ensureCategories } = require("../src/services/category.service");

// The departments a citizen's report can be routed to, and the complaint types
// each one owns.
//
// The categories are the load bearing part of this file. They decide which
// department a report is suggested to, and they are the whole visible world of a
// department admin, so a department with an empty list here would give its admin
// an empty portal.
//
// "other" is treated as a catch-all by the routing suggestion, and the General
// Administration department claims all 18 so no report is left with nowhere to go.
//
// Every category value is checked against the collection before it is written. If
// the admin has added a type that is not listed here, it is simply not assigned to
// anything, which is visible and fixable on the Categories screen rather than
// silently wrong.
const departments = [
  {
    name: "Waste Management Department",
    description:
      "Household and commercial waste collection, dustbin placement, illegal dumping and street cleaning.",
    categories: ["waste", "sanitation", "pollution"],
  },
  {
    name: "Road Maintenance Department",
    description:
      "Potholes, damaged road surfaces, unpaved roads, road markings and speed breakers.",
    categories: ["road_damage", "road_blockage", "construction"],
  },
  {
    name: "Road Obstacle Removal Department",
    description:
      "Removing fallen trees, boulders, earth or debris blocking a road, footpath or drain.",
    categories: ["road_blockage", "fallen_tree"],
  },
  {
    name: "Street Light Department",
    description:
      "Repairing and installing street lights, and replacing bulbs or damaged poles.",
    categories: ["street_light", "electricity"],
  },
  {
    name: "Water Supply Department",
    description:
      "Drinking water supply, leaking pipes, broken taps and supply interruptions.",
    categories: ["water_leakage"],
  },
  {
    name: "Drainage and Sewerage Department",
    description:
      "Blocked drains, open manholes, overflowing sewers and roadside drainage repair.",
    categories: ["drainage", "water_leakage", "waste"],
  },
  {
    name: "Traffic Department",
    description:
      "Traffic signals, road signs, lane markings, parking management and traffic police support.",
    categories: ["traffic_signal", "road_blockage", "safety"],
  },
  {
    name: "Public Infrastructure Department",
    description:
      "Public buildings, parks, playgrounds, bus stops, benches, bridges and other community assets.",
    categories: ["public_infrastructure", "park", "construction", "safety"],
  },
  {
    name: "Sanitation and Pest Control Department",
    description:
      "Mosquito control, stray animal removal, cleaning of public toilets and disinfection work.",
    categories: ["animals", "sanitation", "pollution"],
  },
  {
    name: "Electrical Maintenance Department",
    description:
      "Public wiring, transformer and electrical faults on municipal property and common areas.",
    categories: ["electricity", "street_light"],
  },
  {
    name: "Greenary and Environment Department",
    description:
      "Planting and pruning, parks and gardens, and fallen tree clearance after storms.",
    categories: ["park", "fallen_tree", "pollution"],
  },
  {
    name: "General Administration Department",
    description:
      "Receives any report that does not fit a specialised department and forwards it to the right one.",
    // The catch-all, so it can take a report of any type
    categories: ["other"],
  },
];

// One-off script: adds the starter departments and the categories they own
//
// Skips any department whose name already exists, so it is safe to re-run and
// will not overwrite departments an admin has renamed or edited. A department that
// already exists is reported if it has no categories yet, because that is the one
// thing an admin has to go and fix in the portal
const departmentSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGOOSE_URL);
    console.log("Database connected successfully");

    // The category list is data now, so it has to exist before departments can
    // point at it
    await ensureCategories();

    const knownCategories = new Set(await Category.distinct("value"));

    // name has a unique index, so an existing name must be skipped rather than
    // inserted, otherwise the whole seed dies on the first duplicate
    const existing = await Department.find().select("name categories");
    const existingNames = new Set(existing.map((department) => department.name));

    const toCreate = departments
      .filter((department) => !existingNames.has(department.name))
      .map((department) => ({
        name: department.name,
        description: department.description,
        // Values the collection does not know are dropped, so the seed can never
        // write a category that no longer exists
        categories: department.categories.filter((value) =>
          knownCategories.has(value),
        ),
      }));

    if (toCreate.length === 0) {
      console.log(
        `All ${departments.length} departments already exist, nothing added`,
      );
    } else {
      if (toCreate.length < departments.length) {
        console.log(
          `Skipping ${departments.length - toCreate.length} that already exist`,
        );
      }

      await Department.insertMany(toCreate);

      console.log(
        `Departments seeded successfully: ${toCreate.length} added, ${await Department.countDocuments()} total`,
      );
    }

    // Departments that exist with no categories are a real problem: their
    // department admin would sign in to an empty portal. Named here so it does not
    // have to be discovered from that symptom
    const withoutCategories = existing
      .filter((department) => !department.categories.length)
      .map((department) => department.name);

    if (withoutCategories.length) {
      console.log(
        `Needs categories assigned in the portal: ${withoutCategories.join(", ")}`,
      );
    }
  } catch (error) {
    console.error("Seed error:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};

// Run it with: node scripts/seedDepartments.js
departmentSeed();