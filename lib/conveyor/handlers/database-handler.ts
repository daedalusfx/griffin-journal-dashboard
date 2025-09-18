import { handle } from '@/lib/main/shared';
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

const dbPath = path.join(app.getPath('userData'), 'journal.sqlite');
let db: Database.Database;

// تابع برای بستن امن دیتابیس
export function closeDatabase() {
    if (db) {
        db.close();
        console.log('Database connection closed.');
    }
}

function initDatabase() {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    // FIX: اضافه کردن ستون attachments
    db.exec(`
        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY,
            symbol TEXT NOT NULL,
            type TEXT NOT NULL,
            volume REAL NOT NULL,
            pnl REAL NOT NULL,
            entryDate TEXT NOT NULL,
            exitDate TEXT NOT NULL,
            strategy TEXT,
            checklist TEXT,
            tags TEXT,
            commission REAL,
            swap REAL,
            entryPrice REAL,
            exitPrice REAL
        );
    `);


    const columns = db.prepare(`PRAGMA table_info(trades)`).all();
    const hasAttachmentsColumn = columns.some((col: any) => col.name === 'attachments');

    // اگر ستون وجود نداشت، آن را اضافه کن
    if (!hasAttachmentsColumn) {
        console.log('[DB] Migrating database: Adding "attachments" column to trades table.');
        db.exec(`ALTER TABLE trades ADD COLUMN attachments TEXT`);
    }



    console.log(`Database initialized at: ${dbPath}`);
}

export const registerDatabaseHandlers = () => {
    if (!db) {
        initDatabase();
    }

    // --- SELECT ---
    handle('db-load-trades', () => {
        console.log('[DB] Received request: db-load-trades');
        const stmt = db.prepare('SELECT * FROM trades ORDER BY entryDate DESC');
        const rows = stmt.all();
        console.log(`[DB] Found ${rows.length} trades to load.`);
        return rows.map((row: any) => ({
            ...row,
            checklist: row.checklist ? JSON.parse(row.checklist) : null,
            tags: row.tags ? JSON.parse(row.tags) : [],
            attachments: row.attachments ? JSON.parse(row.attachments) : [], // FIX: خواندن ضمیمه‌ها
        }));
    });
    
    // --- INSERT (Manual) ---
    handle('db-add-trade', (trade) => {
        console.log('[DB] Received request: db-add-trade with data:', trade);
        const stmt = db.prepare(`
            INSERT INTO trades (symbol, type, volume, pnl, entryDate, exitDate, strategy, checklist, tags, commission, swap, entryPrice, exitPrice, attachments)
            VALUES (@symbol, @type, @volume, @pnl, @entryDate, @exitDate, @strategy, @checklist, @tags, @commission, @swap, @entryPrice, @exitPrice, @attachments)
        `);
        const result = stmt.run({
            ...trade,
            checklist: JSON.stringify(trade.checklist || null),
            tags: JSON.stringify(trade.tags || []),
            attachments: JSON.stringify(trade.attachments || []), // FIX: ذخیره ضمیمه‌ها
            commission: trade.commission || 0,
            swap: trade.swap || 0,
            entryPrice: trade.entryPrice || 0,
            exitPrice: trade.exitPrice || 0,
        });
        
        const newTrade = db.prepare('SELECT * FROM trades WHERE id = ?').get(result.lastInsertRowid);
        return {
             ...newTrade,
             checklist: newTrade.checklist ? JSON.parse(newTrade.checklist) : null,
             tags: newTrade.tags ? JSON.parse(newTrade.tags) : [],
             attachments: newTrade.attachments ? JSON.parse(newTrade.attachments) : [], // FIX: بازگرداندن ضمیمه‌ها
        };
    });

    // --- DELETE ---
    handle('db-delete-trade', (id) => {
        console.log(`[DB] Received request: db-delete-trade for id: ${id}`);
        const result = db.prepare('DELETE FROM trades WHERE id = ?').run(id);
        console.log(`[DB] Deleted ${result.changes} rows.`);
    });

    // --- UPDATE (Review Modal) ---
    handle('db-update-trade-review', (id, checklist, tags, strategy) => {
        console.log(`[DB] Received request: db-update-trade-review for id: ${id}`);
        const result = db.prepare(`
            UPDATE trades
            SET checklist = ?, tags = ?, strategy = ?
            WHERE id = ?
        `).run(JSON.stringify(checklist), JSON.stringify(tags), strategy, id);
        console.log(`[DB] Updated ${result.changes} rows.`);
    });
    
    // --- INSERT (Bulk from MT5) ---
    handle('db-bulk-add-trades', (trades) => {
        console.log(`[DB] Received request: db-bulk-add-trades with ${trades.length} trades.`);
        const stmt = db.prepare(`
            INSERT INTO trades (id, symbol, type, volume, pnl, entryDate, exitDate, strategy, commission, swap, entryPrice, exitPrice, attachments)
            VALUES (@id, @symbol, @type, @volume, @pnl, @entryDate, @exitDate, @strategy, @commission, @swap, @entryPrice, @exitPrice, @attachments)
            ON CONFLICT(id) DO UPDATE SET
                pnl=excluded.pnl, exitDate=excluded.exitDate, commission=excluded.commission, swap=excluded.swap
        `);
    
        const insertMany = db.transaction((items) => {
            for (const item of items) {
                const payload = {
                    ...item,
                    entryDate: new Date(item.entryDate).toISOString(),
                    exitDate: new Date(item.exitDate).toISOString(),
                    attachments: JSON.stringify([]), // معاملات وارداتی در ابتدا ضمیمه ندارند
                };
                stmt.run(payload);
            }
        });
    
        insertMany(trades);
        console.log('[DB] Bulk insert/update completed.');
    
        const allTrades = db.prepare('SELECT * FROM trades ORDER BY entryDate DESC').all();
        return allTrades.map((row: any) => ({
            ...row,
            checklist: row.checklist ? JSON.parse(row.checklist) : null,
            tags: row.tags ? JSON.parse(row.tags) : [],
            attachments: row.attachments ? JSON.parse(row.attachments) : [],
        }));
    });

    // کانال جدید برای ذخیره کردن یک ضمیمه جدید
    handle('db-add-attachment', (tradeId, attachmentName) => {
        const trade = db.prepare('SELECT attachments FROM trades WHERE id = ?').get(tradeId);
        if (trade) {
            const attachments = trade.attachments ? JSON.parse(trade.attachments) : [];
            attachments.push(attachmentName);
            db.prepare('UPDATE trades SET attachments = ? WHERE id = ?').run(JSON.stringify(attachments), tradeId);
        }
    });
}

