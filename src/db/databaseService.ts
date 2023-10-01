import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import initSqlJs from "sql.js";
import { File, Note } from "../types";
import { transformDbNoteToNote } from "../utils/utilities";

class DatabaseService {
  private SQL: any = null;
  private dbInstance: any = null;
  private dbFilePath: string | null = null;

  constructor() {
    this.SQL = null;
    this.dbInstance = null;
    this.dbFilePath = null;
  }

  getDbFilePath(): string|null {
    return this.dbFilePath;
  }
  setGlobalStoragePath(globalStorageUri: vscode.Uri): void {
    const globalPath = globalStorageUri.fsPath;
    if (!fs.existsSync(globalPath)) {
      fs.mkdirSync(globalPath);
    }
    this.dbFilePath = path.join(globalPath, "db.sqlite");
  }

  async initializeSQLJs(): Promise<any> {
    if (!this.SQL) {
      try {
        this.SQL = await initSqlJs();
      } catch (error: any) {
        throw new Error("Failed to initialize sql.js: " + error.message);
      }
    }
    return this.SQL;
  }

  loadDatabase(): any {
    if (!this.dbInstance) {
      console.log("Loading DB from memory");
      if (fs.existsSync(this.dbFilePath!)) {
        this.dbInstance = new this.SQL.Database(
          fs.readFileSync(this.dbFilePath!)
        );
      } else {
        this.dbInstance = new this.SQL.Database();
      }
    }
    return this.dbInstance;
  }

  saveDatabase(db: any): void {
    const updatedData = db.export();
    const updatedBuffer = Buffer.from(updatedData);
    fs.writeFileSync(this.dbFilePath!, updatedBuffer);
  }

  insertWorkspace(name: string, path: string): void {
    const db = this.loadDatabase();
    db.run("INSERT INTO workspaces (name, path) VALUES (?, ?);", [name, path]);
    this.saveDatabase(db);
  }

  getWorkspaceIdByName(name: string): number {
    const db = this.loadDatabase();
    const stmt = db.prepare("SELECT * FROM workspaces WHERE name = $name");
    const res = stmt.getAsObject({ $name: name });
    return res.id;
  }

  getWorkspacePathByName(name: string): string {
    const db = this.loadDatabase();
    const stmt = db.prepare("SELECT * FROM workspaces WHERE name = $name");
    const res = stmt.getAsObject({ $name: name });
    return res.path;
  }

  insertFile(relativePath: string, workspaceId: number): void {
    const db = this.loadDatabase();
    db.run("INSERT INTO files (relative_path, workspace_id) VALUES (?, ?);", [
      relativePath,
      workspaceId,
    ]);
    this.saveDatabase(db);
  }

  getFileIdByPath(
    relativePath: string,
    workspaceId: number,
    insertIfNotExists: boolean = false,
  ): number {
    const db = this.loadDatabase();
    const stmt = db.prepare(
      "SELECT * FROM files WHERE relative_path = $relative_path"
    );
    const res = stmt.getAsObject({ $relative_path: relativePath });
    if (!res.id && insertIfNotExists) {
      this.insertFile(relativePath, workspaceId);
      return this.getFileIdByPath(relativePath, workspaceId);
    }
    return res.id;
  }

  getPathByFileId(fileId: number): string {
    const db = this.loadDatabase();
    const stmt = db.prepare("SELECT * FROM files WHERE id = $id");
    const res = stmt.getAsObject({ $id: fileId });
    return res.relative_path;
  }

  deleteFile(id: number): void {
    const db = this.loadDatabase();
    const stmt = db.prepare("DELETE FROM files WHERE id = ?;");
    stmt.run(id);
    this.saveDatabase(db);
  }

  async insertNote(note: Note): Promise<number> {
    const db = this.loadDatabase();
    db.run(
      "INSERT INTO notes (title, note_text, code_text, start_line, end_line, language_id, file_id) VALUES (?, ?, ?, ?, ?, ?, ?);",
      [note.title, note.noteText, note.codeText, note.startLine, note.endLine, note.languageId, note.fileId]
    );
    const rowId = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
    this.saveDatabase(db);
    return rowId;
}

  async updateNote(note: Note) {
    const db = this.loadDatabase();
    db.run("UPDATE notes SET title = ?, note_text = ?, code_text = ?, start_line = ?, end_line = ?, file_id = ? WHERE id = ?;",
    [note.title, note.noteText, note.codeText, note.startLine, note.endLine, note.fileId, note.id])
    this.saveDatabase(db);
  }

  deleteNote(id: number) {
    const db = this.loadDatabase();
    db.run("DELETE FROM notes WHERE id = ?;", [id]);
    this.saveDatabase(db);
  }
  
  getNoteById(id: number): any {
    const db = this.loadDatabase();
    const stmt = db.prepare("SELECT * FROM notes WHERE id = ?;");
    const res = stmt.getAsObject([id]);
    return res;
  }

  getNoteTextFromLine(line: number, fileId: number): string {
    const db = this.loadDatabase();
    const stmt = db.prepare(
      "SELECT * FROM notes WHERE file_id = ? AND ? BETWEEN start_line AND end_line;"
    );
    const res = stmt.getAsObject([fileId, line]);
    return res.note_text.toString();
  }

  async getNotesFromFileId(fileId: number): Promise<Note[]> {
    const db = this.loadDatabase();
    const stmt = db.prepare("SELECT * FROM notes WHERE file_id = ?");
    stmt.bind([fileId]);
    const rows: Note[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const transformedRow = transformDbNoteToNote(row)
      transformedRow.noteText = transformedRow.noteText.toString();
      rows.push(transformedRow);
    }
    return rows;
  }

  async getFilesFromWorkspaceId(workspaceId: number): Promise<any[]> {
    const db = this.loadDatabase();
    const stmt = db.prepare("SELECT * FROM files WHERE workspace_id = ?");
    stmt.bind([workspaceId]);
    const rows: any[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    return rows;
  }

  updateNoteCategory(id: number, category: string): void {
    const db = this.loadDatabase();
    db.run("UPDATE notes SET category = ? WHERE id = ?;", [category, id]);
    this.saveDatabase(db);
  }
}

export default new DatabaseService();
