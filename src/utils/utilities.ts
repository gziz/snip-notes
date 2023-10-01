import { DbNote, Note } from "../types";


export const transformDbNoteToNote = (dbNote: DbNote): Note => {
    const transformed: any = {};
    for (const key in dbNote) {
      if (Object.prototype.hasOwnProperty.call(dbNote, key)) { // this ensures that you're not iterating over inherited properties
        const camelCaseKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
        transformed[camelCaseKey] = (dbNote as any)[key]; // using type assertion here
      }
    }
    return transformed as Note;
  }
  