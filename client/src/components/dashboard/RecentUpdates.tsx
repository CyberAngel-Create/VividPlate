import { formatDate } from "@/lib/utils";

interface Update {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
}

interface RecentUpdatesProps {
  updates: Update[];
}

const RecentUpdates = ({ updates }: RecentUpdatesProps) => {
  return (
    <div>
      <h2 className="text-xl font-heading font-semibold mb-4">Recent Updates</h2>
      <div className="bg-white rounded-lg shadow-md p-4 mb-8">
        {updates.length === 0 ? (
          <p className="text-midgray text-center py-4">No recent activity to display.</p>
        ) : (
          updates.map((update, index) => (
            <div 
              key={update.id}
              className={`${index < updates.length - 1 ? 'border-b pb-3 mb-3' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-dark">{update.title}</h3>
                  <p className="text-sm text-midgray">{update.description}</p>
                </div>
                <span className="text-xs text-midgray">{formatDate(update.timestamp)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentUpdates;
