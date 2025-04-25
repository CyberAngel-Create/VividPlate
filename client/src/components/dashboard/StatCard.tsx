import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
}

const StatCard = ({ icon, value, label }: StatCardProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="text-primary text-2xl mb-2">
        {icon}
      </div>
      <div className="text-dark text-2xl font-bold">{value}</div>
      <div className="text-midgray text-sm">{label}</div>
    </div>
  );
};

export default StatCard;
