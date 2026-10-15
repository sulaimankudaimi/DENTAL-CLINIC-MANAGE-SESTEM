import { getDb, getSqlite } from '../db/connection';
import {
  inventoryItems,
} from '../db/schema';
import { eq, and, isNull, lte, sql } from 'drizzle-orm';
import type {
  InventoryItem,
  CreateInventoryItem,
  UpdateInventoryItem,
  InventoryTransaction,
  CreateInventoryTransaction,
  PaginationParams,
  Paginated,
  ApiResult,
  Supplier,
  CreateSupplier,
  UpdateSupplier,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  InventoryMonthlyConsumptionReport,
  InventoryTransactionType,
} from '@shared/contracts';
import { safeExecute, withTransaction } from './base';
import crypto from 'node:crypto';
import type Database from 'better-sqlite3';

export class InventoryRepository {
  async list(params?: PaginationParams & { search?: string; category?: string; status?: string }): Promise<ApiResult<Paginated<InventoryItem>>> {
    return safeExecute(async () => {
      const db = getDb();
      const page = Math.max(1, params?.page || 1);
      const limit = Math.min(100, Math.max(1, params?.limit || 20));
      const offset = (page - 1) * limit;

      const conditions = [isNull(inventoryItems.deleted_at)];
      if (params?.category && params.category !== 'all') {
        conditions.push(eq(inventoryItems.category, params.category));
      }

      const whereClause = and(...conditions);

      let query = db
        .select()
        .from(inventoryItems)
        .where(whereClause)
        .orderBy(inventoryItems.name)
        .limit(limit)
        .offset(offset);

      const items = (await query) as unknown as InventoryItem[];

      const countResult = await db.select({ count: sql<number>`count(*)` }).from(inventoryItems).where(whereClause);
      const total = Number(countResult[0]?.count || 0);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    });
  }

  async getById(id: string): Promise<ApiResult<InventoryItem>> {
    return safeExecute(async () => {
      const db = getDb();
      const res = await db
        .select()
        .from(inventoryItems)
        .where(and(eq(inventoryItems.id, id), isNull(inventoryItems.deleted_at)))
        .limit(1);

      if (!res.length) throw new Error(`الصنف غير موجود (المعرف: ${id})`);
      return res[0] as unknown as InventoryItem;
    });
  }

  async create(data: CreateInventoryItem): Promise<ApiResult<InventoryItem>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      const newItem: typeof inventoryItems.$inferInsert = {
        id,
        clinic_id: data.clinic_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        name: data.name,
        sku: data.sku,
        category: data.category ?? 'مستهلكات عامة',
        unit: data.unit ?? 'قطعة',
        quantity: data.quantity ?? 0,
        min_quantity: data.min_quantity ?? 5,
        cost_halalas: data.cost_halalas ?? 0,
        supplier_id: data.supplier_id ?? null,
        expiry_date: data.expiry_date ?? null,
        location: data.location ?? null,
      };

