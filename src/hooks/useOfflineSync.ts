'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Anamnese, Student } from '@/types';

interface OfflineData {
  anamneses: Anamnese[];
  students: Student[];
  pendingChanges: PendingChange[];
  lastSync: string;
}

interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: 'anamneses' | 'students';
  data: Anamnese | Student | Record<string, unknown>;
  timestamp: string;
  retryCount: number;
}

const STORAGE_KEY = 'anaminese_offline_data';
const MAX_RETRY_COUNT = 3;

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  // Check online status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Load offline data from localStorage
  const loadOfflineData = useCallback((): OfflineData => {
    if (typeof window === 'undefined') {
      return {
        anamneses: [],
        students: [],
        pendingChanges: [],
        lastSync: ''
      };
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setPendingChangesCount(data.pendingChanges?.length || 0);
        if (data.lastSync) {
          setLastSyncTime(new Date(data.lastSync));
        }
        return data;
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
    
    return {
      anamneses: [],
      students: [],
      pendingChanges: [],
      lastSync: ''
    };
  }, []);

  // Save offline data to localStorage
  const saveOfflineData = useCallback((data: OfflineData) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setPendingChangesCount(data.pendingChanges.length);
      if (data.lastSync) {
        setLastSyncTime(new Date(data.lastSync));
      }
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }, []);

  // Add pending change
  const addPendingChange = useCallback((change: Omit<PendingChange, 'id' | 'timestamp' | 'retryCount'>) => {
    const offlineData = loadOfflineData();
    const newChange: PendingChange = {
      ...change,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      retryCount: 0
    };
    
    offlineData.pendingChanges.push(newChange);
    saveOfflineData(offlineData);
  }, [loadOfflineData, saveOfflineData]);

  // Cache data for offline use
  const cacheData = useCallback(async (anamneses: Anamnese[], students: Student[]) => {
    const offlineData = loadOfflineData();
    offlineData.anamneses = anamneses;
    offlineData.students = students;
    offlineData.lastSync = new Date().toISOString();
    saveOfflineData(offlineData);
  }, [loadOfflineData, saveOfflineData]);

  // Get cached data
  const getCachedData = useCallback(() => {
    return loadOfflineData();
  }, [loadOfflineData]);

  // Sync pending changes
  const syncPendingChanges = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const offlineData = loadOfflineData();
      const { pendingChanges } = offlineData;

      if (pendingChanges.length === 0) {
        setIsSyncing(false);
        return;
      }

      const successfulChanges: string[] = [];
      const failedChanges: PendingChange[] = [];

      for (const change of pendingChanges) {
        try {
          switch (change.type) {
            case 'create':
              if (change.table === 'anamneses') {
                const { error } = await supabase
                  .from('anamneses')
                  .insert(change.data);
                if (error) throw error;
              } else if (change.table === 'students') {
                const { error } = await supabase
                  .from('students')
                  .insert(change.data);
                if (error) throw error;
              }
              break;

            case 'update':
              if (change.table === 'anamneses') {
                const { error } = await supabase
                  .from('anamneses')
                  .update(change.data)
                  .eq('id', change.data.id);
                if (error) throw error;
              } else if (change.table === 'students') {
                const { error } = await supabase
                  .from('students')
                  .update(change.data)
                  .eq('id', change.data.id);
                if (error) throw error;
              }
              break;

            case 'delete':
              if (change.table === 'anamneses') {
                const { error } = await supabase
                  .from('anamneses')
                  .delete()
                  .eq('id', change.data.id);
                if (error) throw error;
              } else if (change.table === 'students') {
                const { error } = await supabase
                  .from('students')
                  .delete()
                  .eq('id', change.data.id);
                if (error) throw error;
              }
              break;
          }

          successfulChanges.push(change.id);
        } catch (error) {
          console.error(`Error syncing change ${change.id}:`, error);
          
          if (change.retryCount < MAX_RETRY_COUNT) {
            failedChanges.push({
              ...change,
              retryCount: change.retryCount + 1
            });
          } else {
            console.error(`Max retry count reached for change ${change.id}`);
          }
        }
      }

      // Update offline data with remaining pending changes
      offlineData.pendingChanges = failedChanges;
      if (successfulChanges.length > 0) {
        offlineData.lastSync = new Date().toISOString();
      }
      saveOfflineData(offlineData);

      if (failedChanges.length > 0) {
        setSyncError(`${failedChanges.length} alterações falharam na sincronização`);
      }
    } catch (error: unknown) {
      setSyncError('Erro durante a sincronização: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, loadOfflineData, saveOfflineData]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && !isSyncing) {
      syncPendingChanges();
    }
  }, [isOnline, syncPendingChanges, isSyncing]);

  // Offline-first CRUD operations
  const createAnamnesis = useCallback(async (anamnesisData: Omit<Anamnese, 'id' | 'created_at' | 'updated_at'>) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const newAnamnesis: Anamnese = {
      ...anamnesisData,
      id,
      created_at: now,
      updated_at: now
    };

    // Update local cache immediately
    const offlineData = loadOfflineData();
    offlineData.anamneses.push(newAnamnesis);
    saveOfflineData(offlineData);

    // Add to pending changes
    addPendingChange({
      type: 'create',
      table: 'anamneses',
      data: newAnamnesis
    });

    // Try to sync immediately if online
    if (isOnline) {
      syncPendingChanges();
    }

    return newAnamnesis;
  }, [loadOfflineData, saveOfflineData, addPendingChange, isOnline, syncPendingChanges]);

  const updateAnamnesis = useCallback(async (id: string, updates: Partial<Anamnese>) => {
    const offlineData = loadOfflineData();
    const anamnesisIndex = offlineData.anamneses.findIndex(a => a.id === id);
    
    if (anamnesisIndex === -1) {
      throw new Error('Anamnese não encontrada');
    }

    const updatedAnamnesis = {
      ...offlineData.anamneses[anamnesisIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Update local cache
    offlineData.anamneses[anamnesisIndex] = updatedAnamnesis;
    saveOfflineData(offlineData);

    // Add to pending changes
    addPendingChange({
      type: 'update',
      table: 'anamneses',
      data: updatedAnamnesis
    });

    // Try to sync immediately if online
    if (isOnline) {
      syncPendingChanges();
    }

    return updatedAnamnesis;
  }, [loadOfflineData, saveOfflineData, addPendingChange, isOnline, syncPendingChanges]);

  const deleteAnamnesis = useCallback(async (id: string) => {
    const offlineData = loadOfflineData();
    const anamnesisIndex = offlineData.anamneses.findIndex(a => a.id === id);
    
    if (anamnesisIndex === -1) {
      throw new Error('Anamnese não encontrada');
    }

    // Remove from local cache
    const deletedAnamnesis = offlineData.anamneses[anamnesisIndex];
    offlineData.anamneses.splice(anamnesisIndex, 1);
    saveOfflineData(offlineData);

    // Add to pending changes
    addPendingChange({
      type: 'delete',
      table: 'anamneses',
      data: { id }
    });

    // Try to sync immediately if online
    if (isOnline) {
      syncPendingChanges();
    }

    return deletedAnamnesis;
  }, [loadOfflineData, saveOfflineData, addPendingChange, isOnline, syncPendingChanges]);

  const createStudent = useCallback(async (studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'>) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const newStudent: Student = {
      ...studentData,
      id,
      created_at: now,
      updated_at: now
    };

    // Update local cache immediately
    const offlineData = loadOfflineData();
    offlineData.students.push(newStudent);
    saveOfflineData(offlineData);

    // Add to pending changes
    addPendingChange({
      type: 'create',
      table: 'students',
      data: newStudent
    });

    // Try to sync immediately if online
    if (isOnline) {
      syncPendingChanges();
    }

    return newStudent;
  }, [loadOfflineData, saveOfflineData, addPendingChange, isOnline, syncPendingChanges]);

  const updateStudent = useCallback(async (id: string, updates: Partial<Student>) => {
    const offlineData = loadOfflineData();
    const studentIndex = offlineData.students.findIndex(s => s.id === id);
    
    if (studentIndex === -1) {
      throw new Error('Aluno não encontrado');
    }

    const updatedStudent = {
      ...offlineData.students[studentIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Update local cache
    offlineData.students[studentIndex] = updatedStudent;
    saveOfflineData(offlineData);

    // Add to pending changes
    addPendingChange({
      type: 'update',
      table: 'students',
      data: updatedStudent
    });

    // Try to sync immediately if online
    if (isOnline) {
      syncPendingChanges();
    }

    return updatedStudent;
  }, [loadOfflineData, saveOfflineData, addPendingChange, isOnline, syncPendingChanges]);

  const deleteStudent = useCallback(async (id: string) => {
    const offlineData = loadOfflineData();
    const studentIndex = offlineData.students.findIndex(s => s.id === id);
    
    if (studentIndex === -1) {
      throw new Error('Aluno não encontrado');
    }

    // Remove from local cache
    const deletedStudent = offlineData.students[studentIndex];
    offlineData.students.splice(studentIndex, 1);
    saveOfflineData(offlineData);

    // Add to pending changes
    addPendingChange({
      type: 'delete',
      table: 'students',
      data: { id }
    });

    // Try to sync immediately if online
    if (isOnline) {
      syncPendingChanges();
    }

    return deletedStudent;
  }, [loadOfflineData, saveOfflineData, addPendingChange, isOnline, syncPendingChanges]);

  // Clear all offline data
  const clearOfflineData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPendingChangesCount(0);
    setLastSyncTime(null);
  }, []);

  return {
    // Status
    isOnline,
    isSyncing,
    syncError,
    lastSyncTime,
    pendingChangesCount,
    
    // Data management
    cacheData,
    getCachedData,
    clearOfflineData,
    
    // Sync operations
    syncPendingChanges,
    
    // CRUD operations (offline-first)
    createAnamnesis,
    updateAnamnesis,
    deleteAnamnesis,
    createStudent,
    updateStudent,
    deleteStudent
  };
}