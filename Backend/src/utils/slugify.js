// Turns a human label into the stored category value.
//
// The value is what a report keeps forever and what a department's category
// list is matched on, so it has to stay stable and predictable: lower case,
// underscores, no spaces. It is derived once when the category is created and
// never derived again, so renaming a label later cannot orphan the reports
// already filed under the old value.
const slugify = (value) =>
  String(value)
    .normalize("NFKD")
    // Strips accents, so "Sanitation & Pest" and "Sanitation" cannot collide
    // on the same value
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);

module.exports = slugify;