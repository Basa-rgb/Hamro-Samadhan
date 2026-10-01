// The starter complaint types, used once by scripts/seedCategories.js and by
// ensureCategories on boot to fill an empty collection.
//
// This file is NOT the source of truth at runtime any more. Categories live in
// the database (src/models/Category.js) and both the public form and the admin
// screens read GET /api/categories. Adding a category is now an admin action in
// the portal, not a code change here.
//
// It is kept because a fresh database has to be filled from somewhere, and
// because existing reports already store these values.
//
// order decides the dropdown order, labelNe is what a Nepali speaker sees.
const categories = [
  { value: "road_damage", label: "Road Damage", labelNe: "सडक क्षत", order: 10 },
  {
    value: "road_blockage",
    label: "Road Blockage",
    labelNe: "सडक अवरोध",
    order: 20,
  },
  {
    value: "street_light",
    label: "Street Light",
    labelNe: "सडक बत्ती",
    order: 30,
  },
  { value: "waste", label: "Waste Management", labelNe: "फोहोर व्यवस्थापन", order: 40 },
  {
    value: "water_leakage",
    label: "Water Leakage",
    labelNe: "पानी चुहावट",
    order: 50,
  },
  { value: "drainage", label: "Drainage", labelNe: "नाली", order: 60 },
  {
    value: "traffic_signal",
    label: "Traffic Signal",
    labelNe: "ट्राफिक संकेत",
    order: 70,
  },
  { value: "fallen_tree", label: "Fallen Tree", labelNe: "भरिएको रूख", order: 80 },
  {
    value: "public_infrastructure",
    label: "Public Infrastructure",
    labelNe: "सार्वजनिक पूर्वाधार",
    order: 90,
  },
  { value: "electricity", label: "Electricity", labelNe: "बिजुली", order: 100 },
  { value: "sanitation", label: "Sanitation", labelNe: "सरसफाई", order: 110 },
  { value: "pollution", label: "Pollution", labelNe: "प्रदूषण", order: 120 },
  {
    value: "animals",
    label: "Stray Animals",
    labelNe: "छाडा चौपाया",
    order: 130,
  },
  {
    value: "construction",
    label: "Construction Issue",
    labelNe: "निर्माण समस्या",
    order: 140,
  },
  {
    value: "park",
    label: "Park & Playground",
    labelNe: "बगैंचा र खेलमैदान",
    order: 150,
  },
  {
    value: "safety",
    label: "Public Safety",
    labelNe: "सार्वजनिक सुरक्षा",
    order: 160,
  },
  { value: "noise", label: "Noise Complaint", labelNe: "ध्वनि गुनासो", order: 170 },
  { value: "other", label: "Other", labelNe: "अन्य", order: 999 },
];

module.exports = {
  categories,
};