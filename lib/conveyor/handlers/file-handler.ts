import { handle } from '@/lib/main/shared';
import Database from 'better-sqlite3';
import { app, dialog } from 'electron';
import fs from 'fs'; // این خط را اضافه کنید
import path from 'path'; // این خط را اضافه کنید
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
        console.log("TRADES table found. Reading directly.");
        const stmt = db.prepare('SELECT * FROM TRADES');
        rows = stmt.all();
      } else if (tableExists(db, 'DEALS')) {
        console.log("TRADES table not found. Constructing trades from DEALS.");
        const query = `
          SELECT 
             d1.POSITION_ID as TICKET, d1.SYMBOL, d1.TYPE, d1.VOLUME, d2.PROFIT,
             d1.TIME as TIME_IN, d2.TIME as TIME_OUT,
             d1.COMMISSION + d2.COMMISSION as COMMISSION, d2.SWAP,
             d1.PRICE as PRICE_IN, d2.PRICE as PRICE_OUT
          FROM DEALS d1
          INNER JOIN DEALS d2 ON d1.POSITION_ID = d2.POSITION_ID
          WHERE d1.ENTRY = 0 AND d2.ENTRY = 1
        `;
        const stmt = db.prepare(query);
        rows = stmt.all();
      } else {
        throw new Error("Neither TRADES nor DEALS table found in the database.");
      }

      // FIX: تبدیل تاریخ‌ها به رشته ISO قبل از ارسال به رابط کاربری
      const trades = rows.map((row: any) => ({
        id: row.TICKET,
        symbol: row.SYMBOL,
        type: row.TYPE === 0 ? 'Buy' : 'Sell',
        volume: row.VOLUME,
        pnl: row.PROFIT,
        entryDate: new Date(row.TIME_IN * 1000).toISOString(),
        exitDate: new Date(row.TIME_OUT * 1000).toISOString(),
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
  });
  handle('file-add-attachment', async (tradeId: number) => {
    if (!tradeId) {
        console.error('Attachment cannot be added without a tradeId.');
        return null;
    }

    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        title: 'انتخاب فایل ضمیمه',
        buttonLabel: 'ضمیمه کن',
    });

    if (canceled || filePaths.length === 0) {
        return null;
    }

    const selectedFilePath = filePaths[0];
    const attachmentsDir = path.join(app.getPath('userData'), 'attachments');

    // اگر پوشه ضمیمه‌ها وجود ندارد، آن را بساز
    if (!fs.existsSync(attachmentsDir)) {
        fs.mkdirSync(attachmentsDir);
    }

    // یک نام منحصر به فرد برای فایل جدید بساز
    const newFileName = `${tradeId}-${Date.now()}-${path.basename(selectedFilePath)}`;
    const newFilePath = path.join(attachmentsDir, newFileName);

    try {
        // فایل انتخاب شده را به پوشه ضمیمه‌ها کپی کن
        fs.copyFileSync(selectedFilePath, newFilePath);
        console.log(`Attachment copied to: ${newFilePath}`);
        // نام جدید فایل را برگردان تا در دیتابیس ذخیره شود
        return newFileName;
    } catch (error) {
        console.error('Failed to copy attachment file:', error);
        dialog.showErrorBox('خطا در ضمیمه کردن فایل', `مشکلی در کپی کردن فایل به وجود آمد: \n\n${error.message}`);
        return null;
    }
});
}

