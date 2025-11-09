import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        home: 'Home',
        learn: 'AI Tutor',
        visualize: 'Data',
        missions: 'Missions',
        dailyLog: 'Daily Log',
        dashboard: 'Dashboard',
        profile: 'Profile',
      },
      home: {
        title: 'Learn • Act • Earn',
        subtitle: 'Your personal climate action companion for India',
        cta: 'Get Started',
        demo: 'Try Demo',
        stats: {
          users: 'Active Users',
          co2Saved: 'CO₂ Saved (kg)',
          missions: 'Missions Completed',
        },
      },
      learn: {
        title: 'AI Climate Tutor',
        subtitle: 'Ask me anything about climate change in India',
        placeholder: 'e.g., How does global warming affect India?',
        teachMe: 'Teach Me',
        loading: 'Thinking...',
      },
      visualize: {
        title: 'India Climate Data',
        subtitle: 'Interactive visualizations powered by ASDI',
        tempTitle: 'Average Temperature Trends',
        co2Title: 'CO₂ Emissions',
        source: 'Source: ASDI (NASA NEX-GDDP / CMS)',
      },
      missions: {
        title: 'Daily Eco-Missions',
        subtitle: 'Complete missions to earn EcoPoints',
        markDone: 'Mark as Done',
        completed: 'Completed!',
        points: 'Points',
        co2: 'CO₂ Saved',
        regenerate: 'Regenerate',
      },
      dailyLog: {
        title: 'Daily Green Routine Tracker',
        subtitle: 'Track your daily activities and their climate impact',
        placeholder: 'Describe your activity...',
        analyze: 'Analyze',
        presets: {
          car: 'Drove petrol car 3 km',
          bus: 'Took bus 5 km',
          meat: 'Ate meat meal',
          ac: 'Used AC for 2 hours',
        },
        results: {
          impact: 'Impact Level',
          tips: 'Green Tips',
          benefits: 'Benefits',
          addToLog: 'Add to Log',
        },
      },
      dashboard: {
        title: 'Your Dashboard',
        subtitle: 'Track your climate impact',
        ecoPoints: 'EcoPoints',
        co2Saved: 'Total CO₂ Saved',
        badges: 'Badges',
        weeklyTrend: 'Weekly Points',
        actions: {
          mission: 'Do a Mission',
          log: 'Log Routine',
          learn: 'Ask AI',
        },
      },
      profile: {
        title: 'Profile Settings',
        language: 'Language',
        resetData: 'Reset All Data',
        exportData: 'Export Data',
        privacy: 'Your data is stored locally on your device',
      },
      common: {
        kg: 'kg',
        loading: 'Loading...',
        error: 'Something went wrong',
      },
    },
  },
  hi: {
    translation: {
      nav: {
        home: 'होम',
        learn: 'AI ट्यूटर',
        visualize: 'डेटा',
        missions: 'मिशन',
        dailyLog: 'दैनिक लॉग',
        dashboard: 'डैशबोर्ड',
        profile: 'प्रोफाइल',
      },
      home: {
        title: 'सीखें • कार्य करें • कमाएं',
        subtitle: 'भारत के लिए आपका व्यक्तिगत जलवायु कार्रवाई साथी',
        cta: 'शुरू करें',
        demo: 'डेमो आज़माएं',
        stats: {
          users: 'सक्रिय उपयोगकर्ता',
          co2Saved: 'CO₂ बचाया (kg)',
          missions: 'पूर्ण मिशन',
        },
      },
      learn: {
        title: 'AI जलवायु ट्यूटर',
        subtitle: 'भारत में जलवायु परिवर्तन के बारे में मुझसे कुछ भी पूछें',
        placeholder: 'उदा., ग्लोबल वार्मिंग भारत को कैसे प्रभावित करती है?',
        teachMe: 'मुझे सिखाएं',
        loading: 'सोच रहा हूं...',
      },
      visualize: {
        title: 'भारत जलवायु डेटा',
        subtitle: 'ASDI द्वारा संचालित इंटरैक्टिव विज़ुअलाइज़ेशन',
        tempTitle: 'औसत तापमान रुझान',
        co2Title: 'CO₂ उत्सर्जन',
        source: 'स्रोत: ASDI (NASA NEX-GDDP / CMS)',
      },
      missions: {
        title: 'दैनिक इको-मिशन',
        subtitle: 'इकोपॉइंट्स अर्जित करने के लिए मिशन पूरा करें',
        markDone: 'पूर्ण करें',
        completed: 'पूर्ण हुआ!',
        points: 'अंक',
        co2: 'CO₂ बचाया',
        regenerate: 'पुनः उत्पन्न करें',
      },
      dailyLog: {
        title: 'दैनिक हरित दिनचर्या ट्रैकर',
        subtitle: 'अपनी दैनिक गतिविधियों और उनके जलवायु प्रभाव को ट्रैक करें',
        placeholder: 'अपनी गतिविधि का वर्णन करें...',
        analyze: 'विश्लेषण करें',
        presets: {
          car: 'पेट्रोल कार से 3 किमी चलाया',
          bus: 'बस में 5 किमी यात्रा की',
          meat: 'मांसाहार भोजन किया',
          ac: '2 घंटे AC इस्तेमाल किया',
        },
        results: {
          impact: 'प्रभाव स्तर',
          tips: 'हरित सुझाव',
          benefits: 'लाभ',
          addToLog: 'लॉग में जोड़ें',
        },
      },
      dashboard: {
        title: 'आपका डैशबोर्ड',
        subtitle: 'अपने जलवायु प्रभाव को ट्रैक करें',
        ecoPoints: 'इकोपॉइंट्स',
        co2Saved: 'कुल CO₂ बचाया',
        badges: 'बैज',
        weeklyTrend: 'साप्ताहिक अंक',
        actions: {
          mission: 'मिशन करें',
          log: 'दिनचर्या लॉग करें',
          learn: 'AI से पूछें',
        },
      },
      profile: {
        title: 'प्रोफाइल सेटिंग्स',
        language: 'भाषा',
        resetData: 'सभी डेटा रीसेट करें',
        exportData: 'डेटा निर्यात करें',
        privacy: 'आपका डेटा आपके डिवाइस पर स्थानीय रूप से संग्रहीत है',
      },
      common: {
        kg: 'किग्रा',
        loading: 'लोड हो रहा है...',
        error: 'कुछ गलत हुआ',
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
