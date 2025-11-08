export const indiaTemperatureData = [
  { Year: 1970, AvgTemp: 23.4 },
  { Year: 1980, AvgTemp: 23.6 },
  { Year: 1990, AvgTemp: 23.8 },
  { Year: 2000, AvgTemp: 24.2 },
  { Year: 2010, AvgTemp: 24.5 },
  { Year: 2020, AvgTemp: 24.8 },
  { Year: 2023, AvgTemp: 25.0 },
];

export const indiaCO2Data = [
  { Year: 1970, CO2: 200 },
  { Year: 1980, CO2: 350 },
  { Year: 1990, CO2: 600 },
  { Year: 2000, CO2: 1000 },
  { Year: 2010, CO2: 1800 },
  { Year: 2020, CO2: 2600 },
  { Year: 2023, CO2: 2800 },
];

export interface Mission {
  id: number;
  text: string;
  textHi: string;
  co2: number;
  points: number;
  completed?: boolean;
}

export const missionsData: Mission[] = [
  {
    id: 1,
    text: 'Use fan instead of AC for 1 hour',
    textHi: '1 घंटे के लिए AC की जगह पंखे का उपयोग करें',
    co2: 0.2,
    points: 5,
  },
  {
    id: 2,
    text: 'Plant a sapling',
    textHi: 'एक पौधा लगाएं',
    co2: 22,
    points: 50,
  },
  {
    id: 3,
    text: 'Switch off lights for 2 hours',
    textHi: '2 घंटे के लिए लाइट बंद करें',
    co2: 0.15,
    points: 3,
  },
  {
    id: 4,
    text: 'Use public transport instead of car',
    textHi: 'कार के बजाय सार्वजनिक परिवहन का उपयोग करें',
    co2: 2.5,
    points: 20,
  },
  {
    id: 5,
    text: 'Cook with a pressure cooker',
    textHi: 'प्रेशर कुकर से खाना बनाएं',
    co2: 0.3,
    points: 8,
  },
];

export const aiResponses: Record<string, { en: string; hi: string }> = {
  'global warming': {
    en: 'Global warming increases temperatures and monsoon variability in India, affecting agriculture and water supplies. Small actions like reducing AC use can help reduce your carbon footprint.',
    hi: 'ग्लोबल वार्मिंग से भारत में तापमान और मानसून की परिवर्तनशीलता बढ़ती है, जो कृषि और जल आपूर्ति को प्रभावित करती है। AC का कम उपयोग जैसे छोटे कार्य आपके कार्बन फुटप्रिंट को कम करने में मदद कर सकते हैं।',
  },
  heatwave: {
    en: 'Heatwaves are becoming more frequent in India due to climate change, posing health risks especially in urban areas. Stay hydrated, use fans instead of AC when possible, and plant trees to reduce local temperatures.',
    hi: 'जलवायु परिवर्तन के कारण भारत में लू अधिक बार आ रही है, विशेष रूप से शहरी क्षेत्रों में स्वास्थ्य जोखिम पैदा कर रही है। हाइड्रेटेड रहें, जब संभव हो तो AC के बजाय पंखे का उपयोग करें, और स्थानीय तापमान को कम करने के लिए पेड़ लगाएं।',
  },
  default: {
    en: 'Climate change affects India through rising temperatures, changing rainfall patterns, and extreme weather events. Every small action counts—from using public transport to conserving energy at home.',
    hi: 'जलवायु परिवर्तन भारत को बढ़ते तापमान, बदलते वर्षा पैटर्न और चरम मौसम की घटनाओं के माध्यम से प्रभावित करता है। सार्वजनिक परिवहन का उपयोग करने से लेकर घर पर ऊर्जा बचाने तक हर छोटी कार्रवाई मायने रखती है।',
  },
};

export const activityAnalysis: Record<string, {
  co2_estimate: number;
  impact_level: 'green' | 'moderate' | 'harmful';
  tips: string[];
  tipsHi: string[];
  benefits: string[];
  benefitsHi: string[];
}> = {
  'car': {
    co2_estimate: 0.72,
    impact_level: 'harmful',
    tips: ['Walk or cycle for short trips', 'Use public transport', 'Consider carpooling'],
    tipsHi: ['छोटी यात्राओं के लिए पैदल या साइकिल चलाएं', 'सार्वजनिक परिवहन का उपयोग करें', 'कारपूलिंग पर विचार करें'],
    benefits: ['Better health', 'Saves money', 'Reduces pollution'],
    benefitsHi: ['बेहतर स्वास्थ्य', 'पैसे बचाता है', 'प्रदूषण कम करता है'],
  },
  'bus': {
    co2_estimate: 0.25,
    impact_level: 'green',
    tips: ['Great choice!', 'Consider metro for longer trips'],
    tipsHi: ['बढ़िया विकल्प!', 'लंबी यात्राओं के लिए मेट्रो पर विचार करें'],
    benefits: ['Low carbon footprint', 'Cost effective'],
    benefitsHi: ['कम कार्बन फुटप्रिंट', 'किफायती'],
  },
  'meat': {
    co2_estimate: 3.3,
    impact_level: 'moderate',
    tips: ['Try plant-based meals', 'Reduce portion sizes', 'Choose chicken over red meat'],
    tipsHi: ['पौध-आधारित भोजन आज़माएं', 'हिस्से का आकार कम करें', 'लाल मांस के बजाय चिकन चुनें'],
    benefits: ['Healthier diet', 'Lower emissions', 'Saves water'],
    benefitsHi: ['स्वस्थ आहार', 'कम उत्सर्जन', 'पानी बचाता है'],
  },
  'ac': {
    co2_estimate: 1.2,
    impact_level: 'moderate',
    tips: ['Use fan instead', 'Set AC to 24-26°C', 'Close doors and windows'],
    tipsHi: ['पंखे का उपयोग करें', 'AC को 24-26°C पर सेट करें', 'दरवाजे और खिड़कियां बंद करें'],
    benefits: ['Lower electricity bills', 'Reduced emissions'],
    benefitsHi: ['कम बिजली बिल', 'कम उत्सर्जन'],
  },
};
