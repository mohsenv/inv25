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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Filter, Download, Eye, AlertCircle, RefreshCw, Plus, Edit, Trash2 } from "lucide-react";
import { formatPersianNumber, formatPersianCurrency } from "@/lib/persian";
import { apolloClient } from "@/lib/apollo-client";
import { gql } from "@apollo/client";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";

// GraphQL queries
const GET_ALL_DOCUMENTS = gql`
  query GetAllDocuments {
    getDocuments {
      id
      documentType
      documentNumber
      supplier {
        id
        name
      }
      customer {
        id
        name
      }
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

const GET_DOCUMENTS_BY_TYPE = gql`
  query GetDocumentsByType($documentType: DocumentType) {
    getDocuments(documentType: $documentType) {
      id
      documentType
      documentNumber
      supplier {
        id
        name
      }
      customer {
        id
        name
      }
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

const GET_CUSTOMERS = gql`
  query GetCustomers {
    getCustomers {
      id
      name
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
      supplier {
        id
        name
      }
      customer {
        id
        name
      }
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

const UPDATE_DOCUMENT = gql`
  mutation UpdateDocument($id: ID!, $input: DocumentInput!) {
    updateDocument(id: $id, input: $input) {
      id
      documentType
      documentNumber
      supplier {
        id
        name
      }
      customer {
        id
        name
      }
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

// Test database connection
const TEST_CONNECTION = gql`
  query TestConnection {
    getCompany {
      id
      name
    }
  }
`;

// Form schemas
const documentItemSchema = z.object({
  productId: z.string().min(1, "انتخاب کالا الزامی است"),
  quantity: z.number().min(0.001, "تعداد باید بیشتر از صفر باشد"),
  unitPrice: z.number().min(0, "قیمت واحد نمی‌تواند منفی باشد"),
  description: z.string().optional(),
});

const documentSchema = z.object({
  documentType: z.enum(["PURCHASE_INVOICE", "SALE_INVOICE", "STOCK_ADJUSTMENT", "INITIAL_STOCK"]),
  documentNumber: z.string().min(1, "شماره سند الزامی است"),
  supplierId: z.string().optional(),
  customerId: z.string().optional(),
  description: z.string().optional(),
  date: z.number(),
});

type DocumentItemFormData = z.infer<typeof documentItemSchema>;
type DocumentFormData = z.infer<typeof documentSchema>;

const persianUnits = [
  "عدد", "کیلوگرم", "گرم", "تن", "لیتر", "میلی‌لیتر", "متر", "سانتی‌متر",
  "متر مربع", "متر مکعب", "جعبه", "بسته", "کارتن", "دستگاه", "جفت",
  "ست", "رول", "ورق", "شاخه", "بطری", "قوطی", "بشکه", "کیسه"
];

// Types
interface Product {
  id: string;
  name: string;
  code: string;
  unit: string;
  category?: string;
  isActive: boolean;
}

interface Supplier {
  id: string;
  name: string;
  isActive: boolean;
}

interface Customer {
  id: string;
  name: string;
  isActive: boolean;
}

interface DocumentItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

interface Document {
  id: string;
  documentType: string;
  documentNumber: string;
  supplier?: Supplier;
  customer?: Customer;
  items: DocumentItem[];
  totalAmount: number;
  description?: string;
  date: number;
  isFinalized: boolean;
  createdAt: number;
  updatedAt: number;
}

const documentTypeLabels = {
  INITIAL_STOCK: "موجودی اولیه",
  PURCHASE_INVOICE: "فاکتور خرید", 
  SALE_INVOICE: "فاکتور فروش",
  STOCK_ADJUSTMENT: "تعدیل موجودی"
};

const documentTypeColors = {
  INITIAL_STOCK: "bg-blue-100 text-blue-800",
  PURCHASE_INVOICE: "bg-green-100 text-green-800",
  SALE_INVOICE: "bg-orange-100 text-orange-800", 
  STOCK_ADJUSTMENT: "bg-purple-100 text-purple-800"
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentItems, setCurrentItems] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  // nextItemId is no longer used since we generate unique IDs for new items
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // State for adding new products
  const [newProductName, setNewProductName] = useState("");
  const [newProductCode, setNewProductCode] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Document form
  const documentForm = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      documentType: "PURCHASE_INVOICE",
      documentNumber: "",
      supplierId: "",
      customerId: "",
      description: "",
      date: Date.now(),
    },
  });

  // Item form
  const itemForm = useForm<DocumentItemFormData>({
    resolver: zodResolver(documentItemSchema),
    defaultValues: {
      productId: "",
      quantity: 0,
      unitPrice: 0,
      description: "",
    },
  });

  // Test database connection first, then load documents
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      setError("");
      
      try {
        // First test the connection
        const connectionTest = await apolloClient.query({
          query: TEST_CONNECTION,
          fetchPolicy: 'no-cache'
        });
        
        setIsConnected(true);
        
        // Load all required data sequentially to avoid race conditions
        await loadDocuments();
        await loadProducts();
        await loadSuppliers();
        await loadCustomers();
        
      } catch (err: any) {
        console.error('Error in initializeData:', err);
        setIsConnected(false);
        
        let errorMessage = "خطا در ارتباط با پایگاه داده";
        
        if (err.networkError) {
          errorMessage = "خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.";
        } else if (err.graphQLErrors && err.graphQLErrors.length > 0) {
          errorMessage = `خطای GraphQL: ${err.graphQLErrors.map((e: any) => e.message).join(', ')}`;
        } else if (err.message) {
          errorMessage = `خطا: ${err.message}`;
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const loadDocuments = async () => {
    try {
      const result = await apolloClient.query({
        query: GET_ALL_DOCUMENTS,
        fetchPolicy: 'network-only', // Always fetch from network to get latest data
        errorPolicy: 'all'
      });
      
      if (result.errors) {
        console.error('GraphQL Errors:', result.errors);
        setError(`خطای GraphQL: ${result.errors.map(e => e.message).join(', ')}`);
        return;
      }
      
      if (result.data && (result.data as any).getDocuments) {
        const docs = (result.data as any).getDocuments;
        setDocuments(docs);
        setFilteredDocuments(docs);
      } else {
        setDocuments([]);
        setFilteredDocuments([]);
      }
    } catch (err: any) {
      console.error('Error loading documents:', err);
      setError(`خطا در بارگذاری اسناد: ${err.message}`);
    }
  };

  const loadProducts = async () => {
    try {
      const result = await apolloClient.query({
        query: GET_PRODUCTS,
        variables: { isActive: true },
        fetchPolicy: 'no-cache'
      });
      
      if (result.data && (result.data as any).getProducts) {
        setProducts((result.data as any).getProducts);
      }
    } catch (err: any) {
      console.error('Error loading products:', err);
    }
  };

  const loadSuppliers = async () => {
    try {
      const result = await apolloClient.query({
        query: GET_SUPPLIERS,
        fetchPolicy: 'no-cache'
      });
      
      if (result.data && (result.data as any).getSuppliers) {
        setSuppliers((result.data as any).getSuppliers);
      }
    } catch (err: any) {
      console.error('Error loading suppliers:', err);
    }
  };

  const loadCustomers = async () => {
    try {
      const result = await apolloClient.query({
        query: GET_CUSTOMERS,
        fetchPolicy: 'no-cache'
      });
      
      if (result.data && (result.data as any).getCustomers) {
        setCustomers((result.data as any).getCustomers);
      }
    } catch (err: any) {
      console.error('Error loading customers:', err);
    }
  };

  // Filter documents based on search and type
  useEffect(() => {
    let filtered = documents;

    // Filter by document type
    if (selectedType !== "ALL") {
      filtered = filtered.filter(doc => doc.documentType === selectedType);
    }

    // Filter by search term (document number, supplier/customer name)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.documentNumber.toLowerCase().includes(searchLower) ||
        doc.supplier?.name.toLowerCase().includes(searchLower) ||
        doc.customer?.name.toLowerCase().includes(searchLower) ||
        doc.description?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, selectedType]);

  const getPartnerName = (doc: Document) => {
    if (doc.supplier) return doc.supplier.name;
    if (doc.customer) return doc.customer.name;
    return "-";
  };

  const getPartnerType = (doc: Document) => {
    if (doc.supplier) return "تامین‌کننده";
    if (doc.customer) return "مشتری";
    return "-";
  };

  const formatDocumentDate = (dateValue: number | string | Date) => {
    try {
      if (!dateValue) return 'تاریخ نامشخص';
      
      let date: Date;
      
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else if (typeof dateValue === 'number') {
        date = new Date(dateValue);
      } else {
        console.warn('Invalid date value type:', typeof dateValue, dateValue);
        return 'نوع تاریخ نامعتبر';
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Invalid date value:', dateValue);
        return 'تاریخ نامعتبر';
      }
      
      return date.toLocaleDateString('fa-IR');
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', dateValue);
      return 'خطا در نمایش تاریخ';
    }
  };

  const openAddDialog = () => {
    setEditingDocument(null);
    setCurrentItems([]);
    documentForm.reset({
      documentType: "PURCHASE_INVOICE",
      documentNumber: "",
      supplierId: "",
      customerId: "",
      description: "",
      date: Date.now(),
    });
    itemForm.reset();
    setIsDialogOpen(true);
  };

  const openEditDialog = (doc: Document) => {
    setEditingDocument(doc);
    setCurrentItems(doc.items || []);
    
    // Clear any item editing state
    setEditingItemId(null);
    itemForm.reset({
      productId: "",
      quantity: 0,
      unitPrice: 0,
      description: "",
    });
    
    documentForm.reset({
      documentType: doc.documentType as any,
      documentNumber: doc.documentNumber,
      supplierId: doc.supplier?.id || "",
      customerId: doc.customer?.id || "",
      description: doc.description || "",
      date: doc.date,
    });
    
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingDocument(null);
    setCurrentItems([]);
    setEditingItemId(null);
    documentForm.reset();
    itemForm.reset({
      productId: "",
      quantity: 0,
      unitPrice: 0,
      description: "",
    });
  };

  const openViewDialog = (doc: Document) => {
    setViewingDocument(doc);
    setIsViewDialogOpen(true);
  };

  const closeViewDialog = () => {
    setIsViewDialogOpen(false);
    setViewingDocument(null);
  };

  const handleAddItem = (data?: DocumentItemFormData) => {
    // If data is not provided, get values from the form
    const formData = data || itemForm.getValues();
    
    const product = products.find(p => p.id === formData.productId);
    if (!product) return;

    // Generate a unique ID for new items that won't conflict with existing IDs
    const newItemId = `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newItem: DocumentItem = {
      id: newItemId,
      product,
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      totalPrice: formData.quantity * formData.unitPrice,
      description: formData.description,
    };

    const newItems = [...currentItems, newItem];
    setCurrentItems(newItems);
    itemForm.reset({
      productId: "",
      quantity: 0,
      unitPrice: 0,
      description: "",
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setCurrentItems(currentItems.filter(item => item.id !== itemId));
  };

  const startEditingItem = (item: DocumentItem) => {
    setEditingItemId(item.id);
    itemForm.reset({
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      description: item.description || "",
    });
  };

  const cancelEditingItem = () => {
    setEditingItemId(null);
    itemForm.reset({
      productId: "",
      quantity: 0,
      unitPrice: 0,
      description: "",
    });
  };

  const updateItem = (data: DocumentItemFormData) => {
    if (!editingItemId) return;
    
    const product = products.find(p => p.id === data.productId);
    if (!product) return;

    const updatedItem: DocumentItem = {
      id: editingItemId,
      product,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      totalPrice: data.quantity * data.unitPrice,
      description: data.description,
    };

    const newItems = currentItems.map(item => 
      item.id === editingItemId ? updatedItem : item
    );
    
    setCurrentItems(newItems);
    
    // Clear editing state and reset form to empty values
    setEditingItemId(null);
    itemForm.reset({
      productId: "",
      quantity: 0,
      unitPrice: 0,
      description: "",
    });
  };

  const handleSubmitDocument = async (data: DocumentFormData) => {
    setIsSubmitting(true);
    setError("");

    // Validate that we have at least one item
    if (currentItems.length === 0) {
      setError("حداقل یک قلم کالا الزامی است");
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare items for GraphQL
      // Filter out ID field since backend generates its own IDs
      const items = currentItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        description: item.description || ""
      }));

      const input = {
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        ...(data.supplierId && { supplierId: data.supplierId }),
        ...(data.customerId && { customerId: data.customerId }),
        description: data.description || "",
        date: data.date,
        items
      };

      let result;
      if (editingDocument) {
        // Update existing document
        result = await apolloClient.mutate({
          mutation: UPDATE_DOCUMENT,
          variables: {
            id: editingDocument.id,
            input
          }
        });
      } else {
        // Create new document
        result = await apolloClient.mutate({
          mutation: CREATE_DOCUMENT,
          variables: {
            input
          }
        });
      }

      if (result.data) {
        // Refetch queries to ensure fresh data
        await apolloClient.refetchQueries({
          include: [GET_ALL_DOCUMENTS]
        });
        
        await loadDocuments();
        closeDialog();
      } else {
        setError("خطا در ذخیره سند - پاسخ خالی از سرور");
      }
    } catch (err: any) {
      console.error('Error saving document:', err);
      setError(`خطا در ذخیره سند: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (confirm("آیا از حذف این سند اطمینان دارید؟")) {
      try {
        await apolloClient.mutate({
          mutation: DELETE_DOCUMENT,
          variables: { id: documentId }
        });
        await loadDocuments();
      } catch (err: any) {
        console.error('Error deleting document:', err);
        setError(`خطا در حذف سند: ${err.message}`);
      }
    }
  };

  const totalDocumentValue = currentItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleAddNewProduct = async () => {
    if (!newProductName || !newProductCode || !newProductUnit) {
      setError("نام کالا، کد کالا و واحد الزامی هستند");
      return;
    }

    setIsAddingProduct(true);
    setError("");

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
      setError(`خطا در افزودن کالا: ${err.message}`);
    } finally {
      setIsAddingProduct(false);
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
              <FileText className="h-8 w-8" />
              مدیریت اسناد
              {!isConnected && (
                <span className="text-red-500 text-sm font-normal">(قطع ارتباط)</span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              مشاهده و مدیریت تمام اسناد سیستم
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  افزودن سند
                </Button>
              </DialogTrigger>
              
              <DialogContent className="w-full max-w-[80vw] sm:max-w-[80vw] md:max-w-[80vw] lg:max-w-[80vw] xl:max-w-[80vw] max-h-[90vh] overflow-y-auto mx-auto my-4 p-0">
                <DialogHeader>
                  <DialogTitle>
                    {editingDocument ? "ویرایش سند" : "افزودن سند جدید"}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  <Form {...documentForm}>
                    <form id="document-form" onSubmit={documentForm.handleSubmit(handleSubmitDocument)} className="space-y-4">
                      {documentForm.formState.errors && Object.keys(documentForm.formState.errors).length > 0 && (
                        <div className="text-red-500 text-sm mb-4">
                          لطفاً خطاهای فرم را بررسی کنید
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={documentForm.control}
                          name="documentType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نوع سند *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="انتخاب نوع سند" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="PURCHASE_INVOICE">فاکتور خرید</SelectItem>
                                  <SelectItem value="SALE_INVOICE">فاکتور فروش</SelectItem>
                                  <SelectItem value="STOCK_ADJUSTMENT">تعدیل موجودی</SelectItem>
                                  <SelectItem value="INITIAL_STOCK">موجودی اولیه</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={documentForm.control}
                          name="documentNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>شماره سند *</FormLabel>
                              <FormControl>
                                <Input placeholder="شماره سند" className="ltr-content" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={documentForm.control}
                          name="supplierId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>تامین‌کننده</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="انتخاب تامین‌کننده" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {suppliers.map(supplier => (
                                    <SelectItem key={supplier.id} value={supplier.id}>
                                      {supplier.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={documentForm.control}
                          name="customerId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>مشتری</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="انتخاب مشتری" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {customers.map(customer => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                      {customer.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={documentForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>توضیحات</FormLabel>
                            <FormControl>
                              <Input placeholder="توضیحات سند" className="text-right" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={documentForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تاریخ سند *</FormLabel>
                            <FormControl>
                              <PersianDatePicker
                                value={field.value ? new Date(field.value) : undefined}
                                onChange={(date) => field.onChange(date ? date.getTime() : Date.now())}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                  
                  {/* Item Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">اقلام سند</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...itemForm}>
                        <form onSubmit={(e) => { 
                          e.preventDefault(); 
                          if (editingItemId) {
                            updateItem(itemForm.getValues());
                          } else {
                            handleAddItem(itemForm.getValues());
                          }
                        }} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                              <FormField
                                control={itemForm.control}
                                name="productId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>کالا *</FormLabel>
                                    <div className="flex gap-2">
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="انتخاب کالا" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {products.map(product => (
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
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={itemForm.control}
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
                              control={itemForm.control}
                              name="unitPrice"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>قیمت واحد *</FormLabel>
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
                            
                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <Label>مبلغ کل</Label>
                                <Input 
                                  type="text"
                                  value={formatPersianCurrency(
                                    (itemForm.watch('quantity') || 0) * (itemForm.watch('unitPrice') || 0)
                                  )}
                                  className="ltr-content bg-gray-50"
                                  readOnly
                                />
                              </div>
                              {editingItemId && (
                                <Button 
                                  type="button" 
                                  onClick={cancelEditingItem}
                                  variant="outline"
                                  className="h-10"
                                >
                                  انصراف
                                </Button>
                              )}
                              <Button 
                                type="button" 
                                onClick={() => {
                                  if (editingItemId) {
                                    updateItem(itemForm.getValues());
                                  } else {
                                    handleAddItem(itemForm.getValues());
                                  }
                                }} 
                                className="h-10"
                              >
                                {editingItemId ? "بروزرسانی" : "افزودن"}
                              </Button>
                            </div>
                          </div>
                          
                          <FormField
                            control={itemForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>توضیحات</FormLabel>
                                <FormControl>
                                  <Input placeholder="توضیحات اقلام" className="text-right" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </form>
                      </Form>
                      
                      {/* Items Table */}
                      {currentItems.length > 0 && (
                        <div className="mt-6">
                          <Table>
                            <TableHeader>
                              <TableRow className="rtl-table">
                                <TableHead>کالا</TableHead>
                                <TableHead>کد کالا</TableHead>
                                <TableHead>تعداد</TableHead>
                                <TableHead>قیمت واحد</TableHead>
                                <TableHead>قیمت کل</TableHead>
                                <TableHead>عملیات</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentItems.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.product.name}</TableCell>
                                  <TableCell className="ltr-content">{item.product.code}</TableCell>
                                  <TableCell className="ltr-content">{formatPersianNumber(item.quantity)}</TableCell>
                                  <TableCell className="ltr-content">{formatPersianCurrency(item.unitPrice)}</TableCell>
                                  <TableCell className="ltr-content font-medium">{formatPersianCurrency(item.totalPrice)}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => startEditingItem(item)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => handleRemoveItem(item.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          
                          <div className="mt-4 pt-4 border-t flex justify-between items-center">
                            <div className="text-lg font-medium">
                              جمع کل: {formatPersianCurrency(totalDocumentValue)}
                            </div>
                            <Button 
                              type="submit" 
                              form="document-form"
                              disabled={isSubmitting || currentItems.length === 0}
                              className="flex items-center gap-2"
                            >
                              {isSubmitting ? "در حال ذخیره..." : (editingDocument ? "بروزرسانی" : "ذخیره سند")}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* View Document Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
              <DialogContent className="w-full max-w-[80vw] sm:max-w-[80vw] md:max-w-[80vw] lg:max-w-[80vw] xl:max-w-[80vw] max-h-[90vh] overflow-y-auto mx-auto my-4 p-0">
                <DialogHeader>
                  <DialogTitle>
                    مشاهده سند
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 p-6">
                  {viewingDocument && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>نوع سند</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            <Badge className={documentTypeColors[viewingDocument.documentType as keyof typeof documentTypeColors]}>
                              {documentTypeLabels[viewingDocument.documentType as keyof typeof documentTypeLabels]}
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <Label>شماره سند</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded ltr-content">
                            {viewingDocument.documentNumber}
                          </div>
                        </div>
                        
                        <div>
                          <Label>طرف حساب</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            {getPartnerName(viewingDocument)}
                          </div>
                        </div>
                        
                        <div>
                          <Label>تاریخ سند</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded ltr-content">
                            {formatDocumentDate(viewingDocument.date)}
                          </div>
                        </div>
                        
                        <div className="md:col-span-2">
                          <Label>توضیحات</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            {viewingDocument.description || "-"}
                          </div>
                        </div>
                      </div>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">اقلام سند</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow className="rtl-table">
                                <TableHead>کالا</TableHead>
                                <TableHead>کد کالا</TableHead>
                                <TableHead>تعداد</TableHead>
                                <TableHead>قیمت واحد</TableHead>
                                <TableHead>قیمت کل</TableHead>
                                <TableHead>توضیحات</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {viewingDocument.items.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.product.name}</TableCell>
                                  <TableCell className="ltr-content">{item.product.code}</TableCell>
                                  <TableCell className="ltr-content">{formatPersianNumber(item.quantity)}</TableCell>
                                  <TableCell className="ltr-content">{formatPersianCurrency(item.unitPrice)}</TableCell>
                                  <TableCell className="ltr-content font-medium">{formatPersianCurrency(item.totalPrice)}</TableCell>
                                  <TableCell>{item.description || "-"}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          
                          <div className="mt-4 pt-4 border-t flex justify-between items-center">
                            <div className="text-lg font-medium">
                              جمع کل: {formatPersianCurrency(viewingDocument.totalAmount)}
                            </div>
                            <Badge variant={viewingDocument.isFinalized ? "default" : "secondary"}>
                              {viewingDocument.isFinalized ? "نهایی شده" : "پیش‌نویس"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={closeViewDialog}>
                          بستن
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadDocuments}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              بروزرسانی
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="جستجو در شماره سند، طرف حساب یا توضیحات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-64">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="نوع سند" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">همه اسناد</SelectItem>
                    <SelectItem value="INITIAL_STOCK">موجودی اولیه</SelectItem>
                    <SelectItem value="PURCHASE_INVOICE">فاکتور خرید</SelectItem>
                    <SelectItem value="SALE_INVOICE">فاکتور فروش</SelectItem>
                    <SelectItem value="STOCK_ADJUSTMENT">تعدیل موجودی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{formatPersianNumber(filteredDocuments.length)}</div>
              <div className="text-sm text-muted-foreground">تعداد اسناد</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {formatPersianNumber(filteredDocuments.filter(d => d.documentType === 'INITIAL_STOCK').length)}
              </div>
              <div className="text-sm text-muted-foreground">موجودی اولیه</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {formatPersianNumber(filteredDocuments.filter(d => d.documentType === 'PURCHASE_INVOICE').length)}
              </div>
              <div className="text-sm text-muted-foreground">فاکتور خرید</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {formatPersianNumber(filteredDocuments.filter(d => d.documentType === 'SALE_INVOICE').length)}
              </div>
              <div className="text-sm text-muted-foreground">فاکتور فروش</div>
            </CardContent>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <div className="font-semibold">خطا در سیستم</div>
                  <div className="text-sm mt-1">{error}</div>
                  {!isConnected && (
                    <div className="text-xs mt-2 text-red-600">
                      💡 راهنمایی: لطفاً اطمینان حاصل کنید که:
                      <ul className="list-disc list-inside mt-1">
                        <li>MongoDB در حال اجرا است</li>
                        <li>اتصال اینترنت برقرار است</li>
                        <li>سرور Next.js به درستی کار می‌کند</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle>لیست اسناد</CardTitle>
            <div className="text-sm text-muted-foreground">
              تعداد کل اسناد: {documents.length} | تعداد فیلتر شده: {filteredDocuments.length}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">در حال بارگذاری...</div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {documents.length === 0 ? 
                  "هیچ سندی در پایگاه داده یافت نشد" : 
                  "هیچ سندی با فیلترهای انتخابی یافت نشد"
                }
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="rtl-table">
                    <TableHead>شماره سند</TableHead>
                    <TableHead>نوع سند</TableHead>
                    <TableHead>طرف حساب</TableHead>
                    <TableHead>تعداد اقلام</TableHead>
                    <TableHead>مبلغ کل</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc, index) => {
                    try {
                      return (
                        <TableRow key={doc.id || index}>
                          <TableCell className="font-medium">{doc.documentNumber || 'نامشخص'}</TableCell>
                          <TableCell>
                            <Badge className={documentTypeColors[doc.documentType as keyof typeof documentTypeColors] || 'bg-gray-100 text-gray-800'}>
                              {documentTypeLabels[doc.documentType as keyof typeof documentTypeLabels] || doc.documentType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{getPartnerName(doc)}</div>
                              <div className="text-sm text-muted-foreground">{getPartnerType(doc)}</div>
                            </div>
                          </TableCell>
                          <TableCell className="ltr-content">{formatPersianNumber(doc.items?.length || 0)}</TableCell>
                          <TableCell className="ltr-content font-medium">
                            {formatPersianCurrency(doc.totalAmount || 0)}
                          </TableCell>
                          <TableCell className="ltr-content">
                            {formatDocumentDate(doc.date)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={doc.isFinalized ? "default" : "secondary"}>
                              {doc.isFinalized ? "نهایی شده" : "پیش‌نویس"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => openViewDialog(doc)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {!doc.isFinalized && (
                                <Button size="sm" variant="outline" onClick={() => openEditDialog(doc)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    } catch (error) {
                      console.error('Error rendering document row:', error, 'Document:', doc);
                      return (
                        <TableRow key={doc.id || index}>
                          <TableCell colSpan={8} className="text-center text-red-500">
                            خطا در نمایش سند: {doc.documentNumber || `سند ${index + 1}`}
                          </TableCell>
                        </TableRow>
                      );
                    }
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}