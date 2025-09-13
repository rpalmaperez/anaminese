const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo erros finais de tipos...');

// Função para ler arquivo
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// Função para escrever arquivo
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

// 1. Corrigir anamneses/[id]/edit/page.tsx
const editPagePath = 'src/app/anamneses/[id]/edit/page.tsx';
let editPageContent = readFile(editPagePath);

// Adicionar import do formatDate se não existir
if (!editPageContent.includes('formatDate')) {
  editPageContent = editPageContent.replace(
    "import { Button } from '@/components/ui/Button';",
    "import { Button } from '@/components/ui/Button';\nimport { formatDate } from '@/lib/utils';"
  );
}

writeFile(editPagePath, editPageContent);
console.log('✅ Corrigido: anamneses/[id]/edit/page.tsx');

// 2. Corrigir anamneses/[id]/page.tsx
const viewPagePath = 'src/app/anamneses/[id]/page.tsx';
let viewPageContent = readFile(viewPagePath);

// Adicionar import do formatDate se não existir
if (!viewPageContent.includes('formatDate')) {
  viewPageContent = viewPageContent.replace(
    "import { Button } from '@/components/ui/Button';",
    "import { Button } from '@/components/ui/Button';\nimport { formatDate } from '@/lib/utils';"
  );
}

writeFile(viewPagePath, viewPageContent);
console.log('✅ Corrigido: anamneses/[id]/page.tsx');

// 3. Corrigir anamneses/page.tsx
const listPagePath = 'src/app/anamneses/page.tsx';
let listPageContent = readFile(listPagePath);

// Corrigir expressão sempre falsy
listPageContent = listPageContent.replace(
  /anamnesis\.notes \|\| "" &&/g,
  'anamnesis.notes &&'
);

// Corrigir comparação de status
listPageContent = listPageContent.replace(
  "anamnesis.status === 'expiring_soon'",
  "anamnesis.status === 'completed' && anamnesis.expires_at && new Date(anamnesis.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)"
);

writeFile(listPagePath, listPageContent);
console.log('✅ Corrigido: anamneses/page.tsx');

// 4. Corrigir dashboard/page.tsx
const dashboardPath = 'src/app/dashboard/page.tsx';
let dashboardContent = readFile(dashboardPath);

// Adicionar import do formatDate
if (!dashboardContent.includes('formatDate')) {
  dashboardContent = dashboardContent.replace(
    "import { supabase } from '@/lib/supabase';",
    "import { supabase } from '@/lib/supabase';\nimport { formatDate } from '@/lib/utils';"
  );
}

// Corrigir status 'active' para 'completed'
dashboardContent = dashboardContent.replace(
  /a\.status === 'active'/g,
  "a.status === 'completed'"
);

dashboardContent = dashboardContent.replace(
  /a\.status !== 'active'/g,
  "a.status !== 'completed'"
);

writeFile(dashboardPath, dashboardContent);
console.log('✅ Corrigido: dashboard/page.tsx');

console.log('\n🎉 Correções finais concluídas!');
console.log('📋 Execute: npm run type-check');