import { handle } from '@/lib/main/shared';
import Database from 'better-sqlite3';
import { dialog } from 'electron';

// تابع کمکی برای بررسی وجود جدول
function tableExists(db: Database.Database, tableName: string): boolean {
  const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?");
  const result = stmt.get(tableName);
  return !!result;
}

export const registerFileHandlers = () => {
  handle('db-read-trades', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'SQLite Database', extensions: ['sqlite', 'db'] }],
    })

    if (canceled || filePaths.length === 0) {
      return null
    }

    const dbPath = filePaths[0];
    let db;

    try {
      db = new Database(dbPath, { readonly: true });
      let rows: any[];

      if (tableExists(db, 'TRADES')) {
        // حالت اول: جدول TRADES وجود دارد (حساب هجینگ)
        console.log("TRADES table found. Reading directly.");
        const stmt = db.prepare('SELECT * FROM TRADES');
        rows = stmt.all();
      } else if (tableExists(db, 'DEALS')) {
        // حالت دوم: فقط جدول DEALS وجود دارد (حساب نتینگ)
        console.log("TRADES table not found. Constructing trades from DEALS.");
        const query = `
          SELECT 
             d1.POSITION_ID as TICKET,
             d1.SYMBOL,
             d1.TYPE,
             d1.VOLUME,
             d2.PROFIT,
             d1.TIME as TIME_IN,
             d2.TIME as TIME_OUT,
             d1.COMMISSION + d2.COMMISSION as COMMISSION,
             d2.SWAP,
             d1.PRICE as PRICE_IN,
             d2.PRICE as PRICE_OUT
          FROM DEALS d1
          INNER JOIN DEALS d2 ON d1.POSITION_ID = d2.POSITION_ID
          WHERE d1.ENTRY = 0 AND d2.ENTRY = 1
        `;
        const stmt = db.prepare(query);
        rows = stmt.all();
      } else {
        // هیچکدام از جدول‌های مورد نیاز وجود ندارند
        throw new Error("Neither TRADES nor DEALS table found in the database.");
      }

      // تبدیل داده‌های خام به فرمت مورد نیاز رابط کاربری
      const trades = rows.map((row: any) => ({
        id: row.TICKET,
        symbol: row.SYMBOL,
        type: row.TYPE === 0 ? 'Buy' : 'Sell',
        volume: row.VOLUME,
        pnl: row.PROFIT,
        entryDate: new Date(row.TIME_IN * 1000),
        exitDate: new Date(row.TIME_OUT * 1000),
        commission: row.COMMISSION,
        swap: row.SWAP,
        entryPrice: row.PRICE_IN,
        exitPrice: row.PRICE_OUT,
        strategy: 'Imported',
      }));

      return trades;
    } catch (error) {
      console.error('Failed to read from SQLite database:', error);
      dialog.showErrorBox('خطا در خواندن فایل', `فایل انتخاب شده یک پایگاه داده معتبر برای ژورنال نیست.\n\nجزئیات خطا: ${error.message}`);
      return null;
    } finally {
        if (db) {
            db.close();
        }
    }
  })
}

