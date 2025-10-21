'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Users, 
  Calculator,
  Calendar,
  FileText,
  ArrowUp,
  ArrowDown,
  DollarSign
} from 'lucide-react';
import { apolloClient } from '@/lib/apollo-client';
import { gql } from 'graphql-tag';
import { MainNavigation } from '@/components/navigation/Navigation';

// GraphQL Queries
const GET_INVENTORY_SUMMARY = gql`
  query GetInventorySummary {
    getInventoryMovements {
      id
      movementType
      quantity
      unitPrice
      totalPrice
      date
      product {
        id
        name
        code
        category
      }
    }
  }
`;

const GET_PRODUCTS_SUMMARY = gql`
  query GetProductsSummary {
    getProducts {
      id
      name
      code
      category
      isActive
    }
  }
`;

// Add new GraphQL query for Rial Cardex
const GET_ALL_DOCUMENTS_FOR_CARDEX = gql`
  query GetAllDocumentsForCardex {
    getDocuments {
      id
      documentType
      documentNumber
      date
      isFinalized
      totalAmount
      items {
        product {
          id
          name
          code
        }
        quantity
        unitPrice
        totalPrice
      }
    }
  }
`;

const GET_SUPPLIERS_SUMMARY = gql`
  query GetSuppliersSummary {
    getSuppliers {
      id
      name
      status
    }
  }
`;

const GET_CUSTOMERS_SUMMARY = gql`
  query GetCustomersSummary {
    getCustomers {
      id
      name
      status
    }
  }
`;

interface InventoryMovement {
  id: string;
  movementType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  date: string;
  product: {
    id: string;
    name: string;
    code: string;
    category?: string;
  };
}

