import { useTranslation } from "react-i18next";
import CategoryManagement from "@/components/menu/CategoryManagement";
import RestaurantOwnerLayout from "@/components/layout/RestaurantOwnerLayout";

export default function CategoriesPage() {
  const { t } = useTranslation();

  return (
    <RestaurantOwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("Manage Categories")}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t("Organize your menu categories and reorder them")}
          </p>
        </div>
        
        <CategoryManagement />
      </div>
    </RestaurantOwnerLayout>
  );
}