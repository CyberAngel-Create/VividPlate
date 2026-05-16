import MenuExamplesManager from "@/components/admin/MenuExamplesManager";
import AdminLayout from "@/components/layout/AdminLayout";

const AdminMenuExamples = () => {
  return (
    <AdminLayout>
      <div className="container mx-auto p-4">
        <MenuExamplesManager />
      </div>
    </AdminLayout>
  );
};

export default AdminMenuExamples;