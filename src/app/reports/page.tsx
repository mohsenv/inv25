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

const GET_DOCUMENTS_SUMMARY = gql`
  query GetDocumentsSummary {
    getDocuments {
      id
      documentType
      documentNumber
      totalAmount
      date
      isFinalized
      supplier {
        id
        name
      }
      customer {
        id
        name
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

interface Document {
  id: string;
  documentType: string;
  documentNumber: string;
  totalAmount: number;
  date: string;
  isFinalized: boolean;
  supplier?: { id: string; name: string };
  customer?: { id: string; name: string };
}

interface Product {
  id: string;
  name: string;
  code: string;
  category?: string;
  isActive: boolean;
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
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Data states
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

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
          query: GET_DOCUMENTS_SUMMARY,
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
    .reduce((sum, doc) => sum + doc.totalAmount, 0);

  const totalSales = documents
    .filter(doc => doc.documentType === 'SALE' && doc.isFinalized)
    .reduce((sum, doc) => sum + doc.totalAmount, 0);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'INITIAL_STOCK': return 'موجودی اولیه';
      case 'PURCHASE': return 'خرید';
      case 'SALE': return 'فروش';
      case 'ADJUSTMENT': return 'تعدیل';
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

  if (loading) return <div className="p-6">در حال بارگذاری...</div>;
  if (error) return <div className="p-6 text-red-600">خطا در بارگذاری اطلاعات: {error}</div>;

  return (
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
                  <SelectItem value="">همه دسته‌بندی‌ها</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category || ''}>
                      {category}
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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">کلی</TabsTrigger>
          <TabsTrigger value="inventory">موجودی</TabsTrigger>
          <TabsTrigger value="transactions">تراکنش‌ها</TabsTrigger>
          <TabsTrigger value="products">کالاها</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>تفکیک بر اساس دسته‌بندی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryBreakdown.map((item) => (
                  <div key={item.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <div className="font-medium">{item.category}</div>
                      <div className="text-sm text-gray-600">{item.productsCount} کالا</div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold">{item.value.toLocaleString()} ریال</div>
                      <div className="text-sm text-gray-600">%{item.percentage.toFixed(1)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>آخرین تراکنش‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>شماره سند</TableHead>
                    <TableHead>نوع</TableHead>
                    <TableHead>مبلغ</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>وضعیت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDocuments.map((doc) => (
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
                        <Badge className={doc.isFinalized ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {doc.isFinalized ? 'نهایی' : 'پیش‌نویس'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
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

        <TabsContent value="transactions" className="space-y-4">
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

        <TabsContent value="products" className="space-y-4">
          {/* Products Summary */}
          <Card>
            <CardHeader>
              <CardTitle>خلاصه کالاها</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام کالا</TableHead>
                    <TableHead>کد</TableHead>
                    <TableHead>دسته‌بندی</TableHead>
                    <TableHead>وضعیت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.code}</TableCell>
                      <TableCell>{product.category || '-'}</TableCell>
                      <TableCell>
                        <Badge className={product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {product.isActive ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}