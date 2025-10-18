import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MainNavigation } from "@/components/navigation/Navigation";
import { formatPersianNumber, formatPersianDate, persianText } from "@/lib/persian";
import Link from "next/link";
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Users,
  BarChart3,
  FileText,
  Building2,
  Calculator
} from "lucide-react";

export default function Home() {
  const currentDate = new Date();
  
  return (
    <div className="min-h-screen bg-background">
      <MainNavigation />
      
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">
            سیستم مدیریت انبار
          </h1>
          <p className="text-muted-foreground">
            سیستم جامع مدیریت انبار با قابلیت محاسبه قیمت میانگین
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {persianText.date}: {formatPersianDate(currentDate)}
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                تعداد کل کالاها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPersianNumber(1250)}
              </div>
              <p className="text-xs text-muted-foreground">
                قلم کالا
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                ارزش کل انبار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPersianNumber(15750000)}
              </div>
              <p className="text-xs text-muted-foreground">
                ریال
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                خریدهای امروز
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPersianNumber(45)}
              </div>
              <p className="text-xs text-muted-foreground">
                فاکتور
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                فروش امروز
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPersianNumber(2850000)}
              </div>
              <p className="text-xs text-muted-foreground">
                ریال
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/company">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  تنظیمات شرکت
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  اطلاعات شرکت و سال مالی را تنظیم کنید
                </p>
                <Button size="sm" className="w-full">
                  باز کردن
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/products">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  مدیریت کالاها
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  افزودن و مدیریت محصولات
                </p>
                <Button size="sm" className="w-full">
                  مدیریت کالاها
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/initial-stock">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  موجودی اولیه
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  ثبت موجودی اولیه کالاها
                </p>
                <Button size="sm" className="w-full">
                  ثبت موجودی
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/purchases">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  خرید کالا
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  ثبت خرید و فاکتورها
                </p>
                <Button size="sm" className="w-full">
                  ثبت خرید
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/suppliers">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  تامین کنندگان
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  مدیریت تامین کنندگان
                </p>
                <Button size="sm" className="w-full">
                  مدیریت
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reports">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  گزارشات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  گزارشات موجودی و قیمت میانگین
                </p>
                <Button size="sm" className="w-full">
                  مشاهده گزارشات
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
