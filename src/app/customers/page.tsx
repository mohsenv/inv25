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
import { Pencil, Trash2, Plus, Search, Phone, Mail, MapPin } from 'lucide-react';
import { apolloClient } from '@/lib/apollo-client';
import { gql } from 'graphql-tag';

// GraphQL Queries and Mutations
const GET_CUSTOMERS = gql`
  query GetCustomers($isActive: Boolean) {
    getCustomers(isActive: $isActive) {
      id
      name
      contactPerson
      phone
      email
      address
      city
      postalCode
      taxNumber
      creditLimit
      currentBalance
      customerType
      status
      notes
      isActive
      createdAt
      updatedAt
    }
  }
`;

const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CustomerInput!) {
    createCustomer(input: $input) {
      id
      name
      contactPerson
      phone
      email
      address
      city
      postalCode
      taxNumber
      creditLimit
      currentBalance
      customerType
      status
      notes
    }
  }
`;

const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $input: CustomerInput!) {
    updateCustomer(id: $id, input: $input) {
      id
      name
      contactPerson
      phone
      email
      address
      city
      postalCode
      taxNumber
      creditLimit
      currentBalance
      customerType
      status
      notes
    }
  }
`;

const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
  }
`;

// Form Schema
const customerSchema = z.object({
  name: z.string().min(1, 'نام مشتری الزامی است'),
  contactPerson: z.string().optional(),
  nationalCode: z.string().optional(),
  economicCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('ایمیل معتبر وارد کنید').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  taxNumber: z.string().optional(),
  creditLimit: z.number().min(0, 'حد اعتبار نمی‌تواند منفی باشد').default(0),
  currentBalance: z.number().default(0),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'CORPORATE']).default('RETAIL'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Customer {
  id: string;
  name: string;
  contactPerson?: string;
  nationalCode?: string;
  economicCode?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  taxNumber?: string;
  creditLimit: number;
  currentBalance: number;
  customerType: 'RETAIL' | 'WHOLESALE' | 'CORPORATE';
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CustomersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apolloClient.query({
        query: GET_CUSTOMERS,
        variables: { isActive: true }, // Only load active customers
        fetchPolicy: 'no-cache'
      });
      
      if (result.data && (result.data as any).getCustomers) {
        const customersData = (result.data as any).getCustomers;
        
        // Ensure all customers have required fields with defaults
        const processedCustomers = customersData.map((customer: any) => ({
          ...customer,
          customerType: customer.customerType || 'RETAIL',
          status: customer.status || 'ACTIVE',
          creditLimit: customer.creditLimit || 0,
          currentBalance: customer.currentBalance || 0
        }));
        setCustomers(processedCustomers);
      } else {
        setCustomers([]);
      }
    } catch (err: any) {
      console.error('Error loading customers:', err);
      setError('خطا در بارگذاری مشتریان');
    } finally {
      setLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerType: 'RETAIL',
      status: 'ACTIVE',
      creditLimit: 0,
    },
  });



  const filteredCustomers = customers.filter(customer =>
    customer.isActive && ( // Only show active customers
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm)) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.city && customer.city.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const openForm = (customer?: Customer) => {
    setEditingCustomer(customer || null);
    if (customer) {
      setValue('name', customer.name);
      setValue('contactPerson', customer.contactPerson || '');
      setValue('nationalCode', customer.nationalCode || '');
      setValue('economicCode', customer.economicCode || '');
      setValue('phone', customer.phone);
      setValue('email', customer.email || '');
      setValue('address', customer.address || '');
      setValue('city', customer.city || '');
      setValue('postalCode', customer.postalCode || '');
      setValue('taxNumber', customer.taxNumber || '');
      setValue('creditLimit', customer.creditLimit);
      setValue('currentBalance', customer.currentBalance);
      setValue('customerType', customer.customerType);
      setValue('status', customer.status);
      setValue('notes', customer.notes || '');
    } else {
      reset();
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
    reset();
  };

  const onSubmit = async (data: any) => {
    setSubmitError('');
    
    try {
      console.log('Submitting customer data:', data);
      
      const input = {
        name: data.name?.trim(),
        contactPerson: data.contactPerson?.trim() || undefined,
        nationalCode: data.nationalCode?.trim() || undefined,
        economicCode: data.economicCode?.trim() || undefined,
        address: data.address?.trim() || undefined,
        city: data.city?.trim() || undefined,
        postalCode: data.postalCode?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        email: data.email?.trim() || undefined,
        taxNumber: data.taxNumber?.trim() || undefined,
        creditLimit: Number(data.creditLimit) || 0,
        currentBalance: Number(data.currentBalance) || 0,
        customerType: data.customerType || 'RETAIL',
        status: data.status || 'ACTIVE',
        notes: data.notes?.trim() || undefined,
      };
      
      // Remove undefined values
      Object.keys(input).forEach(key => {
        if (input[key as keyof typeof input] === undefined) {
          delete input[key as keyof typeof input];
        }
      });
      
      console.log('Processed input:', input);

      let result;
      if (editingCustomer) {
        result = await apolloClient.mutate({
          mutation: UPDATE_CUSTOMER,
          variables: { id: editingCustomer.id, input },
          errorPolicy: 'all'
        });
      } else {
        result = await apolloClient.mutate({
          mutation: CREATE_CUSTOMER,
          variables: { input },
          errorPolicy: 'all'
        });
      }
      
      console.log('Mutation result:', result);
      
      if (result.error) {
        setSubmitError(`خطای GraphQL: ${result.error.message}`);
        return;
      }

      await loadCustomers();
      closeForm();
      
    } catch (error: any) {
      console.error('Error saving customer:', error);
      
      let errorMessage = 'خطا در ذخیره مشتری';
      
      if (error.networkError) {
        errorMessage = 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.';
      } else if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMessage = error.graphQLErrors.map((err: any) => err.message).join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSubmitError(errorMessage);
    }
  };

  const handleDelete = async (customerId: string) => {
    if (confirm('آیا از حذف این مشتری اطمینان دارید؟')) {
      try {
        await apolloClient.mutate({
          mutation: DELETE_CUSTOMER,
          variables: { id: customerId },
        });
        await loadCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const getCustomerTypeLabel = (type: string) => {
    switch (type) {
      case 'RETAIL': return 'خرده‌فروشی';
      case 'WHOLESALE': return 'عمده‌فروشی';
      case 'CORPORATE': return 'شرکتی';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    return status === 'ACTIVE' ? 'فعال' : 'غیرفعال';
  };

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      <div className="p-6">در حال بارگذاری...</div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      <div className="p-6 text-red-600">
        <div>خطا در بارگذاری اطلاعات: {error}</div>
        <Button 
          onClick={loadCustomers} 
          className="mt-4"
          variant="outline"
        >
          تلاش مجدد
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">مدیریت مشتریان</h1>
        <div className="flex gap-2">
          <Button onClick={loadCustomers} variant="outline" size="sm">
            بروزرسانی ({customers.length})
          </Button>
          <Button onClick={() => openForm()} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            مشتری جدید
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="جستجو در مشتریان..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCustomer ? 'ویرایش مشتری' : 'مشتری جدید'}</CardTitle>
          </CardHeader>
          <CardContent>
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{submitError}</p>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">نام مشتری *</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                </div>

                <div>
                  <Label htmlFor="contactPerson">شخص تماس</Label>
                  <Input id="contactPerson" {...register('contactPerson')} />
                </div>

                <div>
                  <Label htmlFor="phone">شماره تلفن</Label>
                  <Input id="phone" {...register('phone')} />
                  {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
                </div>

                <div>
                  <Label htmlFor="email">ایمیل</Label>
                  <Input id="email" type="email" {...register('email')} />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                </div>

                <div>
                  <Label htmlFor="nationalCode">کد ملی</Label>
                  <Input id="nationalCode" {...register('nationalCode')} placeholder="کد ملی یا شناسه ملی" />
                  {errors.nationalCode && <p className="text-red-500 text-sm">{errors.nationalCode.message}</p>}
                </div>

                <div>
                  <Label htmlFor="economicCode">کد اقتصادی</Label>
                  <Input id="economicCode" {...register('economicCode')} placeholder="کد اقتصادی (۱۲ رقم)" />
                  {errors.economicCode && <p className="text-red-500 text-sm">{errors.economicCode.message}</p>}
                </div>

                <div>
                  <Label htmlFor="city">شهر</Label>
                  <Input id="city" {...register('city')} />
                </div>

                <div>
                  <Label htmlFor="taxNumber">شماره مالیاتی</Label>
                  <Input id="taxNumber" {...register('taxNumber')} />
                </div>

                <div>
                  <Label htmlFor="creditLimit">حد اعتبار (ریال)</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    {...register('creditLimit', { valueAsNumber: true })}
                  />
                  {errors.creditLimit && <p className="text-red-500 text-sm">{errors.creditLimit.message}</p>}
                </div>

                <div>
                  <Label htmlFor="customerType">نوع مشتری</Label>
                  <select
                    id="customerType"
                    {...register('customerType')}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="RETAIL">خرده‌فروشی</option>
                    <option value="WHOLESALE">عمده‌فروشی</option>
                    <option value="CORPORATE">شرکتی</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="status">وضعیت</Label>
                  <select
                    id="status"
                    {...register('status')}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="ACTIVE">فعال</option>
                    <option value="INACTIVE">غیرفعال</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">آدرس</Label>
                <textarea 
                  id="address" 
                  {...register('address')} 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <Label htmlFor="notes">یادداشت‌ها</Label>
                <textarea 
                  id="notes" 
                  {...register('notes')} 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={closeForm}>
                  انصراف
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'در حال ذخیره...' : editingCustomer ? 'بروزرسانی' : 'ذخیره'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Customers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{customer.name}</h3>
                  {customer.contactPerson && (
                    <p className="text-sm text-gray-600">{customer.contactPerson}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Badge className={getStatusColor(customer.status)}>
                    {getStatusLabel(customer.status)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                
                {customer.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{customer.city}</span>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <div className="flex justify-between text-xs">
                    <span>نوع: {getCustomerTypeLabel(customer.customerType)}</span>
                    <span>حد اعتبار: {customer.creditLimit.toLocaleString()} ریال</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span>موجودی: {customer.currentBalance.toLocaleString()} ریال</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openForm(customer)}
                  className="flex items-center gap-1"
                >
                  <Pencil className="h-3 w-3" />
                  ویرایش
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(customer.id)}
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

      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">هیچ مشتری‌ای یافت نشد.</p>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}