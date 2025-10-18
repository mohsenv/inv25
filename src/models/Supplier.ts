import mongoose, { Schema, Document } from 'mongoose';

interface ISupplier extends Document {
  name: string;
  nationalCode?: string;
  economicCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'نام تامین کننده الزامی است'],
      trim: true,
      maxlength: [200, 'نام تامین کننده نباید بیش از ۲۰۰ کاراکتر باشد']
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
SupplierSchema.index({ name: 'text', nationalCode: 'text', economicCode: 'text' });
SupplierSchema.index({ isActive: 1 });
SupplierSchema.index({ nationalCode: 1 }, { sparse: true });
SupplierSchema.index({ economicCode: 1 }, { sparse: true });

export const Supplier = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);