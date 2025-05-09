import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
}

const StatCard = ({ icon, value, label }: StatCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900/30 dark:border dark:border-gray-700">
      <div className="text-primary dark:text-primary-light text-2xl mb-2">
        {icon}
      </div>
      <div className="text-dark dark:text-white text-2xl font-bold">{value}</div>
      <div className="text-midgray dark:text-gray-300 text-sm">{label}</div>
    </div>
  );
};

export default StatCard;
