"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MainNavigation } from "@/components/navigation/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Truck, Plus, Search, Edit, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { formatPersianNumber } from "@/lib/persian";
import { apolloClient } from "@/lib/apollo-client";
import { gql } from "@apollo/client";

// GraphQL queries
const GET_SUPPLIERS = gql`
  query GetSuppliers($search: String, $isActive: Boolean) {
    getSuppliers(search: $search, isActive: $isActive) {
      id
      name
      nationalCode
      economicCode
      address
      phone
      email
      isActive
      createdAt
      updatedAt
    }
  }
`;

const CREATE_SUPPLIER = gql`
  mutation CreateSupplier($input: SupplierInput!) {
    createSupplier(input: $input) {
      id
      name
      nationalCode
      economicCode
      address
      phone
      email
      isActive
      createdAt
    }
  }
`;

const UPDATE_SUPPLIER = gql`
  mutation UpdateSupplier($id: ID!, $input: SupplierInput!) {
    updateSupplier(id: $id, input: $input) {
      id
      name
      nationalCode
      economicCode
      address
      phone
      email
      isActive
      updatedAt
    }
  }
`;

const DELETE_SUPPLIER = gql`
  mutation DeleteSupplier($id: ID!) {
    deleteSupplier(id: $id)
  }
`;

const supplierSchema = z.object({
  name: z.string().min(1, "نام تامین‌کننده الزامی است"),
  nationalCode: z.string().optional(),
  economicCode: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("ایمیل معتبر وارد کنید").optional().or(z.literal("")),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface Supplier {
  id: string;
  name: string;
  nationalCode?: string;
  economicCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      nationalCode: "",
      economicCode: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  // Load suppliers from database
  useEffect(() => {
    const loadSuppliers = async () => {
      setIsLoading(true);
      setError("");
      
      try {
        const result = await apolloClient.query({
          query: GET_SUPPLIERS,
          variables: { isActive: true },
          fetchPolicy: 'no-cache'
        });
        
        if (result.data && (result.data as any).getSuppliers) {
          setSuppliers((result.data as any).getSuppliers);
          setFilteredSuppliers((result.data as any).getSuppliers);
        }
      } catch (err: any) {
        console.error('Error loading suppliers:', err);
        setError("خطا در بارگذاری تامین‌کنندگان");
      } finally {
        setIsLoading(false);
      }
    };

    loadSuppliers();
  }, []);

  // Filter suppliers based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.nationalCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.economicCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone?.includes(searchTerm) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    } else {
      setFilteredSuppliers(suppliers);
    }
  }, [searchTerm, suppliers]);

  const handleSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (editingSupplier) {
        // Update existing supplier
        const result = await apolloClient.mutate({
          mutation: UPDATE_SUPPLIER,
          variables: { id: editingSupplier.id, input: data }
        });

        if (result.data && (result.data as any).updateSupplier) {
          setSuppliers(prev => prev.map(s => 
            s.id === editingSupplier.id ? (result.data as any).updateSupplier : s
          ));
          setSuccess("تامین‌کننده با موفقیت به‌روزرسانی شد");
        }
      } else {
        // Create new supplier
        const result = await apolloClient.mutate({
          mutation: CREATE_SUPPLIER,
          variables: { input: data }
        });

        if (result.data && (result.data as any).createSupplier) {
          setSuppliers(prev => [...prev, (result.data as any).createSupplier]);
          setSuccess("تامین‌کننده جدید با موفقیت اضافه شد");
        }
      }

      setIsDialogOpen(false);
      setEditingSupplier(null);
      form.reset();
    } catch (err: any) {
      console.error('Error submitting supplier:', err);
      setError("خطا در ثبت تامین‌کننده");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.reset({
      name: supplier.name,
      nationalCode: supplier.nationalCode || "",
      economicCode: supplier.economicCode || "",
      address: supplier.address || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`آیا از حذف ${supplier.name} مطمئن هستید؟`)) return;

    try {
      const result = await apolloClient.mutate({
        mutation: DELETE_SUPPLIER,
        variables: { id: supplier.id }
      });

      if ((result.data as any).deleteSupplier) {
        setSuppliers(prev => prev.filter(s => s.id !== supplier.id));
        setSuccess("تامین‌کننده با موفقیت حذف شد");
      }
    } catch (err: any) {
      console.error('Error deleting supplier:', err);
      setError("خطا در حذف تامین‌کننده");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Truck className="h-8 w-8" />
              مدیریت تامین‌کنندگان
            </h1>
            <p className="text-muted-foreground mt-1">
              ثبت و مدیریت اطلاعات تامین‌کنندگان
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                تامین‌کننده جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSupplier ? "ویرایش تامین‌کننده" : "تامین‌کننده جدید"}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نام تامین‌کننده *</FormLabel>
                          <FormControl>
                            <Input placeholder="نام شرکت یا شخص" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nationalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>کد ملی / شناسه ملی</FormLabel>
                          <FormControl>
                            <Input placeholder="1234567890" className="ltr-content" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="economicCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>کد اقتصادی</FormLabel>
                          <FormControl>
                            <Input placeholder="123456789012" className="ltr-content" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تلفن</FormLabel>
                          <FormControl>
                            <Input placeholder="021-12345678" className="ltr-content" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ایمیل</FormLabel>
                        <FormControl>
                          <Input placeholder="supplier@company.com" className="ltr-content" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>آدرس</FormLabel>
                        <FormControl>
                          <Input placeholder="آدرس کامل تامین‌کننده" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsDialogOpen(false);
                      setEditingSupplier(null);
                      form.reset();
                    }}>
                      لغو
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "در حال ثبت..." : editingSupplier ? "به‌روزرسانی" : "ثبت"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-2 p-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800">{success}</span>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-2 p-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </CardContent>
          </Card>
        )}

        {/* Search and Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-2">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="جستجو در نام، کد ملی، کد اقتصادی..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{formatPersianNumber(suppliers.length)}</div>
              <div className="text-sm text-muted-foreground">کل تامین‌کنندگان</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {formatPersianNumber(suppliers.filter(s => s.isActive).length)}
              </div>
              <div className="text-sm text-muted-foreground">فعال</div>
            </CardContent>
          </Card>
        </div>

        {/* Suppliers Table */}
        <Card>
          <CardHeader>
            <CardTitle>لیست تامین‌کنندگان</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">در حال بارگذاری...</div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "تامین‌کننده‌ای یافت نشد" : "هیچ تامین‌کننده‌ای ثبت نشده است"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="rtl-table">
                    <TableHead>نام</TableHead>
                    <TableHead>کد ملی</TableHead>
                    <TableHead>کد اقتصادی</TableHead>
                    <TableHead>تلفن</TableHead>
                    <TableHead>ایمیل</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell className="ltr-content">{supplier.nationalCode || "-"}</TableCell>
                      <TableCell className="ltr-content">{supplier.economicCode || "-"}</TableCell>
                      <TableCell className="ltr-content">{supplier.phone || "-"}</TableCell>
                      <TableCell className="ltr-content">{supplier.email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={supplier.isActive ? "default" : "secondary"}>
                          {supplier.isActive ? "فعال" : "غیرفعال"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(supplier)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDelete(supplier)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}