      await db.insert(inventoryItems).values(newItem);
      const res = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).limit(1);
      return res[0] as unknown as InventoryItem;
    });
  }

  async update(id: string, data: UpdateInventoryItem): Promise<ApiResult<InventoryItem>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();

      await db
        .update(inventoryItems)
        .set({
          ...data,
          updated_at: now,
        })
        .where(eq(inventoryItems.id, id));

      const res = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).limit(1);
      return res[0] as unknown as InventoryItem;
    });
  }

  async delete(id: string): Promise<ApiResult<boolean>> {
    return safeExecute(async () => {
      const db = getDb();
      const now = new Date().toISOString();
      await db
        .update(inventoryItems)
        .set({ deleted_at: now, updated_at: now })
        .where(eq(inventoryItems.id, id));
      return true;
    });
  }

  async recordTransaction(
    data: CreateInventoryTransaction,
    customSqlite?: Database.Database
  ): Promise<ApiResult<InventoryTransaction>> {
    return withTransaction((sqlite) => {
      const now = new Date().toISOString();
      const txId = crypto.randomUUID();

      const item = sqlite
        .prepare('SELECT id, clinic_id, quantity FROM inventory_items WHERE id = ? AND deleted_at IS NULL')
        .get(data.item_id) as any;

      if (!item) {
        throw new Error(`الصنف المخزني غير موجود (المعرف: ${data.item_id})`);
      }

      const qty = Math.floor(Number(data.quantity) || 0);
      if (qty <= 0) {
        throw new Error('الكمية يجب أن تكون أكبر من الصفر.');
      }

      if (data.type === 'out' && item.quantity < qty) {
        throw new Error(`الكمية المطلوبة (${qty}) تتجاوز الرصيد المتوفر في المستودع (${item.quantity}).`);
      }

      const delta = data.type === 'in' ? qty : -qty;
      const newQty = item.quantity + delta;

      // Ensure valid created_by
      let createdBy = data.created_by;
      if (!createdBy || !sqlite.prepare('SELECT 1 FROM users WHERE id = ?').get(createdBy)) {
        const u = sqlite.prepare('SELECT id FROM users LIMIT 1').get() as { id: string } | undefined;
        createdBy = u?.id || 'u1000000-0000-0000-0000-000000000001';
      }

      sqlite.prepare(`
        INSERT INTO inventory_transactions (
          id, clinic_id, created_at, updated_at, deleted_at,
          item_id, type, quantity, reason, treatment_id, created_by
        ) VALUES (
          ?, ?, ?, ?, NULL,
          ?, ?, ?, ?, ?, ?
        )
      `).run(
        txId,
        data.clinic_id || item.clinic_id,
        now,
        now,
        data.item_id,
        data.type,
        qty,
        data.reason ?? null,
        data.treatment_id ?? null,
        createdBy
      );

      sqlite.prepare(`
        UPDATE inventory_items
        SET quantity = ?, updated_at = ?
        WHERE id = ?
      `).run(newQty, now, data.item_id);

      const created = sqlite.prepare('SELECT * FROM inventory_transactions WHERE id = ?').get(txId) as any;
      return created as InventoryTransaction;
    }, customSqlite);
  }

  async getLowStock(): Promise<ApiResult<InventoryItem[]>> {
    return safeExecute(async () => {
      const db = getDb();
      const res = (await db
        .select()
        .from(inventoryItems)
        .where(and(isNull(inventoryItems.deleted_at), lte(inventoryItems.quantity, inventoryItems.min_quantity)))
        .orderBy(inventoryItems.quantity)) as unknown as InventoryItem[];
      return res;
    });
  }

  async getTransactions(params?: { itemId?: string; type?: InventoryTransactionType; limit?: number }): Promise<
    ApiResult<Array<InventoryTransaction & { item_name?: string; item_unit?: string; item_sku?: string; treatment_title?: string; created_by_name?: string }>>
  > {
    return safeExecute(async () => {
      const sqlite = getSqlite();
      let sqlQuery = `
        SELECT t.*, i.name as item_name, i.unit as item_unit, i.sku as item_sku, u.full_name as created_by_name
        FROM inventory_transactions t
        LEFT JOIN inventory_items i ON t.item_id = i.id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.deleted_at IS NULL
      `;
      const queryParams: any[] = [];
      if (params?.itemId) {
        sqlQuery += ` AND t.item_id = ?`;
        queryParams.push(params.itemId);
      }
      if (params?.type) {
        sqlQuery += ` AND t.type = ?`;
        queryParams.push(params.type);
      }
      sqlQuery += ` ORDER BY t.created_at DESC LIMIT ?`;
      queryParams.push(params?.limit || 50);

      const rows = sqlite.prepare(sqlQuery).all(...queryParams) as any[];
      return rows;
    });
  }

  async getExpiringItems(daysThreshold: number = 60): Promise<ApiResult<Array<InventoryItem & { daysRemaining: number; isExpired: boolean }>>> {
    return safeExecute(async () => {
      const sqlite = getSqlite();
      const now = new Date();
      const thresholdDate = new Date(now.getTime() + daysThreshold * 86400000).toISOString().split('T')[0];

      const rows = sqlite
        .prepare(`
          SELECT * FROM inventory_items
          WHERE deleted_at IS NULL AND expiry_date IS NOT NULL AND expiry_date <= ?
          ORDER BY expiry_date ASC
        `)
        .all(thresholdDate) as any[];

      const enriched = rows.map((item) => {
        const expDate = new Date(item.expiry_date);
        const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...item,
          daysRemaining: diffDays,
          isExpired: diffDays <= 0,
        };
      });

      return enriched;
    });
  }

  async getMonthlyConsumptionReport(month?: string, year?: number): Promise<ApiResult<InventoryMonthlyConsumptionReport>> {
    return safeExecute(async () => {
      const sqlite = getSqlite();
      const targetYear = year || new Date().getFullYear();
      const targetPeriod = month || `${targetYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

      const arabicMonths: Record<string, string> = {
        '01': 'يناير',
        '02': 'فبراير',
        '03': 'مارس',
        '04': 'أبريل',
        '05': 'مايو',
        '06': 'يونيو',
        '07': 'يوليو',
        '08': 'أغسطس',
        '09': 'سبتمبر',
        '10': 'أكتوبر',
        '11': 'نوفمبر',
        '12': 'ديسمبر',
      };
      const monthPart = targetPeriod.split('-')[1] || '01';
      const monthName = `${arabicMonths[monthPart] || 'الشهر الحالي'} ${targetYear}`;

      const txs = sqlite
        .prepare(`
          SELECT t.*, i.name as item_name, i.sku as item_sku, i.unit as item_unit, i.category as item_category, i.cost_halalas, u.full_name as user_name
          FROM inventory_transactions t
          JOIN inventory_items i ON t.item_id = i.id
          LEFT JOIN users u ON t.created_by = u.id
          WHERE (t.type = 'out' OR t.type = 'waste') AND t.created_at LIKE ? AND t.deleted_at IS NULL
          ORDER BY t.created_at DESC
        `)
        .all(`${targetPeriod}%`) as any[];

      let totalConsumedHalalas = 0;
      const categoryMap = new Map<string, { totalHalalas: number; itemsCount: number; items: Set<string> }>();
      const itemMap = new Map<string, {
        name: string;
        sku: string;
        category: string;
        unit: string;
        quantity: number;
        costHalalas: number;
        totalHalalas: number;
        transactionsCount: number;
      }>();

      for (const tx of txs) {
        const itemCost = Number(tx.cost_halalas) || 0;
        const totalLine = tx.quantity * itemCost;
        totalConsumedHalalas += totalLine;

        // Category breakdown
        const cat = tx.item_category || 'عام';
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, { totalHalalas: 0, itemsCount: 0, items: new Set() });
        }
        const catData = categoryMap.get(cat)!;
        catData.totalHalalas += totalLine;
        catData.items.add(tx.item_id);
        catData.itemsCount = catData.items.size;

        // Top items
        if (!itemMap.has(tx.item_id)) {
          itemMap.set(tx.item_id, {
            name: tx.item_name || 'صنف',
            sku: tx.item_sku || 'SKU',
            category: cat,
            unit: tx.item_unit || 'قطعة',
            quantity: 0,
            costHalalas: itemCost,
            totalHalalas: 0,
            transactionsCount: 0,
          });
        }
        const itm = itemMap.get(tx.item_id)!;
        itm.quantity += tx.quantity;
        itm.totalHalalas += totalLine;
        itm.transactionsCount += 1;
      }

      const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        totalHalalas: data.totalHalalas,
        itemsCount: data.itemsCount,
        percentage: totalConsumedHalalas > 0 ? Math.round((data.totalHalalas / totalConsumedHalalas) * 100) : 0,
      }));

      const topConsumedItems = Array.from(itemMap.entries())
        .map(([itemId, data]) => ({
          itemId,
          name: data.name,
          sku: data.sku,
          category: data.category,
          unit: data.unit,
          quantityConsumed: data.quantity,
          costHalalas: data.costHalalas,
          totalHalalas: data.totalHalalas,
          transactionsCount: data.transactionsCount,
        }))
        .sort((a, b) => b.totalHalalas - a.totalHalalas)
        .slice(0, 5);

      const recentMovements = txs.slice(0, 15).map((t) => ({
        id: t.id,
        date: t.created_at,
        itemName: t.item_name || 'مادة مستهلكة',
        category: t.item_category || 'عام',
        type: t.type,
        quantity: t.quantity,
        unit: t.item_unit || 'قطعة',
        costHalalas: (Number(t.cost_halalas) || 0) * t.quantity,
        reason: t.reason || null,
        createdByName: t.user_name || 'طاقم العيادة',
      }));

      return {
        period: targetPeriod,
        monthName,
        totalConsumedHalalas,
        totalTransactionsCount: txs.length,
        totalItemsCount: itemMap.size,
        byCategory,
        topConsumedItems,
        recentMovements,
      };
    });
  }

  // ==========================================
  // SUPPLIERS
  // ==========================================
  async getSuppliers(): Promise<ApiResult<Supplier[]>> {
    return safeExecute(async () => {
      const sqlite = getSqlite();
      const rows = sqlite
        .prepare('SELECT * FROM suppliers WHERE deleted_at IS NULL ORDER BY name ASC')
        .all() as any[];
      return rows;
    });
  }

  async createSupplier(data: CreateSupplier): Promise<ApiResult<Supplier>> {
    return safeExecute(async () => {
      const sqlite = getSqlite();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      let clinicId = data.clinic_id;
      if (!clinicId) {
        const c = sqlite.prepare('SELECT id FROM clinics LIMIT 1').get() as { id: string } | undefined;
        clinicId = c?.id || 'c1000000-0000-0000-0000-000000000001';
      }

      sqlite.prepare(`
        INSERT INTO suppliers (id, clinic_id, created_at, updated_at, deleted_at, name, phone, email, notes)
        VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?)
      `).run(id, clinicId, now, now, data.name, data.phone ?? null, data.email ?? null, data.notes ?? null);

      return sqlite.prepare('SELECT * FROM suppliers WHERE id = ?').get(id) as Supplier;
    });
  }

  async updateSupplier(id: string, data: UpdateSupplier): Promise<ApiResult<Supplier>> {
    return safeExecute(async () => {
      const sqlite = getSqlite();
      const now = new Date().toISOString();

      const existing = sqlite.prepare('SELECT * FROM suppliers WHERE id = ?').get(id) as any;
      if (!existing) throw new Error('المورد غير موجود');

      sqlite.prepare(`
        UPDATE suppliers
        SET name = COALESCE(?, name),
            phone = COALESCE(?, phone),
            email = COALESCE(?, email),
            notes = COALESCE(?, notes),
            updated_at = ?
        WHERE id = ?
      `).run(
        data.name ?? null,
        data.phone ?? null,
        data.email ?? null,
        data.notes ?? null,
        now,
        id
      );

      return sqlite.prepare('SELECT * FROM suppliers WHERE id = ?').get(id) as Supplier;
    });
  }

  async deleteSupplier(id: string): Promise<ApiResult<boolean>> {
    return safeExecute(async () => {
      const sqlite = getSqlite();
      const now = new Date().toISOString();
      sqlite.prepare('UPDATE suppliers SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, id);
      return true;
    });
  }

  // ==========================================
  // PURCHASE ORDERS
  // ==========================================
  async getPurchaseOrders(): Promise<ApiResult<PurchaseOrder[]>> {
    return safeExecute(async () => {
      const sqlite = getSqlite();
      const orders = sqlite
        .prepare(`
          SELECT po.*, s.name as supplier_name
          FROM purchase_orders po
          LEFT JOIN suppliers s ON po.supplier_id = s.id
          WHERE po.deleted_at IS NULL
          ORDER BY po.created_at DESC
        `)
        .all() as any[];

      const result: PurchaseOrder[] = [];
      const itemStmt = sqlite.prepare(`
        SELECT poi.*, i.name as item_name, i.unit as item_unit
        FROM purchase_order_items poi
        JOIN inventory_items i ON poi.item_id = i.id
        WHERE poi.po_id = ? AND poi.deleted_at IS NULL
      `);

      for (const po of orders) {
        const rawItems = itemStmt.all(po.id) as any[];
        const items: PurchaseOrderItem[] = rawItems.map((itm) => ({
          id: itm.id,
          item_id: itm.item_id,
          item_name: itm.item_name,
          unit: itm.item_unit || 'قطعة',
          quantity: itm.quantity,
          received_quantity: itm.received_quantity || 0,
          cost_halalas: itm.unit_cost_halalas,
          total_halalas: itm.quantity * itm.unit_cost_halalas,
        }));

        result.push({
          id: po.id,
          clinic_id: po.clinic_id,
          created_at: po.created_at,
          updated_at: po.updated_at,
          deleted_at: po.deleted_at,
          po_number: po.number,
          number: po.number,
          supplier_id: po.supplier_id,
          supplier_name: po.supplier_name || 'مورد غير معروف',
          order_date: po.ordered_at || po.created_at,
          ordered_at: po.ordered_at,
          expected_date: po.expected_at,
          expected_at: po.expected_at,
          received_date: po.received_at,
          received_at: po.received_at,
          status: po.status as PurchaseOrderStatus,
          total_halalas: po.total_halalas,
          notes: po.notes,
          items,
        });
      }

      return result;
    });
  }

  async createPurchaseOrder(data: {
    clinic_id?: string;
    supplier_id: string;
    order_date?: string;
    expected_date?: string | null;
    notes?: string | null;
    items: Array<{ item_id: string; quantity: number; cost_halalas: number }>;
  }, customSqlite?: Database.Database): Promise<ApiResult<PurchaseOrder>> {
    return withTransaction((sqlite) => {
      const now = new Date().toISOString();
      const poId = crypto.randomUUID();

      let clinicId = data.clinic_id;
      if (!clinicId) {
        const c = sqlite.prepare('SELECT id FROM clinics LIMIT 1').get() as { id: string } | undefined;
        clinicId = c?.id || 'c1000000-0000-0000-0000-000000000001';
      }

      // Generate sequence number PO-YYYYMMDD-XXXX
      const datePrefix = now.slice(0, 10).replace(/-/g, '');
      const countRow = sqlite.prepare("SELECT COUNT(*) as count FROM purchase_orders WHERE number LIKE ?").get(`PO-${datePrefix}-%`) as any;
      const seq = String((countRow?.count || 0) + 1).padStart(4, '0');
      const poNumber = `PO-${datePrefix}-${seq}`;

      let totalHalalas = 0;
      for (const itm of data.items) {
        totalHalalas += Math.floor(Number(itm.quantity) || 0) * Math.floor(Number(itm.cost_halalas) || 0);
      }

      sqlite.prepare(`
        INSERT INTO purchase_orders (
          id, clinic_id, created_at, updated_at, deleted_at,
          supplier_id, number, status, ordered_at, expected_at, received_at, total_halalas, notes
        ) VALUES (
          ?, ?, ?, ?, NULL,
          ?, ?, 'draft', ?, ?, NULL, ?, ?
        )
      `).run(
        poId,
        clinicId,
        now,
        now,
        data.supplier_id,
        poNumber,
        data.order_date || now,
        data.expected_date ?? null,
        totalHalalas,
        data.notes ?? null
      );

      const insertItemStmt = sqlite.prepare(`
        INSERT INTO purchase_order_items (
          id, clinic_id, created_at, updated_at, deleted_at,
          po_id, item_id, quantity, received_quantity, unit_cost_halalas
        ) VALUES (
          ?, ?, ?, ?, NULL,
          ?, ?, ?, 0, ?
        )
      `);

      for (const itm of data.items) {
        insertItemStmt.run(
          crypto.randomUUID(),
          clinicId,
          now,
          now,
          poId,
          itm.item_id,
          Math.floor(Number(itm.quantity) || 0),
          Math.floor(Number(itm.cost_halalas) || 0)
        );
      }

      // Re-fetch created purchase order
      const supplier = sqlite.prepare('SELECT name FROM suppliers WHERE id = ?').get(data.supplier_id) as any;
      const rawItems = sqlite.prepare(`
        SELECT poi.*, i.name as item_name, i.unit as item_unit
        FROM purchase_order_items poi
        JOIN inventory_items i ON poi.item_id = i.id
        WHERE poi.po_id = ?
      `).all(poId) as any[];

      const items: PurchaseOrderItem[] = rawItems.map((itm) => ({
        id: itm.id,
        item_id: itm.item_id,
        item_name: itm.item_name,
        unit: itm.item_unit || 'قطعة',
        quantity: itm.quantity,
        received_quantity: itm.received_quantity || 0,
        cost_halalas: itm.unit_cost_halalas,
        total_halalas: itm.quantity * itm.unit_cost_halalas,
      }));

      return {
        id: poId,
        clinic_id: clinicId,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        po_number: poNumber,
        number: poNumber,
        supplier_id: data.supplier_id,
        supplier_name: supplier?.name || 'مورد',
        order_date: data.order_date || now,
        ordered_at: data.order_date || now,
        expected_date: data.expected_date ?? null,
        expected_at: data.expected_date ?? null,
        received_date: null,
        received_at: null,
        status: 'draft',
        total_halalas: totalHalalas,
        notes: data.notes ?? null,
        items,
      };
    }, customSqlite);
  }

  async receivePurchaseOrder(id: string, payload?: { received_at?: string; notes?: string }, customSqlite?: Database.Database): Promise<ApiResult<PurchaseOrder>> {
    return withTransaction((sqlite) => {
      const now = new Date().toISOString();
      const po = sqlite.prepare('SELECT * FROM purchase_orders WHERE id = ? AND deleted_at IS NULL').get(id) as any;
      if (!po) {
        throw new Error(`أمر الشراء غير موجود (المعرف: ${id})`);
      }
      if (po.status === 'received') {
        throw new Error('أمر الشراء مستلم مسبقاً.');
      }
      if (po.status === 'cancelled') {
        throw new Error('لا يمكن استلام أمر شراء ملغي.');
      }

      const items = sqlite.prepare('SELECT * FROM purchase_order_items WHERE po_id = ? AND deleted_at IS NULL').all(id) as any[];
      if (!items.length) {
        throw new Error('أمر الشراء لا يحتوي على أصناف صالحة للاستلام.');
      }

      // Default user for transaction creation
      const userRow = sqlite.prepare('SELECT id FROM users LIMIT 1').get() as { id: string } | undefined;
      const createdBy = userRow?.id || 'u1000000-0000-0000-0000-000000000001';

      // 1. Update received quantities & insert transactions & update inventory stock
      let allFullyReceived = true;
      let anyReceived = false;

      for (const itm of items) {
        const itemPayload = (payload as any)?.items?.find((pItm: any) => pItm.item_id === itm.item_id);
        const previouslyReceived = Number(itm.received_quantity) || 0;
        let newReceivedTotal = itm.quantity; // default full
        if (itemPayload && typeof itemPayload.received_quantity === 'number') {
          newReceivedTotal = Math.min(itm.quantity, previouslyReceived + itemPayload.received_quantity);
        }

        const deltaQty = newReceivedTotal - previouslyReceived;
        if (deltaQty > 0) {
          anyReceived = true;
          sqlite.prepare(`
            UPDATE purchase_order_items
            SET received_quantity = ?, updated_at = ?
            WHERE id = ?
          `).run(newReceivedTotal, now, itm.id);

          // Insert inventory_transaction of type 'in'
          const txId = crypto.randomUUID();
          sqlite.prepare(`
            INSERT INTO inventory_transactions (
              id, clinic_id, created_at, updated_at, deleted_at,
              item_id, type, quantity, reason, treatment_id, created_by
            ) VALUES (
              ?, ?, ?, ?, NULL,
              ?, 'in', ?, ?, NULL, ?
            )
          `).run(
            txId,
            po.clinic_id,
            now,
            now,
            itm.item_id,
            deltaQty,
            `استلام أمر شراء رقم ${po.number}`,
            createdBy
          );

          // Update inventory item stock & unit cost
          sqlite.prepare(`
            UPDATE inventory_items
            SET quantity = quantity + ?,
                cost_halalas = ?,
                updated_at = ?
            WHERE id = ?
          `).run(deltaQty, itm.unit_cost_halalas, now, itm.item_id);
        }

        if (newReceivedTotal < itm.quantity) {
          allFullyReceived = false;
        }
      }

      // 2. Update purchase order status (partial or received)
      const finalStatus: PurchaseOrderStatus = allFullyReceived ? 'received' : (anyReceived ? 'partial' : po.status);
      const receivedDate = payload?.received_at || now;
      sqlite.prepare(`
        UPDATE purchase_orders
        SET status = ?,
            received_at = ?,
            updated_at = ?
        WHERE id = ?
      `).run(finalStatus, receivedDate, now, id);

      // 3. Return full updated PO
      const supplier = sqlite.prepare('SELECT name FROM suppliers WHERE id = ?').get(po.supplier_id) as any;
      const rawItems = sqlite.prepare(`
        SELECT poi.*, i.name as item_name, i.unit as item_unit
        FROM purchase_order_items poi
        JOIN inventory_items i ON poi.item_id = i.id
        WHERE poi.po_id = ?
      `).all(id) as any[];

      const updatedItems: PurchaseOrderItem[] = rawItems.map((itm) => ({
        id: itm.id,
        item_id: itm.item_id,
        item_name: itm.item_name,
        unit: itm.item_unit || 'قطعة',
        quantity: itm.quantity,
        received_quantity: itm.received_quantity,
        cost_halalas: itm.unit_cost_halalas,
        total_halalas: itm.quantity * itm.unit_cost_halalas,
      }));

      return {
        id: po.id,
        clinic_id: po.clinic_id,
        created_at: po.created_at,
        updated_at: now,
        deleted_at: null,
        po_number: po.number,
        number: po.number,
        supplier_id: po.supplier_id,
        supplier_name: supplier?.name || 'مورد',
        order_date: po.ordered_at || po.created_at,
        ordered_at: po.ordered_at,
        expected_date: po.expected_at,
        expected_at: po.expected_at,
        received_date: receivedDate,
        received_at: receivedDate,
        status: 'received',
        total_halalas: po.total_halalas,
        notes: po.notes,
        items: updatedItems,
      };
    }, customSqlite);
  }

  async updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus, customSqlite?: Database.Database): Promise<ApiResult<PurchaseOrder>> {
    return safeExecute(async () => {
      const sqlite = customSqlite || getSqlite();
      const now = new Date().toISOString();

      const po = sqlite.prepare('SELECT * FROM purchase_orders WHERE id = ? AND deleted_at IS NULL').get(id) as any;
      if (!po) throw new Error('أمر الشراء غير موجود');

      sqlite.prepare('UPDATE purchase_orders SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);

      const updated = sqlite.prepare(`
        SELECT po.*, s.name as supplier_name
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        WHERE po.id = ?
      `).get(id) as any;

      const rawItems = sqlite.prepare(`
        SELECT poi.*, i.name as item_name, i.unit as item_unit
        FROM purchase_order_items poi
        JOIN inventory_items i ON poi.item_id = i.id
        WHERE poi.po_id = ?
      `).all(id) as any[];

      const items: PurchaseOrderItem[] = rawItems.map((itm) => ({
        id: itm.id,
        item_id: itm.item_id,
        item_name: itm.item_name,
        unit: itm.item_unit || 'قطعة',
        quantity: itm.quantity,
        received_quantity: itm.received_quantity || 0,
        cost_halalas: itm.unit_cost_halalas,
        total_halalas: itm.quantity * itm.unit_cost_halalas,
      }));

      return {
        id: updated.id,
        clinic_id: updated.clinic_id,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
        deleted_at: null,
        po_number: updated.number,
        number: updated.number,
        supplier_id: updated.supplier_id,
        supplier_name: updated.supplier_name || 'مورد',
        order_date: updated.ordered_at || updated.created_at,
        ordered_at: updated.ordered_at,
        expected_date: updated.expected_at,
        expected_at: updated.expected_at,
        received_date: updated.received_at,
        received_at: updated.received_at,
        status: updated.status as PurchaseOrderStatus,
        total_halalas: updated.total_halalas,
        notes: updated.notes,
        items,
      };
    });
  }
}

export const inventoryRepo = new InventoryRepository();
