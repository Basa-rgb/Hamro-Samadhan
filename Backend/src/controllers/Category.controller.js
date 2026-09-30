const { categories } = require("../constants/categories");

// getCategories
const getCategories = async (req, res) => {
  try {
    // Public, the dropdown on the report form is open to everyone
    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getCategories,
};
