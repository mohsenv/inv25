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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Package, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { persianText, formatPersianNumber } from "@/lib/persian";
import { apolloClient } from "@/lib/apollo-client";
import { gql } from "@apollo/client";

// GraphQL mutations and queries
const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      name
      code
      description
      unit
      category
      minimumStock
      maximumStock
      isActive
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: ProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      code
      description
      unit
      category
      minimumStock
      maximumStock
      isActive
      createdAt
      updatedAt
    }
  }
`;

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

const GET_PRODUCTS = gql`
  query GetProducts($search: String, $category: String, $isActive: Boolean) {
    getProducts(search: $search, category: $category, isActive: $isActive) {
      id
      name
      code
      description
      unit
      category
      minimumStock
      maximumStock
      isActive
      createdAt
      updatedAt
    }
  }
`;

const productSchema = z.object({
  name: z.string().min(1, "نام کالا الزامی است").max(200, "نام کالا نباید بیش از ۲۰۰ کاراکتر باشد"),
  code: z.string().min(1, "کد کالا الزامی است").max(50, "کد کالا نباید بیش از ۵۰ کاراکتر باشد"),
  description: z.string().optional(),
  unit: z.string().min(1, "واحد الزامی است"),
  category: z.string().optional(),
  minimumStock: z.number().min(0, "حداقل موجودی نمی‌تواند منفی باشد").optional(),
  maximumStock: z.number().min(0, "حداکثر موجودی نمی‌تواند منفی باشد").optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const persianUnits = [
  "عدد", "کیلوگرم", "گرم", "تن", "لیتر", "میلی‌لیتر", "متر", "سانتی‌متر",
  "متر مربع", "متر مکعب", "جعبه", "بسته", "کارتن", "دستگاه", "جفت",
  "ست", "رول", "ورق", "شاخه", "بطری", "قوطی", "بشکه", "کیسه"
];

interface Product {
  id: string;
  name: string;
  code: string;
  unit: string;
  category?: string;
  minimumStock?: number;
  maximumStock?: number;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load products from database on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await apolloClient.query({
        query: GET_PRODUCTS,
        variables: { isActive: true },
        fetchPolicy: 'no-cache' // Changed from 'cache-first' to 'no-cache' to always fetch fresh data
      });
      
      if (result.data && (result.data as any).getProducts) {
        setProducts((result.data as any).getProducts);
      }
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError("خطا در بارگذاری کالاها");
    } finally {
      setIsLoading(false);
    }
  };

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      unit: "",
      category: "",
      minimumStock: 0,
      maximumStock: 0,
    },
  });

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (data: ProductFormData, addAnother: boolean = false) => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      console.log('Submitting product data:', data);

      if (editingProduct) {
        // Update existing product
        const result = await apolloClient.mutate({
          mutation: UPDATE_PRODUCT,
          variables: { 
            id: editingProduct.id, 
            input: {
              name: data.name,
              code: data.code,
              description: data.description || "",
              unit: data.unit,
              category: data.category || "",
              minimumStock: data.minimumStock || 0,
              maximumStock: data.maximumStock || 0,
            }
          }
        });

        if (result.data && (result.data as any).updateProduct) {
          const updatedProduct = (result.data as any).updateProduct;
          setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
          setSuccess("کالا با موفقیت بروزرسانی شد");
        }
        
        // For edit, always close dialog
        setIsDialogOpen(false);
        setEditingProduct(null);
        form.reset();
      } else {
        // Add new product
        const result = await apolloClient.mutate({
          mutation: CREATE_PRODUCT,
          variables: { 
            input: {
              name: data.name,
              code: data.code,
              description: data.description || "",
              unit: data.unit,
              category: data.category || "",
              minimumStock: data.minimumStock || 0,
              maximumStock: data.maximumStock || 0,
            }
          }
        });

        if (result.data && (result.data as any).createProduct) {
          const newProduct = (result.data as any).createProduct;
          setProducts([...products, newProduct]);
          setSuccess("کالای جدید با موفقیت اضافه شد");
        }
        
        if (addAnother) {
          // Keep form open and reset fields for next product
          form.reset({
            name: "",
            code: "",
            description: "",
            unit: "",
            category: "",
            minimumStock: 0,
            maximumStock: 0,
          });
        } else {
          // Close dialog
          setIsDialogOpen(false);
          setEditingProduct(null);
          form.reset();
        }
      }
    } catch (err: any) {
      console.error('Error saving product:', err);
      let errorMessage = "خطا در ذخیره کالا";
      
      if (err.message?.includes('کد کالا قبلاً ثبت شده')) {
        errorMessage = "کد کالا قبلاً ثبت شده است";
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      code: product.code,
      description: product.description || "",
      unit: product.unit,
      category: product.category || "",
      minimumStock: product.minimumStock || 0,
      maximumStock: product.maximumStock || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (confirm("آیا از حذف این کالا مطمئن هستید؟")) {
      try {
        const result = await apolloClient.mutate({
          mutation: DELETE_PRODUCT,
          variables: { id: productId }
        });

        if (result.data && (result.data as any).deleteProduct) {
          setProducts(products.filter(p => p.id !== productId));
          setSuccess("کالا با موفقیت حذف شد");
        }
      } catch (err: any) {
        console.error('Error deleting product:', err);
        setError("خطا در حذف کالا");
      }
    }
  };

  const openAddDialog = () => {
    setEditingProduct(null);
    form.reset({
      name: "",
      code: "",
      description: "",
      unit: "",
      category: "",
      minimumStock: 0,
      maximumStock: 0,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8" />
              مدیریت کالاها
            </h1>
            <p className="text-muted-foreground mt-1">
              افزودن و مدیریت محصولات انبار
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={loadProducts} variant="outline" className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              بروزرسانی ({formatPersianNumber(products.length)})
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  افزودن کالای جدید
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "ویرایش کالا" : "افزودن کالای جدید"}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => handleSubmit(data, false))} className="space-y-4">
                    {/* Fixed layout: کد کالا on right, توضیحات on left */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>کد کالا *</FormLabel>
                            <FormControl>
                              <Input placeholder="کد کالا" className="ltr-content" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>توضیحات کالا</FormLabel>
                            <FormControl>
                              <Input placeholder="توضیحات کالا" className="text-right" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نام کالا *</FormLabel>
                          <FormControl>
                            <Input placeholder="نام کالا" className="text-right" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>واحد *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="انتخاب واحد" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {persianUnits.map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>دسته‌بندی</FormLabel>
                            <FormControl>
                              <Input placeholder="دسته‌بندی" className="text-right" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="minimumStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>حداقل موجودی</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="0"
                                className="ltr-content"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maximumStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>حداکثر موجودی</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="0"
                                className="ltr-content"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        لغو
                      </Button>
                      {!editingProduct && (
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={form.handleSubmit((data) => handleSubmit(data, true))} 
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "در حال ذخیره..." : "افزودن و جدید"}
                        </Button>
                      )}
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "در حال ذخیره..." : (editingProduct ? "بروزرسانی" : "افزودن")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
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

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس نام یا کد کالا..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-right"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>لیست کالاها ({formatPersianNumber(filteredProducts.length)} مورد)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                در حال بارگذاری کالاها...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="rtl-table">
                    <TableHead>نام کالا</TableHead>
                    <TableHead>کد کالا</TableHead>
                    <TableHead>واحد</TableHead>
                    <TableHead>دسته‌بندی</TableHead>
                    <TableHead>حداقل موجودی</TableHead>
                    <TableHead>حداکثر موجودی</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="ltr-content">{product.code}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell>{product.category || "-"}</TableCell>
                      <TableCell className="ltr-content">{formatPersianNumber(product.minimumStock || 0)}</TableCell>
                      <TableCell className="ltr-content">{formatPersianNumber(product.maximumStock || 0)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!isLoading && filteredProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                کالایی یافت نشد
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}