import mongoose, { Schema, Document } from 'mongoose';

interface ICustomer extends Document {
  name: string;
  contactPerson?: string;
  nationalCode?: string;
  economicCode?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  creditLimit: number;
  currentBalance: number;
  customerType: 'RETAIL' | 'WHOLESALE' | 'CORPORATE';
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'نام مشتری الزامی است'],
      trim: true,
      maxlength: [200, 'نام مشتری نباید بیش از ۲۰۰ کاراکتر باشد']
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: [200, 'نام شخص تماس نباید بیش از ۲۰۰ کاراکتر باشد']
    },
    nationalCode: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          // Persian national code validation (10 or 11 digits)
          return /^[0-9]{10,11}$/.test(v);
        },
        message: 'کد ملی یا شناسه ملی صحیح نیست'
      }
    },
    economicCode: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          // Persian economic code validation (12 digits)
          return /^[0-9]{12}$/.test(v);
        },
        message: 'کد اقتصادی صحیح نیست (۱۲ رقم)'
      }
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'آدرس نباید بیش از ۵۰۰ کاراکتر باشد']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'نام شهر نباید بیش از ۱۰۰ کاراکتر باشد']
    },
    postalCode: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          return /^[0-9]{10}$/.test(v); // Persian postal code (10 digits)
        },
        message: 'کد پستی صحیح نیست (۱۰ رقم)'
      }
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          return /^[0-9+\-\s()]+$/.test(v);
        },
        message: 'شماره تلفن صحیح نیست'
      }
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'ایمیل صحیح نیست'
      }
    },
    taxNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'شماره مالیاتی نباید بیش از ۵۰ کاراکتر باشد']
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: [0, 'حد اعتبار نمی‌تواند منفی باشد']
    },
    currentBalance: {
      type: Number,
      default: 0
    },
    customerType: {
      type: String,
      enum: {
        values: ['RETAIL', 'WHOLESALE', 'CORPORATE'],
        message: 'نوع مشتری معتبر نیست'
      },
      default: 'RETAIL'
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE'],
        message: 'وضعیت معتبر نیست'
      },
      default: 'ACTIVE'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'یادداشت‌ها نباید بیش از ۱۰۰۰ کاراکتر باشد']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
CustomerSchema.index({ name: 'text', nationalCode: 'text', economicCode: 'text' });
CustomerSchema.index({ isActive: 1 });
CustomerSchema.index({ nationalCode: 1 }, { sparse: true });
CustomerSchema.index({ economicCode: 1 }, { sparse: true });

export const Customer = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);