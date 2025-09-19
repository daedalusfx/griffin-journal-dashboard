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

    // ۱. تعریف اسکیمای کامل جدول trades با تمام فیلدهای جدید
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
            exitPrice REAL,
            attachments TEXT,
            riskRewardRatio TEXT,
            timeframe TEXT,
            accountType TEXT,
            outcome TEXT,
            chartLinks TEXT
        );
    `);

    // ۲. ساخت جدول گزارش روزانه (بدون تغییر)
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

    // ۳. سیستم مهاجرت (Migration) برای افزودن ستون‌های جدید به دیتابیس‌های قدیمی
    const columns = db.prepare(`PRAGMA table_info(trades)`).all();
    const existingColumns = columns.map((col: any) => col.name);

    const newColumns = {
        attachments: 'TEXT',
        riskRewardRatio: 'TEXT',
        timeframe: 'TEXT',
        accountType: 'TEXT',
        outcome: 'TEXT',
        chartLinks: 'TEXT'
    };

    for (const [colName, colType] of Object.entries(newColumns)) {
        if (!existingColumns.includes(colName)) {
            console.log(`[DB Migration] Adding column "${colName}" to trades table.`);
            db.exec(`ALTER TABLE trades ADD COLUMN ${colName} ${colType}`);
        }
    }
    
    console.log(`Database initialized at: ${dbPath}`);
}

// Helper function to parse trade rows safely
function parseTradeRow(row: any) {
    return {
        ...row,
        checklist: row.checklist ? JSON.parse(row.checklist) : null,
        tags: row.tags ? JSON.parse(row.tags) : [],
        attachments: row.attachments ? JSON.parse(row.attachments) : [],
        // فیلد جدید
        chartLinks: row.chartLinks ? JSON.parse(row.chartLinks) : [],
    };
}


export const registerDatabaseHandlers = () => {
    if (!db) {
        initDatabase();
    }

    // --- SELECT ---
    handle('db-load-trades', () => {
        const stmt = db.prepare('SELECT * FROM trades ORDER BY entryDate DESC');
        const rows = stmt.all();
        return rows.map(parseTradeRow);
    });
    
    // --- INSERT (Manual) ---
    handle('db-add-trade', (trade) => {
        const stmt = db.prepare(`
            INSERT INTO trades (symbol, type, volume, pnl, entryDate, exitDate, strategy, checklist, tags, commission, swap, entryPrice, exitPrice, attachments, riskRewardRatio, timeframe, accountType, outcome, chartLinks)
            VALUES (@symbol, @type, @volume, @pnl, @entryDate, @exitDate, @strategy, @checklist, @tags, @commission, @swap, @entryPrice, @exitPrice, @attachments, @riskRewardRatio, @timeframe, @accountType, @outcome, @chartLinks)
        `);
        const result = stmt.run({
            ...trade,
            checklist: JSON.stringify(trade.checklist || null),
            tags: JSON.stringify(trade.tags || []),
            attachments: JSON.stringify(trade.attachments || []),
            chartLinks: JSON.stringify(trade.chartLinks || []),
            commission: trade.commission || 0,
            swap: trade.swap || 0,
            entryPrice: trade.entryPrice || 0,
            exitPrice: trade.exitPrice || 0,
        });
        
        const newTrade = db.prepare('SELECT * FROM trades WHERE id = ?').get(result.lastInsertRowid);
        return parseTradeRow(newTrade);
    });

    // --- DELETE ---
    handle('db-delete-trade', (id) => {
        db.prepare('DELETE FROM trades WHERE id = ?').run(id);
    });

    // --- UPDATE (Full Trade Edit) ---
    handle('db-update-trade', (trade) => {
        const stmt = db.prepare(`
            UPDATE trades SET
                symbol = @symbol, type = @type, volume = @volume, pnl = @pnl,
                entryDate = @entryDate, exitDate = @exitDate, strategy = @strategy,
                checklist = @checklist, tags = @tags, commission = @commission,
                swap = @swap, entryPrice = @entryPrice, exitPrice = @exitPrice,
                riskRewardRatio = @riskRewardRatio, timeframe = @timeframe,
                accountType = @accountType, outcome = @outcome, chartLinks = @chartLinks
            WHERE id = @id
        `);
        stmt.run({
            ...trade,
            checklist: JSON.stringify(trade.checklist || null),
            tags: JSON.stringify(trade.tags || []),
            chartLinks: JSON.stringify(trade.chartLinks || []),
        });
        const updatedTrade = db.prepare('SELECT * FROM trades WHERE id = ?').get(trade.id);
        return parseTradeRow(updatedTrade);
    });

    // --- UPDATE (Review Modal) ---
    handle('db-update-trade-review', (id, checklist, tags, strategy) => {
        db.prepare(`
            UPDATE trades SET checklist = ?, tags = ?, strategy = ? WHERE id = ?
        `).run(JSON.stringify(checklist), JSON.stringify(tags), strategy, id);
    });
    
    // --- INSERT (Bulk from MT5) ---
    handle('db-bulk-add-trades', (trades) => {
        // ... (This handler can remain as is, as imported trades won't have the new fields initially)
        const stmt = db.prepare(`
            INSERT INTO trades (id, symbol, type, volume, pnl, entryDate, exitDate, strategy, commission, swap, entryPrice, exitPrice)
            VALUES (@id, @symbol, @type, @volume, @pnl, @entryDate, @exitDate, @strategy, @commission, @swap, @entryPrice, @exitPrice)
            ON CONFLICT(id) DO NOTHING
        `);
        const insertMany = db.transaction((items) => {
            for (const item of items) stmt.run(item);
        });
        insertMany(trades);
        const allTrades = db.prepare('SELECT * FROM trades ORDER BY entryDate DESC').all();
        return allTrades.map(parseTradeRow);
    });

    // --- ATTACHMENTS ---
    handle('db-add-attachment', (tradeId, attachmentName) => {
        const trade = db.prepare('SELECT attachments FROM trades WHERE id = ?').get(tradeId);
        if (trade) {
            const attachments = trade.attachments ? JSON.parse(trade.attachments) : [];
            attachments.push(attachmentName);
            db.prepare('UPDATE trades SET attachments = ? WHERE id = ?').run(JSON.stringify(attachments), tradeId);
        }
    });

    // --- DAILY LOG ---
    handle('db-save-daily-log', (logData) => {
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


handle('db-get-unique-field-values', (fieldName: string) => {
    // WARNING: This is safe only for known column names to prevent SQL injection.
    const allowedFields = ['strategy', 'symbol', 'timeframe', 'accountType', 'outcome','riskRewardRatio'];
    if (!allowedFields.includes(fieldName)) {
        throw new Error(`Invalid field name for unique value query: ${fieldName}`);
    }

    // The following is safe because fieldName is checked against a whitelist.
    const stmt = db.prepare(`SELECT DISTINCT ${fieldName} FROM trades WHERE ${fieldName} IS NOT NULL AND ${fieldName} != ''`);
    const rows = stmt.all();
    return rows.map(row => row[fieldName]);
});


handle('db-get-unique-tags', () => {
    const stmt = db.prepare(`SELECT tags FROM trades WHERE tags IS NOT NULL AND tags != '[]'`);
    const rows = stmt.all();
    const allTags = new Set<string>();

    rows.forEach(row => {
        try {
            const tags = JSON.parse(row.tags);
            if (Array.isArray(tags)) {
                tags.forEach(tag => allTags.add(tag));
            }
        } catch (e) {
            // Ignore parsing errors for malformed data
        }
    });

    return Array.from(allTags); // تبدیل Set به Array برای ارسال
});
}