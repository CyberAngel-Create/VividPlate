import { useTranslation } from 'react-i18next';

// Common menu item translations
export const menuItemTranslations = {
  en: {
    // Categories
    'Main Course': 'Main Course',
    'Breakfast': 'Breakfast',
    'Burger': 'Burger',
    'Pizza': 'Pizza',
    'Snack & Sandwiches': 'Snack & Sandwiches',
    'Bakery': 'Bakery',
    'Appetizers': 'Appetizers',
    'Desserts': 'Desserts',
    'Beverages': 'Beverages',
    'Salads': 'Salads',
    'Pasta': 'Pasta',
    'Seafood': 'Seafood',
    'Meat': 'Meat',
    'Vegetarian': 'Vegetarian',
    'Soups': 'Soups',
    
    // Common food items
    'Cloud steak': 'Cloud Steak',
    'Lasagna': 'Lasagna',
    'Habesha Combo': 'Habesha Combo',
    'Burger with Fries': 'Burger with Fries',
    'Margherita Pizza': 'Margherita Pizza',
    'Caesar Salad': 'Caesar Salad',
    'Chicken Sandwich': 'Chicken Sandwich',
    'Coffee': 'Coffee',
    'Tea': 'Tea',
    'Fresh Juice': 'Fresh Juice',
    'Water': 'Water',
    'Coca Cola': 'Coca Cola',
    'Sprite': 'Sprite',
    'Chicken Stew': 'Chicken Stew',
    'Beef Stew': 'Beef Stew',
    'Fish Fillet': 'Fish Fillet',
    'Grilled Chicken': 'Grilled Chicken',
    'Roasted Beef': 'Roasted Beef',
    'French Fries': 'French Fries',
    'Rice': 'Rice',
    'Bread': 'Bread',
    'Pasta Bolognese': 'Pasta Bolognese',
    
    // Common descriptions
    'Homemade beef lasagna, cheese, tomato sauce, herbs': 'Homemade beef lasagna, cheese, tomato sauce, herbs',
    'Tibs firfir, shiro guanta, firfir and injera': 'Tibs firfir, shiro guanta, firfir and injera',
    'Grilled beef steak with vegetables': 'Grilled beef steak with vegetables',
    'Fresh lettuce, croutons, parmesan cheese': 'Fresh lettuce, croutons, parmesan cheese',
    'Freshly brewed coffee': 'Freshly brewed coffee',
    'Hot tea with lemon': 'Hot tea with lemon',
  },
  
  am: {
    // Categories - Amharic
    'Main Course': 'ዋና ምግብ',
    'Breakfast': 'የቁርስ ምግብ',
    'Burger': 'በርገር',
    'Pizza': 'ፒዛ',
    'Snack & Sandwiches': 'መክሰስ እና ሳንድዊች',
    'Bakery': 'የዳቦ ቤት',
    'Appetizers': 'መክሰስ',
    'Desserts': 'ጣፋጭ ምግቦች',
    'Beverages': 'መጠጦች',
    'Salads': 'ሰላጣ',
    'Pasta': 'ፓስታ',
    'Seafood': 'የባህር ምግብ',
    'Meat': 'ስጋ',
    'Vegetarian': 'የእጽዋት ተመጋቢ',
    'Soups': 'ሾርባ',
    
    // Common food items - Amharic
    'Cloud steak': 'ክላውድ ስቴክ',
    'Lasagna': 'ላዛኛ',
    'Habesha Combo': 'ሀበሻ ኮምቦ',
    'Burger with Fries': 'በርገር ከድንች ጋር',
    'Margherita Pizza': 'ማርጋሪታ ፒዛ',
    'Caesar Salad': 'ቄሳር ሰላጣ',
    'Chicken Sandwich': 'የዶሮ ሳንድዊች',
    'Coffee': 'ቡና',
    'Tea': 'ሻይ',
    'Fresh Juice': 'ፍሬሽ ጁስ',
    'Water': 'ውሃ',
    'Coca Cola': 'ኮካ ኮላ',
    'Sprite': 'ስፕራይት',
    'Chicken Stew': 'የዶሮ ወጥ',
    'Beef Stew': 'የሥጋ ወጥ',
    'Fish Fillet': 'የዓሳ ሰሌዳ',
    'Grilled Chicken': 'የተጠበሰ ዶሮ',
    'Roasted Beef': 'የተጠበሰ ሥጋ',
    'French Fries': 'ፍሬንች ድንች',
    'Rice': 'ሩዝ',
    'Bread': 'ዳቦ',
    'Pasta Bolognese': 'ፓስታ ቦሎኝዝ',
    
    // Common descriptions - Amharic
    'Homemade beef lasagna, cheese, tomato sauce, herbs': 'የቤት የሃቀ ላዛኛ፣ አይብ፣ የቲማቲም ሳውስ፣ ቅመሞች',
    'Tibs firfir, shiro guanta, firfir and injera': 'ጥብስ ፍርፍር፣ ሽሮ ጓንታ፣ ፍርፍር እና እንጀራ',
    'Grilled beef steak with vegetables': 'የተጠበሰ የልዘዎች ስቴክ ከአትክልት ጋር',
    'Fresh lettuce, croutons, parmesan cheese': 'ፍሬሽ ሰላጣ፣ ክሩቶን፣ ፓርሜዛን አይብ',
    'Freshly brewed coffee': 'ፍሬሽ የተሰራ ቡና',
    'Hot tea with lemon': 'ሙቅ ሻይ ከሎሚ ጋር',
  },
  
  fr: {
    // Categories - French
    'Main Course': 'Plat Principal',
    'Breakfast': 'Petit Déjeuner',
    'Burger': 'Burger',
    'Pizza': 'Pizza',
    'Snack & Sandwiches': 'Collations et Sandwiches',
    'Bakery': 'Boulangerie',
    'Appetizers': 'Apéritifs',
    'Desserts': 'Desserts',
    'Beverages': 'Boissons',
    'Salads': 'Salades',
    'Pasta': 'Pâtes',
    'Seafood': 'Fruits de Mer',
    'Meat': 'Viande',
    'Vegetarian': 'Végétarien',
    'Soups': 'Soupes',
    
    // Common food items - French
    'Cloud steak': 'Steak Cloud',
    'Lasagna': 'Lasagne',
    'Habesha Combo': 'Combo Habesha',
    'Burger with Fries': 'Burger avec Frites',
    'Margherita Pizza': 'Pizza Margherita',
    'Caesar Salad': 'Salade César',
    'Chicken Sandwich': 'Sandwich au Poulet',
    'Coffee': 'Café',
    'Tea': 'Thé',
    'Fresh Juice': 'Jus Frais',
    'Water': 'Eau',
    'Coca Cola': 'Coca Cola',
    'Sprite': 'Sprite',
    
    // Common descriptions - French
    'Homemade beef lasagna, cheese, tomato sauce, herbs': 'Lasagne de bœuf maison, fromage, sauce tomate, herbes',
    'Tibs firfir, shiro guanta, firfir and injera': 'Tibs firfir, shiro guanta, firfir et injera',
    'Grilled beef steak with vegetables': 'Steak de bœuf grillé avec légumes',
    'Fresh lettuce, croutons, parmesan cheese': 'Laitue fraîche, croûtons, fromage parmesan',
    'Freshly brewed coffee': 'Café fraîchement préparé',
    'Hot tea with lemon': 'Thé chaud au citron',
  },
  
  ar: {
    // Categories - Arabic
    'Main Course': 'الطبق الرئيسي',
    'Breakfast': 'الإفطار',
    'Burger': 'برجر',
    'Pizza': 'بيتزا',
    'Snack & Sandwiches': 'وجبات خفيفة وساندويتش',
    'Bakery': 'المخبز',
    'Appetizers': 'المقبلات',
    'Desserts': 'الحلويات',
    'Beverages': 'المشروبات',
    'Salads': 'السلطات',
    'Pasta': 'المعكرونة',
    'Seafood': 'المأكولات البحرية',
    'Meat': 'اللحوم',
    'Vegetarian': 'نباتي',
    'Soups': 'الحساء',
    
    // Common food items - Arabic
    'Cloud steak': 'ستيك كلاود',
    'Lasagna': 'لازانيا',
    'Habesha Combo': 'كومبو هابيشا',
    'Burger with Fries': 'برجر مع البطاطس المقلية',
    'Margherita Pizza': 'بيتزا مارجريتا',
    'Caesar Salad': 'سلطة قيصر',
    'Chicken Sandwich': 'ساندويتش دجاج',
    'Coffee': 'قهوة',
    'Tea': 'شاي',
    'Fresh Juice': 'عصير طازج',
    'Water': 'ماء',
    'Coca Cola': 'كوكا كولا',
    'Sprite': 'سبرايت',
    
    // Common descriptions - Arabic
    'Homemade beef lasagna, cheese, tomato sauce, herbs': 'لازانيا لحم البقر محلية الصنع، جبن، صلصة طماطم، أعشاب',
    'Tibs firfir, shiro guanta, firfir and injera': 'تيبس فيرفير، شيرو غوانتا، فيرفير وإنجيرا',
    'Grilled beef steak with vegetables': 'ستيك لحم بقري مشوي مع الخضار',
    'Fresh lettuce, croutons, parmesan cheese': 'خس طازج، خبز محمص، جبن بارميزان',
    'Freshly brewed coffee': 'قهوة محضرة طازجة',
    'Hot tea with lemon': 'شاي ساخن بالليمون',
  },
  
  zh: {
    // Categories - Chinese
    'Main Course': '主菜',
    'Breakfast': '早餐',
    'Burger': '汉堡',
    'Pizza': '披萨',
    'Snack & Sandwiches': '小食和三明治',
    'Bakery': '烘焙',
    'Appetizers': '开胃菜',
    'Desserts': '甜点',
    'Beverages': '饮料',
    'Salads': '沙拉',
    'Pasta': '意面',
    'Seafood': '海鲜',
    'Meat': '肉类',
    'Vegetarian': '素食',
    'Soups': '汤品',
    
    // Common food items - Chinese
    'Cloud steak': '云朵牛排',
    'Lasagna': '千层面',
    'Habesha Combo': '哈贝莎套餐',
    'Burger with Fries': '汉堡配薯条',
    'Margherita Pizza': '玛格丽特披萨',
    'Caesar Salad': '凯撒沙拉',
    'Chicken Sandwich': '鸡肉三明治',
    'Coffee': '咖啡',
    'Tea': '茶',
    'Fresh Juice': '鲜榨果汁',
    'Water': '水',
    'Coca Cola': '可口可乐',
    'Sprite': '雪碧',
    
    // Common descriptions - Chinese
    'Homemade beef lasagna, cheese, tomato sauce, herbs': '自制牛肉千层面，奶酪，番茄酱，香草',
    'Tibs firfir, shiro guanta, firfir and injera': 'Tibs firfir，shiro guanta，firfir 和 injera',
    'Grilled beef steak with vegetables': '烤牛排配蔬菜',
    'Fresh lettuce, croutons, parmesan cheese': '新鲜生菜，面包丁，帕玛森奶酪',
    'Freshly brewed coffee': '现煮咖啡',
    'Hot tea with lemon': '柠檬热茶',
  }
};

// Translation helper function
export const translateMenuText = (text: string, language: string): string => {
  if (!text || language === 'en') return text;
  
  const translations = menuItemTranslations[language as keyof typeof menuItemTranslations];
  if (!translations) return text;
  
  // Check for exact match first
  if (translations[text as keyof typeof translations]) {
    return translations[text as keyof typeof translations];
  }
  
  // Check for partial matches (case insensitive)
  const lowerText = text.toLowerCase();
  for (const [key, value] of Object.entries(translations)) {
    if (key.toLowerCase() === lowerText) {
      return value;
    }
  }
  
  return text; // Return original if no translation found
};

// Hook for menu translations
export const useMenuTranslation = () => {
  const { i18n } = useTranslation();
  
  const translateMenu = (text: string): string => {
    return translateMenuText(text, i18n.language);
  };
  
  return { translateMenu, currentLanguage: i18n.language };
};