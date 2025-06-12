# ConectaFit App - MVP 1.1

## 1. Visão Geral do Projeto

### Resumo do Sistema
ConectaFit é uma plataforma web moderna que conecta profissionais de fitness (personal trainers) com seus clientes, facilitando o gerenciamento de treinos, acompanhamento de progresso e comunicação entre as partes. O sistema resolve o problema de organização e acompanhamento de treinos, eliminando a necessidade de planilhas e comunicação fragmentada.

### Objetivos Principais
- Facilitar a criação e gerenciamento de treinos personalizados
- Melhorar o acompanhamento do progresso dos alunos
- Centralizar a comunicação entre treinadores e alunos
- Automatizar processos administrativos do personal trainer
- Fornecer métricas e insights sobre o desempenho dos alunos

### Público-Alvo
- Personal Trainers profissionais
- Alunos/clientes de personal trainers
- Academias e estúdios de treinamento

### Stack Tecnológica
#### Frontend
- Next.js 14 (Framework React)
- TypeScript
- Tailwind CSS
- Radix UI (Componentes)
- React Hook Form
- Zod (Validação)

#### Backend
- Supabase (BaaS)
  - PostgreSQL (Banco de dados)
  - Autenticação
  - Storage
  - Edge Functions

#### Infraestrutura
- Docker
- Nginx

### Escopo e Funcionalidades Principais
- Sistema de autenticação e autorização
- Dashboard personalizado para treinadores e alunos
- Gerenciamento de treinos e exercícios
- Agendamento de sessões
- Acompanhamento de progresso
- Sistema de notificações
- Perfis personalizados
- Relatórios e métricas

## 2. Arquitetura do Sistema

### Diagrama de Arquitetura
```
[Cliente] → [Next.js Frontend] → [Supabase]
   ↑            ↓
   └────────────┘
```

### Padrões Utilizados
- Clean Architecture (Separação de responsabilidades)
- Component-Based Architecture (React)
- Repository Pattern (Acesso a dados)
- Service Layer Pattern (Lógica de negócios)

### Justificativas Arquiteturais
- Next.js: Escolhido pela performance, SEO e facilidade de desenvolvimento
- Supabase: Reduz complexidade de infraestrutura e oferece recursos prontos
- TypeScript: Garante type safety e melhor manutenibilidade
- Tailwind CSS: Facilita desenvolvimento responsivo e consistente

### Fluxos Principais
1. Autenticação
   - Login/Registro
   - Recuperação de senha
   - Proteção de rotas

2. Gerenciamento de Treinos
   - Criação de treino
   - Atribuição a alunos
   - Acompanhamento de progresso

3. Sessões
   - Agendamento
   - Check-in/Check-out
   - Feedback

## 3. Estrutura do Código

### Organização de Pastas
```
├── app/                    # Rotas e páginas Next.js
│   ├── (auth)/            # Rotas de autenticação
│   ├── (dashboard)/       # Rotas do dashboard
│   └── api/               # API routes
├── components/            # Componentes React
│   ├── ui/               # Componentes base
│   ├── workouts/         # Componentes de treinos
│   └── ...
├── hooks/                # Custom hooks
├── lib/                  # Utilitários e configurações
└── styles/              # Estilos globais
```

### Padrões de Codificação
- ESLint para linting
- Prettier para formatação
- Conventional Commits
- Nomenclatura em inglês
- Componentes funcionais com hooks

### Principais Componentes
- `Layout`: Estrutura base da aplicação
- `AuthProvider`: Gerenciamento de autenticação
- `WorkoutManager`: Gerenciamento de treinos
- `SessionScheduler`: Agendamento de sessões

## 4. API

### Rotas Principais
```typescript
// Autenticação
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout

// Treinos
GET /api/workouts
POST /api/workouts
PUT /api/workouts/:id
DELETE /api/workouts/:id

// Sessões
GET /api/sessions
POST /api/sessions
PUT /api/sessions/:id
```

### Formato dos Dados
- JSON para todas as requisições/respostas
- Validação com Zod
- Tipagem TypeScript

### Autenticação
- JWT via Supabase
- Middleware de proteção de rotas
- Refresh tokens

## 5. Segurança

### Proteções Implementadas
- CSRF Protection
- CORS configurado
- XSS Prevention
- SQL Injection Prevention (via Supabase)
- Rate Limiting
- Input Sanitization

### Autenticação e Sessão
- JWT com expiração
- Refresh tokens
- Sessões seguras
- Logout em múltiplos dispositivos

### Armazenamento Seguro
- Variáveis de ambiente
- Dados sensíveis criptografados
- Senhas hasheadas
- Tokens seguros

## 7. Deploy e Infraestrutura

### Ambientes
- Development (localhost)
- Production (vps)

### Processo de Deploy
- CI/CD via Vps
- Deploy automático em PR
- Deploy manual em produção
- Testes automatizados

### Serviços
- Vps (Hosting)
- Supabase (Backend)
- GitHub (Versionamento)

## 8. Instalação e Execução Local

### Pré-requisitos
- Node.js 18+
- pnpm
- Docker (opcional)
- Conta Supabase

### Passo a Passo
1. Clone o repositório
2. Instale dependências:
   ```bash
   pnpm install
   ```
3. Configure variáveis de ambiente:
   ```bash
   cp .env.example .env.local
   ```
4. Inicie o servidor:
   ```bash
   pnpm dev
   ```

## 9. Performance e Escalabilidade

### Otimizações
- Lazy loading de componentes
- Image optimization
- Caching de API
- Code splitting
- Bundle optimization

### Escalabilidade
- Arquitetura serverless
- CDN para assets
- Caching em múltiplas camadas

## 10. Considerações Finais

### Dificuldades Enfrentadas
- Integração com Supabase
- Gerenciamento de estado complexo
- Otimização de performance
- Testes automatizados

### Melhorias Futuras
- App mobile
- Sistema de pagamentos
- Gamificação
- IA para sugestões de treino
- Integração com wearables
