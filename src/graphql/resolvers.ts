import { GraphQLScalarType, Kind } from 'graphql';
import dbConnect from '@/lib/mongodb';

// Import all models to ensure they are registered with Mongoose
import { Company } from '@/models/Company';
import { Product } from '@/models/Product';
import { Supplier } from '@/models/Supplier';
import { Customer } from '@/models/Customer';
import { Document } from '@/models/Document';
import { InventoryMovement } from '@/models/InventoryMovement';

// Ensure all models are registered by accessing them
const ensureModelsRegistered = () => {
  // This ensures all models are loaded and registered with Mongoose
  Company;
  Product;
  Supplier;
  Customer;
  Document;
  InventoryMovement;
};

// Helper function to process document items safely
const processDocumentItem = (item: any) => {
  const itemObject = item.toObject ? item.toObject() : item;
  // Create a new object without the _id field to avoid conflict with id field
  const { _id, ...itemWithoutId } = itemObject;
  
  // Handle product safely - create a placeholder if product is null
  let product = {
    id: "unknown",
    name: "کالای حذف شده",
    code: "DELETED",
    unit: "عدد",
    isActive: false
  };
  
  if (item.product) {
    const productObject = item.product.toObject ? item.product.toObject() : item.product;
    const productId = item.product._id ? item.product._id.toString() : item.product.id;
    product = {
      id: productId,
      ...productObject
    };
  }
  
  // Ensure totalPrice is always calculated and not null
  const quantity = item.quantity || 0;
  const unitPrice = item.unitPrice || 0;
  const totalPrice = item.totalPrice || (quantity * unitPrice);
  
  return {
    id: item._id.toString(),
    ...itemWithoutId,
    quantity: quantity,
    unitPrice: unitPrice,
    totalPrice: totalPrice,
    product: product
  };
};

// Custom Date scalar
const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value: unknown) {
    if (value instanceof Date) {
      return value.getTime(); // Convert outgoing Date to integer for JSON
    }
    throw Error('GraphQL Date Scalar serializer expected a `Date` object');
  },
  parseValue(value: unknown) {
    if (typeof value === 'number') {
      return new Date(value); // Convert incoming integer to Date
    }
    throw new Error('GraphQL Date Scalar parser expected a `number`');
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10)); // Convert hard-coded AST string to integer and then to Date
    }
    return null; // Invalid hard-coded value (not an integer)
  },
});

