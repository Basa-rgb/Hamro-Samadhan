require("dotenv").config();
const mongoose = require("mongoose");
const Faq = require("../src/models/Faq");

// The starter FAQ, in the same order the page shows them
const faqs = [
  {
    order: 1,
    question: "What is Hamro Samadhan?",
    answer:
      "It is a public service platform where citizens report problems in their area, such as road damage, waste, water leakage or broken street lights, and follow what the responsible office does about them.",
    questionNe: "हाम्रो समाधान के हो?",
    answerNe:
      "यो एक सार्वजनिक सेवा प्लेटफर्म हो, जहाँ नागरिकहरू आफ्नो क्षेत्रका समस्या जस्तै सडक क्षति, फोहोरमैला, पानी चुहावट वा बत्ती बिजुली गोबो भएको रिपोर्ट गर्न र सम्बन्धित कार्यालयले के गर्यो हेर्न सक्छन्।",
  },
  {
    order: 2,
    question: "Who can report an issue?",
    answer:
      "Any resident of the municipality can report a public problem. You only need a valid phone number or email address so the office can reach you.",
    questionNe: "कसले समस्या रिपोर्ट गर्न सक्छ?",
    answerNe:
      "नगरपालिकाको कुनै पनि बासिन्दाले सार्वजनिक समस्या रिपोर्ट गर्न सक्छन्। कार्यालयले तपाईंलाई सम्पर्क गर्न सक्ने मान्य फोन नम्बर वा इमेल ठेगाना चाहिन्छ।",
  },
  {
    order: 3,
    question: "Is it free to use?",
    answer:
      "Yes. Reporting and tracking an issue costs nothing. Be careful with anyone who asks you for money to file a report on your behalf.",
    questionNe: "यो सेवा निःशुल्क हो?",
    answerNe:
      "हो, रिपोर्ट गर्न र अनुगमन गर्न केही शुल्क छैन। तपाईंको तर्फबाट रिपोर्ट गर्न पैसा माग्ने कसैलाई विश्वास नगर्नुहोस्।",
  },
  {
    order: 4,
    question: "What information do I need to provide?",
    answer:
      "A short title, the category of the problem, a description, the location with address or map pin, and your contact details. Anything missing may slow the report down.",
    questionNe: "कस्ता जानकारी दिनुपर्छ?",
    answerNe:
      "छोटो शीर्षक, समस्याको श्रेणी, विवरण, ठेगाना वा नक्सामा पिन, र तपाईंको सम्पर्क विवरण। केही छुटेमा काम ढिलो हुन सक्छ।",
  },
  {
    order: 5,
    question: "Is a photo required?",
    answer:
      "Yes, a photo is required. Please upload a clear PNG or JPG under 5MB that shows the whole problem.",
    questionNe: "फोटो अनिवार्य हो?",
    answerNe:
      "हो, फोटो अनिवार्य हुन्छ। कृपया सम्पूर्ण समस्या देखिने, 5MB भन्दा कम साइजको स्पष्ट PNG वा JPG अपलोड गर्नुहोस्।",
  },
  {
    order: 6,
    question: "How long does it take to resolve?",
    answer:
      "It depends on the type and severity of the issue. Urgent safety problems are prioritised, while larger works take longer. You can check progress with your report ID.",
    questionNe: "समाधान हुन कति समय लाग्छ?",
    answerNe:
      "यसले समस्याको किसिम र गम्भीरतामा निर्भर गर्छ। सुरक्षासम्बन्धी अत्यावश्यक समस्यालाई प्राथमिकता दिइन्छ, ठूला कामलाई बढी समय लाग्छ। आफ्नो रिपोर्ट आईडीबाट प्रगति हेर्न सक्नुहुन्छ।",
  },
  {
    order: 7,
    question: "How do I track my report?",
    answer:
      "After submitting you receive a report ID. Save it and use it on the Track Report page to see the current status of your report.",
    questionNe: "आफ्नो रिपोर्ट कसरी हेर्ने?",
    answerNe:
      "पेश गरेपछि तपाईंले रिपोर्ट आईडी पाउनुहुन्छ। त्यसलाई सुरक्षित राख्नुहोस् र रिपोर्ट हेर्नुहोस् पृष्ठमा प्रयोग गरी वर्तमान स्थिति हेर्नुहोस्।",
  },
  {
    order: 8,
    question: "I already reported the same problem. What now?",
    answer:
      "Do not submit it again. Search your saved report ID to check its status. If the problem gets worse, add a new report and mention the earlier report ID in the description.",
    questionNe: "उही समस्या पहिले नै रिपोर्ट गरिसकेको छु, अब के गर्ने?",
    answerNe:
      "दोब्बो पटक नपेस गर्नुहोस्। आफ्नो रिपोर्ट आईडी प्रयोग गरी स्थिति हेर्नुहोस्। समस्या बढेमा नयाँ रिपोर्ट गर्दा विवरणमा पहिलेको रिपोर्ट आईडी उल्लेख गर्नुहोस्।",
  },
  {
    order: 9,
    question: "Can I report anonymously?",
    answer:
      "No, a working phone number or email is required. This is so the office can confirm the location and update you when the work is done. Your details are not shown publicly.",
    questionNe: "बिना नाम रिपोर्ट गर्न सकिन्छ?",
    answerNe:
      "सकिँदैन, काम चलाउने फोन नम्बर वा इमेल आवश्यक हुन्छ। यसले कार्यालयले ठेगाना पुष्टि गरी काम भएपछि तपाईंलाई जानकारी दिन सक्नेछ। तपाईंको विवरण सार्वजनिक रूपमा देखाइँदैन।",
  },
  {
    order: 10,
    question: "Is my personal information safe?",
    answer:
      "Yes. Your name, phone number and email are used only to process and update your report, and are never displayed publicly with it.",
    questionNe: "मेरो व्यक्तिगत जानकारी सुरक्षित छ?",
    answerNe:
      "हो। तपाईंको नाम, फोन नम्बर र इमेल रिपोर्ट प्रक्रियापर गर्न र अद्यावधिक दिन मात्र प्रयोग गरिन्छ, र कहिल्यै सार्वजनिक रूपमा देखाइँदैन।",
  },
];

// One-off script: fills the FAQ table with the starter questions
const faqSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGOOSE_URL);
    console.log("Database connected successfully");

    // Nothing is duplicated on a re-run, the count is checked first
    const existingCount = await Faq.countDocuments();

    if (existingCount > 0) {
      console.log(`FAQ already has ${existingCount} questions, nothing added`);
      return;
    }

    await Faq.insertMany(faqs);

    console.log(`FAQ seeded successfully: ${faqs.length} questions added`);
  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};

// Run it with: node scripts/seedFaq.js
faqSeed();
