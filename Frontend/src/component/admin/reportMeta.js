// Shared labels and colours for the admin screens.
//
// The API stores statuses and priorities in SCREAMING_SNAKE. These tables turn
// them into something an admin can read, and keep the badge, the filter
// dropdown and the dashboard bars always agreeing with each other.
//
// The values match the enums in the Joi validation on the backend, so nothing
// here can be sent that the server will reject.

export const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "REJECTED", label: "Rejected" },
];

export const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

// Tailwind classes for the badge pills
export const STATUS_BADGE = {
  PENDING: "bg-gray-100 text-gray-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export const PRIORITY_BADGE = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-red-600 text-white",
};

// Bar colours for the dashboard breakdown, a shade lighter than the badges
export const STATUS_BAR = {
  PENDING: "bg-gray-400",
  UNDER_REVIEW: "bg-blue-400",
  IN_PROGRESS: "bg-amber-400",
  RESOLVED: "bg-green-500",
  REJECTED: "bg-red-500",
};

export const PRIORITY_BAR = {
  LOW: "bg-gray-300",
  MEDIUM: "bg-blue-400",
  HIGH: "bg-amber-400",
  URGENT: "bg-red-500",
};

// One place to turn a raw value into a readable label
const toLabelMap = (options) =>
  options.reduce(
    (map, option) => ({ ...map, [option.value]: option.label }),
    {},
  );

export const STATUS_LABEL = toLabelMap(STATUS_OPTIONS);
export const PRIORITY_LABEL = toLabelMap(PRIORITY_OPTIONS);

// The categories a citizen can file under, mirrors Backend/src/constants/categories.js
export const CATEGORY_LABEL = {
  road_damage: "Road Damage",
  road_blockage: "Road Blockage",
  street_light: "Street Light",
  waste: "Waste Management",
  water_leakage: "Water Leakage",
  drainage: "Drainage",
  traffic_signal: "Traffic Signal",
  fallen_tree: "Fallen Tree",
  public_infrastructure: "Public Infrastructure",
  other: "Other",
};

export const getStatusLabel = (value) => STATUS_LABEL[value] || value;
export const getPriorityLabel = (value) => PRIORITY_LABEL[value] || value;
export const getCategoryLabel = (value) => CATEGORY_LABEL[value] || value;

// The dropdowns need an empty option, the backend treats "" as no filter
export const FILTER_OPTIONS = [{ value: "", label: "All" }, ...STATUS_OPTIONS];
