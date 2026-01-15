import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, writeBatch, collection, getDocs } from "firebase/firestore";
import type { NavItem } from "../content/types/navTypes";
import { logAdminActivity } from "./audit";

const NAV_DOC = doc(db, "siteConfig", "navigation");

// Log levels
const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
} as const;

type LogLevel = typeof LogLevel[keyof typeof LogLevel];

// Enhanced logger with colors and timestamps
class NavigationLogger {
  private static colors = {
    [LogLevel.DEBUG]: '#6c757d',
    [LogLevel.INFO]: '#17a2b8',
    [LogLevel.WARN]: '#ffc107',
    [LogLevel.ERROR]: '#dc3545',
  };

  private static log(level: LogLevel, context: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const style = `color: ${this.colors[level]}; font-weight: bold;`;

    console.groupCollapsed(`[${timestamp}] [${level}] ${context}: ${message}`);
    console.log(`%c${level}`, style, `- ${context}: ${message}`);

    if (data !== undefined) {
      console.log('Data:', data);
      console.log('Data type:', typeof data);
      console.log('Is Array?', Array.isArray(data));
      console.log('Data length?', Array.isArray(data) ? data.length : 'N/A');
    }

    // Add stack trace for errors
    if (level === LogLevel.ERROR) {
      console.trace('Error stack trace:');
    }

    console.groupEnd();
  }

  static debug(context: string, message: string, data?: any) {
    this.log(LogLevel.DEBUG, context, message, data);
  }

  static info(context: string, message: string, data?: any) {
    this.log(LogLevel.INFO, context, message, data);
  }

  static warn(context: string, message: string, data?: any) {
    this.log(LogLevel.WARN, context, message, data);
  }

  static error(context: string, message: string, data?: any) {
    this.log(LogLevel.ERROR, context, message, data);
  }
}

// Helper to validate NavItem structure
function validateNavItem(item: any, path: string = ''): string[] {
  const errors: string[] = [];

  if (!item) {
    errors.push(`${path}: Item is null or undefined`);
    return errors;
  }

  if (!item.id) {
    errors.push(`${path}: Missing id`);
  }

  if (!item.label || typeof item.label !== 'string') {
    errors.push(`${path}: Invalid label - must be a non-empty string`);
  }

  if (item.href && typeof item.href !== 'string') {
    errors.push(`${path}: href must be a string if provided`);
  }

  if (item.children) {
    if (!Array.isArray(item.children)) {
      errors.push(`${path}: children must be an array`);
    } else {
      item.children.forEach((child: any, index: number) => {
        const childPath = `${path}.children[${index}]`;
        errors.push(...validateNavItem(child, childPath));
      });
    }
  }

  return errors;
}

// Helper to serialize NavItem for Firestore
function prepareForFirestore(items: NavItem[]): any {
  NavigationLogger.debug('Serializer', 'Preparing data for Firestore', items);

  const serializeItem = (item: NavItem): any => {
    const serialized: any = {
      id: item.id,
      label: item.label,
      enabled: item.enabled !== false,
      order: item.order || 999,
    };

    if (item.href) serialized.href = item.href;
    if (item.icon) serialized.icon = item.icon;
    // if (item.description) serialized.description = item.description;
    // if (item.target) serialized.target = item.target;
    // if (item.className) serialized.className = item.className;

    if (item.children && item.children.length > 0) {
      serialized.children = item.children.map(serializeItem);
    }

    return serialized;
  };

  const result = items.map(serializeItem);
  NavigationLogger.debug('Serializer', 'Serialized data', result);
  return result;
}

