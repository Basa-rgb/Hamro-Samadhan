const Faq = require("../models/Faq");

// getFaqs
const getFaqs = async (req, res) => {
  try {
    // Public, the FAQ page is open to everyone
    // Hidden questions are filtered out, and order decides where each one sits
    const faqs = await Faq.find({ isActive: true }).sort({
      order: 1,
      createdAt: 1,
    });

    return res.status(200).json({
      success: true,
      count: faqs.length,
      faqs,
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
  getFaqs,
};
