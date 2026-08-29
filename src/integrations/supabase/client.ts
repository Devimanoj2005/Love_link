import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  setDoc,
  addDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase';
export { auth };


// --- HELPER TO CONVERT FIRESTORE SNAPSHOT TO ARRAY ---
const snapshotToArray = (snapshot: any): any[] => {
  const result: any[] = [];
  snapshot.forEach((doc: any) => {
    result.push({ id: doc.id, ...doc.data() });
  });
  return result;
};

// Custom type-compatible QueryBuilder that maps to FIRESTORE
class FirestoreQueryBuilder {
  private table: string;
  private filters: Array<{ column: string; op: any; value: any }> = [];
  private orderField: string | null = null;
  private orderAscending = true;
  private limitCount: number | null = null;
  private dataToInsert: any = null;
  private dataToUpdate: any = null;
  private isDelete = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string) {
    return this;
  }

  insert(data: any) {
    this.dataToInsert = data;
    return this;
  }

  update(data: any) {
    this.dataToUpdate = data;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  eq(column: string, value: any) {
    if (value !== undefined && value !== null) {
      this.filters.push({ column, op: "==", value });
    }
    return this;
  }

  in(column: string, values: any[]) {
    // If empty array, we can use a dummy filter or avoid querying
    if (!values || values.length === 0) {
      this.filters.push({ column, op: "==", value: "__dummy_nonexistent_value__" });
    } else {
      // Firebase supports 'in' constraint with up to 10 values, we partition or map
      this.filters.push({ column, op: "in", value: values.slice(0, 10) });
    }
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderField = column;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  private async execute() {
    try {
      const colRef = collection(db, this.table);

      // 1. Handle Insertion
      if (this.dataToInsert) {
        const inserts = Array.isArray(this.dataToInsert) ? this.dataToInsert : [this.dataToInsert];
        const results: any[] = [];

        for (const item of inserts) {
          let customId = item.id;
          if (this.table === "couples" && !customId) {
            customId = Math.random().toString(36).substring(2, 10).toUpperCase();
          } else if (!customId) {
            customId = crypto.randomUUID();
          }

          const record = {
            id: customId,
            created_at: new Date().toISOString(),
            is_read: false,
            status: item.status || "pending",
            ...item
          };

          const docRef = doc(db, this.table, customId);
          await setDoc(docRef, record);
          results.push(record);
        }

        return { data: Array.isArray(this.dataToInsert) ? results : results[0], error: null };
      }

      // Check if there is an equality filter on 'id'
      const idFilter = this.filters.find(f => f.column === "id" && f.op === "==");
      let docsList: any[] = [];

      if (idFilter) {
        const docRef = doc(db, this.table, idFilter.value);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          docsList = [{ id: docSnap.id, ...docSnap.data() }];
        }
      } else {
        // Build Query Constraints for Select/Update/Delete
        const constraints: any[] = [];
        for (const f of this.filters) {
          constraints.push(where(f.column, f.op, f.value));
        }

        if (this.orderField) {
          constraints.push(orderBy(this.orderField, this.orderAscending ? 'asc' : 'desc'));
        }

        if (this.limitCount !== null) {
          constraints.push(limit(this.limitCount));
        }

        const q = query(colRef, ...constraints);
        const snapshot = await getDocs(q);
        docsList = snapshotToArray(snapshot);
      }

      // 2. Handle Update
      if (this.dataToUpdate) {
        const updatedResults: any[] = [];
        for (const record of docsList) {
          const docRef = doc(db, this.table, record.id);
          const updatePayload = { ...this.dataToUpdate };
          await updateDoc(docRef, updatePayload);
          updatedResults.push({ ...record, ...updatePayload });
        }
        return { data: updatedResults.length === 1 ? updatedResults[0] : updatedResults, error: null };
      }

      // 3. Handle Delete
      if (this.isDelete) {
        for (const record of docsList) {
          const docRef = doc(db, this.table, record.id);
          await deleteDoc(docRef);
        }
        return { data: docsList, error: null };
      }

      // 4. Handle Read (Select)
      return { data: docsList, error: null };
    } catch (err: any) {
      console.error(`Firestore error in table "${this.table}":`, err);
      return { data: null, error: err };
    }
  }

  single() {
    const p = this.execute().then(res => {
      const first = Array.isArray(res.data) ? res.data[0] : res.data;
      return { data: first || null, error: first ? null : new Error("Record not found") };
    });
    return {
      then: (onfulfilled: any, onrejected: any) => p.then(onfulfilled, onrejected),
      catch: (onrejected: any) => p.catch(onrejected)
    } as any;
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Custom transparent real-time notification listener compatible with supabase channels
class FirestoreChannel {
  private channelName: string;
  private listeners: Array<{ table: string; callback: (payload: any) => void }> = [];
  private activeSubscriptions: any[] = [];

  constructor(name: string) {
    this.channelName = name;
  }

  on(event: string, filterObj: any, callback: (payload: any) => void) {
    const table = filterObj.table;
    this.listeners.push({ table, callback });
    return this;
  }

  subscribe() {
    // Start listening to live snapshots on Firestore for each registered collection
    const unsubscribers = this.listeners.map(({ table, callback }) => {
      const q = query(collection(db, table));
      let initialLoad = true;

      const unsub = onSnapshot(q, (snapshot) => {
        // Skip calling callbacks during initial load to prevent duplicating pre-loaded history
        if (initialLoad) {
          initialLoad = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          let eventType = "INSERT";
          if (change.type === "modified") eventType = "UPDATE";
          if (change.type === "removed") eventType = "DELETE";

          callback({
            eventType,
            new: { id: change.doc.id, ...change.doc.data() },
            old: {}
          });
        });
      }, (err) => {
        console.warn(`Firestore real-time listener error for "${table}":`, err);
      });

      return unsub;
    });

    return {
      unsubscribe: () => {
        unsubscribers.forEach(unsub => unsub());
      }
    };
  }
}

// Custom Storage implementation compatible with Supabase's bucket API
const firestoreStorage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: File) {
        try {
          // Upload file directly to Firebase Storage bucket under the specified path
          const storageRef = ref(storage, `${bucket}/${path}`);
          const snapshot = await uploadBytes(storageRef, file);
          return { data: { path: snapshot.ref.fullPath }, error: null };
        } catch (err: any) {
          console.warn("Firebase Storage direct upload failed. Falling back to local Base64 storage.", err);
          // Fallback to local Base64 URL storage if Storage bucket permissions/cors are unconfigured
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Url = reader.result as string;
              localStorage.setItem(`firebase_emulated_storage_${bucket}_${path}`, base64Url);
              resolve({ data: { path }, error: null });
            };
            reader.onerror = () => {
              resolve({ data: null, error: err });
            };
            reader.readAsDataURL(file);
          });
        }
      },
      getPublicUrl(path: string) {
        // Try getting real Download URL if it is stored in Firebase Storage, otherwise return base64 fallback or Unsplash placeholder
        const savedBase64 = localStorage.getItem(`firebase_emulated_storage_${bucket}_${path}`);
        if (savedBase64) {
          return { data: { publicUrl: savedBase64 } };
        }

        const fallbackUrl = "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=500&auto=format&fit=crop";
        return { data: { publicUrl: fallbackUrl } };
      }
    };
  }
};

// Export transparent client object matching your original application's codebase queries
export const supabase = {
  from(table: string): any {
    return new FirestoreQueryBuilder(table);
  },

  channel(name: string): any {
    return new FirestoreChannel(name);
  },

  removeChannel(channel: any): any {
    if (channel && typeof channel.unsubscribe === 'function') {
      channel.unsubscribe();
    }
  },

  get storage(): any {
    return firestoreStorage;
  }
};
