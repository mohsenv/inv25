import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar Date

  type Company {
    id: ID!
    name: String!
    nationalCode: String
    address: String
    phone: String
    email: String
    financialYearStart: Date!
    financialYearEnd: Date!
    isActive: Boolean!
    createdAt: Date!
    updatedAt: Date!
  }

  type Product {
    id: ID!
    name: String!
    code: String!
    description: String
    unit: String!
    category: String
    minimumStock: Float
    maximumStock: Float
    isActive: Boolean!
    createdAt: Date!
    updatedAt: Date!
  }

  type Supplier {
    id: ID!
    name: String!
    nationalCode: String
    economicCode: String
    address: String
    phone: String
    email: String
    isActive: Boolean!
    createdAt: Date!
    updatedAt: Date!
  }

  type Customer {
    id: ID!
    name: String!
    contactPerson: String
    nationalCode: String
    economicCode: String
    address: String
    city: String
    postalCode: String
    phone: String
    email: String
    taxNumber: String
    creditLimit: Float
    currentBalance: Float
    customerType: CustomerType
    status: CustomerStatus
    notes: String
    isActive: Boolean!
    createdAt: Date!
    updatedAt: Date!
  }

  type InventoryMovement {
    id: ID!
    product: Product!
    movementType: MovementType!
    quantity: Float!
    unitPrice: Float!
    totalPrice: Float!
    averagePrice: Float
    description: String
    document: Document
    date: Date!
    createdAt: Date!
    updatedAt: Date!
  }

  type Document {
    id: ID!
    documentType: DocumentType!
    documentNumber: String!
    supplier: Supplier
    customer: Customer
    items: [DocumentItem!]!
    totalAmount: Float!
    description: String
    date: Date!
    isFinalized: Boolean!
    createdAt: Date!
    updatedAt: Date!
  }

  type DocumentItem {
    id: ID!
    product: Product!
    quantity: Float!
    unitPrice: Float!
    totalPrice: Float!
    description: String
  }

  type InventoryReport {
    product: Product!
    currentStock: Float!
    averagePrice: Float
    totalValue: Float!
    lastMovementDate: Date
  }

  type StockMovementReport {
    date: Date!
    purchases: Float!
    sales: Float!
    adjustments: Float!
    balance: Float!
  }

  enum CustomerType {
    RETAIL
    WHOLESALE
    CORPORATE
  }

  enum CustomerStatus {
    ACTIVE
    INACTIVE
  }

  enum MovementType {
    PURCHASE
    SALE
    ADJUSTMENT_IN
    ADJUSTMENT_OUT
    INITIAL_STOCK
  }

  enum DocumentType {
    PURCHASE_INVOICE
    SALE_INVOICE
    STOCK_ADJUSTMENT
    INITIAL_STOCK
  }

  input CompanyInput {
    name: String!
    nationalCode: String
    address: String
    phone: String
    email: String
    financialYearStart: Date!
    financialYearEnd: Date!
  }

  input ProductInput {
    name: String!
    code: String!
    description: String
    unit: String!
    category: String
    minimumStock: Float
    maximumStock: Float
  }

  input SupplierInput {
    name: String!
    nationalCode: String
    economicCode: String
    address: String
    phone: String
    email: String
  }

  input CustomerInput {
    name: String!
    contactPerson: String
    nationalCode: String
    economicCode: String
    address: String
    city: String
    postalCode: String
    phone: String
    email: String
    taxNumber: String
    creditLimit: Float
    currentBalance: Float
    customerType: CustomerType
    status: CustomerStatus
    notes: String
  }

  input DocumentInput {
    documentType: DocumentType!
    documentNumber: String!
    supplierId: ID
    customerId: ID
    items: [DocumentItemInput!]!
    description: String
    date: Date!
  }

  input DocumentItemInput {
    productId: ID!
    quantity: Float!
    unitPrice: Float!
    description: String
  }

  input InventoryReportFilter {
    categoryFilter: String
    lowStockOnly: Boolean
    dateFrom: Date
    dateTo: Date
  }

  type Query {
    # Company
    getCompany: Company
    
    # Products
    getProducts(search: String, category: String, isActive: Boolean): [Product!]!
    getProduct(id: ID!): Product
    
    # Suppliers
    getSuppliers(search: String, isActive: Boolean): [Supplier!]!
    getSupplier(id: ID!): Supplier
    
    # Customers
    getCustomers(search: String, isActive: Boolean): [Customer!]!
    getCustomer(id: ID!): Customer
    
    # Documents
    getDocuments(
      documentType: DocumentType
      dateFrom: Date
      dateTo: Date
      supplierId: ID
      customerId: ID
      isFinalized: Boolean
    ): [Document!]!
    getDocument(id: ID!): Document
    
    # Inventory
    getInventoryMovements(
      productId: ID
      movementType: MovementType
      dateFrom: Date
      dateTo: Date
    ): [InventoryMovement!]!
    
    # Reports
    getInventoryReport(filter: InventoryReportFilter): [InventoryReport!]!
    getStockMovementReport(
      productId: ID!
      dateFrom: Date!
      dateTo: Date!
    ): [StockMovementReport!]!
    
    # Dashboard
    getDashboardStats: DashboardStats!
  }

  type DashboardStats {
    totalProducts: Int!
    totalInventoryValue: Float!
    todayPurchases: Int!
    todaySales: Float!
    lowStockProducts: Int!
  }

  type Mutation {
    # Company
    createOrUpdateCompany(input: CompanyInput!): Company!
    
    # Products
    createProduct(input: ProductInput!): Product!
    updateProduct(id: ID!, input: ProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
    
    # Suppliers
    createSupplier(input: SupplierInput!): Supplier!
    updateSupplier(id: ID!, input: SupplierInput!): Supplier!
    deleteSupplier(id: ID!): Boolean!
    
    # Customers
    createCustomer(input: CustomerInput!): Customer!
    updateCustomer(id: ID!, input: CustomerInput!): Customer!
    deleteCustomer(id: ID!): Boolean!
    
    # Documents
    createDocument(input: DocumentInput!): Document!
    updateDocument(id: ID!, input: DocumentInput!): Document!
    finalizeDocument(id: ID!): Document!
    deleteDocument(id: ID!): Boolean!
  }
`;