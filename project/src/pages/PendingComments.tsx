import React, { useState, useEffect } from 'react';
import { MessageSquare, Check, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { RepairComment } from '../types';

export default function PendingComments() {
  const [comments, setComments] = useState<RepairComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingCommentId, setUpdatingCommentId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: commentsError } = await supabase
        .from('repair_comments')
        .select(`
          *,
          user:users(*),
          repair:repairs(
            *,
            vehicle:vehicles(*),
            machine:machines(*)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Error al cargar los comentarios');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (commentId: string) => {
    try {
      setUpdatingCommentId(commentId);
      setError(null);

      const { error: updateError } = await supabase
        .from('repair_comments')
        .update({ 
          status: 'read',
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (updateError) throw updateError;

      // Actualizar el estado local removiendo el comentario marcado como leído
      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
      
    } catch (error: any) {
      console.error('Error marking comment as read:', error);
      setError(error.message || 'Error al marcar el comentario como leído');
    } finally {
      setUpdatingCommentId(null);
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
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
          <button
            onClick={fetchComments}
            className="ml-2 underline hover:no-underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No hay comentarios pendientes
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Todos los comentarios han sido revisados
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            // Determinar el activo (vehículo o máquina)
            const asset = comment.repair?.vehicle || comment.repair?.machine;
            const assetName = asset ? (
              'brand' in asset 
                ? `${asset.code} - ${asset.brand} ${asset.model}`
                : `${asset.code} - ${asset.name}`
            ) : 'Activo no encontrado';

            return (
              <div 
                key={comment.id} 
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-lg"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {comment.user?.full_name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          comentó en
                        </span>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-md">
                          {assetName}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {comment.comment}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        {new Date(comment.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkAsRead(comment.id)}
                      disabled={updatingCommentId === comment.id}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        updatingCommentId === comment.id
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                      {updatingCommentId === comment.id ? 'Actualizando...' : 'Marcar como leído'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}