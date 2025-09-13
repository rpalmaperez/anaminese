'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { formatDateTime } from '@/lib/utils';

interface SyncStatusProps {
  className?: string;
  showDetails?: boolean;
}

export default function SyncStatus({ className = '', showDetails = false }: SyncStatusProps) {
  const {
    isOnline,
    isSyncing,
    syncError,
    lastSyncTime,
    pendingChangesCount,
    syncPendingChanges,
    clearOfflineData
  } = useOfflineSync();

  const [showDetailedStatus, setShowDetailedStatus] = useState(showDetails);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-600';
    if (syncError) return 'text-yellow-600';
    if (pendingChangesCount > 0) return 'text-blue-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    if (syncError) return <AlertTriangle className="h-4 w-4" />;
    if (pendingChangesCount > 0) return <Clock className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (isSyncing) return 'Sincronizando...';
    if (!isOnline) return 'Offline';
    if (syncError) return 'Erro na sincronização';
    if (pendingChangesCount > 0) return `${pendingChangesCount} alterações pendentes`;
    return 'Sincronizado';
  };

  const handleManualSync = async () => {
    if (isOnline && !isSyncing) {
      await syncPendingChanges();
    }
  };

  const handleClearData = () => {
    clearOfflineData();
    setShowClearConfirm(false);
  };

  if (!showDetailedStatus) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`flex items-center gap-1 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
        {(pendingChangesCount > 0 || syncError) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetailedStatus(true)}
            className="text-xs"
          >
            Detalhes
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="font-medium">{getStatusText()}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetailedStatus(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4 text-green-600" />
            <span>Conectado à internet</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-600" />
            <span>Sem conexão com a internet</span>
          </>
        )}
      </div>

      {/* Last Sync Time */}
      {lastSyncTime && (
        <div className="text-sm text-gray-600">
          <span>Última sincronização: </span>
          <span className="font-medium">{formatDateTime(lastSyncTime)}</span>
        </div>
      )}

      {/* Pending Changes */}
      {pendingChangesCount > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <span>
                {pendingChangesCount} alteração{pendingChangesCount !== 1 ? 'ões' : ''} aguardando sincronização
              </span>
              {isOnline && !isSyncing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualSync}
                  className="ml-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Sincronizar
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Sync Error */}
      {syncError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>{syncError}</span>
              {isOnline && !isSyncing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualSync}
                  className="ml-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Tentar novamente
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Offline Mode Info */}
      {!isOnline && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <WifiOff className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div>
              <p className="font-medium mb-1">Modo Offline Ativo</p>
              <p className="text-sm">
                Suas alterações estão sendo salvas localmente e serão sincronizadas quando a conexão for restaurada.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Sync Success */}
      {isOnline && !syncError && pendingChangesCount === 0 && lastSyncTime && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Todos os dados estão sincronizados com o servidor.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {isOnline && !isSyncing && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSync}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Sincronizar agora
          </Button>
        )}
        
        {(pendingChangesCount > 0 || lastSyncTime) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Limpar dados offline
          </Button>
        )}
      </div>

      {/* Clear Confirmation */}
      {showClearConfirm && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div>
              <p className="font-medium mb-2">Confirmar limpeza de dados offline</p>
              <p className="text-sm mb-3">
                Esta ação irá remover todos os dados salvos localmente e alterações pendentes. 
                Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearData}
                >
                  Confirmar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Compact version for header/navbar
export function SyncStatusCompact({ className = '' }: { className?: string }) {
  const {
    isOnline,
    isSyncing,
    syncError,
    pendingChangesCount
  } = useOfflineSync();

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-600';
    if (syncError) return 'text-yellow-600';
    if (pendingChangesCount > 0) return 'text-blue-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    if (syncError) return <AlertTriangle className="h-4 w-4" />;
    if (pendingChangesCount > 0) return <Clock className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  const getTooltipText = () => {
    if (isSyncing) return 'Sincronizando...';
    if (!isOnline) return 'Offline - Dados salvos localmente';
    if (syncError) return 'Erro na sincronização';
    if (pendingChangesCount > 0) return `${pendingChangesCount} alterações pendentes`;
    return 'Sincronizado';
  };

  return (
    <div 
      className={`flex items-center gap-1 ${getStatusColor()} ${className}`}
      title={getTooltipText()}
    >
      {getStatusIcon()}
      {pendingChangesCount > 0 && (
        <span className="text-xs bg-current text-white rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
          {pendingChangesCount > 99 ? '99+' : pendingChangesCount}
        </span>
      )}
    </div>
  );
}