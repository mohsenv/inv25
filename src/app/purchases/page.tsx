'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainNavigation } from '@/components/navigation/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, Plus, Search, Calendar, Package, User, Calculator } from 'lucide-react';
import { apolloClient } from '@/lib/apollo-client';
import { gql } from 'graphql-tag';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// GraphQL Queries and Mutations
const GET_PURCHASE_DOCUMENTS = gql`
  query GetPurchaseDocuments {
    getDocuments(documentType: PURCHASE_INVOICE) {
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
      supplier {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

const GET_PRODUCTS = gql`
  query GetProducts($isActive: Boolean) {
    getProducts(isActive: $isActive) {
      id
      name
      code
      unit
      category
      isActive
    }
  }
`;

const GET_SUPPLIERS = gql`
  query GetSuppliers {
    getSuppliers {
      id
      name
      isActive
    }
  }
`;

const CREATE_PURCHASE_DOCUMENT = gql`
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
      supplier {
        id
        name
      }
    }
  }
`;

const DELETE_DOCUMENT = gql`
  mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id)
  }
`;

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

// Form Schema
const purchaseItemSchema = z.object({
  productId: z.string().min(1, 'انتخاب کالا الزامی است'),
  quantity: z.number().min(0.001, 'تعداد باید بیشتر از صفر باشد'),
  unitPrice: z.number().min(0, 'قیمت واحد نمی‌تواند منفی باشد'),
  description: z.string().optional(),
});

const purchaseDocumentSchema = z.object({
  supplierId: z.string().min(1, 'انتخاب تامین‌کننده الزامی است'),
  description: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'حداقل یک کالا باید اضافه شود'),
});

type PurchaseItemFormData = z.infer<typeof purchaseItemSchema>;
type PurchaseDocumentFormData = z.infer<typeof purchaseDocumentSchema>;

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
  isActive?: boolean;
}

interface Supplier {
  id: string;
  name: string;
  isActive: boolean;
}

interface PurchaseItem {
  id: number;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

interface PurchaseDocument {
  id: string;
  documentType: string;
  documentNumber: string;
  items: PurchaseItem[];
  totalAmount: number;
  description?: string;
  date: string;
  isFinalized: boolean;
  supplier?: Supplier;
  createdAt: string;
  updatedAt: string;
}

export default function PurchasesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [purchaseDocuments, setPurchaseDocuments] = useState<PurchaseDocument[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currentItems, setCurrentItems] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nextItemId, setNextItemId] = useState(1);
  
  // State for adding new products
  const [newProductName, setNewProductName] = useState("");
  const [newProductCode, setNewProductCode] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const {
    register: registerItem,
    handleSubmit: handleSubmitItem,
    reset: resetItem,
    setValue: setValueItem,
    watch: watchItem,
    formState: { errors: itemErrors },
  } = useForm<PurchaseItemFormData>({
    resolver: zodResolver(purchaseItemSchema),
  });

  const {
    register: registerDocument,
    handleSubmit: handleSubmitDocument,
    reset: resetDocument,
    setValue,
    formState: { errors: documentErrors, isSubmitting },
  } = useForm<PurchaseDocumentFormData>({
    resolver: zodResolver(purchaseDocumentSchema),
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [documentsResult, productsResult, suppliersResult] = await Promise.all([
        apolloClient.query({
          query: GET_PURCHASE_DOCUMENTS,
          fetchPolicy: 'no-cache'
        }),
        apolloClient.query({
          query: GET_PRODUCTS,
          variables: { isActive: true },
          fetchPolicy: 'no-cache'
        }),
        apolloClient.query({
          query: GET_SUPPLIERS,
          fetchPolicy: 'no-cache'
        })
      ]);

      if (documentsResult.data && (documentsResult.data as any).getDocuments) {
        const documentsData = (documentsResult.data as any).getDocuments;
        setPurchaseDocuments(documentsData);
      } else {
        setPurchaseDocuments([]);
      }
      
      if (productsResult.data && (productsResult.data as any).getProducts) {
        const productsData = (productsResult.data as any).getProducts;
        setProducts(productsData);
      } else {
        setProducts([]);
      }
      
      if (suppliersResult.data && (suppliersResult.data as any).getSuppliers) {
        const suppliersData = (suppliersResult.data as any).getSuppliers;
        setSuppliers(suppliersData);
      } else {
        setSuppliers([]);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const watchedProductId = watchItem('productId');
  const watchedQuantity = watchItem('quantity');
  const watchedUnitPrice = watchItem('unitPrice');

  const selectedProduct = products.find(p => p.id === watchedProductId);
  const calculatedTotal = (watchedQuantity || 0) * (watchedUnitPrice || 0);

  const filteredDocuments = purchaseDocuments.filter(doc =>
    doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.supplier && doc.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openForm = () => {
    setCurrentItems([]);
    setNextItemId(1);
    resetDocument();
    resetItem();
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setCurrentItems([]);
    setNextItemId(1);
    resetDocument();
    resetItem();
  };

  const onAddItem = (data: PurchaseItemFormData) => {
    const product = products.find(p => p.id === data.productId);
    if (!product) return;

    const newItem: PurchaseItem = {
      id: nextItemId,
      product,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      totalPrice: data.quantity * data.unitPrice,
      description: data.description,
    };

    setCurrentItems(prev => [...prev, newItem]);
    setNextItemId(prev => prev + 1);
    resetItem();
  };

  const removeItem = (itemId: number) => {
    setCurrentItems(prev => prev.filter(item => item.id !== itemId));
  };

  const totalAmount = currentItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleAddNewProduct = async () => {
    if (!newProductName || !newProductCode || !newProductUnit) {
      alert("نام کالا، کد کالا و واحد الزامی هستند");
      return;
    }

    setIsAddingProduct(true);
    setError('');

    try {
      const productInput = {
        name: newProductName,
        code: newProductCode,
        description: newProductDescription,
        unit: newProductUnit,
        category: "",
        minimumStock: 0,
        maximumStock: 0,
      };

      const result = await apolloClient.mutate({
        mutation: CREATE_PRODUCT,
        variables: { input: productInput },
      });

      if (result.data && (result.data as any).createProduct) {
        const newProduct = (result.data as any).createProduct;
        setProducts([...products, newProduct]);
        
        // Reset form fields
        setNewProductName("");
        setNewProductCode("");
        setNewProductUnit("");
        setNewProductDescription("");
        
        // Close the dialog
        // The dialog will close automatically when we re-render
      }
    } catch (err: any) {
      console.error('Error adding product:', err);
      alert(`خطا در افزودن کالا: ${err.message}`);
    } finally {
      setIsAddingProduct(false);
    }
  };

  const onSubmitDocument = async (data: { supplierId: string; description?: string }) => {
    if (currentItems.length === 0) {
      alert('حداقل یک کالا باید اضافه شود');
      return;
    }

    try {
      const documentInput = {
        documentType: 'PURCHASE_INVOICE',
        documentNumber: `PUR-${Date.now()}`, // Generate a unique document number
        supplierId: data.supplierId,
        description: data.description,
        date: new Date(),
        items: currentItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          description: item.description,
        })),
      };

      await apolloClient.mutate({
        mutation: CREATE_PURCHASE_DOCUMENT,
        variables: { input: documentInput },
      });

      await loadData();
      closeForm();
    } catch (error) {
      console.error('Error saving purchase document:', error);
      alert('خطا در ذخیره سند خرید');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (confirm('آیا از حذف این سند خرید اطمینان دارید؟')) {
      try {
        await apolloClient.mutate({
          mutation: DELETE_DOCUMENT,
          variables: { id: documentId },
        });
        await loadData();
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('خطا در حذف سند');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  if (loading) return <div className="p-6">در حال بارگذاری...</div>;
  if (error) return <div className="p-6 text-red-600">خطا در بارگذاری اطلاعات: {error}</div>;

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">مدیریت خرید کالا</h1>
        <Button onClick={openForm} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          سند خرید جدید
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="جستجو در اسناد خرید..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Purchase Document Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>سند خرید جدید</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Document Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplierId">تامین‌کننده *</Label>
                <Select onValueChange={(value) => setValue('supplierId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب تامین‌کننده" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.filter(s => s.isActive).map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {documentErrors.supplierId && (
                  <p className="text-red-500 text-sm">{documentErrors.supplierId.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">شرح سند</Label>
                <Input
                  id="description"
                  {...registerDocument('description')}
                  placeholder="شرح اختیاری برای سند"
                />
              </div>
            </div>

            {/* Add Item Form */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg">افزودن کالا</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitItem(onAddItem)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="productId">کالا *</Label>
                      <div className="flex gap-2">
                        <Select onValueChange={(value) => setValueItem('productId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب کالا" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} ({product.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="icon">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>افزودن کالای جدید</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>نام کالا *</Label>
                                <Input 
                                  placeholder="نام کالا" 
                                  className="text-right" 
                                  onChange={(e) => setNewProductName(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>کد کالا *</Label>
                                <Input 
                                  placeholder="کد کالا" 
                                  className="ltr-content" 
                                  onChange={(e) => setNewProductCode(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>واحد *</Label>
                                <Select onValueChange={setNewProductUnit}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="انتخاب واحد" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {persianUnits.map((unit: string) => (
                                      <SelectItem key={unit} value={unit}>
                                        {unit}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>توضیحات</Label>
                                <Input 
                                  placeholder="توضیحات کالا" 
                                  className="text-right" 
                                  onChange={(e) => setNewProductDescription(e.target.value)}
                                />
                              </div>
                              <Button onClick={handleAddNewProduct} disabled={isAddingProduct}>
                                {isAddingProduct ? "در حال افزودن..." : "افزودن کالا"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      {itemErrors.productId && (
                        <p className="text-red-500 text-sm">{itemErrors.productId.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="quantity">تعداد *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="0.001"
                        {...registerItem('quantity', { valueAsNumber: true })}
                      />
                      {selectedProduct && (
                        <p className="text-xs text-gray-500 mt-1">واحد: {selectedProduct.unit}</p>
                      )}
                      {itemErrors.quantity && (
                        <p className="text-red-500 text-sm">{itemErrors.quantity.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="unitPrice">قیمت واحد (ریال) *</Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        {...registerItem('unitPrice', { valueAsNumber: true })}
                      />
                      {itemErrors.unitPrice && (
                        <p className="text-red-500 text-sm">{itemErrors.unitPrice.message}</p>
                      )}
                    </div>

                    <div>
                      <Label>جمع کل</Label>
                      <div className="p-2 bg-white border rounded-md">
                        {calculatedTotal.toLocaleString()} ریال
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="itemDescription">شرح کالا</Label>
                    <Input
                      id="itemDescription"
                      {...registerItem('description')}
                      placeholder="شرح اختیاری برای کالا"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    افزودن کالا
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Items List */}
            {currentItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>کالاهای انتخاب شده</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>کالا</TableHead>
                        <TableHead>تعداد</TableHead>
                        <TableHead>قیمت واحد</TableHead>
                        <TableHead>جمع کل</TableHead>
                        <TableHead>شرح</TableHead>
                        <TableHead>عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.product.name}</div>
                              <div className="text-sm text-gray-500">
                                کد: {item.product.code} | واحد: {item.product.unit}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity.toLocaleString()}</TableCell>
                          <TableCell>{item.unitPrice.toLocaleString()} ریال</TableCell>
                          <TableCell className="font-medium">
                            {item.totalPrice.toLocaleString()} ریال
                          </TableCell>
                          <TableCell>{item.description || '-'}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-gray-50">
                        <TableCell colSpan={3}>جمع کل سند:</TableCell>
                        <TableCell>{totalAmount.toLocaleString()} ریال</TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Form Actions */}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={closeForm}>
                انصراف
              </Button>
              <Button
                onClick={handleSubmitDocument((data) => onSubmitDocument(data))}
                disabled={isSubmitting || currentItems.length === 0}
              >
                {isSubmitting ? 'در حال ذخیره...' : 'ذخیره سند'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Documents List */}
      <div className="space-y-4">
        {filteredDocuments.map((document) => (
          <Card key={document.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    سند خرید {document.documentNumber}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(document.date)}
                    </div>
                    {document.supplier && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {document.supplier.name}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calculator className="h-4 w-4" />
                      {document.totalAmount.toLocaleString()} ریال
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={document.isFinalized ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {document.isFinalized ? 'نهایی شده' : 'پیش‌نویس'}
                  </Badge>
                </div>
              </div>

              {document.description && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm">{document.description}</p>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>کالا</TableHead>
                    <TableHead>تعداد</TableHead>
                    <TableHead>قیمت واحد</TableHead>
                    <TableHead>جمع کل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {document.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-sm text-gray-500">
                            کد: {item.product.code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.quantity.toLocaleString()} {item.product.unit}
                      </TableCell>
                      <TableCell>{item.unitPrice.toLocaleString()} ریال</TableCell>
                      <TableCell className="font-medium">
                        {item.totalPrice.toLocaleString()} ریال
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(document.id)}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  حذف
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">هیچ سند خریدی یافت نشد.</p>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}