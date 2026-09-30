require("dotenv").config();
const mongoose = require("mongoose");
const Department = require("../src/models/Department");

// The departments a citizen's report can be routed to.
//
// Every complaint type in src/constants/categories.js is covered by at least
// one of these, so no report is left with nowhere sensible to go.
const departments = [
  {
    name: "Waste Management Department",
    description:
      "Household and commercial waste collection, dustbin placement, illegal dumping and street cleaning.",
  },
  {
    name: "Road Maintenance Department",
    description:
      "Potholes, damaged road surfaces, unpaved roads, road markings and speed breakers.",
  },
  {
    name: "Road Obstacle Removal Department",
    description:
      "Removing fallen trees, boulders, earth or debris blocking a road, footpath or drain.",
  },
  {
    name: "Street Light Department",
    description:
      "Repairing and installing street lights, and replacing bulbs or damaged poles.",
  },
  {
    name: "Water Supply Department",
    description:
      "Drinking water supply, leaking pipes, broken taps and supply interruptions.",
  },
  {
    name: "Drainage and Sewerage Department",
    description:
      "Blocked drains, open manholes, overflowing sewers and roadside drainage repair.",
  },
  {
    name: "Traffic Department",
    description:
      "Traffic signals, road signs, lane markings, parking management and traffic police support.",
  },
  {
    name: "Public Infrastructure Department",
    description:
      "Public buildings, parks, playgrounds, bus stops, benches, bridges and other community assets.",
  },
  {
    name: "Sanitation and Pest Control Department",
    description:
      "Mosquito control, stray animal removal, cleaning of public toilets and disinfection work.",
  },
  {
    name: "Electrical Maintenance Department",
    description:
      "Public wiring, transformer and electrical faults on municipal property and common areas.",
  },
  {
    name: "Greenary and Environment Department",
    description:
      "Planting and pruning, parks and gardens, and fallen tree clearance after storms.",
  },
  {
    name: "General Administration Department",
    description:
      "Receives any report that does not fit a specialised department and forwards it to the right one.",
  },
];

// One-off script: adds the starter departments
// Skips any department whose name already exists, so it is safe to re-run and
// will not overwrite departments an admin has renamed or edited
const departmentSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGOOSE_URL);
    console.log("Database connected successfully");

    // name has a unique index, so an existing name must be skipped rather than
    // inserted, otherwise the whole seed dies on the first duplicate
    const existingNames = await Department.distinct("name");

    const toCreate = departments.filter(
      (department) => !existingNames.includes(department.name),
    );

    if (toCreate.length === 0) {
      console.log(
        `All ${departments.length} departments already exist, nothing added`,
      );
      return;
    }

    if (toCreate.length < departments.length) {
      console.log(
        `Skipping ${departments.length - toCreate.length} that already exist`,
      );
    }

    await Department.insertMany(toCreate);

    console.log(
      `Departments seeded successfully: ${toCreate.length} added, ${await Department.countDocuments()} total`,
    );
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
