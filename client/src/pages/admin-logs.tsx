import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

const AdminLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [logType, setLogType] = useState("all");
  const { toast } = useToast();

  // Fetch admin logs
  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/logs", logType],
    queryFn: async () => {
      const endpoint = logType === "all" 
        ? "/api/admin/logs" 
        : `/api/admin/logs?type=${logType}`;
      const response = await apiRequest("GET", endpoint);
      const data = await response.json();
      return data;
    }
  });

  const filteredLogs = logs.filter((log: any) => 
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entityType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(log.details)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Activity Logs</h1>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search logs..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={logType} onValueChange={setLogType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Log Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Logs</SelectItem>
                <SelectItem value="user">User Logs</SelectItem>
                <SelectItem value="restaurant">Restaurant Logs</SelectItem>
                <SelectItem value="subscription">Subscription Logs</SelectItem>
                <SelectItem value="payment">Payment Logs</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => refetch()}>Refresh</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden dark:border dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log: any) => (
                    <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell>{log.id}</TableCell>
                      <TableCell>{log.createdAt ? format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss') : 'N/A'}</TableCell>
                      <TableCell>{log.adminUsername || log.adminId || 'N/A'}</TableCell>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell>{log.entityType}</TableCell>
                      <TableCell>{log.entityId || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate dark:text-gray-300">
                        {log.details ? JSON.stringify(log.details) : 'None'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      {searchTerm ? "No logs match your search" : "No logs found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminLogs;