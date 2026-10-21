import { databases, DATABASE_ID, NOTEBOOKS_COLLECTION_ID } from '../appwriteClient';
import { ID, Query } from 'appwrite';

export interface NotebookPage {
  id: string;
  pageNumber: number;
  content: string; // Fabric JSON string
  thumbnail?: string;
}

export interface NotebookItem {
  $id: string;
  title: string;
  userId: string;
  pages: NotebookPage[];
  lastEdited: string;
  createdAt: string;
  paperStyle: 'blank' | 'grid' | 'lined' | 'dots';
}

const STORAGE_PREFIX = 'notecraft_notebooks_';

const getLocalKey = (userId: string) => `${STORAGE_PREFIX}${userId || 'guest'}`;

export const getLocalNotebooks = (userId: string): NotebookItem[] => {
  try {
    const raw = localStorage.getItem(getLocalKey(userId));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading local notebooks:', err);
  }
  return [];
};

export const setLocalNotebooks = (userId: string, items: NotebookItem[]) => {
  try {
    localStorage.setItem(getLocalKey(userId), JSON.stringify(items));
  } catch (err) {
    console.error('Error saving local notebooks:', err);
  }
};

const createSampleNotebook = (userId: string): NotebookItem => {
  // A friendly sample canvas with a welcome sketch
  const sampleCanvasJSON = JSON.stringify({
    version: '5.3.0',
    objects: [
      {
        type: 'i-text',
        version: '5.3.0',
        originX: 'left',
        originY: 'top',
        left: 80,
        top: 60,
        width: 320,
        height: 40,
        fill: '#4f46e5',
        stroke: null,
        strokeWidth: 1,
        fontFamily: 'Inter',
        fontSize: 32,
        fontWeight: 'bold',
        text: 'Welcome to NoteCraft Pro! ✨',
      },
      {
        type: 'i-text',
        version: '5.3.0',
        originX: 'left',
        originY: 'top',
        left: 80,
        top: 120,
        width: 480,
        height: 60,
        fill: '#4b5563',
        fontFamily: 'Inter',
        fontSize: 18,
        text: 'Sketch, draw, add images, and take notes seamlessly.\nWorks on Google Chrome and Telegram!',
      },
      {
        type: 'rect',
        version: '5.3.0',
        originX: 'left',
        originY: 'top',
        left: 80,
        top: 220,
        width: 140,
        height: 90,
        fill: 'rgba(99, 102, 241, 0.15)',
        stroke: '#6366f1',
        strokeWidth: 3,
        rx: 12,
        ry: 12,
      },
      {
        type: 'circle',
        version: '5.3.0',
        originX: 'left',
        originY: 'top',
        left: 260,
        top: 215,
        radius: 50,
        fill: 'rgba(236, 72, 153, 0.15)',
        stroke: '#ec4899',
        strokeWidth: 3,
      },
      {
        type: 'path',
        version: '5.3.0',
        originX: 'left',
        originY: 'top',
        left: 400,
        top: 230,
        width: 120,
        height: 60,
        fill: null,
        stroke: '#10b981',
        strokeWidth: 4,
        strokeLineCap: 'round',
        path: [
          ['M', 400, 260],
          ['Q', 430, 220, 460, 260],
          ['T', 520, 260]
        ]
      }
    ]
  });

  return {
    $id: 'sample_' + Date.now(),
    title: 'Getting Started with NoteCraft',
    userId,
    paperStyle: 'grid',
    lastEdited: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    pages: [
      {
        id: 'page1',
        pageNumber: 1,
        content: sampleCanvasJSON,
      },
      {
        id: 'page2',
        pageNumber: 2,
        content: JSON.stringify({
          version: '5.3.0',
          objects: [
            {
              type: 'i-text',
              left: 80,
              top: 60,
              fontSize: 26,
              fontWeight: 'bold',
              fill: '#1e293b',
              text: 'Page 2: Ideas & Sketches 💡'
            }
          ]
        })
      }
    ]
  };
};