interface DocumentItem {
  id: string;
  product: {
    id: string;
    name: string;
    code: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Document {
  id: string;
  documentType: string;
  documentNumber: string;
  totalAmount?: number;
  date: number;
  isFinalized: boolean;
  supplier?: { id: string; name: string };
  customer?: { id: string; name: string };
  items: DocumentItem[];
}

interface Product {
  id: string;
  name: string;
  code: string;
  category?: string;
  isActive: boolean;
}

// Add new interfaces for Rial Cardex
interface RialCardexItem {
  date: string;
  documentType: string;
  documentNumber: string;
  inQuantity: number;
  inUnitPrice: number;
  inTotalPrice: number;
  outQuantity: number;
  outUnitPrice: number;
  outTotalPrice: number;
  balanceQuantity: number;
  balanceUnitPrice: number;
  balanceTotalPrice: number;
}

interface Supplier {
  id: string;
  name: string;
  status: string;
}

interface Customer {
  id: string;
  name: string;
  status: string;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Data states
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Add state for Rial Cardex
  const [selectedProduct, setSelectedProduct] = useState('');
  const [rialCardexData, setRialCardexData] = useState<RialCardexItem[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Load all data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [
        inventoryResult,
        documentsResult,
        productsResult,
        suppliersResult,
        customersResult
      ] = await Promise.all([
        apolloClient.query({
          query: GET_INVENTORY_SUMMARY,
          fetchPolicy: 'no-cache'
        }),
        apolloClient.query({
          query: GET_ALL_DOCUMENTS_FOR_CARDEX, // Use the query with items instead of GET_DOCUMENTS_SUMMARY
          fetchPolicy: 'no-cache'
        }),
        apolloClient.query({
          query: GET_PRODUCTS_SUMMARY,
          fetchPolicy: 'no-cache'
        }),
        apolloClient.query({
          query: GET_SUPPLIERS_SUMMARY,
          fetchPolicy: 'no-cache'
        }),
        apolloClient.query({
          query: GET_CUSTOMERS_SUMMARY,
          fetchPolicy: 'no-cache'
        })
      ]);

      setInventoryMovements((inventoryResult.data as any)?.getInventoryMovements || []);
      setDocuments((documentsResult.data as any)?.getDocuments || []);
      setProducts((productsResult.data as any)?.getProducts || []);
      setSuppliers((suppliersResult.data as any)?.getSuppliers || []);
      setCustomers((customersResult.data as any)?.getCustomers || []);
    } catch (err: any) {
      console.error('Error loading reports data:', err);
      setError('خطا در بارگذاری اطلاعات گزارشات');
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalInventoryValue = inventoryMovements
    .filter(movement => movement.movementType === 'INITIAL_STOCK')
    .reduce((sum, movement) => sum + Math.abs(movement.totalPrice), 0);

  const totalPurchases = documents
    .filter(doc => doc.documentType === 'PURCHASE' && doc.isFinalized)
    .reduce((sum, doc) => sum + (doc.totalAmount || 0), 0);

  const totalSales = documents
    .filter(doc => doc.documentType === 'SALE' && doc.isFinalized)
    .reduce((sum, doc) => sum + (doc.totalAmount || 0), 0);

  const activeProducts = products.filter(p => p.isActive).length;
  const totalProducts = products.length;

  const activeSuppliers = suppliers.filter(s => s.status === 'ACTIVE').length;
  const activeCustomers = customers.filter(c => c.status === 'ACTIVE').length;

  // Get unique categories
  const categories = [...new Set(products.filter(p => p.category).map(p => p.category))];

  // Filter data by date range and category
  const filterByDateAndCategory = (items: any[], dateField = 'date') => {
    return items.filter(item => {
      const itemDate = new Date(item[dateField]).toISOString().split('T')[0];
      const matchesDate = (!dateFrom || itemDate >= dateFrom) && 
                         (!dateTo || itemDate <= dateTo);
      const matchesCategory = !selectedCategory || 
                             selectedCategory === 'all' ||
                             (item.product?.category === selectedCategory) ||
                             (item.category === selectedCategory);
      return matchesDate && matchesCategory;
    });
  };

  const filteredMovements = filterByDateAndCategory(inventoryMovements);
  const filteredDocuments = filterByDateAndCategory(documents);

  // Calculate category breakdown
  const categoryBreakdown = categories.map(category => {
    const categoryProducts = products.filter(p => p.category === category);
    const categoryMovements = inventoryMovements.filter(m => m.product.category === category);
    const categoryValue = categoryMovements.reduce((sum, m) => sum + Math.abs(m.totalPrice), 0);
    
    return {
      category,
      productsCount: categoryProducts.length,
      value: categoryValue,
      percentage: totalInventoryValue > 0 ? (categoryValue / totalInventoryValue) * 100 : 0
    };
  });

  // Top products by value
  const productValues = inventoryMovements.reduce((acc, movement) => {
    const productId = movement.product.id;
    if (!acc[productId]) {
      acc[productId] = {
        product: movement.product,
        totalValue: 0,
        totalQuantity: 0
      };
    }
    acc[productId].totalValue += Math.abs(movement.totalPrice);
    acc[productId].totalQuantity += Math.abs(movement.quantity);
    return acc;
  }, {} as any);

  const topProducts = Object.values(productValues)
    .sort((a: any, b: any) => b.totalValue - a.totalValue)
    .slice(0, 10);

  // Recent transactions
  const recentDocuments = documents
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const formatDate = (dateValue: number) => {
    return new Date(dateValue).toLocaleDateString('fa-IR');
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'INITIAL_STOCK': return 'موجودی اولیه';
      case 'PURCHASE_INVOICE': return 'خرید';
      case 'SALE_INVOICE': return 'فروش';
      case 'STOCK_ADJUSTMENT': return 'تعدیل';
      default: return type;
    }
  };

  const getDocumentTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'INITIAL_STOCK': return 'bg-blue-100 text-blue-800';
      case 'PURCHASE': return 'bg-green-100 text-green-800';
      case 'SALE': return 'bg-orange-100 text-orange-800';
      case 'ADJUSTMENT': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to calculate Rial Cardex
  const calculateRialCardex = async (productId: string) => {
    if (!productId) return;
    
    setIsCalculating(true);
    setError('');
    setRialCardexData([]);
    
    try {
      console.log('Calculating Rial Cardex for product ID:', productId);
      
      const result = await apolloClient.query({
        query: GET_ALL_DOCUMENTS_FOR_CARDEX,
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      });
      
      console.log('GraphQL query result:', result);
      
      const documents = (result.data as any)?.getDocuments || [];
      console.log('Retrieved documents:', documents);
      
      // Log all document types to see what we have
      const documentTypes = [...new Set(documents.map((doc: any) => doc.documentType))];
      console.log('All document types in system:', documentTypes);
      
      // Filter documents that contain this product (INCLUDE BOTH FINALIZED AND DRAFT)
      const productDocuments = documents.filter((doc: any) => {
        // Check if any item in the document matches the product ID
        // Add proper check for items property
        const hasProduct = doc.items && Array.isArray(doc.items) && 
          doc.items.some((item: any) => item.product?.id === productId);
        console.log(`Document ${doc.documentNumber} (${doc.documentType}) isFinalized: ${doc.isFinalized}, hasProduct: ${hasProduct}`);
        return hasProduct;
      });
      
      console.log('Product documents (including draft):', productDocuments);
      
      // Log document types for this product
      const productDocumentTypes = [...new Set(productDocuments.map((doc: any) => doc.documentType))];
      console.log('Document types for this product (including draft):', productDocumentTypes);
      
      // Process documents to create cardex entries
      const cardexEntries: any[] = [];
      
      productDocuments.forEach((doc: any) => {
        // Add proper check for items property
        if (doc.items && Array.isArray(doc.items)) {
          doc.items.forEach((item: any) => {
            if (item.product?.id === productId) {
              cardexEntries.push({
                date: doc.date, // This is a timestamp number
                documentType: doc.documentType,
                documentNumber: doc.documentNumber,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice
              });
            }
          });
        }
      });
      
      console.log('Cardex entries:', cardexEntries);
      
      // Sort entries by date (timestamp)
      cardexEntries.sort((a, b) => a.date - b.date);
      
      console.log('Sorted cardex entries:', cardexEntries);
      
      // Calculate running balance with weighted average
      let balanceQuantity = 0;
      let balanceTotalPrice = 0;
      const processedEntries: RialCardexItem[] = [];
      
      cardexEntries.forEach(entry => {
        let inQuantity = 0;
        let inUnitPrice = 0;
        let inTotalPrice = 0;
        let outQuantity = 0;
        let outUnitPrice = 0;
        let outTotalPrice = 0;
        
        // Categorize documents according to requirements:
        // "وارده" (Incoming): INITIAL_STOCK, PURCHASE_INVOICE
        // "صادره" (Outgoing): SALE_INVOICE
        
        const isIncoming = entry.documentType === 'INITIAL_STOCK' || entry.documentType === 'PURCHASE_INVOICE';
        const isOutgoing = entry.documentType === 'SALE_INVOICE';
        
        console.log(`Processing ${entry.documentNumber} (${entry.documentType}) - isIncoming: ${isIncoming}, isOutgoing: ${isOutgoing}`);
        
        if (isIncoming) {
          // For incoming items (وارده)
          inQuantity = Math.abs(entry.quantity);
          inUnitPrice = entry.unitPrice;
          inTotalPrice = Math.abs(entry.totalPrice);
          
          // Update balance with weighted average
          balanceQuantity += inQuantity;
          balanceTotalPrice += inTotalPrice;
          
          console.log(`Incoming - quantity: ${inQuantity}, unitPrice: ${inUnitPrice}, totalPrice: ${inTotalPrice}`);
          console.log(`Balance after incoming - quantity: ${balanceQuantity}, totalPrice: ${balanceTotalPrice}`);
        } else if (isOutgoing) {
          // For outgoing items (صادره)
          outQuantity = Math.abs(entry.quantity);
          outUnitPrice = entry.unitPrice;
          // For outgoing, we use the current average cost
          const averagePrice = balanceQuantity > 0 ? balanceTotalPrice / balanceQuantity : 0;
          outTotalPrice = outQuantity * averagePrice;
          
          // Update balance
          balanceQuantity -= outQuantity;
          balanceTotalPrice -= outTotalPrice;
          
          console.log(`Outgoing - quantity: ${outQuantity}, unitPrice: ${outUnitPrice}, totalPrice: ${outTotalPrice}`);
          console.log(`Balance after outgoing - quantity: ${balanceQuantity}, totalPrice: ${balanceTotalPrice}`);
          
          // Ensure balance values don't go negative due to rounding
          if (balanceQuantity < 0) balanceQuantity = 0;
          if (balanceTotalPrice < 0) balanceTotalPrice = 0;
        }
        
        // Calculate average price for balance
        const balanceUnitPrice = balanceQuantity > 0 ? balanceTotalPrice / balanceQuantity : 0;
        
        processedEntries.push({
          date: entry.date, // This is a timestamp number
          documentType: entry.documentType,
          documentNumber: entry.documentNumber,
          inQuantity,
          inUnitPrice,
          inTotalPrice,
          outQuantity,
          outUnitPrice,
          outTotalPrice,
          balanceQuantity,
          balanceUnitPrice,
          balanceTotalPrice
        });
      });
      
      console.log('Processed entries:', processedEntries);
      setRialCardexData(processedEntries);
    } catch (err: any) {
      console.error('Error calculating Rial Cardex:', err);
      console.error('Error details:', {
        message: err.message,
        networkError: err.networkError,
        graphQLErrors: err.graphQLErrors,
        statusCode: err.statusCode
      });
      
      // Check if it's a network error
      if (err.networkError) {
        setError('خطا در ارتباط با سرور: ' + (err.networkError.message || 'خطای نامشخص'));
      } 
      // Check if it's a GraphQL error
      else if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        const firstError = err.graphQLErrors[0];
        setError('خطا در پردازش داده‌ها: ' + (firstError.message || 'خطای نامشخص'));
      } 
      // Generic error
      else {
        setError('خطا در محاسبه کاردکس ریالی: ' + (err.message || 'خطای نامشخص'));
      }
    } finally {
      setIsCalculating(false);
    }
  };

  // Function to calculate product movements for the new report
  const calculateProductMovements = (productId: string) => {
    // Initialize movement data
    const movements = {
      initialStock: { quantity: 0, unitPrice: 0, totalPrice: 0 },
      incoming: { quantity: 0, unitPrice: 0, totalPrice: 0 },
      outgoing: { quantity: 0, unitPrice: 0, totalPrice: 0 },
      balance: { quantity: 0, unitPrice: 0, totalPrice: 0 }
    };

    // Filter documents for this product (including both finalized and draft)
    // Add proper check for items property
    const productDocuments = documents.filter(doc => 
      doc.items && Array.isArray(doc.items) && doc.items.some((item: DocumentItem) => item.product?.id === productId)
    );

    // Process each document
    productDocuments.forEach(doc => {
      // Add proper check for items property
      if (doc.items && Array.isArray(doc.items)) {
        doc.items.forEach((item: DocumentItem) => {
          if (item.product?.id === productId) {
            const quantity = Math.abs(item.quantity);
            const totalPrice = Math.abs(item.totalPrice);
            const unitPrice = quantity > 0 ? totalPrice / quantity : 0;

            if (doc.documentType === 'INITIAL_STOCK') {
              movements.initialStock.quantity += quantity;
              movements.initialStock.totalPrice += totalPrice;
              movements.initialStock.unitPrice = movements.initialStock.quantity > 0 
                ? movements.initialStock.totalPrice / movements.initialStock.quantity 
                : 0;
            } 
            else if (doc.documentType === 'PURCHASE_INVOICE') {
              movements.incoming.quantity += quantity;
              movements.incoming.totalPrice += totalPrice;
              movements.incoming.unitPrice = movements.incoming.quantity > 0 
                ? movements.incoming.totalPrice / movements.incoming.quantity 
                : 0;
            } 
            else if (doc.documentType === 'SALE_INVOICE') {
              movements.outgoing.quantity += quantity;
              movements.outgoing.totalPrice += totalPrice;
              movements.outgoing.unitPrice = movements.outgoing.quantity > 0 
                ? movements.outgoing.totalPrice / movements.outgoing.quantity 
                : 0;
            }
          }
        });
      }
    });

    // Calculate balance
    movements.balance.quantity = 
      movements.initialStock.quantity + movements.incoming.quantity - movements.outgoing.quantity;
  
    movements.balance.totalPrice = 
      movements.initialStock.totalPrice + movements.incoming.totalPrice - movements.outgoing.totalPrice;
  
    movements.balance.unitPrice = movements.balance.quantity > 0 
      ? movements.balance.totalPrice / movements.balance.quantity 
      : 0;

    return movements;
  };

  // Function to calculate total movements for summary row
  const calculateTotalMovements = () => {
    // Initialize totals
    const totals = {
      initialStock: { quantity: 0, unitPrice: 0, totalPrice: 0 },
      incoming: { quantity: 0, unitPrice: 0, totalPrice: 0 },
      outgoing: { quantity: 0, unitPrice: 0, totalPrice: 0 },
      balance: { quantity: 0, unitPrice: 0, totalPrice: 0 }
    };

    // Calculate totals for all active products
    products.filter(p => p.isActive).forEach(product => {
      const productMovements = calculateProductMovements(product.id);
    
      totals.initialStock.totalPrice += productMovements.initialStock.totalPrice;
      totals.incoming.totalPrice += productMovements.incoming.totalPrice;
      totals.outgoing.totalPrice += productMovements.outgoing.totalPrice;
      totals.balance.totalPrice += productMovements.balance.totalPrice;
    });

    return totals;
  };

  if (loading) return <div className="p-6">در حال بارگذاری...</div>;
  if (error) return <div className="p-6 text-red-600">خطا در بارگذاری اطلاعات: {error}</div>;

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">گزارشات و آمار</h1>
          <Button onClick={loadAllData} variant="outline">
            بروزرسانی اطلاعات
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>فیلترها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dateFrom">از تاریخ</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">تا تاریخ</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">دسته‌بندی</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="همه دسته‌بندی‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category || 'all'}>
                        {category || 'همه دسته‌بندی‌ها'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ارزش کل موجودی</p>
                  <p className="text-2xl font-bold">{totalInventoryValue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">ریال</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کل خریدها</p>
                  <p className="text-2xl font-bold">{totalPurchases.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">ریال</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کل فروش</p>
                  <p className="text-2xl font-bold">{totalSales.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">ریال</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کالاهای فعال</p>
                  <p className="text-2xl font-bold">{activeProducts}</p>
                  <p className="text-xs text-gray-500">از {totalProducts} کالا</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">تامین‌کنندگان فعال</p>
                  <p className="text-xl font-bold">{activeSuppliers}</p>
                </div>
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">مشتریان فعال</p>
                  <p className="text-xl font-bold">{activeCustomers}</p>
                </div>
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">گزارش کالاها</TabsTrigger>
            <TabsTrigger value="documents">گزارش اسناد</TabsTrigger>
            <TabsTrigger value="rial-cardex">کاردکس ریالی</TabsTrigger>
            <TabsTrigger value="product-movements">گردش ریالی کالاها</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            {/* Top Products by Value */}
            <Card>
              <CardHeader>
                <CardTitle>برترین کالاها بر اساس ارزش</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>کالا</TableHead>
                      <TableHead>کد</TableHead>
                      <TableHead>ارزش کل</TableHead>
                      <TableHead>مقدار کل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((item: any, index) => (
                      <TableRow key={item.product.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            {item.product.name}
                          </div>
                        </TableCell>
                        <TableCell>{item.product.code}</TableCell>
                        <TableCell className="font-medium">
                          {item.totalValue.toLocaleString()} ریال
                        </TableCell>
                        <TableCell>{item.totalQuantity.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {/* Filtered Documents */}
            <Card>
              <CardHeader>
                <CardTitle>تراکنش‌های فیلتر شده</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>شماره سند</TableHead>
                      <TableHead>نوع</TableHead>
                      <TableHead>مبلغ</TableHead>
                      <TableHead>تاریخ</TableHead>
                      <TableHead>طرف حساب</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.documentNumber}</TableCell>
                        <TableCell>
                          <Badge className={getDocumentTypeBadgeColor(doc.documentType)}>
                            {getDocumentTypeLabel(doc.documentType)}
                          </Badge>
                        </TableCell>
                        <TableCell>{doc.totalAmount.toLocaleString()} ریال</TableCell>
                        <TableCell>{formatDate(doc.date)}</TableCell>
                        <TableCell>
                          {doc.supplier?.name || doc.customer?.name || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rial-cardex" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>کاردکس ریالی</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="product">کالا</Label>
                    <Select value={selectedProduct} onValueChange={(value) => {
                      setSelectedProduct(value);
                      if (value) {
                        calculateRialCardex(value);
                      } else {
                        setRialCardexData([]);
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب کالا" />
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          .filter(product => product.isActive)
                          .map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 text-sm text-blue-800">
                  <p>این گزارش شامل اسناد پیش‌نویس نیز می‌شود تا بتوانید قبل از نهایی کردن اسناد، محاسبات را بررسی کنید.</p>
                </div>

                {isCalculating && (
                  <div className="text-center py-4">در حال محاسبه کاردکس ریالی...</div>
                )}

                {rialCardexData.length > 0 && !isCalculating && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>تاریخ</TableHead>
                        <TableHead>نوع سند</TableHead>
                        <TableHead>شماره سند</TableHead>
                        <TableHead>مقدار ورود</TableHead>
                        <TableHead>فی ورود</TableHead>
                        <TableHead>ارزش ورود</TableHead>
                        <TableHead>مقدار خروج</TableHead>
                        <TableHead>فی خروج</TableHead>
                        <TableHead>ارزش خروج</TableHead>
                        <TableHead>مانده مقدار</TableHead>
                        <TableHead>فی مانده</TableHead>
                        <TableHead>ارزش مانده</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rialCardexData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(item.date).toLocaleDateString('fa-IR')}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{getDocumentTypeLabel(item.documentType)}</span>
                              {/* Show draft indicator if needed */}
                            </div>
                          </TableCell>
                          <TableCell>{item.documentNumber}</TableCell>
                          <TableCell>{item.inQuantity > 0 ? item.inQuantity.toLocaleString() : '-'}</TableCell>
                          <TableCell>{item.inUnitPrice > 0 ? item.inUnitPrice.toLocaleString() : '-'}</TableCell>
                          <TableCell>{item.inTotalPrice > 0 ? item.inTotalPrice.toLocaleString() : '-'}</TableCell>
                          <TableCell>{item.outQuantity > 0 ? item.outQuantity.toLocaleString() : '-'}</TableCell>
                          <TableCell>{item.outUnitPrice > 0 ? item.outUnitPrice.toLocaleString() : '-'}</TableCell>
                          <TableCell>{item.outTotalPrice > 0 ? item.outTotalPrice.toLocaleString() : '-'}</TableCell>
                          <TableCell className="font-medium">{Math.abs(item.balanceQuantity).toLocaleString()}</TableCell>
                          <TableCell className="font-medium">{item.balanceUnitPrice > 0 ? Math.round(item.balanceUnitPrice).toLocaleString() : '0'}</TableCell>
                          <TableCell className="font-medium">{Math.round(item.balanceTotalPrice).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {selectedProduct && rialCardexData.length === 0 && !isCalculating && (
                  <div className="text-center py-4 text-gray-500">هیچ داده‌ای برای نمایش وجود ندارد</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="product-movements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>گردش ریالی کالاها</CardTitle>
                <p className="text-sm text-gray-600">خلاصه‌ای از گردش مالی هر کالا</p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>کالا</TableHead>
                      <TableHead>کد</TableHead>
                      <TableHead className="text-right">موجودی اولیه (تعداد)</TableHead>
                      <TableHead className="text-right">موجودی اولیه (فی)</TableHead>
                      <TableHead className="text-right">موجودی اولیه (ارزش)</TableHead>
                      <TableHead className="text-right">ورودی (تعداد)</TableHead>
                      <TableHead className="text-right">ورودی (فی)</TableHead>
                      <TableHead className="text-right">ورودی (ارزش)</TableHead>
                      <TableHead className="text-right">خروجی (تعداد)</TableHead>
                      <TableHead className="text-right">خروجی (فی)</TableHead>
                      <TableHead className="text-right">خروجی (ارزش)</TableHead>
                      <TableHead className="text-right">مانده (تعداد)</TableHead>
                      <TableHead className="text-right">مانده (فی)</TableHead>
                      <TableHead className="text-right">مانده (ارزش)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.filter(p => p.isActive).map((product) => {
                      // Calculate movements for this product
                      const productMovements = calculateProductMovements(product.id);
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.code}</TableCell>
                          <TableCell className="text-right">{productMovements.initialStock.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{Math.round(productMovements.initialStock.unitPrice).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{Math.round(productMovements.initialStock.totalPrice).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{productMovements.incoming.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{Math.round(productMovements.incoming.unitPrice).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{Math.round(productMovements.incoming.totalPrice).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{productMovements.outgoing.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{Math.round(productMovements.outgoing.unitPrice).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{Math.round(productMovements.outgoing.totalPrice).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">{productMovements.balance.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">{Math.round(productMovements.balance.unitPrice).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">{Math.round(productMovements.balance.totalPrice).toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Summary row */}
                    <TableRow className="bg-gray-100 font-bold">
                      <TableCell colSpan={2}>جمع کل</TableCell>
                      <TableCell className="text-right">{calculateTotalMovements().initialStock.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Math.round(calculateTotalMovements().initialStock.unitPrice).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Math.round(calculateTotalMovements().initialStock.totalPrice).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{calculateTotalMovements().incoming.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Math.round(calculateTotalMovements().incoming.unitPrice).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Math.round(calculateTotalMovements().incoming.totalPrice).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{calculateTotalMovements().outgoing.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Math.round(calculateTotalMovements().outgoing.unitPrice).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Math.round(calculateTotalMovements().outgoing.totalPrice).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{calculateTotalMovements().balance.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Math.round(calculateTotalMovements().balance.unitPrice).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{Math.round(calculateTotalMovements().balance.totalPrice).toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}