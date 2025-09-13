const fs = require('fs');
const path = require('path');

function fixRemainingTypeErrors() {
  console.log('🔧 Corrigindo erros de tipos restantes...');
  
  // 1. Adicionar propriedades faltantes ao tipo Anamnese
  console.log('\n📝 Atualizando tipo Anamnese...');
  const typesFile = 'src/types/index.ts';
  let typesContent = fs.readFileSync(typesFile, 'utf8');
  
  // Adicionar propriedades faltantes ao tipo Anamnese
  if (!typesContent.includes('title?:')) {
    typesContent = typesContent.replace(
      /export interface Anamnese \{([^}]+)\}/s,
      (match, content) => {
        if (content.includes('title')) return match;
        const lines = content.split('\n');
        const insertIndex = lines.findIndex(line => line.includes('student_id:'));
        if (insertIndex !== -1) {
          lines.splice(insertIndex + 1, 0, '  title?: string;');
          lines.splice(insertIndex + 2, 0, '  notes?: string;');
        }
        return `export interface Anamnese {${lines.join('\n')}}`;
      }
    );
  }
  
  // Remover export duplicado de AnamneseSearchFilters
  const lines = typesContent.split('\n');
  const exportLines = lines.filter(line => line.includes('export type { AnamneseSearchFilters }'));
  if (exportLines.length > 1) {
    // Remover todas as linhas de export duplicadas
    typesContent = lines.filter(line => !line.includes('export type { AnamneseSearchFilters }')).join('\n');
  }
  
  fs.writeFileSync(typesFile, typesContent);
  console.log('✅ Tipo Anamnese atualizado');
  
  // 2. Corrigir arquivo AdvancedSearch.tsx
  console.log('\n🔄 Corrigindo AdvancedSearch.tsx...');
  const advancedSearchFile = 'src/components/AdvancedSearch.tsx';
  if (fs.existsSync(advancedSearchFile)) {
    let content = fs.readFileSync(advancedSearchFile, 'utf8');
    
    // Remover export duplicado
    const contentLines = content.split('\n');
    const filteredLines = contentLines.filter((line, index) => {
      if (line.includes('export type { AnamneseSearchFilters }')) {
        const firstOccurrence = contentLines.findIndex(l => l.includes('export type { AnamneseSearchFilters }'));
        return index === firstOccurrence;
      }
      return true;
    });
    
    content = filteredLines.join('\n');
    fs.writeFileSync(advancedSearchFile, content);
    console.log('✅ AdvancedSearch.tsx corrigido');
  }
  
  // 3. Corrigir arquivos que usam propriedades inexistentes
  const filesToFix = [
    {
      path: 'src/app/anamneses/[id]/edit/page.tsx',
      fixes: [
        // Adicionar verificação para propriedades opcionais
        { from: 'anamnesis.title', to: 'anamnesis.title || ""' },
        { from: 'anamnesis.notes', to: 'anamnesis.notes || ""' }
      ]
    },
    {
      path: 'src/app/anamneses/[id]/page.tsx',
      fixes: [
        { from: 'anamnesis.title', to: 'anamnesis.title || `Anamnese ${formatDate(anamnesis.created_at)}`' },
        { from: 'anamnesis.notes', to: 'anamnesis.notes || ""' }
      ]
    },
    {
      path: 'src/app/anamneses/page.tsx',
      fixes: [
        { from: 'anamnesis.title', to: 'anamnesis.title || `Anamnese ${formatDate(anamnesis.created_at)}`' },
        { from: 'anamnesis.notes', to: 'anamnesis.notes || ""' }
      ]
    },
    {
      path: 'src/app/dashboard/page.tsx',
      fixes: [
        { from: 'anamnesis.title', to: 'anamnesis.title || `Anamnese ${formatDate(anamnesis.created_at)}`' }
      ]
    },
    {
      path: 'src/app/history/page.tsx',
      fixes: [
        { from: 'anamnesis.title', to: 'anamnesis.title || `Anamnese ${formatDate(anamnesis.created_at)}`' },
        { from: 'anamnesis.notes', to: 'anamnesis.notes || ""' }
      ]
    },
    {
      path: 'src/app/students/[id]/anamneses/page.tsx',
      fixes: [
        { from: 'anamnesis.notes', to: 'anamnesis.notes || ""' },
        { from: 'anamnesis.created_by_user', to: 'anamnesis.created_by_user' },
        { from: "=== 'expiring_soon'", to: "=== 'expired'" }
      ]
    }
  ];
  
  console.log('\n🔄 Aplicando correções específicas...');
  
  filesToFix.forEach(({ path: filePath, fixes }) => {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Arquivo não encontrado: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    fixes.forEach(({ from, to }) => {
      if (content.includes(from) && from !== to) {
        content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Corrigido: ${filePath}`);
    } else {
      console.log(`ℹ️ Sem alterações: ${filePath}`);
    }
  });
  
  // 4. Corrigir queries do Supabase para incluir dados relacionados
  console.log('\n🔄 Corrigindo queries do Supabase...');
  
  const queryFixes = [
    {
      path: 'src/app/students/[id]/anamneses/page.tsx',
      from: '.select(`\n          *,\n          student:students!anamneses_student_id_fkey(id, name, email)\n        `)',
      to: '.select(`\n          *,\n          student:students!anamneses_student_id_fkey(id, name, email),\n          created_by_user:users!anamneses_created_by_fkey(id, name, email)\n        `)'
    }
  ];
  
  queryFixes.forEach(({ path: filePath, from, to }) => {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(from)) {
      content = content.replace(from, to);
      fs.writeFileSync(filePath, content);
      console.log(`✅ Query corrigida: ${filePath}`);
    }
  });
  
  console.log('\n🎉 Correções concluídas!');
  console.log('\n📋 Execute novamente: npm run type-check');
}

fixRemainingTypeErrors();