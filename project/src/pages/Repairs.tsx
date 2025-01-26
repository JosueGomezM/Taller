import React, { useState, useEffect, useCallback } from 'react';
import { Filter, MessageSquare, X, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase, fetchWithCache } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Vehicle, Repair, Machine } from '../types';

type RepairWithDetails = Repair & { 
  vehicle?: Vehicle;
  machine?: Machine;
};

export default function Repairs() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [repairs, setRepairs] = useState<RepairWithDetails[]>([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showNewRepairModal, setShowNewRepairModal] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Estado para nueva reparación
  const [newRepair, setNewRepair] = useState({
    type: 'vehicle' as const,
    vehicle_id: '',
    machine_id: '',
    description: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar vehículos
      const { data: vehiclesData, error: vehiclesError } = await fetchWithCache(
        'repairs-vehicles',
        () => supabase
          .from('vehicles')
          .select('*')
          .order('code'),
        { forceRefresh: true }
      );

      if (vehiclesError) throw vehiclesError;
      setVehicles(vehiclesData || []);

      // Cargar máquinas
      const { data: machinesData, error: machinesError } = await fetchWithCache(
        'repairs-machines',
        () => supabase
          .from('machines')
          .select('*')
          .order('code'),
        { forceRefresh: true }
      );

      if (machinesError) throw machinesError;
      setMachines(machinesData || []);

      // Cargar reparaciones activas
      const { data: repairsData, error: repairsError } = await fetchWithCache(
        'repairs-active',
        () => supabase
          .from('repairs')
          .select(`
            *,
            vehicle:vehicles(*),
            machine:machines(*)
          `)
          .in('status', ['pending', 'in_progress'])
          .order('created_at', { ascending: false }),
        { forceRefresh: true }
      );

      if (repairsError) throw repairsError;
      setRepairs(repairsData as RepairWithDetails[] || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Mostrar modal de nueva reparación si viene desde el dashboard
    if (location.state?.action === 'new-repair') {
      setShowNewRepairModal(true);
      // Limpiar el estado para que no se vuelva a abrir al navegar
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate, fetchData]);

  const handleStatusChange = async (repairId: string, newStatus: 'in_progress' | 'completed') => {
    try {
      setError(null);
      const { error } = await supabase
        .from('repairs')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null 
        })
        .eq('id', repairId);

      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error('Error updating repair status:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar el estado');
    }
  };

  const handleAddComment = async () => {
    if (!selectedRepair || !comment.trim()) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('repair_comments')
        .insert([{
          repair_id: selectedRepair,
          user_id: user!.id,
          comment: comment.trim(),
          status: 'pending'
        }]);

      if (error) throw error;
      setComment('');
      setShowCommentModal(false);
      setSelectedRepair(null);
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err instanceof Error ? err.message : 'Error al agregar el comentario');
    }
  };

  const handleCreateRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que se haya seleccionado un vehículo o máquina
    if (newRepair.type === 'vehicle' && !newRepair.vehicle_id) {
      setError('Por favor seleccione un vehículo');
      return;
    }
    if (newRepair.type === 'machine' && !newRepair.machine_id) {
      setError('Por favor seleccione una máquina');
      return;
    }
    if (!newRepair.description.trim()) {
      setError('Por favor ingrese una descripción');
      return;
    }

    try {
      setError(null);
      const repairData = {
        mechanic_id: user!.id,
        description: newRepair.description.trim(),
        status: 'pending',
        started_at: new Date().toISOString(),
        vehicle_id: newRepair.type === 'vehicle' ? newRepair.vehicle_id : null,
        machine_id: newRepair.type === 'machine' ? newRepair.machine_id : null
      };

      const { error } = await supabase
        .from('repairs')
        .insert([repairData]);

      if (error) throw error;

      setNewRepair({
        type: 'vehicle',
        vehicle_id: '',
        machine_id: '',
        description: ''
      });
      setShowNewRepairModal(false);
      await fetchData();
    } catch (err) {
      console.error('Error creating repair:', err);
      setError(err instanceof Error ? err.message : 'Error al crear la reparación');
    }
  };

  const filteredRepairs = selectedFilter === 'all'
    ? repairs
    : repairs.filter(repair => {
        if (selectedFilter === 'vehicles') {
          return repair.vehicle_id !== null;
        } else {
          return repair.machine_id !== null;
        }
      });

  return (
    <div className="space-y-6">
      {/* Filtro */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">Todas las reparaciones</option>
            <option value="vehicles">Vehículos</option>
            <option value="machines">Máquinas</option>
          </select>
        </div>
      </div>

      {/* Lista de Reparaciones */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando reparaciones...</p>
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
              <p className="text-gray-500 dark:text-gray-400">No hay reparaciones activas</p>
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
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {asset.code} - {repair.vehicle ? `${repair.vehicle.brand} ${repair.vehicle.model}` : repair.machine?.name}
                        </h4>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                          {repair.description}
                        </p>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          Inicio: {new Date(repair.started_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          repair.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {repair.status === 'pending' ? 'Pendiente' : 'En Proceso'}
                        </span>
                        <div className="flex gap-2">
                          {repair.status === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(repair.id, 'in_progress')}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            >
                              Iniciar
                            </button>
                          )}
                          {repair.status === 'in_progress' && (
                            <button
                              onClick={() => handleStatusChange(repair.id, 'completed')}
                              className="px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                            >
                              Finalizar
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedRepair(repair.id);
                              setShowCommentModal(true);
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Comentar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Nueva Reparación */}
      {showNewRepairModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
              <button
                onClick={() => setShowNewRepairModal(false)}
                className="mr-4 text-gray-400 hover:text-gray-500 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Nueva Reparación
              </h3>
            </div>
            <form onSubmit={handleCreateRepair} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo
                </label>
                <select
                  value={newRepair.type}
                  onChange={(e) => setNewRepair({ 
                    ...newRepair, 
                    type: e.target.value as 'vehicle' | 'machine',
                    vehicle_id: '',
                    machine_id: ''
                  })}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="vehicle">Vehículo</option>
                  <option value="machine">Máquina</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {newRepair.type === 'vehicle' ? 'Vehículo' : 'Máquina'}
                </label>
                <select
                  value={newRepair.type === 'vehicle' ? newRepair.vehicle_id : newRepair.machine_id}
                  onChange={(e) => setNewRepair({ 
                    ...newRepair, 
                    vehicle_id: newRepair.type === 'vehicle' ? e.target.value : '',
                    machine_id: newRepair.type === 'machine' ? e.target.value : ''
                  })}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccione {newRepair.type === 'vehicle' ? 'un vehículo' : 'una máquina'}</option>
                  {newRepair.type === 'vehicle' 
                    ? vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.code} - {vehicle.brand} {vehicle.model}
                        </option>
                      ))
                    : machines.map((machine) => (
                        <option key={machine.id} value={machine.id}>
                          {machine.code} - {machine.name}
                        </option>
                      ))
                  }
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción del trabajo
                </label>
                <textarea
                  value={newRepair.description}
                  onChange={(e) => setNewRepair({ ...newRepair, description: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Describe el trabajo a realizar..."
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewRepairModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Reparación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Comentarios */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Agregar Comentario</h3>
              <button
                onClick={() => {
                  setShowCommentModal(false);
                  setSelectedRepair(null);
                  setComment('');
                }}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                placeholder="Escribe tu comentario aquí..."
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCommentModal(false);
                    setSelectedRepair(null);
                    setComment('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}