// Check Firestore connection and permissions
async function checkFirestoreAccess() {
  try {
    NavigationLogger.info('Firestore', 'Checking Firestore access...');

    // Try to read from a test collection
    const testCollection = collection(db, '_test_access');
    const testDocs = await getDocs(testCollection);

    NavigationLogger.info('Firestore', 'Firestore access check successful', {
      canRead: true,
      testCollectionSize: testDocs.size
    });

    return { canRead: true, canWrite: true };
  } catch (error: any) {
    NavigationLogger.error('Firestore', 'Firestore access check failed', {
      error: error.message,
      code: error.code,
      details: error
    });

    // Check for specific permission errors
    const canRead = !error.code || !error.code.includes('permission');
    const canWrite = !error.code || !error.code.includes('permission');

    return { canRead, canWrite };
  }
}

export async function getNavigation(): Promise<NavItem[]> {
  NavigationLogger.info('GET', 'Fetching navigation from Firestore', {
    path: 'siteConfig/navigation',
    timestamp: new Date().toISOString()
  });

  try {
    const startTime = performance.now();
    const snap = await getDoc(NAV_DOC);
    const endTime = performance.now();

    NavigationLogger.info('GET', 'Firestore response received', {
      exists: snap.exists(),
      latency: `${(endTime - startTime).toFixed(2)}ms`
    });

    if (!snap.exists()) {
      NavigationLogger.warn('GET', 'Navigation document does not exist');
      return [];
    }

    const data = snap.data();
    NavigationLogger.debug('GET', 'Raw Firestore data', data);

    const items = (data?.items ?? []) as NavItem[];

    // Validate the structure
    const validationErrors: string[] = [];
    items.forEach((item, index) => {
      validationErrors.push(...validateNavItem(item, `items[${index}]`));
    });

    if (validationErrors.length > 0) {
      NavigationLogger.warn('GET', 'Navigation data validation warnings', validationErrors);
    }

    NavigationLogger.info('GET', 'Navigation loaded successfully', {
      itemCount: items.length,
      validationErrors: validationErrors.length,
      sampleFirstItem: items[0] ? { id: items[0].id, label: items[0].label } : null
    });

    return items;
  } catch (error: any) {
    NavigationLogger.error('GET', 'Failed to fetch navigation', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });

    // Check Firestore access for debugging
    await checkFirestoreAccess();

    throw error;
  }
}

