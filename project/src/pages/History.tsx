import React, { useState, useEffect, useCallback } from 'react';
import { Filter, FileDown } from 'lucide-react';
import { supabase, fetchWithCache } from '../lib/supabase';
import type { Repair, Vehicle, Machine } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type RepairWithDetails = Repair & {
  vehicle?: Vehicle | null;
  machine?: Machine | null;
};

type Asset = Vehicle | Machine;

export default function History() {
  const [repairs, setRepairs] = useState<RepairWithDetails[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string>('all');
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar vehículos y máquinas
      const [vehiclesResponse, machinesResponse] = await Promise.all([
        fetchWithCache(
          'history-vehicles',
          () => supabase
            .from('vehicles')
            .select('*')
            .order('code'),
          { forceRefresh: true }
        ),
        fetchWithCache(
          'history-machines',
          () => supabase
            .from('machines')
            .select('*')
            .order('code'),
          { forceRefresh: true }
        )
      ]);

      if (vehiclesResponse.error) throw vehiclesResponse.error;
      if (machinesResponse.error) throw machinesResponse.error;

      // Obtener solo los activos que tienen reparaciones
      const { data: repairsData, error: repairsError } = await fetchWithCache(
        'history-repairs',
        () => supabase
          .from('repairs')
          .select(`
            *,
            vehicle:vehicles(*),
            machine:machines(*)
          `)
          .order('created_at', { ascending: false }),
        { forceRefresh: true }
      );

      if (repairsError) throw repairsError;

      // Establecer las reparaciones
      const repairs = repairsData as RepairWithDetails[] || [];
      setRepairs(repairs);

      // Crear un conjunto de IDs únicos de activos que tienen reparaciones
      const assetIds = new Set<string>();
      repairs.forEach(repair => {
        if (repair.vehicle_id) assetIds.add(repair.vehicle_id);
        if (repair.machine_id) assetIds.add(repair.machine_id);
      });

      // Filtrar y combinar solo los activos que tienen reparaciones
      const assetsWithRepairs = [
        ...(vehiclesResponse.data || []).filter(v => assetIds.has(v.id)),
        ...(machinesResponse.data || []).filter(m => assetIds.has(m.id))
      ].sort((a, b) => a.code.localeCompare(b.code));

      setAssets(assetsWithRepairs);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'in_progress':
        return 'En Proceso';
      default:
        return 'Pendiente';
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
  };

  const generatePDF = async () => {
    if (generating) return;
    
    try {
      setGenerating(true);
      const doc = new jsPDF();
      
      // Cargar el logo de forma asíncrona
      const logoUrl = 'https://vlvdykzznjdnfcsutloc.supabase.co/storage/v1/object/sign/Imagenes/LOGO%20SIN%20RELLENO.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJJbWFnZW5lcy9MT0dPIFNJTiBSRUxMRU5PLnBuZyIsImlhdCI6MTczNjcyNjE3NywiZXhwIjoxNzY4MjYyMTc3fQ.LjJRGsZLRt5JMWU4dkMvfzkfGMo35ikw0ksDcYlVNnE&t=2025-01-12T23%3A55%3A37.904Z';
      
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          try {
            const imgWidth = 30;
            const imgHeight = (img.height * imgWidth) / img.width;
            doc.addImage(img, 'PNG', 15, 10, imgWidth, imgHeight);
            resolve(null);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = reject;
        img.src = logoUrl;
      });
      
      // Configurar título y metadatos
      doc.setFontSize(16);
      doc.text('Historial de Reparaciones', 50, 25);

      // Agregar información del reporte
      doc.setFontSize(10);
      doc.text(`Generado por: ${user?.full_name}`, 15, 40);
      doc.text(`Fecha: ${format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}`, 15, 45);
      
      if (selectedAsset !== 'all') {
        const selectedAssetData = assets.find(a => a.id === selectedAsset);
        if (selectedAssetData) {
          doc.text(`Activo: ${selectedAssetData.code} - ${
            'brand' in selectedAssetData 
              ? `${selectedAssetData.brand} ${selectedAssetData.model}`
              : selectedAssetData.name
          }`, 15, 50);
        }
      }
      
      // Tabla de reparaciones
      const headers = [
        'Fecha', 
        'Activo', 
        'Estado', 
        'Descripción', 
        'Inicio', 
        'Finalización'
      ];

      const data = filteredRepairs
        .map(repair => {
          const asset = repair.vehicle || repair.machine;
          const assetName = asset ? (
            'brand' in asset 
              ? `${asset.code} - ${asset.brand} ${asset.model}`
              : `${asset.code} - ${asset.name}`
          ) : 'N/A';

          return [
            formatDate(repair.created_at),
            assetName,
            getStatusText(repair.status),
            repair.description,
            formatDate(repair.started_at),
            repair.completed_at ? formatDate(repair.completed_at) : '-'
          ];
        });

      (doc as any).autoTable({
        head: [headers],
        body: data,
        startY: selectedAsset !== 'all' ? 55 : 50,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20 },
          3: { cellWidth: 40 },
          4: { cellWidth: 30 },
          5: { cellWidth: 30 }
        },
        margin: { left: 15, right: 15 }
      });
      
      // Guardar el PDF
      const fileName = `historial_reparaciones_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generando PDF:', error);
      setError('Error al generar el PDF');
    } finally {
      setGenerating(false);
    }
  };

  const filteredRepairs = selectedAsset === 'all'
    ? repairs
    : repairs.filter(repair => {
        const asset = repair.vehicle || repair.machine;
        return asset?.id === selectedAsset;
      });

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <option value="all">Todos los activos</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.code} - {
                      'brand' in asset 
                        ? `${asset.brand} ${asset.model}`
                        : asset.name
                    }
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={generatePDF}
              disabled={generating}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                generating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-r-transparent mr-2" />
                  Generando...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar PDF
                </>
              )}
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando reparaciones...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={fetchData}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : filteredRepairs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600 dark:text-gray-400">No hay reparaciones registradas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRepairs.map((repair) => {
                const asset = repair.vehicle || repair.machine;
                if (!asset) return null;

                return (
                  <div
                    key={repair.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors duration-200 hover:bg-gray-800/50"
                  >
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-800 dark:text-white">
                          {asset.code} - {
                            'brand' in asset 
                              ? `${asset.brand} ${asset.model}`
                              : asset.name
                          }
                        </h4>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                          {repair.description}
                        </p>
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <p>Inicio: {formatDate(repair.started_at)}</p>
                          {repair.completed_at && (
                            <p>Finalización: {formatDate(repair.completed_at)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(repair.status)}`}>
                          {getStatusText(repair.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}