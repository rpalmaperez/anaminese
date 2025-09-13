'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  User, 
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Student, User as UserType } from '@/types';

export interface AnamneseSearchFilters {
  searchTerm: string;
  studentId: string;
  status: string;
  createdBy: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  ageRange: {
    min: number;
    max: number;
  };
  hasSymptoms: boolean | null;
  hasMedications: boolean | null;
  hasAllergies: boolean | null;
  painScaleRange: {
    min: number;
    max: number;
  };
}

interface AdvancedSearchProps {
  filters: AnamneseSearchFilters;
  onFiltersChange: (filters: AnamneseSearchFilters) => void;
  students: Student[];
  users: UserType[];
  onClear: () => void;
  className?: string;
}

const defaultFilters: AnamneseSearchFilters = {
  searchTerm: '',
  studentId: '',
  status: '',
  createdBy: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
  ageRange: { min: 0, max: 100 },
  hasSymptoms: null,
  hasMedications: null,
  hasAllergies: null,
  painScaleRange: { min: 0, max: 10 }
};

export default function AdvancedSearch({
  filters,
  onFiltersChange,
  students,
  users,
  onClear,
  className = ''
}: AdvancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<AnamneseSearchFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key: keyof AnamneseSearchFilters, value: AnamneseSearchFilters[keyof AnamneseSearchFilters]) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const updateNestedFilter = (parentKey: keyof AnamneseSearchFilters, childKey: string, value: unknown) => {
    const newFilters = {
      ...localFilters,
      [parentKey]: {
        ...(localFilters[parentKey] as Record<string, unknown>),
        [childKey]: value
      }
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClear = () => {
    setLocalFilters(defaultFilters);
    onClear();
  };

  const hasActiveFilters = () => {
    return (
      localFilters.searchTerm ||
      localFilters.studentId ||
      localFilters.status ||
      localFilters.createdBy ||
      localFilters.dateFrom ||
      localFilters.dateTo ||
      localFilters.ageRange.min > 0 ||
      localFilters.ageRange.max < 100 ||
      localFilters.hasSymptoms !== null ||
      localFilters.hasMedications !== null ||
      localFilters.hasAllergies !== null ||
      localFilters.painScaleRange.min > 0 ||
      localFilters.painScaleRange.max < 10
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Busca Avançada
            {hasActiveFilters() && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Filtros ativos
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Recolher
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Expandir
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Basic Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por título, aluno, observações..."
                value={localFilters.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aluno
            </label>
            <Select
              value={localFilters.studentId}
              onValueChange={(value) => updateFilter('studentId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os alunos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os alunos</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              value={localFilters.status}
              onValueChange={(value) => updateFilter('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="expired">Expirada</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="space-y-6 border-t pt-6">
            {/* Date and Creator Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data inicial
                </label>
                <Input
                  type="date"
                  value={localFilters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data final
                </label>
                <Input
                  type="date"
                  value={localFilters.dateTo}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Criado por
                </label>
                <Select
                  value={localFilters.createdBy}
                  onValueChange={(value) => updateFilter('createdBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os usuários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os usuários</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Faixa etária do aluno
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Idade mínima</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={localFilters.ageRange.min}
                    onChange={(e) => updateNestedFilter('ageRange', 'min', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Idade máxima</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={localFilters.ageRange.max}
                    onChange={(e) => updateNestedFilter('ageRange', 'max', parseInt(e.target.value) || 100)}
                    placeholder="100"
                  />
                </div>
              </div>
            </div>

            {/* Pain Scale Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escala de dor
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Dor mínima</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={localFilters.painScaleRange.min}
                    onChange={(e) => updateNestedFilter('painScaleRange', 'min', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Dor máxima</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={localFilters.painScaleRange.max}
                    onChange={(e) => updateNestedFilter('painScaleRange', 'max', parseInt(e.target.value) || 10)}
                    placeholder="10"
                  />
                </div>
              </div>
            </div>

            {/* Medical Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condições médicas
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Possui sintomas</label>
                  <Select
                    value={localFilters.hasSymptoms === null ? '' : localFilters.hasSymptoms.toString()}
                    onValueChange={(value) => updateFilter('hasSymptoms', value === '' ? null : value === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Qualquer</SelectItem>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Usa medicamentos</label>
                  <Select
                    value={localFilters.hasMedications === null ? '' : localFilters.hasMedications.toString()}
                    onValueChange={(value) => updateFilter('hasMedications', value === '' ? null : value === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Qualquer</SelectItem>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Possui alergias</label>
                  <Select
                    value={localFilters.hasAllergies === null ? '' : localFilters.hasAllergies.toString()}
                    onValueChange={(value) => updateFilter('hasAllergies', value === '' ? null : value === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Qualquer</SelectItem>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Sorting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenação
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ordenar por</label>
                  <Select
                    value={localFilters.sortBy}
                    onValueChange={(value) => updateFilter('sortBy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Data de criação</SelectItem>
                      <SelectItem value="updated_at">Última atualização</SelectItem>
                      <SelectItem value="title">Título</SelectItem>
                      <SelectItem value="student_name">Nome do aluno</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="pain_scale">Escala de dor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ordem</label>
                  <Select
                    value={localFilters.sortOrder}
                    onValueChange={(value) => updateFilter('sortOrder', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Decrescente</SelectItem>
                      <SelectItem value="asc">Crescente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          {hasActiveFilters() && (
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { defaultFilters };