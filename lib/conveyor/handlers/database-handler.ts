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

    db.exec(`
        CREATE TABLE IF NOT EXISTS daily_log (
            date TEXT PRIMARY KEY,                       -- تاریخ 'YYYY-MM-DD'
    
            -- === مرحله ۱: آمادگی قبل از بازار ===
            pre_market_focus INTEGER,                    -- میزان تمرکز قبل از شروع (۱ تا ۵)
            pre_market_preparation INTEGER,              -- میزان آمادگی و تحلیل (۱ تا ۵)
            mindfulness_state TEXT,                      -- وضعیت ذهنی (مثلا: آرام، مضطرب، هیجان‌زده)
    
            -- === مرحله ۲: نظم و انضباط در حین بازار ===
            adherence_to_rules INTEGER,                  -- پایبندی به قوانین استراتژی (۱ تا ۵)
            impulsive_trades_count INTEGER,              -- تعداد معاملات هیجانی/خارج از برنامه
            hesitation_on_entry INTEGER,                 -- میزان تردید در ورود (۱=کم, ۵=زیاد)
            premature_exit_count INTEGER,                -- تعداد خروج‌های زودهنگام (به دلیل ترس)
    
            -- === مرحله ۳: بازبینی و ریکاوری بعد از بازار ===
            post_market_review_quality INTEGER,          -- کیفیت بازبینی معاملات (۱ تا ۵)
            emotional_state_after TEXT,                  -- وضعیت احساسی در پایان روز (مثلا: راضی، خشمگین، بی‌تفاوت)
            daily_lesson_learned TEXT                    -- مهم‌ترین درسی که امروز یاد گرفتم
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
    handle('db-update-trade', (trade) => {
        console.log(`[DB] Received request: db-update-trade for id: ${trade.id}`);
        const stmt = db.prepare(`
            UPDATE trades
            SET
                symbol = @symbol,
                type = @type,
                volume = @volume,
                pnl = @pnl,
                entryDate = @entryDate,
                exitDate = @exitDate,
                strategy = @strategy,
                checklist = @checklist,
                tags = @tags,
                commission = @commission,
                swap = @swap,
                entryPrice = @entryPrice,
                exitPrice = @exitPrice
            WHERE id = @id
        `);

        const result = stmt.run({
            ...trade,
            checklist: JSON.stringify(trade.checklist || null),
            tags: JSON.stringify(trade.tags || []),
        });
        console.log(`[DB] Updated ${result.changes} rows.`);

        const updatedTrade = db.prepare('SELECT * FROM trades WHERE id = ?').get(trade.id);
        return {
             ...updatedTrade,
             checklist: updatedTrade.checklist ? JSON.parse(updatedTrade.checklist) : null,
             tags: updatedTrade.tags ? JSON.parse(updatedTrade.tags) : [],
             attachments: updatedTrade.attachments ? JSON.parse(updatedTrade.attachments) : [],
        };
    });

handle('db-save-daily-log', (logData) => {
    console.log(`[DB] Saving daily log for date: ${logData.date}`);
    const stmt = db.prepare(`
        INSERT INTO daily_log (date, pre_market_focus, pre_market_preparation, mindfulness_state, adherence_to_rules, impulsive_trades_count, hesitation_on_entry, premature_exit_count, post_market_review_quality, emotional_state_after, daily_lesson_learned)
        VALUES (@date, @pre_market_focus, @pre_market_preparation, @mindfulness_state, @adherence_to_rules, @impulsive_trades_count, @hesitation_on_entry, @premature_exit_count, @post_market_review_quality, @emotional_state_after, @daily_lesson_learned)
        ON CONFLICT(date) DO UPDATE SET
            pre_market_focus = excluded.pre_market_focus,
            pre_market_preparation = excluded.pre_market_preparation,
            mindfulness_state = excluded.mindfulness_state,
            adherence_to_rules = excluded.adherence_to_rules,
            impulsive_trades_count = excluded.impulsive_trades_count,
            hesitation_on_entry = excluded.hesitation_on_entry,
            premature_exit_count = excluded.premature_exit_count,
            post_market_review_quality = excluded.post_market_review_quality,
            emotional_state_after = excluded.emotional_state_after,
            daily_lesson_learned = excluded.daily_lesson_learned
    `);
    stmt.run(logData);
});
}

