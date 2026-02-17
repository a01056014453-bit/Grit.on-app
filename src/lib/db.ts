// IndexedDB wrapper for practice session storage

export interface PracticeSession {
  id?: number;
  pieceId: string;
  pieceName: string;
  composer?: string;
  startTime: Date;
  endTime: Date;
  totalTime: number; // seconds
  practiceTime: number; // seconds (actual sound detected time)
  audioBlob?: Blob;
  synced: boolean;
  practiceType?: "partial" | "routine" | "runthrough";
  label?: string;
  measureRange?: { start: number; end: number } | null; // 집중 타겟 마디
  todoNote?: string; // 연습 To-do의 메모
}

const DB_NAME = "griton_db";
const DB_VERSION = 1;
const SESSIONS_STORE = "practice_sessions";

let dbInstance: IDBDatabase | null = null;
let dbOpening: Promise<IDBDatabase> | null = null;

// Initialize database
export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  if (dbOpening) return dbOpening;

  dbOpening = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbOpening = null;
      reject(new Error("Failed to open database"));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbOpening = null;

      // Reset cached instance when browser closes the connection
      dbInstance.onclose = () => {
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create practice sessions store
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        const store = db.createObjectStore(SESSIONS_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("pieceId", "pieceId", { unique: false });
        store.createIndex("startTime", "startTime", { unique: false });
        store.createIndex("synced", "synced", { unique: false });
      }
    };
  });

  return dbOpening;
}

// Get a valid DB connection, reconnecting if stale
async function getDB(): Promise<IDBDatabase> {
  const db = await initDB();
  try {
    // Test if connection is still alive
    db.transaction([SESSIONS_STORE], "readonly");
    return db;
  } catch {
    // Connection is stale, force reconnect
    dbInstance = null;
    return initDB();
  }
}

// Save practice session
export async function savePracticeSession(
  session: Omit<PracticeSession, "id">
): Promise<number> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], "readwrite");
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.add(session);

    request.onsuccess = () => {
      resolve(request.result as number);
    };

    request.onerror = () => {
      reject(new Error("Failed to save session"));
    };
  });
}

// Get all practice sessions
export async function getAllSessions(): Promise<PracticeSession[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], "readonly");
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error("Failed to get sessions"));
    };
  });
}

// Get session by ID
export async function getSession(id: number): Promise<PracticeSession | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], "readonly");
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error("Failed to get session"));
    };
  });
}

// Get sessions by piece ID
export async function getSessionsByPiece(
  pieceId: string
): Promise<PracticeSession[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], "readonly");
    const store = transaction.objectStore(SESSIONS_STORE);
    const index = store.index("pieceId");
    const request = index.getAll(pieceId);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error("Failed to get sessions by piece"));
    };
  });
}

// Get unsynced sessions
export async function getUnsyncedSessions(): Promise<PracticeSession[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], "readonly");
    const store = transaction.objectStore(SESSIONS_STORE);
    const index = store.index("synced");
    const request = index.getAll(IDBKeyRange.only(0));

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error("Failed to get unsynced sessions"));
    };
  });
}

// Mark session as synced
export async function markSessionSynced(id: number): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], "readwrite");
    const store = transaction.objectStore(SESSIONS_STORE);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const session = getRequest.result;
      if (session) {
        session.synced = true;
        const updateRequest = store.put(session);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () =>
          reject(new Error("Failed to update session"));
      } else {
        reject(new Error("Session not found"));
      }
    };

    getRequest.onerror = () => {
      reject(new Error("Failed to get session"));
    };
  });
}

// Delete session
export async function deleteSession(id: number): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], "readwrite");
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to delete session"));
    };
  });
}

// Clear all sessions
export async function clearAllSessions(): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], "readwrite");
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to clear sessions"));
    };
  });
}

