// GraphSentinel AI - Multilingual Context & Provider (English, Hindi, Hinglish)

import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedLanguage = 'en' | 'hi' | 'hinglish';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
    hinglish: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.dashboard': {
    en: 'Dashboard',
    hi: 'डैशबोर्ड',
    hinglish: 'Dashboard',
  },
  'nav.incidents': {
    en: 'Incidents',
    hi: 'घटनाएं (इंसिडेंट्स)',
    hinglish: 'Incidents',
  },
  'nav.services': {
    en: 'Services',
    hi: 'सेवाएं (सर्विसेज)',
    hinglish: 'Services',
  },
  'nav.graph': {
    en: 'Graph Explorer',
    hi: 'ग्राफ़ एक्सप्लोरर',
    hinglish: 'Graph Explorer',
  },
  'nav.data_workspace': {
    en: 'Data Workspace',
    hi: 'डेटा वर्कस्पेस',
    hinglish: 'Data Workspace',
  },
  'nav.ai_agent': {
    en: 'AI Investigation Agent',
    hi: 'एआई जांच एजेंट',
    hinglish: 'AI Investigation Agent',
  },
  'nav.history': {
    en: 'Investigation History',
    hi: 'जांच इतिहास',
    hinglish: 'Investigation History',
  },
  'nav.profile': {
    en: 'Profile',
    hi: 'प्रोफ़ाइल',
    hinglish: 'Profile',
  },
  'nav.settings': {
    en: 'Settings',
    hi: 'सेटिंग्स',
    hinglish: 'Settings',
  },

  // Actions & Buttons
  'action.search': {
    en: 'Search services, incidents, or graph...',
    hi: 'सर्विसेज, इंसिडेंट्स या ग्राफ खोजें...',
    hinglish: 'Services, incidents ya graph search karein...',
  },
  'action.login': {
    en: 'Sign In',
    hi: 'लॉग इन करें',
    hinglish: 'Sign In Karein',
  },
  'action.logout': {
    en: 'Sign Out',
    hi: 'लॉग आउट करें',
    hinglish: 'Sign Out Karein',
  },
  'action.save': {
    en: 'Save Changes',
    hi: 'परिवर्तन सहेजें',
    hinglish: 'Changes Save Karein',
  },
  'action.upload': {
    en: 'Upload Dataset',
    hi: 'डेटासेट अपलोड करें',
    hinglish: 'Dataset Upload Karein',
  },
  'action.import': {
    en: 'Confirm & Import',
    hi: 'पुष्टि करें और आयात करें',
    hinglish: 'Confirm & Import Karein',
  },
  'action.cancel': {
    en: 'Cancel',
    hi: 'रद्द करें',
    hinglish: 'Cancel Karein',
  },
  'action.refresh': {
    en: 'Refresh',
    hi: 'रिफ्रेश करें',
    hinglish: 'Refresh Karein',
  },
  'action.translate': {
    en: 'Translate Answer',
    hi: 'उत्तर अनुवाद करें',
    hinglish: 'Answer Translate Karein',
  },
  'action.resume': {
    en: 'Resume Chat',
    hi: 'चैट जारी रखें',
    hinglish: 'Chat Resume Karein',
  },

  // Status & Badges
  'status.healthy': {
    en: 'Healthy',
    hi: 'स्वस्थ (हेल्दी)',
    hinglish: 'Healthy',
  },
  'status.degraded': {
    en: 'Degraded',
    hi: 'प्रभावित (डीग्रेडेड)',
    hinglish: 'Degraded',
  },
  'status.critical': {
    en: 'Critical',
    hi: 'गंभीर (क्रिटिकल)',
    hinglish: 'Critical',
  },
  'status.investigating': {
    en: 'Investigating',
    hi: 'जांच जारी है',
    hinglish: 'Investigating',
  },
  'status.resolved': {
    en: 'Resolved',
    hi: 'समाधान हो चुका है',
    hinglish: 'Resolved',
  },

  // Provenance Badges
  'provenance.synthetic': {
    en: 'Synthetic Demo Data',
    hi: 'सिंथेटिक डेमो डेटा',
    hinglish: 'Synthetic Demo Data',
  },
  'provenance.imported': {
    en: 'User-Imported Data',
    hi: 'उपयोगकर्ता द्वारा आयातित डेटा',
    hinglish: 'User-Imported Data',
  },
  'provenance.external': {
    en: 'Verified External Data',
    hi: 'सत्यापित बाहरी डेटा',
    hinglish: 'Verified External Data',
  },

  // Safety Warnings
  'safety.read_only': {
    en: 'Read-Only (Safe)',
    hi: 'केवल पढ़ने योग्य (सुरक्षित)',
    hinglish: 'Read-Only (Safe)',
  },
  'safety.privileged': {
    en: 'Privileged (Requires elevated access)',
    hi: 'विशेषाधिकार प्राप्त (एलीवेटेड एक्सेस आवश्यक)',
    hinglish: 'Privileged (Elevated access chahiye)',
  },
  'safety.destructive': {
    en: 'Destructive / High Risk (Requires approval & review)',
    hi: 'विनाशकारी / उच्च जोखिम (मंजूरी और समीक्षा आवश्यक)',
    hinglish: 'Destructive / High Risk (Review & approval zaroori hai)',
  },
  'safety.disclaimer': {
    en: 'Never executed automatically. Human review is required before running any command in production.',
    hi: 'यह आदेश स्वचालित रूप से कभी निष्पादित नहीं होता। प्रोडक्शन में चलाने से पहले मानवीय समीक्षा आवश्यक है।',
    hinglish: 'Yeh commands automatically run nahi hote. Production mein run karne se pehle human review zaroori hai.',
  },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('graphsentinel_lang');
    if (saved === 'hi' || saved === 'hinglish' || saved === 'en') {
      return saved;
    }
    return 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('graphsentinel_lang', lang);
  };

  const t = (key: string, fallback?: string): string => {
    const entry = translations[key];
    if (entry && entry[language]) {
      return entry[language];
    }
    if (entry && entry.en) {
      return entry.en;
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