export async function saveNavigation(items: NavItem[]) {
  const saveId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  NavigationLogger.info('SAVE', 'Starting navigation save', {
    saveId,
    itemCount: items.length,
    items: items.map(item => ({ id: item.id, label: item.label }))
  });

  try {
    // Step 1: Validate input
    NavigationLogger.debug('SAVE', 'Validating input data');
    const validationErrors: string[] = [];

    if (!Array.isArray(items)) {
      throw new Error('Input must be an array');
    }

    items.forEach((item, index) => {
      validationErrors.push(...validateNavItem(item, `items[${index}]`));
    });

    if (validationErrors.length > 0) {
      NavigationLogger.error('SAVE', 'Validation failed', validationErrors);
      throw new Error(`Invalid navigation data: ${validationErrors.join(', ')}`);
    }

    NavigationLogger.debug('SAVE', 'Validation passed');

    // Step 2: Check Firestore access
    const access = await checkFirestoreAccess();
    if (!access.canWrite) {
      throw new Error('No write permission to Firestore');
    }

    // Step 3: Prepare data for Firestore
    NavigationLogger.debug('SAVE', 'Preparing data for Firestore');
    const firestoreData = prepareForFirestore(items);

    NavigationLogger.debug('SAVE', 'Final data to save', {
      items: firestoreData,
      metadata: {
        lastUpdated: new Date().toISOString(),
        updatedBy: 'admin',
        itemCount: firestoreData.length
      }
    });

    // Step 4: Save to Firestore
    NavigationLogger.info('SAVE', 'Writing to Firestore', {
      document: 'siteConfig/navigation',
      saveId
    });

    const startTime = performance.now();

    // Using batch write for atomic operation (optional)
    const batch = writeBatch(db);
    batch.set(NAV_DOC, {
      items: firestoreData,
      metadata: {
        lastUpdated: new Date().toISOString(),
        updatedBy: 'admin',
        version: Date.now(),
        saveId
      }
    }, { merge: true });

    await batch.commit();

    const endTime = performance.now();

    // Step 5: Verify the save
    NavigationLogger.info('SAVE', 'Save operation completed', {
      saveId,
      latency: `${(endTime - startTime).toFixed(2)}ms`
    });

    // Verify by reading back
    NavigationLogger.debug('SAVE', 'Verifying save by reading back...');
    const verification = await getDoc(NAV_DOC);
    const savedData = verification.data();

    if (!verification.exists()) {
      NavigationLogger.error('SAVE', 'Verification failed: Document does not exist after save');
      throw new Error('Document was not created');
    }

    NavigationLogger.info('SAVE', 'Verification successful', {
      savedItemCount: savedData?.items?.length || 0,
      saveVerified: true
    });

    // Step 6: Log success
    NavigationLogger.info('SAVE', 'Navigation saved successfully', {
      saveId,
      timestamp: new Date().toISOString(),
      itemCount: items.length,
      firstItem: items[0] ? { id: items[0].id, label: items[0].label } : null
    });

    await logAdminActivity({
      type: "NAV_SAVE",
      title: "Navigation updated",
      detail: `Saved ${items.length} top-level items`,
      meta: {
        saveId,
        itemCount: items.length,
      },
    });


    // Return success with metadata
    return {
      success: true,
      saveId,
      timestamp: new Date().toISOString(),
      itemCount: items.length,
      verification: {
        exists: verification.exists(),
        itemCount: savedData?.items?.length || 0
      }
    };



  } catch (error: any) {
    NavigationLogger.error('SAVE', 'Failed to save navigation', {
      saveId,
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      inputItems: items.map(item => ({ id: item.id, label: item.label }))
    });

    // Check if it's a Firestore error
    if (error.code) {
      NavigationLogger.error('SAVE', 'Firestore error details', {
        code: error.code,
        details: error.details || 'No additional details'
      });

      // Common Firestore errors
      switch (error.code) {
        case 'permission-denied':
          NavigationLogger.error('SAVE', 'Firestore permission denied. Check security rules.');
          break;
        case 'not-found':
          NavigationLogger.error('SAVE', 'Collection or document not found');
          break;
        case 'already-exists':
          NavigationLogger.error('SAVE', 'Document already exists');
          break;
        case 'failed-precondition':
          NavigationLogger.error('SAVE', 'Operation failed due to precondition');
          break;
        case 'unavailable':
          NavigationLogger.error('SAVE', 'Firestore service unavailable');
          break;
      }
    }

    // Rethrow the error for the caller
    throw {
      ...error,
      saveId,
      timestamp: new Date().toISOString(),
      logged: true
    };
  }
}

// Additional utility functions for debugging

export async function checkNavigationDocument() {
  try {
    const snap = await getDoc(NAV_DOC);

    NavigationLogger.info('DEBUG', 'Navigation document status', {
      exists: snap.exists(),
      data: snap.exists() ? snap.data() : null,
      path: NAV_DOC.path,
      id: NAV_DOC.id
    });

    return {
      exists: snap.exists(),
      data: snap.exists() ? snap.data() : null,
      path: NAV_DOC.path
    };
  } catch (error: any) {
    NavigationLogger.error('DEBUG', 'Failed to check navigation document', error);
    throw error;
  }
}

export async function clearNavigationCache() {
  try {
    NavigationLogger.info('CACHE', 'Clearing navigation cache');

    // Clear any localStorage cache if you have it
    if (typeof window !== 'undefined') {
      localStorage.removeItem('navigation_cache');
    }

    // Force refresh by re-reading from Firestore
    const freshData = await getNavigation();

    NavigationLogger.info('CACHE', 'Cache cleared and refreshed', {
      freshItemCount: freshData.length
    });

    return freshData;
  } catch (error: any) {
    NavigationLogger.error('CACHE', 'Failed to clear cache', error);
    throw error;
  }
}

// Export the logger for use in other files
export { NavigationLogger };