// Seed mock practice sessions (only if DB is empty)
export async function seedMockSessions(): Promise<void> {
  const existing = await getAllSessions();
  if (existing.length > 0) return; // already has data

  const songs = [
    { id: "1", name: "F. Chopin Ballade Op.23 No.1", composer: "F. Chopin" },
    { id: "2", name: "L. v. Beethoven Sonata Op.13 No.8", composer: "L. v. Beethoven" },
    { id: "3", name: "C. Debussy Suite Bergamasque No.3", composer: "C. Debussy" },
    { id: "4", name: "F. Liszt Etude S.141 No.3", composer: "F. Liszt" },
    { id: "5", name: "F. Chopin Fantaisie-Impromptu Op.66", composer: "F. Chopin" },
  ];

  const types: ("partial" | "routine" | "runthrough")[] = ["partial", "routine", "runthrough"];
  const notes = [
    "왼손 아르페지오 집중",
    "코다 구간 템포 조절",
    "다이내믹 표현 연습",
    "페달링 개선",
    "양손 합치기",
    "느린 템포 정확도",
    "프레이징 호흡",
    "",
  ];

  const now = new Date();
  const sessions: Omit<PracticeSession, "id">[] = [];

  // 지난 21일간 데이터 생성 (오늘 포함)
  for (let daysAgo = 0; daysAgo <= 21; daysAgo++) {
    // 일부 날은 건너뛰기 (연속 아닌 날)
    if ([4, 8, 13, 17].includes(daysAgo)) continue;

    const day = new Date(now);
    day.setDate(day.getDate() - daysAgo);

    // 하루 1~3세션
    const sessionCount = daysAgo === 0 ? 2 : (daysAgo % 3 === 0 ? 3 : daysAgo % 2 === 0 ? 2 : 1);

    for (let s = 0; s < sessionCount; s++) {
      const song = songs[(daysAgo + s) % songs.length];
      const hour = 9 + s * 3 + (daysAgo % 3); // 9시, 12시, 15시 등
      const totalMin = 15 + (daysAgo + s) % 4 * 10; // 15~45분
      const practiceMin = Math.round(totalMin * (0.65 + Math.random() * 0.2)); // 65~85% 효율

      const start = new Date(day);
      start.setHours(hour, (daysAgo * 7 + s * 13) % 60, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + totalMin);

      sessions.push({
        pieceId: song.id,
        pieceName: song.name,
        composer: song.composer,
        startTime: start,
        endTime: end,
        totalTime: totalMin * 60,
        practiceTime: practiceMin * 60,
        synced: true,
        practiceType: types[(daysAgo + s) % 3],
        todoNote: notes[(daysAgo + s) % notes.length] || undefined,
      });
    }
  }

  // IndexedDB에 저장
  for (const session of sessions) {
    await savePracticeSession(session);
  }
}

// Get practice statistics
export async function getPracticeStats(): Promise<{
  totalSessions: number;
  totalTime: number;
  totalPracticeTime: number;
  averagePracticeRatio: number;
}> {
  const sessions = await getAllSessions();

  const totalSessions = sessions.length;
  const totalTime = sessions.reduce((sum, s) => sum + s.totalTime, 0);
  const totalPracticeTime = sessions.reduce(
    (sum, s) => sum + s.practiceTime,
    0
  );
  const averagePracticeRatio =
    totalTime > 0 ? (totalPracticeTime / totalTime) * 100 : 0;

  return {
    totalSessions,
    totalTime,
    totalPracticeTime,
    averagePracticeRatio,
  };
}

// Get today's practice time
export async function getTodayPracticeTime(): Promise<{
  totalTime: number;
  practiceTime: number;
  sessions: number;
}> {
  const sessions = await getAllSessions();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySessions = sessions.filter((s) => {
    const sessionDate = new Date(s.startTime);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === today.getTime();
  });

  return {
    totalTime: todaySessions.reduce((sum, s) => sum + s.totalTime, 0),
    practiceTime: todaySessions.reduce((sum, s) => sum + s.practiceTime, 0),
    sessions: todaySessions.length,
  };
}
