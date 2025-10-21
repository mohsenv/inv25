"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Building2, 
  Package, 
  Truck, 
  Users, 
  ShoppingCart, 
  BarChart3,
  Settings,
  Home,
  FileText,
  Calculator,
  Calendar,
  Bug
} from "lucide-react";

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
}

const navigationItems: NavigationItem[] = [
  {
    title: "داشبورد",
    href: "/",
    icon: <Home className="h-5 w-5" />,
    description: "نمای کلی سیستم"
  },
    {
    title: "آزمایش دیتابیس",
    href: "/debug",
    icon: <Bug className="h-5 w-5" />,
    description: "آزمایش اتصال MongoDB و GraphQL"
  },
  {
    title: "تنظیمات شرکت",
    href: "/company",
    icon: <Building2 className="h-5 w-5" />,
    description: "اطلاعات شرکت و سال مالی"
  },
  {
    title: "مدیریت کالاها",
    href: "/products",
    icon: <Package className="h-5 w-5" />,
    description: "ثبت و مدیریت محصولات"
  },
  {
    title: "تامین کنندگان",
    href: "/suppliers",
    icon: <Truck className="h-5 w-5" />,
    description: "مدیریت تامین کنندگان"
  },
  {
    title: "مشتریان",
    href: "/customers",
    icon: <Users className="h-5 w-5" />,
    description: "مدیریت مشتریان"
  },
  {
    title: "خرید کالا",
    href: "/purchases",
    icon: <ShoppingCart className="h-5 w-5" />,
    description: "ثبت خرید و فاکتورها"
  },
  {
    title: "موجودی اولیه",
    href: "/initial-stock",
    icon: <Calculator className="h-5 w-5" />,
    description: "ثبت موجودی اولیه کالاها"
  },
  {
    title: "اسناد و فاکتورها",
    href: "/documents",
    icon: <FileText className="h-5 w-5" />,
    description: "مشاهده تمام اسناد"
  },
  {
    title: "گزارشات",
    href: "/reports",
    icon: <BarChart3 className="h-5 w-5" />,
    description: "گزارشات موجودی و قیمت میانگین"
  }
];

export function MainNavigation() {
  const pathname = usePathname();

  return (
    <div className="w-full">
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <div className="flex flex-wrap gap-2 p-4 bg-background border-b">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "default" : "ghost"}
                className="flex items-center gap-2 h-auto p-3"
              >
                {item.icon}
                <span>{item.title}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="block md:hidden">
        <div className="grid grid-cols-2 gap-3 p-4">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className={`p-4 hover:bg-accent transition-colors ${
                pathname === item.href ? "bg-primary text-primary-foreground" : ""
              }`}>
                <div className="flex flex-col items-center gap-2">
                  {item.icon}
                  <span className="text-sm font-medium text-center">
                    {item.title}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SidebarNavigation() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-card border-l h-screen overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">منوی اصلی</h2>
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 p-3 rounded-md transition-colors hover:bg-accent ${
                pathname === item.href ? "bg-primary text-primary-foreground" : ""
              }`}>
                {item.icon}
                <div>
                  <div className="font-medium">{item.title}</div>
                  {item.description && (
                    <div className="text-sm opacity-70">{item.description}</div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}