export const listNotebooks = async (userId: string): Promise<NotebookItem[]> => {
  let localList = getLocalNotebooks(userId);

  // If no notebooks exist, seed a sample notebook
  if (localList.length === 0) {
    const sample = createSampleNotebook(userId);
    localList = [sample];
    setLocalNotebooks(userId, localList);
  }

  // Try Appwrite if configured and user is not a guest
  if (DATABASE_ID && NOTEBOOKS_COLLECTION_ID && !userId.startsWith('guest_')) {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        NOTEBOOKS_COLLECTION_ID,
        [Query.equal('userId', userId), Query.orderDesc('lastEdited')]
      );

      if (res.documents.length > 0) {
        const remoteItems: NotebookItem[] = res.documents.map(doc => {
          let pages: NotebookPage[] = [];
          let paperStyle: 'blank' | 'grid' | 'lined' | 'dots' = 'blank';

          if (doc.content) {
            try {
              const parsed = JSON.parse(doc.content);
              if (Array.isArray(parsed.pages)) {
                pages = parsed.pages;
                paperStyle = parsed.paperStyle || 'blank';
              } else if (parsed.objects) {
                pages = [{ id: 'page1', pageNumber: 1, content: doc.content }];
              }
            } catch {
              pages = [{ id: 'page1', pageNumber: 1, content: '' }];
            }
          }

          if (pages.length === 0) {
            pages = [{ id: 'page1', pageNumber: 1, content: '' }];
          }

          return {
            $id: doc.$id,
            title: doc.title,
            userId: doc.userId,
            pages,
            paperStyle,
            lastEdited: doc.lastEdited || doc.$updatedAt || new Date().toISOString(),
            createdAt: doc.$createdAt || new Date().toISOString(),
          };
        });

        // Merge: local notebooks that might not be synced yet + remote notebooks
        const map = new Map<string, NotebookItem>();
        remoteItems.forEach(n => map.set(n.$id, n));
        localList.forEach(n => {
          if (!map.has(n.$id)) {
            map.set(n.$id, n);
          }
        });

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime()
        );

        setLocalNotebooks(userId, merged);
        return merged;
      }
    } catch (err) {
      console.warn('Appwrite list failed, using local storage cache:', err);
    }
  }

  return localList;
};

export const getNotebook = async (notebookId: string, userId: string = ''): Promise<NotebookItem | null> => {
  // Check local first
  const localList = getLocalNotebooks(userId);
  const found = localList.find(n => n.$id === notebookId);

  if (DATABASE_ID && NOTEBOOKS_COLLECTION_ID && !notebookId.startsWith('sample_') && !notebookId.startsWith('local_')) {
    try {
      const doc = await databases.getDocument(DATABASE_ID, NOTEBOOKS_COLLECTION_ID, notebookId);
      if (doc) {
        let pages: NotebookPage[] = [];
        let paperStyle: 'blank' | 'grid' | 'lined' | 'dots' = 'blank';

        if (doc.content) {
          try {
            const parsed = JSON.parse(doc.content);
            if (Array.isArray(parsed.pages)) {
              pages = parsed.pages;
              paperStyle = parsed.paperStyle || 'blank';
            } else if (parsed.objects) {
              pages = [{ id: 'page1', pageNumber: 1, content: doc.content }];
            }
          } catch {
            pages = [{ id: 'page1', pageNumber: 1, content: '' }];
          }
        }

        if (pages.length === 0) {
          pages = [{ id: 'page1', pageNumber: 1, content: '' }];
        }

        const remote: NotebookItem = {
          $id: doc.$id,
          title: doc.title,
          userId: doc.userId,
          pages,
          paperStyle,
          lastEdited: doc.lastEdited || doc.$updatedAt || new Date().toISOString(),
          createdAt: doc.$createdAt || new Date().toISOString(),
        };

        // Cache locally
        saveLocalNotebook(userId || doc.userId, remote);
        return remote;
      }
    } catch (err) {
      console.warn('Appwrite getDocument failed, returning cached version:', err);
    }
  }

  return found || null;
};

export const saveLocalNotebook = (userId: string, notebook: NotebookItem) => {
  const list = getLocalNotebooks(userId);
  const idx = list.findIndex(n => n.$id === notebook.$id);
  if (idx >= 0) {
    list[idx] = notebook;
  } else {
    list.unshift(notebook);
  }
  setLocalNotebooks(userId, list);
};

export const createNotebook = async (
  userId: string, 
  title: string = 'Untitled Notebook',
  paperStyle: 'blank' | 'grid' | 'lined' | 'dots' = 'blank'
): Promise<NotebookItem> => {
  const newId = (DATABASE_ID && NOTEBOOKS_COLLECTION_ID && !userId.startsWith('guest_')) 
    ? ID.unique() 
    : 'local_' + Date.now();

  const now = new Date().toISOString();
  const newNotebook: NotebookItem = {
    $id: newId,
    title,
    userId,
    pages: [{ id: 'page1', pageNumber: 1, content: '' }],
    lastEdited: now,
    createdAt: now,
    paperStyle,
  };

  // Save local first
  saveLocalNotebook(userId, newNotebook);

  // Sync with Appwrite
  if (DATABASE_ID && NOTEBOOKS_COLLECTION_ID && !userId.startsWith('guest_')) {
    try {
      const payload = JSON.stringify({
        pages: newNotebook.pages,
        paperStyle: newNotebook.paperStyle
      });
      await databases.createDocument(
        DATABASE_ID,
        NOTEBOOKS_COLLECTION_ID,
        newId,
        {
          title: newNotebook.title,
          userId: newNotebook.userId,
          content: payload,
          lastEdited: now,
        }
      );
    } catch (err) {
      console.warn('Appwrite createDocument failed, notebook preserved locally:', err);
    }
  }

  return newNotebook;
};

