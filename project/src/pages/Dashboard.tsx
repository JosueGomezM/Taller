import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Truck, Users, X, Wrench, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, fetchWithCache } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { User, Vehicle, Repair, Machine } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showNewVehicleModal, setShowNewVehicleModal] = useState(false);
  const [showNewMachineModal, setShowNewMachineModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [repairStats, setRepairStats] = useState({
    pending: 0,
    in_progress: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'mechanic' as const
  });
  const [newVehicle, setNewVehicle] = useState({
    code: '',
    type: 'truck' as const,
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    serial_number: ''
  });
  const [newMachine, setNewMachine] = useState({
    plant: '',
    name: '',
    serial_number: ''
  });

  const fetchData = useCallback(async () => {
    if (user?.role !== 'admin') return;

    try {
      setLoading(true);
      setError('');
      
      // Fetch users with cache
      const { data: usersData, error: usersError } = await fetchWithCache(
        'dashboard-users',
        () => supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false }),
        { forceRefresh: true }
      );

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch vehicles with cache
      const { data: vehiclesData, error: vehiclesError } = await fetchWithCache(
        'dashboard-vehicles',
        () => supabase
          .from('vehicles')
          .select('*')
          .order('code'),
        { forceRefresh: true }
      );

      if (vehiclesError) throw vehiclesError;
      setVehicles(vehiclesData || []);

      // Fetch machines with cache
      const { data: machinesData, error: machinesError } = await fetchWithCache(
        'dashboard-machines',
        () => supabase
          .from('machines')
          .select('*')
          .order('code'),
        { forceRefresh: true }
      );

      if (machinesError) throw machinesError;
      setMachines(machinesData || []);

      // Fetch repair statistics
      const { data: repairsData, error: repairsError } = await fetchWithCache(
        'dashboard-repairs-stats',
        () => supabase
          .from('repairs')
          .select('status'),
        { forceRefresh: true }
      );

      if (repairsError) throw repairsError;

      const stats = {
        pending: 0,
        in_progress: 0,
        completed: 0
      };

      repairsData?.forEach((repair) => {
        stats[repair.status as keyof typeof stats]++;
      });

      setRepairStats(stats);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.full_name,
            role: newUser.role
          }
        }
      });

      if (authError) {
        if (authError.message === 'User already registered') {
          setError('Este correo electrónico ya está registrado');
        } else {
          throw authError;
        }
        return;
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      setShowNewUserModal(false);
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        role: 'mechanic'
      });
      fetchData();
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(error.message || 'Error al crear el usuario');
    }
  };

  const handleNewVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .insert([newVehicle]);

      if (vehicleError) throw vehicleError;

      setShowNewVehicleModal(false);
      setNewVehicle({
        code: '',
        type: 'truck',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        serial_number: ''
      });
      fetchData();
    } catch (error: any) {
      console.error('Error creating vehicle:', error);
      setError(error.message || 'Error al crear el vehículo');
    }
  };

  const handleNewMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const { error: machineError } = await supabase
        .from('machines')
        .insert([newMachine]);

      if (machineError) throw machineError;

      setShowNewMachineModal(false);
      setNewMachine({
        plant: '',
        name: '',
        serial_number: ''
      });
      fetchData();
    } catch (error: any) {
      console.error('Error creating machine:', error);
      setError(error.message || 'Error al crear la máquina');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Acceso Restringido</h1>
        <p className="text-gray-600 dark:text-gray-400">
          No tienes permisos para acceder a esta sección.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Estadísticas de Reparaciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reparaciones Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{repairStats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Wrench className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En Proceso</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{repairStats.in_progress}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completadas</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{repairStats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowNewVehicleModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
        >
          <Truck className="h-4 w-4 mr-2" />
          Nuevo Vehículo
        </button>
        <button
          onClick={() => setShowNewMachineModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Máquina
        </button>
        <button
          onClick={() => navigate('/repairs', { state: { action: 'new-repair' } })}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Reparación
        </button>
        <button
          onClick={() => setShowNewUserModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <Users className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Lista de Vehículos */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Vehículos Registrados</h2>
        {loading ? (
          <div className="text-center py-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Marca
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Modelo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Año
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Número de Serie
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="transition-colors duration-200 hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {vehicle.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        vehicle.type === 'truck' 
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
                          : vehicle.type === 'vehicle'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        {vehicle.type === 'truck' ? 'Camión' : vehicle.type === 'vehicle' ? 'Vehículo' : 'Equipo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {vehicle.brand}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {vehicle.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {vehicle.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {vehicle.serial_number}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lista de Máquinas */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Máquinas Registradas</h2>
        {loading ? (
          <div className="text-center py-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Planta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Número de Serie
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {machines.map((machine) => (
                  <tr key={machine.id} className="transition-colors duration-200 hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {machine.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {machine.plant}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {machine.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {machine.serial_number}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lista de Usuarios */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Usuarios del Sistema</h2>
        {loading ? (
          <div className="text-center py-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha de Registro
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="transition-colors duration-200 hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {user.role === 'admin' ? 'Administrador' : 'Mecánico'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(user.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nuevo Usuario */}
      {showNewUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nuevo Usuario</h3>
              <button
                onClick={() => setShowNewUserModal(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleNewUser} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rol
                </label>
                <select
                  required
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'mechanic' })}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="mechanic">Mecánico</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Vehículo */}
      {showNewVehicleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nuevo Vehículo</h3>
              <button
                onClick={() => setShowNewVehicleModal(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleNewVehicle} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Código
                </label>
                <input
                  type="text"
                  required
                  value={newVehicle.code}
                  onChange={(e) => setNewVehicle({ ...newVehicle, code: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ej: TRUCK-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipo
                </label>
                <select
                  required
                  value={newVehicle.type}
                  onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value as 'truck' | 'vehicle' | 'equipment' })}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="truck">Camión</option>
                  <option value="vehicle">Vehículo</option>
                  <option value="equipment">Equipo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Marca
                </label>
                <input
                  type="text"
                  required
                  value={newVehicle.brand}
                   onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Modelo
                </label>
                <input
                  type="text"
                  required
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Año
                </label>
                <input
                  type="number"
                  required
                  min="1900"
                  max={new Date().getFullYear()}
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Número de Serie
                </label>
                <input
                  type="text"
                  required
                  value={newVehicle.serial_number}
                  onChange={(e) => setNewVehicle({ ...newVehicle, serial_number: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewVehicleModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Máquina */}
      {showNewMachineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nueva Máquina</h3>
              <button
                onClick={() => setShowNewMachineModal(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleNewMachine} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Planta
                </label>
                <input
                  type="text"
                  required
                  value={newMachine.plant}
                  onChange={(e) => setNewMachine({ ...newMachine, plant: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={newMachine.name}
                  onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Número de Serie
                </label>
                <input
                  type="text"
                  required
                  value={newMachine.serial_number}
                  onChange={(e) => setNewMachine({ ...newMachine, serial_number: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewMachineModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}