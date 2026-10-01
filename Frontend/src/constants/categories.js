// The complaint types a citizen can pick.
//
// These are hardcoded rather than fetched from GET /api/categories on purpose.
// The list is a fixed set of enum values, the backend validates against the same
// ones, and nothing creates a category at runtime, so a round trip to load it
// bought nothing and made the form depend on the API being reachable. The form
// now renders its category options with no network call at all, which is what
// was breaking the dropdown: the request was blocked by CORS and the select came
// up empty.
//
// Changing this list means changing Backend/src/constants/categories.js too, the
// Mongoose enum and the Joi validation both validate against it, so a value sent
// from here that the backend does not know is rejected on submit.
export const CATEGORIES = [
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

export const CATEGORY_LABEL = CATEGORIES.reduce(
  (map, category) => ({ ...map, [category.value]: category.label }),
  {},
);
