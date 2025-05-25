import TestimonialsManager from "@/components/admin/TestimonialsManager";
import AdminLayout from "@/components/admin/AdminLayout";

const AdminTestimonials = () => {
  return (
    <AdminLayout>
      <div className="container mx-auto p-4">
        <TestimonialsManager />
      </div>
    </AdminLayout>
  );
};

export default AdminTestimonials;