export const resolvers = {
  Date: DateScalar,

  Query: {
    // Company queries
    getCompany: async () => {
      await dbConnect();
      const company = await Company.findOne({ isActive: true });
      if (!company) return null;
      return {
        id: company._id.toString(),
        ...company.toObject()
      };
    },

    // Product queries
    getProducts: async (
      _: any,
      { search, category, isActive }: { search?: string; category?: string; isActive?: boolean }
    ) => {
      await dbConnect();
      const filter: any = {};
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (category) {
        filter.category = category;
      }
      
      if (isActive !== undefined) {
        filter.isActive = isActive;
      }
      
      const products = await Product.find(filter).sort({ name: 1 });
      return products.map(product => ({
        id: product._id.toString(),
        ...product.toObject()
      }));
    },

    getProduct: async (_: any, { id }: { id: string }) => {
      await dbConnect();
      const product = await Product.findById(id);
      if (!product) return null;
      return {
        id: product._id.toString(),
        ...product.toObject()
      };
    },

    // Supplier queries
    getSuppliers: async (
      _: any,
      { search, isActive }: { search?: string; isActive?: boolean }
    ) => {
      await dbConnect();
      const filter: any = {};
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { nationalCode: { $regex: search, $options: 'i' } },
          { economicCode: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (isActive !== undefined) {
        filter.isActive = isActive;
      }
      
      const suppliers = await Supplier.find(filter).sort({ name: 1 });
      return suppliers.map(supplier => ({
        id: supplier._id.toString(),
        ...supplier.toObject()
      }));
    },

    getSupplier: async (_: any, { id }: { id: string }) => {
      await dbConnect();
      const supplier = await Supplier.findById(id);
      if (!supplier) return null;
      return {
        id: supplier._id.toString(),
        ...supplier.toObject()
      };
    },

    // Customer queries
    getCustomers: async (
      _: any,
      { search, isActive }: { search?: string; isActive?: boolean }
    ) => {
      await dbConnect();
      const filter: any = {};
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { nationalCode: { $regex: search, $options: 'i' } },
          { economicCode: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (isActive !== undefined) {
        filter.isActive = isActive;
      }
      
      const customers = await Customer.find(filter).sort({ name: 1 });
      
      // Ensure all customers have default values for required enum fields
      const processedCustomers = customers.map(customer => ({
        id: customer._id.toString(), // Map _id to id
        ...customer.toObject(),
        customerType: customer.customerType || 'RETAIL',
        status: customer.status || 'ACTIVE',
        creditLimit: customer.creditLimit || 0,
        currentBalance: customer.currentBalance || 0
      }));
      
      return processedCustomers;
    },

    getCustomer: async (_: any, { id }: { id: string }) => {
      await dbConnect();
      const customer = await Customer.findById(id);
      
      if (!customer) return null;
      
      // Ensure customer has default values for required enum fields
      return {
        id: customer._id.toString(), // Map _id to id
        ...customer.toObject(),
        customerType: customer.customerType || 'RETAIL',
        status: customer.status || 'ACTIVE',
        creditLimit: customer.creditLimit || 0,
        currentBalance: customer.currentBalance || 0
      };
    },

    // Dashboard stats
    getDashboardStats: async () => {
      await dbConnect();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get total products
      const totalProducts = await Product.countDocuments({ isActive: true });

      // Get today's purchases (count of purchase documents)
      const todayPurchases = await Document.countDocuments({
        documentType: 'PURCHASE_INVOICE',
        date: { $gte: today, $lt: tomorrow },
        isFinalized: true
      });

      // Get today's sales (total amount)
      const todaySalesAgg = await Document.aggregate([
        {
          $match: {
            documentType: 'SALE_INVOICE',
            date: { $gte: today, $lt: tomorrow },
            isFinalized: true
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]);
      const todaySales = todaySalesAgg.length > 0 ? todaySalesAgg[0].total : 0;

      // Calculate total inventory value and low stock products
      // This would require more complex aggregation with inventory movements
      // For now, we'll return placeholder values
      const totalInventoryValue = 15750000; // This should be calculated from actual inventory
      const lowStockProducts = 5; // This should be calculated based on minimum stock levels

      return {
        totalProducts,
        totalInventoryValue,
        todayPurchases,
        todaySales,
        lowStockProducts
      };
    },

    // Document queries
    getDocuments: async (
      _: any,
      { documentType, dateFrom, dateTo, supplierId, customerId, isFinalized }: {
        documentType?: string;
        dateFrom?: number;
        dateTo?: number;
        supplierId?: string;
        customerId?: string;
        isFinalized?: boolean;
      }
    ) => {
      await dbConnect();
      
      // Ensure all models are registered
      ensureModelsRegistered();
      const filter: any = {};
      
      if (documentType) {
        filter.documentType = documentType;
      }
      
      if (dateFrom || dateTo) {
        filter.date = {};
        if (dateFrom) filter.date.$gte = new Date(dateFrom);
        if (dateTo) filter.date.$lte = new Date(dateTo);
      }
      
      if (supplierId) {
        filter.supplier = supplierId;
      }
      
      if (customerId) {
        filter.customer = customerId;
      }
      
      if (isFinalized !== undefined) {
        filter.isFinalized = isFinalized;
      }
      
      const documents = await Document.find(filter)
        .populate('supplier')
        .populate('customer')
        .populate('items.product')
        .sort({ date: -1 });
      
      const result = documents.map(doc => {
        const docObject = doc.toObject();
        const processedDoc = {
          id: doc._id.toString(),
          ...docObject,
          supplier: doc.supplier && doc.supplier._id ? {
            id: doc.supplier._id.toString(),
            ...doc.supplier.toObject()
          } : null,
          customer: doc.customer ? {
            id: doc.customer._id.toString(),
            ...doc.customer.toObject()
          } : null,
          items: doc.items.map(processDocumentItem)
        };
        return processedDoc;
      });
      
      return result;
    },

    getDocument: async (_: any, { id }: { id: string }) => {
      await dbConnect();
      const document = await Document.findById(id)
        .populate('supplier')
        .populate('customer')
        .populate('items.product');
      if (!document) return null;
      const docObject = document.toObject();
      return {
        id: document._id.toString(),
        ...docObject,
        supplier: document.supplier && document.supplier._id ? {
          id: document.supplier._id.toString(),
          ...document.supplier.toObject()
        } : null,
        customer: document.customer ? {
          id: document.customer._id.toString(),
          ...document.customer.toObject()
        } : null,
        items: document.items.map(processDocumentItem)
      };
    },

    // Inventory queries
    getInventoryMovements: async (
      _: any,
      { productId, movementType, dateFrom, dateTo }: {
        productId?: string;
        movementType?: string;
        dateFrom?: number;
        dateTo?: number;
      }
    ) => {
      await dbConnect();
      const filter: any = {};
      
      if (productId) {
        filter.product = productId;
      }
      
      if (movementType) {
        filter.movementType = movementType;
      }
      
      if (dateFrom || dateTo) {
        filter.date = {};
        if (dateFrom) filter.date.$gte = new Date(dateFrom);
        if (dateTo) filter.date.$lte = new Date(dateTo);
      }
      
      const movements = await InventoryMovement.find(filter)
        .populate('product')
        .populate('document')
        .sort({ date: -1 });
      
      return movements;
    },
  },

  Mutation: {
    // Company mutations
    createOrUpdateCompany: async (_: any, { input }: { input: any }) => {
      await dbConnect();
      
      // Debug logging to see what data is received
      console.log('=== GraphQL createOrUpdateCompany received ===');
      console.log('Input:', JSON.stringify(input, null, 2));
      console.log('financialYearStart type:', typeof input.financialYearStart);
      console.log('financialYearEnd type:', typeof input.financialYearEnd);
      console.log('financialYearStart:', input.financialYearStart);
      console.log('financialYearEnd:', input.financialYearEnd);
      
      if (input.financialYearStart instanceof Date) {
        console.log('financialYearStart as Date:', input.financialYearStart.toISOString());
      }
      if (input.financialYearEnd instanceof Date) {
        console.log('financialYearEnd as Date:', input.financialYearEnd.toISOString());
      }
      
      // Deactivate existing company
      await Company.updateMany({}, { isActive: false });
      
      const company = await Company.create({
        ...input,
        isActive: true
      });
      
      console.log('=== Company created in database ===');
      console.log('Saved company:', JSON.stringify(company.toObject(), null, 2));
      
      return company;
    },

    // Product mutations
    createProduct: async (_: any, { input }: { input: any }) => {
      await dbConnect();
      
      // Check if product code already exists
      const existingProduct = await Product.findOne({ code: input.code, isActive: true });
      if (existingProduct) {
        throw new Error('کد کالا قبلاً ثبت شده است');
      }
      
      const product = await Product.create({
        ...input,
        isActive: true
      });
      
      return {
        id: product._id.toString(),
        ...product.toObject()
      };
    },

    updateProduct: async (_: any, { id, input }: { id: string; input: any }) => {
      await dbConnect();
      
      // Check if product code already exists for other products
      const existingProduct = await Product.findOne({ 
        code: input.code, 
        isActive: true,
        _id: { $ne: id }
      });
      if (existingProduct) {
        throw new Error('کد کالا قبلاً ثبت شده است');
      }
      
      const product = await Product.findByIdAndUpdate(
        id,
        { ...input, updatedAt: new Date() },
        { new: true }
      );
      
      if (!product) {
        throw new Error('کالا یافت نشد');
      }
      
      return product;
    },

    deleteProduct: async (_: any, { id }: { id: string }) => {
      await dbConnect();
      
      // Soft delete by setting isActive to false
      const product = await Product.findByIdAndUpdate(
        id,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );
      
      return !!product;
    },

    // Supplier mutations
    createSupplier: async (_: any, { input }: { input: any }) => {
      await dbConnect();
      
      const supplier = await Supplier.create({
        ...input,
        isActive: true
      });
      
      return {
        id: supplier._id.toString(),
        ...supplier.toObject()
      };
    },

    updateSupplier: async (_: any, { id, input }: { id: string; input: any }) => {
      await dbConnect();
      
      const supplier = await Supplier.findByIdAndUpdate(
        id,
        { ...input, updatedAt: new Date() },
        { new: true }
      );
      
      if (!supplier) {
        throw new Error('تامین کننده یافت نشد');
      }
      
      return {
        id: supplier._id.toString(),
        ...supplier.toObject()
      };
    },

    deleteSupplier: async (_: any, { id }: { id: string }) => {
      await dbConnect();
      
      const supplier = await Supplier.findByIdAndUpdate(
        id,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );
      
      return !!supplier;
    },

    // Customer mutations
    createCustomer: async (_: any, { input }: { input: any }) => {
      await dbConnect();
      
      console.log('=== GraphQL createCustomer received ===');
      console.log('Input:', JSON.stringify(input, null, 2));
      
      try {
        // Input validation
        if (!input.name || !input.name.trim()) {
          throw new Error('نام مشتری الزامی است');
        }
        
        // Check for duplicate phone number only if phone is provided
        if (input.phone?.trim()) {
          const existingCustomer = await Customer.findOne({ 
            phone: input.phone.trim(), 
            isActive: true 
          });
          if (existingCustomer) {
            throw new Error('مشتری با این شماره تلفن قبلاً ثبت شده است');
          }
        }
        
        // Prepare customer data with defaults
        const customerData = {
          name: input.name.trim(),
          contactPerson: input.contactPerson?.trim() || undefined,
          nationalCode: input.nationalCode?.trim() || undefined,
          economicCode: input.economicCode?.trim() || undefined,
          address: input.address?.trim() || undefined,
          city: input.city?.trim() || undefined,
          postalCode: input.postalCode?.trim() || undefined,
          phone: input.phone?.trim() || undefined,
          email: input.email?.trim() || undefined,
          taxNumber: input.taxNumber?.trim() || undefined,
          creditLimit: input.creditLimit || 0,
          currentBalance: input.currentBalance || 0,
          customerType: input.customerType || 'RETAIL',
          status: input.status || 'ACTIVE',
          notes: input.notes?.trim() || undefined,
          isActive: true
        };
        
        console.log('✅ Creating customer with data:', customerData);
        
        const customer = await Customer.create(customerData);
        
        console.log('✅ Customer created successfully with ID:', customer._id);
        return {
          id: customer._id.toString(),
          ...customer.toObject()
        };
        
      } catch (error: any) {
        console.error('❌ Error creating customer:', error);
        
        // Provide specific error messages
        if (error.name === 'ValidationError') {
          const validationErrors = Object.values(error.errors).map((err: any) => err.message);
          throw new Error(`خطا در اعتبارسنجی: ${validationErrors.join(', ')}`);
        }
        
        if (error.code === 11000) {
          throw new Error('مشتری با این اطلاعات قبلاً ثبت شده است');
        }
        
        throw new Error(`خطا در ایجاد مشتری: ${error.message}`);
      }
    },

    updateCustomer: async (_: any, { id, input }: { id: string; input: any }) => {
      await dbConnect();
      
      const customer = await Customer.findByIdAndUpdate(
        id,
        { ...input, updatedAt: new Date() },
        { new: true }
      );
      
      if (!customer) {
        throw new Error('مشتری یافت نشد');
      }
      
      return {
        id: customer._id.toString(),
        ...customer.toObject()
      };
    },

    deleteCustomer: async (_: any, { id }: { id: string }) => {
      await dbConnect();
      
      console.log('=== GraphQL deleteCustomer called ===');
      console.log('Customer ID to delete:', id);
      
      try {
        const customer = await Customer.findByIdAndUpdate(
          id,
          { isActive: false, updatedAt: new Date() },
          { new: true }
        );
        
        if (!customer) {
          console.log('❌ Customer not found');
          throw new Error('مشتری یافت نشد');
        }
        
        console.log('✅ Customer soft deleted successfully:', customer._id);
        return true;
        
      } catch (error: any) {
        console.error('❌ Error deleting customer:', error);
        throw new Error(`خطا در حذف مشتری: ${error.message}`);
      }
    },

    // Document mutations
    createDocument: async (_: any, { input }: { input: any }) => {
      await dbConnect();
      
      console.log('=== GraphQL createDocument received ===');
      console.log('Input:', JSON.stringify(input, null, 2));
      console.log('Date received:', input.date, 'Type:', typeof input.date);
      
      // Input validation
      if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
        console.error('❌ Validation failed: No items provided');
        throw new Error('حداقل یک قلم کالا در سند الزامی است');
      }
      
      // Validate each item
      for (const item of input.items) {
        if (!item.productId) {
          console.error('❌ Validation failed: Missing productId for item:', item);
          throw new Error('شناسه کالا الزامی است');
        }
        if (!item.quantity || item.quantity <= 0) {
          console.error('❌ Validation failed: Invalid quantity for item:', item);
          throw new Error('تعداد کالا باید بیشتر از صفر باشد');
        }
        if (item.unitPrice < 0) {
          console.error('❌ Validation failed: Negative unitPrice for item:', item);
          throw new Error('قیمت واحد نمی‌تواند منفی باشد');
        }
      }
      
      try {
        // Ensure date is properly converted
        let documentDate;
        if (input.date instanceof Date) {
          documentDate = input.date;
        } else if (typeof input.date === 'number') {
          documentDate = new Date(input.date);
        } else if (typeof input.date === 'string') {
          documentDate = new Date(input.date);
        } else {
          documentDate = new Date(); // fallback to current date
        }
        
        console.log('✅ Converted date:', documentDate.toISOString());
        
        // Prepare items with proper structure for Document model
        const documentItems = input.items.map((item: any) => {
          // Validate that productId is a valid ObjectId format
          if (!item.productId.match(/^[0-9a-fA-F]{24}$/)) {
            console.error('❌ Invalid ObjectId format for productId:', item.productId);
            throw new Error(`شناسه کالا معتبر نیست: ${item.productId}`);
          }
          
          console.log('✅ Processing item:', {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          });
          
          return {
            product: item.productId, // Map productId to product
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice, // Calculate totalPrice
            description: item.description || ''
          };
        });
        
        // Calculate total amount for the document
        const totalAmount = documentItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
        console.log('✅ Calculated total amount:', totalAmount);
        
        // Validate supplier/customer requirements based on document type
        if (input.documentType === 'PURCHASE_INVOICE' && !input.supplierId) {
          console.error('❌ Validation failed: Missing supplier for purchase invoice');
          throw new Error('تامین‌کننده برای فاکتور خرید الزامی است');
        }
        
        if (input.documentType === 'SALE_INVOICE' && !input.customerId) {
          console.error('❌ Validation failed: Missing customer for sale invoice');
          throw new Error('مشتری برای فاکتور فروش الزامی است');
        }
        
        console.log('🔍 About to create document with data:', {
          documentType: input.documentType,
          documentNumber: input.documentNumber,
          itemsCount: documentItems.length,
          totalAmount: totalAmount,
          date: documentDate.toISOString()
        });
        
        // Create the document
        const document = await Document.create({
          documentType: input.documentType,
          documentNumber: input.documentNumber,
          supplier: input.supplierId || undefined,
          customer: input.customerId || undefined,
          items: documentItems,
          totalAmount: totalAmount,
          description: input.description,
          date: documentDate, // Use properly converted date
          isFinalized: input.documentType === 'INITIAL_STOCK' // Auto-finalize initial stock
        });
        
        console.log('✅ Document created successfully with ID:', document._id);
        console.log('📄 Document details:', {
          id: document._id,
          documentType: document.documentType,
          documentNumber: document.documentNumber,
          itemsCount: document.items.length,
          totalAmount: document.totalAmount,
          isFinalized: document.isFinalized
        });
        
        // Create inventory movements for each item
        const inventoryMovements = [];
        console.log('🔄 Starting inventory movement creation for', input.items.length, 'items');
        
        for (const item of input.items) {
          console.log('🔄 Creating inventory movement for item:', {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            documentType: input.documentType
          });
          
          try {
            // Ensure quantity is positive for initial stock
            const quantity = input.documentType === 'INITIAL_STOCK' ? Math.abs(item.quantity) : 
                            input.documentType === 'PURCHASE_INVOICE' ? Math.abs(item.quantity) :
                            input.documentType === 'SALE_INVOICE' ? -Math.abs(item.quantity) : 
                            item.quantity;
            
            const movementType = input.documentType === 'INITIAL_STOCK' ? 'INITIAL_STOCK' :
                               input.documentType === 'PURCHASE_INVOICE' ? 'PURCHASE' :
                               input.documentType === 'SALE_INVOICE' ? 'SALE' : 'ADJUSTMENT_IN';
            
            console.log('🔄 Movement details:', {
              quantity: quantity,
              movementType: movementType,
              unitPrice: item.unitPrice,
              totalPrice: Math.abs(quantity) * item.unitPrice
            });
            
            const movement = await InventoryMovement.create({
              product: item.productId,
              movementType: movementType,
              quantity: quantity,
              unitPrice: item.unitPrice,
              totalPrice: Math.abs(quantity) * item.unitPrice,
              description: item.description,
              document: document._id,
              date: documentDate // Use the same converted date
            });
            
            console.log('✅ Created inventory movement with ID:', movement._id);
            inventoryMovements.push(movement);
          } catch (movementError) {
            console.error('❌ Error creating inventory movement:', movementError);
            throw new Error(`خطا در ایجاد حرکت انبار: ${(movementError as any).message}`);
          }
        }
        
        console.log(`✅ Created ${inventoryMovements.length} inventory movements successfully`);
        
        // Populate the document for return
        console.log('🔍 Populating document for return...');
        const populatedDocument = await Document.findById(document._id)
          .populate('supplier')
          .populate('customer')
          .populate('items.product');
        
        if (!populatedDocument) {
          console.error('❌ Failed to find populated document');
          throw new Error('خطا در بازیابی سند ایجاد شده');
        }
        
        console.log('✅ Document successfully populated and ready for return');
        console.log('🎉 DOCUMENT CREATION COMPLETED SUCCESSFULLY!');
        
        const docObject = populatedDocument.toObject();
        return {
          id: populatedDocument._id.toString(),
          ...docObject,
          supplier: populatedDocument.supplier && populatedDocument.supplier._id ? {
            id: populatedDocument.supplier._id.toString(),
            ...populatedDocument.supplier.toObject()
          } : null,
          customer: populatedDocument.customer && populatedDocument.customer._id ? {
            id: populatedDocument.customer._id.toString(),
            ...populatedDocument.customer.toObject()
          } : null,
          items: populatedDocument.items.map(processDocumentItem)
        };
      } catch (error) {
        console.error('Error creating document:', error);
        
        // Provide more specific error messages
        if ((error as any).name === 'ValidationError') {
          const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
          throw new Error(`خطا در اعتبارسنجی: ${validationErrors.join(', ')}`);
        }
        
        if ((error as any).code === 11000) {
          throw new Error('شماره سند قبلاً ثبت شده است');
        }
        
        if ((error as any).message.includes('Cast to ObjectId failed')) {
          throw new Error('شناسه کالا، تامین‌کننده یا مشتری معتبر نیست');
        }
        
        throw new Error(`خطا در ایجاد سند: ${(error as any).message}`);
      }
    },

    updateDocument: async (_: any, { id, input }: { id: string; input: any }) => {
      await dbConnect();
      
      console.log('=== GraphQL updateDocument received ===');
      console.log('Document ID:', id);
      console.log('Input:', JSON.stringify(input, null, 2));
      
      try {
        // Prepare the update data similar to createDocument
        let updateData: any = {
          documentType: input.documentType,
          documentNumber: input.documentNumber,
          description: input.description || "",
          date: input.date instanceof Date ? input.date : new Date(input.date),
          updatedAt: new Date()
        };
        
        // Handle supplier/customer
        if (input.supplierId) {
          updateData.supplier = input.supplierId;
        } else {
          updateData.supplier = null;
        }
        
        if (input.customerId) {
          updateData.customer = input.customerId;
        } else {
          updateData.customer = null;
        }
        
        // Process items if provided
        if (input.items && Array.isArray(input.items)) {
          console.log('Processing items for update:', input.items.length);
          
          const processedItems = input.items.map((item: any) => {
            console.log('Processing item:', {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice
            });
            
            return {
              product: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              description: item.description || ''
            };
          });
          
          updateData.items = processedItems;
          
          // Calculate total amount
          updateData.totalAmount = processedItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
          console.log('Calculated total amount:', updateData.totalAmount);
        }
        
        console.log('Final update data:', JSON.stringify(updateData, null, 2));
        
        const document = await Document.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        ).populate('supplier').populate('customer').populate('items.product');
        
        if (!document) {
          console.error('Document not found for ID:', id);
          throw new Error('سند یافت نشد');
        }
        
        console.log('✅ Document updated successfully:', document._id);
        
        const docObject = document.toObject();
        return {
          id: document._id.toString(),
          ...docObject,
          supplier: document.supplier && document.supplier._id ? {
            id: document.supplier._id.toString(),
            ...document.supplier.toObject()
          } : null,
          customer: document.customer && document.customer._id ? {
            id: document.customer._id.toString(),
            ...document.customer.toObject()
          } : null,
          items: document.items.map(processDocumentItem)
        };
        
      } catch (error) {
        console.error('❌ Error updating document:', error);
        throw new Error(`خطا در بروزرسانی سند: ${(error as any).message}`);
      }
    },

    finalizeDocument: async (_: any, { id }: { id: string }) => {
      await dbConnect();
      
      const document = await Document.findByIdAndUpdate(
        id,
        { isFinalized: true, updatedAt: new Date() },
        { new: true }
      ).populate('supplier').populate('customer').populate('items.product');
      
      if (!document) {
        throw new Error('سند یافت نشد');
      }
      
      const docObject = document.toObject();
      return {
        id: document._id.toString(),
        ...docObject,
        supplier: document.supplier && document.supplier._id ? {
          id: document.supplier._id.toString(),
          ...document.supplier.toObject()
        } : null,
        customer: document.customer && document.customer._id ? {
          id: document.customer._id.toString(),
          ...document.customer.toObject()
        } : null,
        items: document.items.map(processDocumentItem)
      };
    },

    deleteDocument: async (_: any, { id }: { id: string }) => {
      await dbConnect();
      
      // Soft delete the document
      const document = await Document.findByIdAndUpdate(
        id,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );
      
      return !!document;
    },
  },
};