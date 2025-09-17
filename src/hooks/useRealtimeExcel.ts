import { useEffect, useState, useCallback, useRef } from 'react';
import { ExcelService } from '../services/excelService';
import { CellChange, CollaborationState, ExcelData } from '@/schemas/excel';
import { createClient } from '@/utils/supabase/client';

interface UseRealtimeExcelProps {
  sheetId: string;
  userId: string;
  userName: string;
  companyId: string;
}

export const useRealtimeExcel = ({
  sheetId,
  userId,
  userName,
  companyId,
}: UseRealtimeExcelProps) => {
  const supabase = createClient();
  const [excelService] = useState(() => new ExcelService());
  const [isLoading, setIsLoading] = useState(true);
  const [collaborationState, setCollaborationState] =
    useState<CollaborationState>({
      activeUsers: [],
      pendingChanges: [],
    });
  const [worksheetData, setWorksheetData] = useState<any[][]>([]);

  const changeQueueRef = useRef<CellChange[]>([]);
  const isApplyingChangesRef = useRef(false);

  // Load initial sheet data
  const loadSheetData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('Sheet')
        .select('content')
        .eq('id', sheetId)
        .single();

      if (error) throw error;

      if (data?.content) {
        await excelService.initializeFromData(data.content as ExcelData);
        console.log('Loaded sheet data from database');
        const worksheetData = excelService.getWorksheetData() || [];
        console.log('Worksheet data:', worksheetData);
        setWorksheetData(worksheetData);
      }
    } catch (error) {
      console.error('Error loading sheet:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sheetId, excelService]);

  // Save changes to database
  const saveToDatabase = useCallback(
    async (data: ExcelData) => {
      try {
        await supabase
          .from('Sheet')
          .update({
            content: data,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', sheetId);
      } catch (error) {
        console.error('Error saving to database:', error);
      }
    },
    [sheetId]
  );

  // Apply queued changes
  const processChangeQueue = useCallback(async () => {
    if (isApplyingChangesRef.current || changeQueueRef.current.length === 0) {
      return;
    }

    isApplyingChangesRef.current = true;
    const changes = [...changeQueueRef.current];
    changeQueueRef.current = [];

    changes.forEach((change) => {
      excelService.applyCellChange(change);
    });

    const newData = excelService.exportToData();
    setWorksheetData(excelService.getWorksheetData() || []);

    // Save to database (debounced)
    await saveToDatabase(newData);

    isApplyingChangesRef.current = false;

    // Process any changes that came in while we were processing
    if (changeQueueRef.current.length > 0) {
      setTimeout(processChangeQueue, 100);
    }
  }, [excelService, saveToDatabase]);

  // Make a cell change
  const updateCell = useCallback(
    async (address: string, value: any) => {
      const change: CellChange = {
        address,
        value,
        userId,
        timestamp: Date.now(),
      };

      // Apply locally first for immediate feedback
      excelService.applyCellChange(change);
      setWorksheetData(excelService.getWorksheetData() || []);

      // Broadcast change
      const channel = supabase.channel(`sheet_${sheetId}`);
      await channel.send({
        type: 'broadcast',
        event: 'cell_change',
        payload: change,
      });

      // Queue for database save
      changeQueueRef.current.push(change);
      setTimeout(processChangeQueue, 300); // Debounce saves
    },
    [sheetId, userId, excelService, processChangeQueue]
  );

  // Setup realtime subscriptions
  useEffect(() => {
    const channel = supabase.channel(`sheet_${sheetId}`, {
      config: {
        broadcast: { self: false }, // Don't receive our own changes
      },
    });

    // Listen for cell changes from other users
    channel.on('broadcast', { event: 'cell_change' }, (payload) => {
      const change = payload.payload as CellChange;
      if (change.userId !== userId) {
        changeQueueRef.current.push(change);
        setTimeout(processChangeQueue, 100);
      }
    });

    // Listen for user presence
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users = Object.values(state).flat() as any[];

      setCollaborationState((prev) => ({
        ...prev,
        activeUsers: users.map((user) => ({
          userId: user.userId,
          userName: user.userName,
          currentCell: user.currentCell,
          color: user.color,
        })),
      }));
    });

    // Track user presence
    const userColor = `hsl(${Math.random() * 360}, 70%, 50%)`;
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId,
          userName,
          color: userColor,
          online_at: new Date().toISOString(),
        });
      }
    });

    // Listen for database changes (for conflict resolution)
    const dbChannel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Sheet',
          filter: `id=eq.${sheetId}`,
        },
        (payload) => {
          // Handle database updates from other sources
          if (payload.new?.content && !isApplyingChangesRef.current) {
            excelService.initializeFromData(payload.new.content as ExcelData);
            setWorksheetData(excelService.getWorksheetData() || []);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      dbChannel.unsubscribe();
    };
  }, [sheetId, userId, userName, excelService, processChangeQueue]);

  // Load initial data
  useEffect(() => {
    loadSheetData();
  }, [loadSheetData]);

  // Export functions
  const exportToExcel = useCallback(async (): Promise<Blob> => {
    const buffer = await excelService.exportToBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }, [excelService]);

  return {
    worksheetData,
    collaborationState,
    isLoading,
    updateCell,
    exportToExcel,
    excelService,
  };
};