export const savePageContent = async (
  notebookId: string,
  pageId: string,
  contentJson: string,
  userId: string,
  thumbnail?: string
): Promise<void> => {
  const notebook = await getNotebook(notebookId, userId);
  if (!notebook) return;

  const now = new Date().toISOString();
  const pageIdx = notebook.pages.findIndex(p => p.id === pageId);

  if (pageIdx >= 0) {
    notebook.pages[pageIdx].content = contentJson;
    if (thumbnail) notebook.pages[pageIdx].thumbnail = thumbnail;
  } else {
    notebook.pages.push({
      id: pageId,
      pageNumber: notebook.pages.length + 1,
      content: contentJson,
      thumbnail
    });
  }

  notebook.lastEdited = now;
  saveLocalNotebook(userId || notebook.userId, notebook);

  // Appwrite sync
  if (DATABASE_ID && NOTEBOOKS_COLLECTION_ID && !notebookId.startsWith('sample_') && !notebookId.startsWith('local_')) {
    try {
      const payload = JSON.stringify({
        pages: notebook.pages,
        paperStyle: notebook.paperStyle
      });
      await databases.updateDocument(
        DATABASE_ID,
        NOTEBOOKS_COLLECTION_ID,
        notebookId,
        {
          content: payload,
          lastEdited: now,
        }
      );
    } catch (err) {
      console.warn('Appwrite updateDocument failed:', err);
    }
  }
};

export const addPage = async (notebookId: string, userId: string): Promise<NotebookPage> => {
  const notebook = await getNotebook(notebookId, userId);
  if (!notebook) throw new Error('Notebook not found');

  const newPageNum = notebook.pages.length + 1;
  const newPage: NotebookPage = {
    id: `page${Date.now()}`,
    pageNumber: newPageNum,
    content: ''
  };

  notebook.pages.push(newPage);
  notebook.lastEdited = new Date().toISOString();
  saveLocalNotebook(userId || notebook.userId, notebook);

  if (DATABASE_ID && NOTEBOOKS_COLLECTION_ID && !notebookId.startsWith('sample_') && !notebookId.startsWith('local_')) {
    try {
      const payload = JSON.stringify({
        pages: notebook.pages,
        paperStyle: notebook.paperStyle
      });
      await databases.updateDocument(DATABASE_ID, NOTEBOOKS_COLLECTION_ID, notebookId, {
        content: payload,
        lastEdited: notebook.lastEdited
      });
    } catch (err) {
      console.warn('Appwrite page add failed:', err);
    }
  }

  return newPage;
};

export const deleteNotebook = async (notebookId: string, userId: string): Promise<void> => {
  const list = getLocalNotebooks(userId).filter(n => n.$id !== notebookId);
  setLocalNotebooks(userId, list);

  if (DATABASE_ID && NOTEBOOKS_COLLECTION_ID && !notebookId.startsWith('sample_') && !notebookId.startsWith('local_')) {
    try {
      await databases.deleteDocument(DATABASE_ID, NOTEBOOKS_COLLECTION_ID, notebookId);
    } catch (err) {
      console.warn('Appwrite deleteDocument failed:', err);
    }
  }
};

export const updateNotebookTitle = async (notebookId: string, title: string, userId: string): Promise<void> => {
  const notebook = await getNotebook(notebookId, userId);
  if (!notebook) return;

  notebook.title = title;
  notebook.lastEdited = new Date().toISOString();
  saveLocalNotebook(userId || notebook.userId, notebook);

  if (DATABASE_ID && NOTEBOOKS_COLLECTION_ID && !notebookId.startsWith('sample_') && !notebookId.startsWith('local_')) {
    try {
      await databases.updateDocument(DATABASE_ID, NOTEBOOKS_COLLECTION_ID, notebookId, {
        title,
        lastEdited: notebook.lastEdited
      });
    } catch (err) {
      console.warn('Appwrite title update failed:', err);
    }
  }
};
