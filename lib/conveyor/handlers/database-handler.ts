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

    // ساختار صحیح و کامل جدول
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
    console.log(`Database initialized at: ${dbPath}`);
}

export const registerDatabaseHandlers = () => {
    if (!db) {
        initDatabase();
    }

    handle('db-load-trades', () => {
        console.log('[DB] Received request: db-load-trades');
        const stmt = db.prepare('SELECT * FROM trades ORDER BY entryDate DESC');
        const rows = stmt.all();
        console.log(`[DB] Found ${rows.length} trades to load.`);
        return rows.map((row: any) => ({
            ...row,
            checklist: row.checklist ? JSON.parse(row.checklist) : null,
            tags: row.tags ? JSON.parse(row.tags) : [],
        }));
    });
    
    handle('db-add-trade', (trade) => {
        console.log('[DB] Received request: db-add-trade with data:', trade);
        const stmt = db.prepare(`
            INSERT INTO trades (symbol, type, volume, pnl, entryDate, exitDate, strategy, checklist, tags, commission, swap, entryPrice, exitPrice)
            VALUES (@symbol, @type, @volume, @pnl, @entryDate, @exitDate, @strategy, @checklist, @tags, @commission, @swap, @entryPrice, @exitPrice)
        `);
        const result = stmt.run({
            ...trade,
            checklist: JSON.stringify(trade.checklist || null),
            tags: JSON.stringify(trade.tags || []),
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
        };
    });

    handle('db-delete-trade', (id) => {
        console.log(`[DB] Received request: db-delete-trade for id: ${id}`);
        const result = db.prepare('DELETE FROM trades WHERE id = ?').run(id);
        console.log(`[DB] Deleted ${result.changes} rows.`);
    });

    handle('db-update-trade-review', (id, checklist, tags) => {
        console.log(`[DB] Received request: db-update-trade-review for id: ${id}`);
        const result = db.prepare(`
            UPDATE trades
            SET checklist = ?, tags = ?
            WHERE id = ?
        `).run(JSON.stringify(checklist), JSON.stringify(tags), id);
        console.log(`[DB] Updated ${result.changes} rows.`);
    });
    
    handle('db-bulk-add-trades', (trades) => {
        console.log(`[DB] Received request: db-bulk-add-trades with ${trades.length} trades.`);
        const stmt = db.prepare(`
            INSERT INTO trades (id, symbol, type, volume, pnl, entryDate, exitDate, strategy, commission, swap, entryPrice, exitPrice)
            VALUES (@id, @symbol, @type, @volume, @pnl, @entryDate, @exitDate, @strategy, @commission, @swap, @entryPrice, @exitPrice)
            ON CONFLICT(id) DO UPDATE SET
                pnl=excluded.pnl, exitDate=excluded.exitDate, commission=excluded.commission, swap=excluded.swap
        `);
    
        const insertMany = db.transaction((items) => {
            for (const item of items) {
                const payload = {
                    ...item,
                    entryDate: new Date(item.entryDate).toISOString(),
                    exitDate: new Date(item.exitDate).toISOString()
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
        }));
    });
}

