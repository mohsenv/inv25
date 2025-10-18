"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PersianDateField } from "@/components/ui/persian-date-picker";
import { persianText, validateNationalCode, formatPersianDate, parsePersianDate, formatPersianDateString, gregorianToJalaali, jalaaliToGregorian, isPersianLeapYear } from "@/lib/persian";

const companySchema = z.object({
  name: z.string().min(1, persianText.required).max(200, "نام شرکت نباید بیش از ۲۰۰ کاراکتر باشد"),
  nationalCode: z.string().optional().refine((val) => {
    if (!val) return true;
    return validateNationalCode(val);
  }, { message: persianText.invalidNationalCode }),
  address: z.string().optional().refine((val) => {
    if (!val) return true;
    return val.length <= 500;
  }, { message: "آدرس نباید بیش از ۵۰۰ کاراکتر باشد" }),
  phone: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^[0-9+\-\s()]+$/.test(val);
  }, { message: "شماره تلفن صحیح نیست" }),
  email: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }, { message: "ایمیل صحیح نیست" }),
  financialYearStart: z.instanceof(Date, {
    message: "تاریخ شروع سال مالی الزامی است"
  }),
  financialYearEnd: z.instanceof(Date, {
    message: "تاریخ پایان سال مالی الزامی است"
  }),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanySettingsFormProps {
  onSubmit: (data: CompanyFormData) => void;
  initialData?: Partial<CompanyFormData>;
  isLoading?: boolean;
}

export function CompanySettingsForm({ onSubmit, initialData, isLoading }: CompanySettingsFormProps) {
  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: initialData?.name || "",
      nationalCode: initialData?.nationalCode || "",
      address: initialData?.address || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      financialYearStart: initialData?.financialYearStart || undefined,
      financialYearEnd: initialData?.financialYearEnd || undefined,
    },
  });

  const handleSubmit = (data: CompanyFormData) => {
    // Debug logging to see what's being submitted
    console.log('=== Company Form Submission ===');
    console.log('Financial Year Start:', {
      date: data.financialYearStart,
      persianString: formatPersianDateString(data.financialYearStart),
      gregorianISO: data.financialYearStart.toISOString(),
      gregorianDate: data.financialYearStart.toDateString()
    });
    console.log('Financial Year End:', {
      date: data.financialYearEnd,
      persianString: formatPersianDateString(data.financialYearEnd),
      gregorianISO: data.financialYearEnd.toISOString(),
      gregorianDate: data.financialYearEnd.toDateString()
    });
    
    // Data now contains Date objects for the date fields
    onSubmit(data);
  };

  // Helper function to set Persian fiscal year dates
  const setPersianFiscalYear = (yearOffset: number = 0) => {
    const currentDate = new Date();
    const currentPersianDate = gregorianToJalaali(currentDate);
    const currentPersianYear = currentPersianDate.jy + yearOffset;
    
    // Persian fiscal year: 1 Farvardin to 29/30 Esfand
    const startDate = jalaaliToGregorian(currentPersianYear, 1, 1); // 1 Farvardin
    const lastDayOfEsfand = isPersianLeapYear(currentPersianYear) ? 30 : 29;
    const endDate = jalaaliToGregorian(currentPersianYear, 12, lastDayOfEsfand); // 29/30 Esfand
    
    // Debug logging
    console.log(`=== Setting Persian Fiscal Year ===`);
    console.log(`Current Gregorian date: ${currentDate.toISOString()}`);
    console.log(`Current Persian date: ${currentPersianDate.jy}/${currentPersianDate.jm}/${currentPersianDate.jd}`);
    console.log(`Year offset: ${yearOffset}`);
    console.log(`Target Persian year: ${currentPersianYear}`);
    console.log(`Is ${currentPersianYear} leap year: ${isPersianLeapYear(currentPersianYear)}`);
    console.log(`Last day of Esfand: ${lastDayOfEsfand}`);
    console.log(`Start date: ${formatPersianDateString(startDate)} (${startDate.toISOString()})`);
    console.log(`End date: ${formatPersianDateString(endDate)} (${endDate.toISOString()})`);
    
    form.setValue("financialYearStart", startDate);
    form.setValue("financialYearEnd", endDate);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          تنظیمات شرکت و سال مالی
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Company Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                اطلاعات شرکت
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام شرکت *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="نام شرکت را وارد کنید"
                          className="text-right"
                          {...field} 
                        />
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
                      <FormLabel>شناسه ملی / کد ملی</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="۱۰ یا ۱۱ رقم"
                          className="ltr-content"
                          maxLength={11}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>آدرس</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="آدرس کامل شرکت"
                        className="text-right"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شماره تلفن</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="۰۲۱-۱۲۳۴۵۶۷۸"
                          className="ltr-content"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ایمیل</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="info@company.com"
                          className="ltr-content"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Financial Year Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                تنظیمات سال مالی
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="financialYearStart"
                  render={({ field }) => (
                    <FormItem>
                      <PersianDateField
                        label="تاریخ شروع سال مالی *"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="انتخاب تاریخ شروع"
                        required
                        helperText="معمولاً ۱ فروردین"
                        error={form.formState.errors.financialYearStart?.message}
                      />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="financialYearEnd"
                  render={({ field }) => (
                    <FormItem>
                      <PersianDateField
                        label="تاریخ پایان سال مالی *"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="انتخاب تاریخ پایان"
                        required
                        helperText="معمولاً ۳۰ اسفند (در سال کبیسه) یا ۲۹ اسفند (در سال عادی)"
                        error={form.formState.errors.financialYearEnd?.message}
                      />
                    </FormItem>
                  )}
                />
              </div>

              {/* Quick Date Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPersianFiscalYear(-1)}
                >
                  سال مالی قبل (۱۴۰۳)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPersianFiscalYear(0)}
                >
                  سال مالی جاری (۱۴۰۴)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPersianFiscalYear(1)}
                >
                  سال مالی آینده (۱۴۰۵)
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <Button 
                type="submit" 
                className="w-full md:w-auto min-w-32"
                disabled={isLoading}
              >
                {isLoading ? "در حال ذخیره..." : "ذخیره تنظیمات"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}