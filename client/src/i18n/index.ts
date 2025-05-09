import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translations for multiple languages
// Common translation keys used across the app
const translations = {
  common: {
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    username: 'Username',
    password: 'Password',
    adminUsername: 'Admin Username',
    adminPassword: 'Admin Password',
    email: 'Email',
    fullName: 'Full Name',
    dashboard: 'Dashboard',
    profile: 'Profile',
    admin: 'Admin',
    restaurantOwner: 'Restaurant Owner',
    adminLogin: 'Admin Login',
    adminOnly: 'For platform administrators only',
    noAccount: 'Don\'t have an account?',
    createAccount: 'Create Account',
    successLogin: 'You have been logged in successfully',
    successAdminLogin: 'Admin login successful',
    invalidCredentials: 'Invalid username or password',
    invalidAdminCredentials: 'Invalid admin credentials',
    language: 'Language',
    translateMenu: 'Translate Menu',
  },
  home: {
    welcome: 'Welcome to MenuMate',
    subtitle: 'Create and share digital menus for your restaurant',
    getStarted: 'Get Started',
    learnMore: 'Learn More',
  },
  dashboard: {
    myRestaurants: 'My Restaurants',
    createRestaurant: 'Create Restaurant',
    subscriptionStatus: 'Subscription Status',
    stats: 'Statistics',
    viewMenu: 'View Menu',
    editMenu: 'Edit Menu',
    shareMenu: 'Share Menu',
    upgradeAccount: 'Upgrade Account',
    freeAccount: 'Free Account',
    premiumAccount: 'Premium Account',
    restaurantLimit: 'Restaurant limit:',
    expirationDate: 'Expiration date:',
  },
  menu: {
    categories: 'Categories',
    items: 'Items',
    price: 'Price',
    description: 'Description',
    addCategory: 'Add Category',
    addItem: 'Add Item',
    editCategory: 'Edit Category',
    editItem: 'Edit Item',
    deleteCategory: 'Delete Category',
    deleteItem: 'Delete Item',
    confirmDelete: 'Are you sure you want to delete this?',
    availableItems: 'Available Items',
    tags: 'Tags',
    uploadImage: 'Upload Image',
    imageSize: 'Max image size: 3MB',
    all: 'All',
    food: 'Food',
    beverage: 'Beverage',
    clickToLeaveFeedback: 'Click to leave feedback',
    noImage: 'No image',
    noItemsInCategory: 'No items in this category',
    noMenuItems: 'No menu items yet',
    previewMode: 'Preview Mode',
  },
  restaurant: {
    uploadLogo: 'Upload Restaurant Logo',
    logoSize: 'Max logo size: 3MB',
    uploadBanner: 'Upload Restaurant Banner',
    bannerSize: 'Max banner size: 3MB',
    feedback: 'Customer Feedback',
    viewFeedback: 'View Feedback',
    noFeedback: 'No feedback yet',
    leaveFeedback: 'Share Your Experience',
  },
  subscription: {
    choosePlan: 'Choose Your Plan',
    freePlan: 'Free Plan',
    premiumPlan: 'Premium Plan',
    monthlyBilling: 'Monthly Billing',
    yearlyBilling: 'Yearly Billing',
    subscribe: 'Subscribe',
    features: 'Features',
    includedFeatures: 'Included Features',
    restaurantLimit: 'Restaurant Limit',
    adsDisplay: 'Ads Display',
    support: 'Support',
    yes: 'Yes',
    no: 'No',
    basic: 'Basic',
    priority: 'Priority',
  },
  feedback: {
    leaveFeedback: 'Leave Feedback',
    yourRating: 'Your Rating',
    yourComment: 'Your Comment',
    name: 'Name',
    email: 'Email',
    submit: 'Submit Feedback',
    thankYou: 'Thank you for your feedback!',
  },
  admin: {
    adminPanel: 'Admin Panel',
    restaurants: 'Restaurants',
    users: 'Users',
    subscriptions: 'Subscriptions',
    feedback: 'Feedback',
    overview: 'Overview',
    premiumUsers: 'Premium Users',
    totalRestaurants: 'Total Restaurants',
    totalFeedback: 'Total Feedback',
    recentSubscriptions: 'Recent Subscriptions',
    allRestaurants: 'All Restaurants',
    allSubscriptions: 'All Subscriptions',
    allFeedback: 'All Feedback',
    approveFeedback: 'Approve',
    rejectFeedback: 'Reject',
  },
};

