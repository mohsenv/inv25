"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MainNavigation } from "@/components/navigation/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calculator, Save, AlertCircle, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { persianText, formatPersianNumber, formatPersianCurrency } from "@/lib/persian";
import { apolloClient } from "@/lib/apollo-client";
import { gql } from "@apollo/client";

// GraphQL queries
const GET_PRODUCTS = gql`
  query GetProducts($search: String, $category: String, $isActive: Boolean) {
    getProducts(search: $search, category: $category, isActive: $isActive) {
      id
      name
      code
      unit
      category
      isActive
    }
  }
`;

const CREATE_DOCUMENT = gql`
  mutation CreateDocument($input: DocumentInput!) {
    createDocument(input: $input) {
      id
      documentType
      documentNumber
      items {
        id
        product {
          id
          name
          code
          unit
        }
        quantity
        unitPrice
        totalPrice
        description
      }
      totalAmount
      description
      date
      isFinalized
      createdAt
      updatedAt
    }
  }
`;

const GET_INITIAL_STOCK_DOCUMENTS = gql`
  query GetInitialStockDocuments {
    getDocuments(documentType: INITIAL_STOCK) {
      id
      documentType
      documentNumber
      items {
        id
        product {
          id
          name
          code
          unit
        }
        quantity
        unitPrice
        totalPrice
        description
      }
      totalAmount
      description
      date
      isFinalized
      createdAt
    }
  }
`;

const GET_TOTAL_INVENTORY_VALUE = gql`
  query GetInventoryMovements {
    getInventoryMovements(movementType: INITIAL_STOCK) {
      id
      quantity
      unitPrice
      totalPrice
      product {
        id
        name
      }
    }
  }
`;

const initialStockSchema = z.object({
  productId: z.string().min(1, "انتخاب کالا الزامی است"),
  quantity: z.number().min(0.001, "تعداد باید بیشتر از صفر باشد"),
  unitPrice: z.number().min(0, "قیمت واحد نمی‌تواند منفی باشد"),
  description: z.string().optional(),
});

type InitialStockFormData = z.infer<typeof initialStockSchema>;

interface Product {
  id: string;
  name: string;
  code: string;
  unit: string;
  category?: string;
  isActive?: boolean;
}

