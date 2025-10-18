import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

enum DocumentType {
  PURCHASE_INVOICE = 'PURCHASE_INVOICE',
  SALE_INVOICE = 'SALE_INVOICE',
  STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT',
  INITIAL_STOCK = 'INITIAL_STOCK'
}

interface IDocumentItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

interface IDocument extends MongooseDocument {
  documentType: DocumentType;
  documentNumber: string;
  supplier?: mongoose.Types.ObjectId;
  customer?: mongoose.Types.ObjectId;
  items: IDocumentItem[];
  totalAmount: number;
  description?: string;
  date: Date;
  isFinalized: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentItemSchema: Schema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'کالا الزامی است']
  },
  quantity: {
    type: Number,
    required: [true, 'تعداد الزامی است'],
    min: [0.001, 'تعداد باید بیشتر از صفر باشد']
  },
  unitPrice: {
    type: Number,
    required: [true, 'قیمت واحد الزامی است'],
    min: [0, 'قیمت واحد نمی‌تواند منفی باشد']
  },
  totalPrice: {
    type: Number,
    required: [true, 'مبلغ کل الزامی است'],
    min: [0, 'مبلغ کل نمی‌تواند منفی باشد']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'توضیحات نباید بیش از ۵۰۰ کاراکتر باشد']
  }
});

const DocumentSchema: Schema = new Schema(
  {
    documentType: {
      type: String,
      required: [true, 'نوع سند الزامی است'],
      enum: {
        values: Object.values(DocumentType),
        message: 'نوع سند معتبر نیست'
      }
    },
    documentNumber: {
      type: String,
      required: [true, 'شماره سند الزامی است'],
      trim: true,
      maxlength: [50, 'شماره سند نباید بیش از ۵۰ کاراکتر باشد']
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      validate: {
        validator: function(this: IDocument, v: mongoose.Types.ObjectId) {
          // Supplier is required for purchase invoices
          if (this.documentType === DocumentType.PURCHASE_INVOICE) {
            return !!v;
          }
          return true;
        },
        message: 'تامین کننده برای فاکتور خرید الزامی است'
      }
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      validate: {
        validator: function(this: IDocument, v: mongoose.Types.ObjectId) {
          // Customer is required for sale invoices
          if (this.documentType === DocumentType.SALE_INVOICE) {
            return !!v;
          }
          return true;
        },
        message: 'مشتری برای فاکتور فروش الزامی است'
      }
    },
    items: {
      type: [DocumentItemSchema],
      required: [true, 'اقلام سند الزامی است'],
      validate: {
        validator: function(v: IDocumentItem[]) {
          return v && v.length > 0;
        },
        message: 'حداقل یک قلم کالا در سند الزامی است'
      }
    },
    totalAmount: {
      type: Number,
      required: [true, 'مبلغ کل سند الزامی است'],
      min: [0, 'مبلغ کل نمی‌تواند منفی باشد']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'توضیحات نباید بیش از ۱۰۰۰ کاراکتر باشد']
    },
    date: {
      type: Date,
      required: [true, 'تاریخ سند الزامی است'],
      default: Date.now
    },
    isFinalized: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Pre-save middleware to calculate total amount
DocumentSchema.pre('save', function(this: IDocument, next) {
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }
  next();
});

// Pre-save middleware to calculate item total prices
DocumentSchema.pre('save', function(this: IDocument, next) {
  if (this.items && this.items.length > 0) {
    this.items.forEach(item => {
      item.totalPrice = item.quantity * item.unitPrice;
    });
  }
  next();
});

// Indexes for better query performance
DocumentSchema.index({ documentType: 1 });
DocumentSchema.index({ date: -1 });
DocumentSchema.index({ isFinalized: 1 });
DocumentSchema.index({ supplier: 1 });
DocumentSchema.index({ customer: 1 });
DocumentSchema.index({ documentNumber: 1, documentType: 1 }, { unique: true }); // Ensure unique document numbers per type

export const Document = mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);