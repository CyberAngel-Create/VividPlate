import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English translations only
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

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: translations
      },
    },
    lng: 'en',
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });

export default i18n;