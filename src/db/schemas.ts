import * as fs from 'fs';
import databaseService from './databaseService';

export async function initializeTables(): Promise<void> {
    const db = await databaseService.loadDatabase();

    db.run(`CREATE TABLE IF NOT EXISTS workspaces (
        id INTEGER PRIMARY KEY, 
        name TEXT UNIQUE,
        path TEXT UNIQUE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY, 
        relative_path TEXT,
        workspace_id INTEGER, 
        FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY,
        title TEXT,
        note_text TEXT, 
        code_text TEXT,
        start_line INTEGER,
        end_line INTEGER,
        language_id TEXT,
        category TEXT,
        file_id INTEGER,
        createdDate TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(file_id) REFERENCES files(id)
    )`);

    databaseService.saveDatabase(db);
}

export async function isDbExistent(): Promise<void> {
    const dbFilePath = databaseService.getDbFilePath();
    console.log(dbFilePath);
    if (dbFilePath && !fs.existsSync(dbFilePath)) {
        await initializeTables();
    }
}
