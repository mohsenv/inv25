"use client";

import { useState, useEffect } from "react";
import { CompanySettingsForm } from "@/components/company/CompanySettingsForm";
import { MainNavigation } from "@/components/navigation/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle } from "lucide-react";
import { persianText, formatPersianDate, formatPersianDateString } from "@/lib/persian";
import { apolloClient } from "@/lib/apollo-client";
import { CREATE_OR_UPDATE_COMPANY, GET_COMPANY } from "@/graphql/mutations/company";

export default function CompanyPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [companyLoading, setCompanyLoading] = useState(false);

  // Load company data on component mount
  useEffect(() => {
    const loadCompanyData = async () => {
      setCompanyLoading(true);
      try {
        const result = await apolloClient.query({
          query: GET_COMPANY,
          fetchPolicy: 'cache-first'
        });
        
        if (result.data && (result.data as any).getCompany) {
          // Convert timestamps back to Date objects
          const company = (result.data as any).getCompany;
          setCompanyData({
            ...company,
            financialYearStart: company.financialYearStart ? new Date(company.financialYearStart) : null,
            financialYearEnd: company.financialYearEnd ? new Date(company.financialYearEnd) : null,
          });
        }
      } catch (err: any) {
        console.error('Error loading company data:', err);
      } finally {
        setCompanyLoading(false);
      }
    };

    loadCompanyData();
  }, []);

  const handleCompanySubmit = async (data: any) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log('Submitting company data:', data);
      
      // Convert Date objects to timestamps for GraphQL
      const input = {
        name: data.name,
        nationalCode: data.nationalCode || null,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
        financialYearStart: data.financialYearStart.getTime(), // Convert to timestamp
        financialYearEnd: data.financialYearEnd.getTime(), // Convert to timestamp
      };
      
      console.log('GraphQL input:', input);
      
      const result = await apolloClient.mutate({
        mutation: CREATE_OR_UPDATE_COMPANY,
        variables: { input }
      });
      
      console.log('GraphQL result:', result);
      
      if (result.data && (result.data as any).createOrUpdateCompany) {
        const savedCompany = (result.data as any).createOrUpdateCompany;
        // Update local state with saved data
        setCompanyData({
          ...savedCompany,
          financialYearStart: new Date(savedCompany.financialYearStart),
          financialYearEnd: new Date(savedCompany.financialYearEnd),
        });
        setSuccess("تنظیمات شرکت با موفقیت ذخیره شد");
      } else {
        throw new Error('خطا در ذخیره اطلاعات');
      }
    } catch (err: any) {
      console.error('Error submitting company data:', err);
      
      let errorMessage = "خطا در ذخیره تنظیمات شرکت";
      
      // Check if it's a network error (MongoDB connection issue)
      if (err.networkError || err.message?.includes('ECONNREFUSED') || err.message?.includes('connect')) {
        errorMessage = "خطا در اتصال به دیتابیس. لطفاً MongoDB را بررسی کنید.";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">تنظیمات شرکت</h1>
          <p className="text-muted-foreground">
            اطلاعات شرکت و دوره مالی خود را تنظیم کنید
          </p>
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

        {/* Current Company Info (if exists) */}
        {companyLoading && (
          <Card>
            <CardContent className="p-4">
              <p className="text-center text-muted-foreground">در حال بارگذاری اطلاعات شرکت...</p>
            </CardContent>
          </Card>
        )}
        
        {companyData && !companyLoading && (
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات شرکت فعلی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">نام شرکت: </span>
                  <span>{companyData.name}</span>
                </div>
                {companyData.nationalCode && (
                  <div>
                    <span className="font-medium">شناسه ملی: </span>
                    <span className="ltr-content">{companyData.nationalCode}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">شروع سال مالی: </span>
                  <span>{companyData.financialYearStart ? formatPersianDateString(companyData.financialYearStart) : '-'}</span>
                </div>
                <div>
                  <span className="font-medium">پایان سال مالی: </span>
                  <span>{companyData.financialYearEnd ? formatPersianDateString(companyData.financialYearEnd) : '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Company Settings Form */}
        <CompanySettingsForm
          onSubmit={handleCompanySubmit}
          initialData={companyData}
          isLoading={isLoading || companyLoading}
        />

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">درباره سال مالی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                سال مالی دوره‌ای است که در آن تمام معاملات مالی و حسابداری شرکت ثبت می‌شود.
              </p>
              <p className="text-sm text-muted-foreground">
                معمولاً در ایران سال مالی از ۱ فروردین شروع و در ۲۹ اسفند پایان می‌یابد.
              </p>
              <p className="text-sm text-muted-foreground">
                تنظیم صحیح سال مالی برای محاسبه قیمت میانگین و گزارش‌گیری دقیق ضروری است.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">نکات مهم</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• پس از تنظیم سال مالی، تمام محاسبات بر اساس این دوره انجام می‌شود</li>
                <li>• شناسه ملی شرکت برای صدور فاکتور الکترونیک ضروری است</li>
                <li>• اطلاعات شرکت در تمام گزارشات و اسناد نمایش داده می‌شود</li>
                <li>• تغییر سال مالی بر روی گزارشات قبلی تأثیر نمی‌گذارد</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}