export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_payments: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          payment_amount: number
          payment_date: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          transaction_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          customer_code: string
          date_of_birth: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          qr_code_url: string | null
          total_points: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          customer_code: string
          date_of_birth?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          qr_code_url?: string | null
          total_points?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          customer_code?: string
          date_of_birth?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          qr_code_url?: string | null
          total_points?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          description: string | null
          expense_date: string
          id: string
          receipt_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          receipt_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          receipt_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_sale_items: {
        Row: {
          created_at: string
          discount_percentage: number
          flash_sale_id: string
          id: string
          max_quantity_per_customer: number | null
          original_price: number
          product_id: string
          sale_price: number
          sold_quantity: number
          stock_quantity: number
        }
        Insert: {
          created_at?: string
          discount_percentage?: number
          flash_sale_id: string
          id?: string
          max_quantity_per_customer?: number | null
          original_price?: number
          product_id: string
          sale_price?: number
          sold_quantity?: number
          stock_quantity?: number
        }
        Update: {
          created_at?: string
          discount_percentage?: number
          flash_sale_id?: string
          id?: string
          max_quantity_per_customer?: number | null
          original_price?: number
          product_id?: string
          sale_price?: number
          sold_quantity?: number
          stock_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "flash_sale_items_flash_sale_id_fkey"
            columns: ["flash_sale_id"]
            isOneToOne: false
            referencedRelation: "flash_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flash_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_sales: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          delivery_date: string | null
          delivery_fee: number
          id: string
          notes: string | null
          order_date: string
          order_number: string
          payment_method: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_date?: string | null
          delivery_fee?: number
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          payment_method?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_date?: string | null
          delivery_fee?: number
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          payment_method?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      point_exchanges: {
        Row: {
          created_at: string
          customer_id: string
          exchange_date: string
          id: string
          notes: string | null
          points_used: number
          processed_by: string
          quantity: number
          reward_id: string
          status: string
          total_points_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          exchange_date?: string
          id?: string
          notes?: string | null
          points_used?: number
          processed_by: string
          quantity?: number
          reward_id: string
          status?: string
          total_points_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          exchange_date?: string
          id?: string
          notes?: string | null
          points_used?: number
          processed_by?: string
          quantity?: number
          reward_id?: string
          status?: string
          total_points_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_point_exchanges_customer_id"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_point_exchanges_processed_by"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_point_exchanges_reward_id"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          created_at: string
          customer_id: string
          description: string
          id: string
          points_change: number
          reward_id: string | null
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          description: string
          id?: string
          points_change?: number
          reward_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string
          id?: string
          points_change?: number
          reward_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      price_variants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          minimum_quantity: number
          name: string
          price: number
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          minimum_quantity?: number
          name: string
          price?: number
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          minimum_quantity?: number
          name?: string
          price?: number
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          base_price: number
          category_id: string | null
          created_at: string
          current_stock: number
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          loyalty_points: number
          min_quantity: number
          min_stock: number
          name: string
          selling_price: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          base_price?: number
          category_id?: string | null
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          loyalty_points?: number
          min_quantity?: number
          min_stock?: number
          name: string
          selling_price?: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          base_price?: number
          category_id?: string | null
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          loyalty_points?: number
          min_quantity?: number
          min_stock?: number
          name?: string
          selling_price?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          conversion_factor: number | null
          created_at: string
          expiration_date: string | null
          id: string
          product_id: string
          purchase_id: string
          purchase_unit_id: string | null
          quantity: number
          total_cost: number
          unit_cost: number
        }
        Insert: {
          conversion_factor?: number | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          product_id: string
          purchase_id: string
          purchase_unit_id?: string | null
          quantity?: number
          total_cost?: number
          unit_cost?: number
        }
        Update: {
          conversion_factor?: number | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          product_id?: string
          purchase_id?: string
          purchase_unit_id?: string | null
          quantity?: number
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_unit_id_fkey"
            columns: ["purchase_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_payments: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          payment_amount: number
          payment_date: string
          purchase_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          purchase_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          purchase_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_payments_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          purchase_date: string
          purchase_number: string
          supplier_id: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          purchase_date?: string
          purchase_number: string
          supplier_id: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          purchase_date?: string
          purchase_number?: string
          supplier_id?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      return_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          return_id: string
          total_cost: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          return_id: string
          total_cost?: number
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          return_id?: string
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          created_at: string
          id: string
          invoice_number: string | null
          reason: string | null
          return_date: string
          return_number: string
          status: string | null
          supplier_id: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_number?: string | null
          reason?: string | null
          return_date?: string
          return_number: string
          status?: string | null
          supplier_id: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_number?: string | null
          reason?: string | null
          return_date?: string
          return_number?: string
          status?: string | null
          supplier_id?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "returns_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_items: {
        Row: {
          created_at: string
          id: string
          points_required: number
          product_id: string
          quantity: number
          reward_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_required?: number
          product_id: string
          quantity?: number
          reward_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_required?: number
          product_id?: string
          quantity?: number
          reward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_items_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      stock_adjustments: {
        Row: {
          adjustment_type: Database["public"]["Enums"]["adjustment_type"]
          created_at: string
          id: string
          new_stock: number
          previous_stock: number
          product_id: string
          quantity_change: number
          reason: string | null
          user_id: string
        }
        Insert: {
          adjustment_type: Database["public"]["Enums"]["adjustment_type"]
          created_at?: string
          id?: string
          new_stock?: number
          previous_stock?: number
          product_id: string
          quantity_change?: number
          reason?: string | null
          user_id: string
        }
        Update: {
          adjustment_type?: Database["public"]["Enums"]["adjustment_type"]
          created_at?: string
          id?: string
          new_stock?: number
          previous_stock?: number
          product_id?: string
          quantity_change?: number
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transaction_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          total_price: number
          transaction_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          total_price?: number
          transaction_id: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          transaction_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          cashier_id: string
          change_amount: number
          created_at: string
          customer_id: string | null
          discount_amount: number
          due_date: string | null
          id: string
          is_credit: boolean
          notes: string | null
          paid_amount: number
          payment_amount: number
          payment_type: Database["public"]["Enums"]["transaction_type"]
          points_earned: number
          points_used: number
          receipt_url: string | null
          total_amount: number
          transaction_number: string
          updated_at: string
        }
        Insert: {
          cashier_id: string
          change_amount?: number
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          is_credit?: boolean
          notes?: string | null
          paid_amount?: number
          payment_amount?: number
          payment_type?: Database["public"]["Enums"]["transaction_type"]
          points_earned?: number
          points_used?: number
          receipt_url?: string | null
          total_amount?: number
          transaction_number: string
          updated_at?: string
        }
        Update: {
          cashier_id?: string
          change_amount?: number
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          is_credit?: boolean
          notes?: string | null
          paid_amount?: number
          payment_amount?: number
          payment_type?: Database["public"]["Enums"]["transaction_type"]
          points_earned?: number
          points_used?: number
          receipt_url?: string | null
          total_amount?: number
          transaction_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_conversions: {
        Row: {
          conversion_factor: number
          created_at: string
          from_unit_id: string | null
          id: string
          product_id: string
          to_unit_id: string | null
        }
        Insert: {
          conversion_factor?: number
          created_at?: string
          from_unit_id?: string | null
          id?: string
          product_id: string
          to_unit_id?: string | null
        }
        Update: {
          conversion_factor?: number
          created_at?: string
          from_unit_id?: string | null
          id?: string
          product_id?: string
          to_unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_unit_conversions_from_unit"
            columns: ["from_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_unit_conversions_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_unit_conversions_to_unit"
            columns: ["to_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_conversions_from_unit_id_fkey"
            columns: ["from_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_conversions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_conversions_to_unit_id_fkey"
            columns: ["to_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          abbreviation: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          abbreviation: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          abbreviation?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_product_likes: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_product_likes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_customer_purchase_history: {
        Args: { customer_uuid: string }
        Returns: {
          transaction_id: string
          transaction_number: string
          total_amount: number
          points_earned: number
          points_used: number
          created_at: string
          items: Json
        }[]
      }
      get_supplier_purchase_history: {
        Args: { supplier_uuid: string }
        Returns: {
          purchase_id: string
          purchase_number: string
          total_amount: number
          purchase_date: string
          payment_method: string
          status: string
          created_at: string
          items: Json
        }[]
      }
      get_supplier_return_history: {
        Args: { supplier_uuid: string }
        Returns: {
          return_id: string
          return_number: string
          total_amount: number
          return_date: string
          status: string
          reason: string
          created_at: string
          items: Json
        }[]
      }
      get_unit_conversion_factor: {
        Args: {
          p_product_id: string
          p_from_unit_id: string
          p_to_unit_id: string
        }
        Returns: number
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      adjustment_type: "increase" | "decrease" | "correction"
      expense_category:
        | "operational"
        | "maintenance"
        | "utilities"
        | "supplies"
        | "other"
      transaction_type: "cash" | "transfer" | "credit"
      user_role: "admin" | "cashier" | "manager" | "staff" | "buyer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      adjustment_type: ["increase", "decrease", "correction"],
      expense_category: [
        "operational",
        "maintenance",
        "utilities",
        "supplies",
        "other",
      ],
      transaction_type: ["cash", "transfer", "credit"],
      user_role: ["admin", "cashier", "manager", "staff", "buyer"],
    },
  },
} as const
