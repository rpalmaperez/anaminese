const fs = require('fs');
const path = require('path');

// Lista de arquivos com problemas de tipos identificados
const filesToFix = [
  'src/app/anamneses/[id]/edit/page.tsx',
  'src/app/anamneses/[id]/page.tsx',
  'src/app/anamneses/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/history/page.tsx',
  'src/app/students/[id]/anamneses/page.tsx',
  'src/app/students/page.tsx',
  'src/components/AdvancedSearch.tsx'
];

// Mapeamento de correções
const typeCorrections = {
  // Corrigir nome do tipo
  'Anamnesis': 'Anamnese',
  'AnamnasisWithStudent': 'AnamneseWithStudent',
  'AnamnesisWithRelations': 'AnamneseWithRelations',
  'AnamnesisWithStudent': 'AnamneseWithStudent',
  
  // Propriedades que precisam ser corrigidas
  'anamnesis.updated_at': 'anamnesis.updated_at',
  'anamnesis.id': 'anamnesis.id',
  'student.cpf': 'student.cpf || ""'
};

// Definições de tipos que precisam ser adicionadas
const typeDefinitions = `
// Tipos estendidos para relacionamentos
export interface AnamneseWithStudent extends Anamnese {
  student: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    birth_date?: string;
    cpf?: string;
  };
  created_by_user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AnamneseWithRelations extends Anamnese {
  student: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    birth_date?: string;
    cpf?: string;
  };
  created_by_user: {
    id: string;
    name: string;
    email: string;
  };
  updated_by_user?: {
    id: string;
    name: string;
    email: string;
  };
}

// Filtros de busca para anamneses
export interface AnamneseSearchFilters {
  searchTerm?: string;
  studentId?: string;
  status?: string;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  ageRange?: { min: number; max: number };
  hasSymptoms?: boolean | null;
  hasMedications?: boolean | null;
  hasAllergies?: boolean | null;
  painScaleRange?: { min: number; max: number };
}
`;

function fixTypeInconsistencies() {
  console.log('🔧 Iniciando correção de inconsistências de tipos...');
  
  // 1. Adicionar tipos faltantes ao arquivo de tipos principal
  console.log('\n📝 Adicionando tipos faltantes...');
  const typesFile = 'src/types/index.ts';
  const typesContent = fs.readFileSync(typesFile, 'utf8');
  
  if (!typesContent.includes('AnamneseWithStudent')) {
    fs.appendFileSync(typesFile, typeDefinitions);
    console.log('✅ Tipos adicionados ao arquivo principal');
  } else {
    console.log('ℹ️ Tipos já existem no arquivo principal');
  }
  
  // 2. Adicionar propriedade cpf ao tipo Student se não existir
  if (!typesContent.includes('cpf?:')) {
    const updatedContent = typesContent.replace(
      /export interface Student \{[^}]+\}/s,
      (match) => {
        if (match.includes('cpf')) return match;
        return match.replace(
          'phone?: string;',
          'phone?: string;\n  cpf?: string;'
        );
      }
    );
    fs.writeFileSync(typesFile, updatedContent);
    console.log('✅ Propriedade cpf adicionada ao tipo Student');
  }
  
  // 3. Corrigir arquivos individuais
  console.log('\n🔄 Corrigindo arquivos individuais...');
  
  filesToFix.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Arquivo não encontrado: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Aplicar correções de tipos
    Object.entries(typeCorrections).forEach(([wrong, correct]) => {
      if (content.includes(wrong) && wrong !== correct) {
        content = content.replace(new RegExp(wrong, 'g'), correct);
        hasChanges = true;
      }
    });
    
    // Correções específicas por arquivo
    if (filePath.includes('students/page.tsx')) {
      // Corrigir acesso ao CPF
      content = content.replace(
        /student\.cpf\?\./g,
        '(student.cpf || "").'
      );
      hasChanges = true;
    }
    
    if (filePath.includes('AdvancedSearch.tsx')) {
      // Remover export duplicado
      const lines = content.split('\n');
      const filteredLines = lines.filter((line, index) => {
        if (line.includes('export type { AnamneseSearchFilters }')) {
          // Manter apenas a primeira ocorrência
          const firstOccurrence = lines.findIndex(l => l.includes('export type { AnamneseSearchFilters }'));
          return index === firstOccurrence;
        }
        return true;
      });
      content = filteredLines.join('\n');
      hasChanges = true;
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Corrigido: ${filePath}`);
    } else {
      console.log(`ℹ️ Sem alterações: ${filePath}`);
    }
  });
  
  console.log('\n🎉 Correção de tipos concluída!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Execute: npm run type-check');
  console.log('2. Verifique se ainda há erros de tipos');
  console.log('3. Teste a aplicação para garantir que tudo funciona');
}

fixTypeInconsistencies();