// Additional languages
const amharicTranslations = {
  common: {
    login: 'ግባ',
    register: 'ተመዝገብ',
    logout: 'ውጣ',
    username: 'የተጠቃሚ ስም',
    password: 'የይለፍ ቃል',
    language: 'ቋንቋ',
    translateMenu: 'ምናሌዉን ተረጉም',
  },
  menu: {
    categories: 'ምድቦች',
    items: 'ምግቦች',
    price: 'ዋጋ',
    description: 'መግለጫ',
    all: 'ሁሉም',
    food: 'ምግብ',
    beverage: 'መጠጥ',
    clickToLeaveFeedback: 'አስተያየት ለመስጠት ይጫኑ',
    noImage: 'ምስል የለም',
    noItemsInCategory: 'በዚህ ምድብ ውስጥ ምንም ምግቦች የሉም',
    noMenuItems: 'እስካሁን ምንም ምግቦች አልተጨመሩም',
    previewMode: 'የናሙና ሁኔታ',
    tags: 'መለያዎች'
  },
  restaurant: {
    feedback: 'የደንበኛ አስተያየት',
    leaveFeedback: 'አስተያየትዎን ያጋሩ',
  }
};

const frenchTranslations = {
  common: {
    login: 'Connexion',
    register: 'S\'inscrire',
    logout: 'Déconnexion',
    username: 'Nom d\'utilisateur',
    password: 'Mot de passe',
    language: 'Langue',
    translateMenu: 'Traduire le menu',
  },
  menu: {
    categories: 'Catégories',
    items: 'Articles',
    price: 'Prix',
    description: 'Description',
    all: 'Tous',
    food: 'Nourriture',
    beverage: 'Boisson',
    clickToLeaveFeedback: 'Cliquez pour laisser un commentaire',
    noImage: 'Pas d\'image',
    noItemsInCategory: 'Aucun article dans cette catégorie',
    noMenuItems: 'Pas encore d\'articles de menu',
    previewMode: 'Mode Aperçu',
    tags: 'Étiquettes'
  },
  restaurant: {
    feedback: 'Commentaires des clients',
    leaveFeedback: 'Partagez votre expérience',
  }
};

const arabicTranslations = {
  common: {
    login: 'تسجيل الدخول',
    register: 'التسجيل',
    logout: 'تسجيل الخروج',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    language: 'اللغة',
    translateMenu: 'ترجمة القائمة',
  },
  menu: {
    categories: 'الفئات',
    items: 'العناصر',
    price: 'السعر',
    description: 'الوصف',
    all: 'الكل',
    food: 'طعام',
    beverage: 'مشروبات',
    clickToLeaveFeedback: 'انقر لترك تعليق',
    noImage: 'لا توجد صورة',
    noItemsInCategory: 'لا توجد عناصر في هذه الفئة',
    noMenuItems: 'لا توجد عناصر في القائمة حتى الآن',
    previewMode: 'وضع المعاينة',
    tags: 'العلامات'
  },
  restaurant: {
    feedback: 'آراء العملاء',
    leaveFeedback: 'شارك تجربتك',
  }
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources: {
      en: {
        translation: translations
      },
      am: {
        translation: amharicTranslations
      },
      fr: {
        translation: frenchTranslations
      },
      ar: {
        translation: arabicTranslations
      }
    },
    lng: 'en',
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    }
  });

export default i18n;