interface InitialStockItem {
  id: number;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

export default function InitialStockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockItems, setStockItems] = useState<InitialStockItem[]>([]);
  const [savedDocuments, setSavedDocuments] = useState<any[]>([]);
  const [savedInventoryValue, setSavedInventoryValue] = useState<number>(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Load products and documents from database on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoadingProducts(true);
    setIsLoadingDocuments(true);
    setError("");
    
    try {
      // Load products
      const productsResult = await apolloClient.query({
        query: GET_PRODUCTS,
        variables: { isActive: true },
        fetchPolicy: 'no-cache'
      });
      
      if (productsResult.data && (productsResult.data as any).getProducts) {
        setProducts((productsResult.data as any).getProducts);
      }
      
      // Load existing initial stock documents
      const documentsResult = await apolloClient.query({
        query: GET_INITIAL_STOCK_DOCUMENTS,
        fetchPolicy: 'no-cache'
      });
      
      if (documentsResult.data && (documentsResult.data as any).getDocuments) {
        setSavedDocuments((documentsResult.data as any).getDocuments);
        console.log('Loaded existing documents:', (documentsResult.data as any).getDocuments);
      }
      
      // Load total inventory value from movements
      const inventoryResult = await apolloClient.query({
        query: GET_TOTAL_INVENTORY_VALUE,
        fetchPolicy: 'no-cache'
      });
      
      if (inventoryResult.data && (inventoryResult.data as any).getInventoryMovements) {
        const movements = (inventoryResult.data as any).getInventoryMovements;
        const totalValue = movements.reduce((sum: number, movement: any) => {
          // Based on memory: positive quantities for incoming movements
          return sum + Math.abs(movement.totalPrice);
        }, 0);
        setSavedInventoryValue(totalValue);
        console.log('Calculated total inventory value:', totalValue);
      }
      
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError("خطا در بارگذاری اطلاعات");
    } finally {
      setIsLoadingProducts(false);
      setIsLoadingDocuments(false);
    }
  };

  const form = useForm<InitialStockFormData>({
    resolver: zodResolver(initialStockSchema),
    defaultValues: {
      productId: "",
      quantity: 0,
      unitPrice: 0,
      description: "",
    },
  });

  const totalInventoryValue = stockItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleAddItem = (data: InitialStockFormData, addAnother: boolean = false) => {
    const product = products.find((p: Product) => p.id === data.productId);
    if (!product) return;

    // Check if product already exists
    const existingItemIndex = stockItems.findIndex(item => item.product.id === data.productId);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...stockItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice: data.quantity * data.unitPrice,
        description: data.description,
      };
      setStockItems(updatedItems);
    } else {
      // Add new item
      const newItem: InitialStockItem = {
        id: stockItems.length + 1,
        product,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice: data.quantity * data.unitPrice,
        description: data.description,
      };
      setStockItems([...stockItems, newItem]);
    }

    if (addAnother) {
      // Keep form open and reset fields for next item
      form.reset({
        productId: "",
        quantity: 0,
        unitPrice: 0,
        description: "",
      });
    } else {
      // Close dialog
      setIsDialogOpen(false);
      form.reset();
    }
  };

  const handleRemoveItem = (itemId: number) => {
    if (confirm("آیا از حذف این قلم مطمئن هستید؟")) {
      setStockItems(stockItems.filter(item => item.id !== itemId));
    }
  };

  const handleSubmitDocument = async () => {
    if (stockItems.length === 0) {
      setError("حداقل یک قلم کالا الزامی است");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      console.log('Submitting initial stock document:', stockItems);
      
      // Generate document number
      const documentNumber = `IS-${Date.now()}`;
      
      // Prepare items for GraphQL
      const items = stockItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        description: item.description || ""
      }));
      
      const result = await apolloClient.mutate({
        mutation: CREATE_DOCUMENT,
        variables: {
          input: {
            documentType: 'INITIAL_STOCK',
            documentNumber,
            items,
            description: `ثبت موجودی اولیه - ${formatPersianNumber(stockItems.length)} قلم`,
            date: new Date().getTime()
          }
        }
      });
      
      if (result.data && (result.data as any).createDocument) {
        setSuccess(`موجودی اولیه ${formatPersianNumber(stockItems.length)} قلم کالا با موفقیت ثبت شد`);
        setStockItems([]);
        
        // Reload documents to show the newly created one
        try {
          const documentsResult = await apolloClient.query({
            query: GET_INITIAL_STOCK_DOCUMENTS,
            fetchPolicy: 'no-cache'
          });
          
          if (documentsResult.data && (documentsResult.data as any).getDocuments) {
            setSavedDocuments((documentsResult.data as any).getDocuments);
          }
          
          // Also reload inventory value
          const inventoryResult = await apolloClient.query({
            query: GET_TOTAL_INVENTORY_VALUE,
            fetchPolicy: 'no-cache'
          });
          
          if (inventoryResult.data && (inventoryResult.data as any).getInventoryMovements) {
            const movements = (inventoryResult.data as any).getInventoryMovements;
            const totalValue = movements.reduce((sum: number, movement: any) => {
              return sum + Math.abs(movement.totalPrice);
            }, 0);
            setSavedInventoryValue(totalValue);
          }
        } catch (reloadError) {
          console.error('Error reloading data:', reloadError);
        }
      } else {
        throw new Error('خطا در ثبت موجودی');
      }
    } catch (err: any) {
      console.error('Error submitting initial stock:', err);
      setError("خطا در ثبت موجودی اولیه");
    } finally {
      setIsSubmitting(false);
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
              <Calculator className="h-8 w-8" />
              ثبت موجودی اولیه
            </h1>
            <p className="text-muted-foreground mt-1">
              موجودی اولیه کالاها را برای شروع کار با سیستم تنظیم کنید
            </p>
          </div>
          <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoadingDocuments || isLoadingProducts ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
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

        {/* Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{formatPersianNumber(stockItems.length)}</div>
              <div className="text-sm text-muted-foreground">تعداد اقلام جاری</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {formatPersianCurrency(totalInventoryValue)}
              </div>
              <div className="text-sm text-muted-foreground">ارزش کل موجودی جاری</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {formatPersianCurrency(savedInventoryValue)}
              </div>
              <div className="text-sm text-muted-foreground">ارزش کل موجودی ثبت شده</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{formatPersianNumber(savedDocuments.length)}</div>
              <div className="text-sm text-muted-foreground">اسناد ثبت شده</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center justify-center">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    افزودن کالا
                  </Button>
                </DialogTrigger>
                
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>افزودن کالا به موجودی اولیه</DialogTitle>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => handleAddItem(data, false))} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="productId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>کالا *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="انتخاب کالا" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isLoadingProducts ? (
                                  <SelectItem value="loading" disabled>
                                    <div className="flex items-center gap-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      در حال بارگذاری...
                                    </div>
                                  </SelectItem>
                                ) : products.length === 0 ? (
                                  <SelectItem value="no-products" disabled>
                                    کالایی یافت نشد. ابتدا کالا اضافه کنید.
                                  </SelectItem>
                                ) : (
                                  products.map((product: Product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name} ({product.code})
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>تعداد *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  step="0.001"
                                  placeholder="0"
                                  className="ltr-content"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="unitPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>قیمت واحد (ریال) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  placeholder="0"
                                  className="ltr-content"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-2">
                          <Label>مبلغ کل (ریال)</Label>
                          <Input 
                            type="text"
                            value={formatPersianCurrency((form.watch('quantity') || 0) * (form.watch('unitPrice') || 0))}
                            className="ltr-content bg-gray-50"
                            readOnly
                            placeholder="0 ریال"
                          />
                          <p className="text-xs text-muted-foreground">
                            محاسبه خودکار: تعداد × قیمت واحد
                          </p>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>توضیحات</FormLabel>
                            <FormControl>
                              <Input placeholder="توضیحات اختیاری" className="text-right" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          لغو
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={form.handleSubmit((data) => handleAddItem(data, true))}
                        >
                          افزودن و جدید
                        </Button>
                        <Button type="submit">
                          افزودن
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Items Table */}
        {stockItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>اقلام موجودی اولیه</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="rtl-table">
                    <TableHead>کالا</TableHead>
                    <TableHead>کد کالا</TableHead>
                    <TableHead>تعداد</TableHead>
                    <TableHead>واحد</TableHead>
                    <TableHead>قیمت واحد</TableHead>
                    <TableHead>قیمت کل</TableHead>
                    <TableHead>توضیحات</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product.name}</TableCell>
                      <TableCell className="ltr-content">{item.product.code}</TableCell>
                      <TableCell className="ltr-content">{formatPersianNumber(item.quantity)}</TableCell>
                      <TableCell>{item.product.unit}</TableCell>
                      <TableCell className="ltr-content">{formatPersianCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="ltr-content font-medium">{formatPersianCurrency(item.totalPrice)}</TableCell>
                      <TableCell>{item.description || "-"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleRemoveItem(item.id)}>
                          حذف
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="text-lg font-medium">
                    جمع کل: {formatPersianCurrency(totalInventoryValue)}
                  </div>
                  <Button 
                    onClick={handleSubmitDocument}
                    disabled={isSubmitting || stockItems.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSubmitting ? "در حال ثبت..." : "ثبت موجودی اولیه"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved Documents */}
        {savedDocuments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                ثبت‌های قبلی موجودی اولیه
                <span className="text-sm font-normal text-muted-foreground">
                  {isLoadingDocuments ? "در حال بارگذاری..." : `${formatPersianNumber(savedDocuments.length)} سند`}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savedDocuments.map((doc) => (
                  <Card key={doc.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">شماره سند: {doc.documentNumber}</h4>
                          <p className="text-sm text-muted-foreground">
                            تاریخ: {new Date(doc.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="font-medium">جمع کل: {formatPersianCurrency(doc.totalAmount)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPersianNumber(doc.items.length)} قلم کالا
                          </p>
                        </div>
                      </div>
                      
                      {doc.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          توضیحات: {doc.description}
                        </p>
                      )}
                      
                      <Table>
                        <TableHeader>
                          <TableRow className="rtl-table">
                            <TableHead>کالا</TableHead>
                            <TableHead>کد کالا</TableHead>
                            <TableHead>تعداد</TableHead>
                            <TableHead>واحد</TableHead>
                            <TableHead>قیمت واحد</TableHead>
                            <TableHead>قیمت کل</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {doc.items.map((item: any, index: number) => (
                            <TableRow key={item.id || index}>
                              <TableCell className="font-medium">{item.product.name}</TableCell>
                              <TableCell className="ltr-content">{item.product.code}</TableCell>
                              <TableCell className="ltr-content">{formatPersianNumber(item.quantity)}</TableCell>
                              <TableCell>{item.product.unit}</TableCell>
                              <TableCell className="ltr-content">{formatPersianCurrency(item.unitPrice)}</TableCell>
                              <TableCell className="ltr-content font-medium">{formatPersianCurrency(item.totalPrice)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>راهنمای ثبت موجودی اولیه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• موجودی اولیه تنها یک بار و در ابتدای کار با سیستم ثبت می‌شود</li>
              <li>• قیمت‌های وارد شده به عنوان قیمت میانگین اولیه در نظر گرفته می‌شود</li>
              <li>• پس از ثبت، تمام محاسبات قیمت میانگین بر اساس این مقادیر انجام می‌شود</li>
              <li>• اطمینان حاصل کنید که تعداد و قیمت‌های وارد شده صحیح است</li>
              <li>• می‌توانید قبل از ثبت نهایی، اقلام را ویرایش یا حذف کنید</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}