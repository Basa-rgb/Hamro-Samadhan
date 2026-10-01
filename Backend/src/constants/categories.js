// The complaint types a citizen can pick, kept in one place so the schema,
// the validation and the frontend dropdown all read the same list
const categories = [
  { value: "road_damage", label: "Road Damage" },
  { value: "road_blockage", label: "Road Blockage" },
  { value: "street_light", label: "Street Light" },
  { value: "waste", label: "Waste Management" },
  { value: "water_leakage", label: "Water Leakage" },
  { value: "drainage", label: "Drainage" },
  { value: "traffic_signal", label: "Traffic Signal" },
  { value: "fallen_tree", label: "Fallen Tree" },
  { value: "public_infrastructure", label: "Public Infrastructure" },
  { value: "electricity", label: "Electricity" },
  { value: "sanitation", label: "Sanitation" },
  { value: "pollution", label: "Pollution" },
  { value: "animals", label: "Stray Animals" },
  { value: "construction", label: "Construction Issue" },
  { value: "park", label: "Park & Playground" },
  { value: "safety", label: "Public Safety" },
  { value: "noise", label: "Noise Complaint" },
  { value: "other", label: "Other" },
];


// Just the value part, which is what the schema and Joi validate against
const categoryValues = categories.map((category) => category.value);

module.exports = {
  categories,
  categoryValues,
};
