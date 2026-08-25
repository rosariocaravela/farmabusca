# FarmaBusca

Aplicação móvel e web para pesquisa de medicamentos e farmácias, gestão de catálogos farmacêuticos e administração de estabelecimentos cadastrados. O repositório contém um frontend React Native/Expo e uma API REST Node.js/Express ligada a PostgreSQL.

> **Estado:** MVP em desenvolvimento. Há fluxos funcionais para pacientes, farmácias e administradores, mas pagamentos, recuperação de palavra-passe, mapa administrativo, segurança das respostas e testes ainda exigem trabalho antes de produção.

## Diagnóstico resumido

O código implementa três perfis (`PATIENT`, `PHARMACY` e `ADMIN`). Pacientes pesquisam medicamentos, consultam farmácias, guardam favoritos e iniciam uma taxa de reserva por M-Pesa. Farmácias completam um cadastro documental e, depois de aprovadas, gerem o próprio catálogo. Administradores analisam farmácias, alteram o estado delas e consultam indicadores agregados.

Conclusões principais:

- A arquitetura frontend/backend e os fluxos centrais estão ligados à API.
- A base possui utilizadores, farmácias, categorias, medicamentos, favoritos e pagamentos.
- Não existe modelo separado de paciente, pedido ou reserva.
- O pagamento não cria reserva, não reduz stock e não tem confirmação assíncrona.
- O M-Pesa `mock` tem testes; a integração real depende de credenciais e homologação.
- A recuperação de senha devolve o token pela API; não há envio de email/SMS.
- O “Mapa Nacional” é uma lista agregada, não um mapa geográfico.
- Respostas que incluem `User` podem expor campos sensíveis.
- Não há migrações, lint, testes do frontend ou testes de integração da API.
- `app.json` referencia ícones/splash ausentes da pasta `assets` inventariada.

## 1. Identificação do projeto

**Nome:** FarmaBusca

**Tipo:** aplicação Expo (Android, iOS e web) com API REST

**Versão declarada:** `1.0.0` no frontend e backend

### Problema e objetivo

O FarmaBusca procura facilitar a localização de medicamentos disponíveis e farmácias, reduzindo a necessidade de contactar ou visitar vários estabelecimentos para comparar disponibilidade e preço. Também oferece às farmácias gestão básica do catálogo e à administração verificação dos estabelecimentos.

### Público-alvo

- Pacientes/consumidores que procuram medicamentos em Moçambique.
- Farmácias que desejam cadastrar o estabelecimento e gerir medicamentos.
- Administradores responsáveis pela análise dos cadastros.

## 2. Funcionamento geral

### Paciente

Pode criar conta, iniciar sessão e usar Início, Pesquisar, Favoritos e Perfil. A home carrega medicamentos e farmácias aprovadas. A pesquisa aceita parte do nome do medicamento, filtra disponibilidade e ordena por nome/preço. O paciente abre detalhes, contacta a farmácia, abre o endereço no mapa, guarda favoritos e inicia pagamento M-Pesa de 25 MT associado a um medicamento.

### Farmácia

O cadastro possui duas etapas:

1. Nome, NUIT, endereço, província, distrito e horário.
2. Comprovativo do NUIT, licença/alvará e fotos do estabelecimento.

O perfil nasce não aprovado. Depois da aprovação, a farmácia pode criar, consultar, editar e apagar medicamentos próprios, com imagem, categoria, descrição, preço e quantidade. A API impede alterações no catálogo de outra farmácia.

### Administrador

Contas administrativas não são criadas no registo público; podem ser criadas por variáveis de ambiente na sincronização da base. O administrador consulta indicadores, analisa documentos, aprova/suspende/rejeita farmácias, pesquisa medicamentos e vê contagens por província.

## 3. Estrutura do projeto

```text
farmarbusca/
├── farmabusca-backend/
│   ├── src/
│   │   ├── config/       # PostgreSQL/Sequelize e Cloudinary
│   │   ├── controllers/  # Regras dos endpoints
│   │   ├── middlewares/  # JWT, perfis, validação e erros
│   │   ├── models/       # Modelos e associações Sequelize
│   │   ├── routes/       # Rotas Express
│   │   ├── services/     # Autenticação, Cloudinary e M-Pesa
│   │   ├── utils/        # Políticas de autenticação/pagamento
│   │   ├── app.js        # Express, CORS, Swagger e rotas
│   │   └── server.js     # Servidor HTTP
│   ├── tests/            # Testes com node:test
│   ├── .env.example
│   └── package.json
├── farmabusca-frontend/
│   ├── assets/images/    # Banner e fallback de medicamento
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis
│   │   ├── context/      # Sessão e autenticação
│   │   ├── navigation/   # Navegadores por perfil
│   │   ├── screens/      # Auth, paciente, farmácia e admin
│   │   ├── services/     # Cliente Axios
│   │   ├── theme/        # Tema visual
│   │   └── App.js        # Providers e navegação
│   ├── App.js            # Entrada Expo
│   ├── app.json
│   └── package.json
└── README.md
```

Não foram encontrados diretórios de migrações, seeders, CI/CD, Docker ou testes do frontend.

## 4. Tecnologias utilizadas

| Tecnologia | Função confirmada |
|---|---|
| React 19 / React Native 0.81 | Componentes, estado e interface móvel. |
| Expo 54 | Execução, empacotamento e recursos do dispositivo. |
| React Navigation 6 | Pilhas e abas por perfil. |
| Axios | Comunicação HTTP. |
| AsyncStorage | Persistência local da sessão JWT. |
| React Hook Form | Formulários e validação no cliente. |
| Expo Image/Document Picker | Seleção de fotos e documentos. |
| Node.js / Express 4 | Runtime e API REST. |
| PostgreSQL / Sequelize 6 | Base relacional, modelos e consultas. |
| JWT / bcryptjs | Tokens e hash de palavras-passe. |
| express-validator | Validação das rotas de autenticação. |
| Multer | Upload multipart em memória. |
| Cloudinary | Armazenamento de uploads. |
| CORS | Acesso entre origens. |
| Swagger UI | Documentação parcial em `/api-docs`. |
| M-Pesa C2B | Taxa de reserva em modo mock/real. |
| `node:test` | Testes unitários do backend. |

`swagger-jsdoc` está instalado, mas a especificação atual é manual em `app.js`.

## 5. Frontend

### Navegação e autenticação

`src/App.js` instala os providers. `AppNavigator` escolhe:

- sem sessão: `AuthNavigator`;
- `PATIENT`: `PatientNavigator`;
- `PHARMACY`: `PharmacyNavigator`;
- `ADMIN`: `AdminNavigator`.

O navegador da farmácia consulta `/pharmacies/me` para abrir o cadastro ou o painel. `AuthContext` guarda `{ user, token }` no AsyncStorage (`farmabusca-auth`), e Axios adiciona o Bearer token. O token não é revalidado no arranque.

### Principais telas

**Públicas/autenticação:** Splash, onboarding, login, registo de paciente/farmácia, pedido e redefinição de senha.

**Paciente:**

- `HomeScreen`: banner, atalhos, medicamentos e farmácias.
- `SearchMedicineScreen`: pesquisa com debounce de 350 ms, filtros e ordenação local.
- `FavoritesScreen`: lista e remoção de favoritos.
- `MedicineDetailsScreen`: imagem, descrição, preço, stock e farmácia.
- `PharmacyDetailsScreen`: foto, horário, telefone, WhatsApp e mapa externo.
- `PaymentScreen`: pedido M-Pesa de 25 MT.
- `ProfileScreen`: consulta/edição do perfil e logout.

**Farmácia:** cadastro básico, documentos, dashboard, lista, adição e edição de medicamentos e perfil partilhado.

**Administração:** dashboard, gestão de farmácias, catálogo nacional, distribuição por província e perfil informativo. `AdminMapScreen` não renderiza mapa e `AdminProfileScreen` não oferece edição/logout.

### Medicamentos, pesquisa, favoritos e imagens

`MedicineCard` mostra imagem própria ou fallback, preço, farmácia e stock. A pesquisa usa `GET /medicines/search?name=...`; com campo vazio lista os medicamentos públicos. Filtros e ordenação são feitos no dispositivo.

Favoritos usam endpoints autenticados. A interface está no perfil paciente, mas o backend não restringe o perfil.

`ResilientImage` usa fallback quando uma URI falha. Imagens escolhidas são enviadas em `FormData` e armazenadas no Cloudinary.

### Comunicação com a API

`src/services/api.js` usa timeout de 10 segundos e base `/api`. A origem é escolhida por `process.env.BACKEND_URL`, `expo.extra.BACKEND_URL`/manifesto ou um IP local fixo. O upload da farmácia usa 60 segundos. O IP fixo é frágil fora da rede do autor.

## 6. Backend

`server.js` inicia na `PORT` ou 5000 e tenta a porta seguinte se estiver ocupada, sem atualizar o frontend. `app.js` configura body parsing, CORS, Swagger, base, rotas e erros.

### Autenticação e permissões

Emails são normalizados, senhas usam bcrypt (custo 10), e JWT tem expiração configurável. `authMiddleware` valida o Bearer token e carrega o utilizador. `roleMiddleware` compara o perfil. Registo público aceita apenas `PATIENT` e `PHARMACY`.

### Uploads e serviços

Multer mantém ficheiros em memória e limita cada um a 5 MB. Perfil e medicamento aceitam imagens; farmácia aceita imagem/PDF e até 10 documentos. `cloudinaryService` envia os buffers ao Cloudinary. Recursos antigos não são eliminados ao substituir/apagar dados.

O M-Pesa usa C2B single-stage quando `PAYMENT_PROVIDER_MODE=mpesa` e retorna simulação `PENDING` em modo `mock`.

### Base e erros

Sequelize executa `sync`; em desenvolvimento usa `alter` por padrão. Quatro categorias são inseridas com `ignoreDuplicates`. O middleware trata limite de ficheiro, unicidade, validação Sequelize e oculta mensagens internas 500 em produção.

## 7. Base de dados

Os IDs são UUID e todos os modelos têm timestamps.

| Modelo / tabela | Conteúdo principal |
|---|---|
| `User` / `users` | Nome, email, telefone, senha, reset, imagem e perfil. |
| `Pharmacy` / `pharmacies` | Dados comerciais/legais, localização, contactos, imagem, documentos, aprovação, suspensão e views. |
| `Category` / `categories` | Nome único e descrição. |
| `Medicine` / `medicines` | Farmácia, categoria, nome, descrição, preço, quantidade, stock e imagem. |
| `Favorite` / `favorites` | Utilizador e medicamento. |
| `Payment` / `payments` | Utilizador, medicamento, provedor, valor, telefone, request ID, referência e estado. |

```text
User 1 ── 0..1 Pharmacy
User 1 ── N Favorite N ── 1 Medicine
User 1 ── N Payment  N ── 1 Medicine
Pharmacy 1 ── N Medicine
Category 1 ── N Medicine
```

Não existem modelos `Patient`, `Order`, `Reservation` ou tabela de imagens. Paciente é `User` com role `PATIENT`; imagens são URLs; a intenção de reserva está apenas em `Payment`.

## 8. Perfis e permissões

| Perfil | O que pode fazer | Limitação |
|---|---|---|
| `PATIENT` | Pesquisa, favoritos, perfil, detalhes e pagamento. | Só pagamentos são restritos explicitamente a paciente. |
| `PHARMACY` | Cadastro e CRUD do catálogo próprio. | Escrita exige perfil aprovado/não suspenso. |
| `ADMIN` | Utilizadores, farmácias, estados, medicamentos e indicadores. | Perfil frontend sem logout/edição. |

Há verificação de propriedade ao editar/apagar medicamentos e consultar pagamentos. Faltam políticas de perfil para favoritos e sanitização uniforme.

## 9. API e rotas

Base típica: `http://localhost:5000/api`. Swagger parcial: `http://localhost:5000/api-docs`.

### Autenticação e utilizadores

| Método | Caminho | Acesso | Finalidade |
|---|---|---|---|
| POST | `/auth/register` | Público | Criar paciente/farmácia. |
| POST | `/auth/login` | Público | Login e JWT. |
| POST | `/auth/forgot-password` | Público | Gerar token de recuperação. |
| POST | `/auth/reset-password` | Público | Redefinir senha. |
| GET | `/auth/profile` | Autenticado | Perfil sanitizado. |
| GET | `/users/me` | Autenticado | Perfil e farmácia associada. |
| PUT | `/users/me` | Autenticado | Nome, telefone e foto. |

### Farmácias

| Método | Caminho | Acesso | Finalidade |
|---|---|---|---|
| GET | `/pharmacies` | Público | Aprovadas e não suspensas. |
| GET | `/pharmacies/:id` | Público | Detalhe público. |
| POST | `/pharmacies/me` | `PHARMACY` | Criar perfil próprio. |
| PUT | `/pharmacies/me` | `PHARMACY` | Atualizar perfil/uploads. |
| GET | `/pharmacies/me` | `PHARMACY` | Consultar perfil próprio. |
| GET | `/pharmacies/me/medicines` | `PHARMACY` | Catálogo próprio. |
| GET | `/pharmacies/me/medicines/:id` | `PHARMACY` | Medicamento próprio. |

### Medicamentos e favoritos

| Método | Caminho | Acesso | Finalidade |
|---|---|---|---|
| GET | `/medicines` | Público | Disponíveis/stock baixo de farmácias públicas. |
| GET | `/medicines/search?name=` | Público | Pesquisa parcial por nome. |
| GET | `/medicines/:id` | Público | Detalhe público. |
| POST | `/medicines` | `PHARMACY` | Criar medicamento próprio. |
| PUT | `/medicines/:id` | `PHARMACY` | Atualizar medicamento próprio. |
| DELETE | `/medicines/:id` | `PHARMACY` | Apagar medicamento próprio. |
| GET | `/favorites` | Autenticado | Listar favoritos próprios. |
| POST | `/favorites` | Autenticado | Adicionar `medicineId`. |
| DELETE | `/favorites/:medicineId` | Autenticado | Remover favorito. |

### Pagamentos

| Método | Caminho | Acesso | Finalidade |
|---|---|---|---|
| POST | `/payments` | `PATIENT` | Iniciar taxa M-Pesa de 25 MT. |
| GET | `/payments/:id` | `PATIENT` | Consultar pagamento próprio. |

### Administração

| Método | Caminho | Acesso | Finalidade |
|---|---|---|---|
| GET | `/admin/users` | `ADMIN` | Listar utilizadores. |
| GET | `/admin/pharmacies/pending` | `ADMIN` | Farmácias pendentes. |
| GET | `/admin/pharmacies` | `ADMIN` | Pesquisar/filtrar farmácias. |
| PUT | `/admin/pharmacies/:id/status` | `ADMIN` | Aprovar/suspender/rejeitar. |
| PUT | `/admin/pharmacies/:id/approve` | `ADMIN` | Aprovar. |
| GET | `/admin/medicines` | `ADMIN` | Pesquisar/filtrar medicamentos. |
| GET | `/admin/analytics/summary` | `ADMIN` | Indicadores agregados. |

Não existem rotas próprias de categorias, pedidos ou reservas.

## 10. Configuração e execução

### Pré-requisitos

- Node.js 18+ (o serviço M-Pesa usa `fetch` global).
- npm e PostgreSQL.
- Conta Cloudinary para uploads reais.
- Expo Go ou navegador moderno.
- Telemóvel/computador na mesma rede para backend local.

### Backend

Crie uma base PostgreSQL. Não há migrações; o esquema é sincronizado no arranque.

```bash
cd farmabusca-backend
npm install
```

No PowerShell, copie o exemplo e ajuste os valores:

```powershell
Copy-Item .env.example .env
```

```bash
npm run dev
# ou
npm start
```

### Frontend

```bash
cd farmabusca-frontend
npm install
npm start
```

Scripts confirmados:

```bash
npm run android
npm run ios
npm run web
npx expo start -c
```

### Expo Go

Configure `expo.extra.BACKEND_URL` no `app.json` com o IP LAN e porta, por exemplo `http://192.168.1.10:5000`; inicie backend e frontend e leia o QR code. Não use `localhost` no telemóvel.

### Navegador

```bash
cd farmabusca-frontend
npm run web
```

## 11. Variáveis de ambiente

Nunca publique `.env`. O `.gitignore` já o ignora.

```dotenv
NODE_ENV=development
PORT=5000
JWT_SECRET=uma_chave_longa_e_aleatoria
JWT_EXPIRES_IN=7d

DB_HOST=localhost
DB_PORT=5432
DB_NAME=farmabusca
DB_USER=seu_utilizador
DB_PASSWORD=sua_senha
DB_SSL=false
DB_SYNC_ALTER=true

CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret

ADMIN_EMAIL=admin@exemplo.co.mz
ADMIN_PASSWORD=uma_senha_forte
ADMIN_NAME=Administrador FarmaBusca
ADMIN_PHONE=841234567

PAYMENT_PROVIDER_MODE=mock
MPESA_BASE_URL=https://sandbox.exemplo
MPESA_API_KEY=sua_api_key
MPESA_PUBLIC_KEY=sua_public_key
MPESA_SERVICE_PROVIDER_CODE=seu_codigo
MPESA_ORIGIN=http://localhost:5000
```

`JWT_SECRET` é obrigatório. `JWT_EXPIRES_IN` controla validade. `DB_*` configura PostgreSQL/sync. `CLOUDINARY_*` configura uploads. `ADMIN_*` cria opcionalmente o admin inicial. `PAYMENT_PROVIDER_MODE` aceita `mock`/`mpesa`; `MPESA_*` configura C2B.

No frontend, `BACKEND_URL` aparece no `app.json` e é consultado por `process.env.BACKEND_URL`; não há `.env.example` do frontend.

## 12. Estado das funcionalidades

| Funcionalidade | Estado | Limitação |
|---|---|---|
| Registo/login/sessão | Implementada | Sessão não é revalidada no arranque. |
| Recuperação de senha | Parcial | Sem email/SMS; token devolvido pela API. |
| Cadastro documental | Implementada | Upload Cloudinary + JSON. |
| Aprovação/suspensão | Implementada | Rotas e telas admin. |
| CRUD de medicamentos | Implementada | Farmácia própria aprovada. |
| Pesquisa por nome | Implementada | Sem paginação/ranking. |
| Favoritos | Implementada | Qualquer utilizador autenticado no backend. |
| Contacto/WhatsApp/mapa externo | Implementada | Depende de apps/links externos. |
| Fotos | Implementada | Cloudinary + fallbacks. |
| Indicadores admin | Implementada | Contagens/agregação. |
| Mapa geográfico | Não implementada | Apenas lista por província. |
| M-Pesa mock | Implementada | Fica `PENDING`. |
| M-Pesa real | Parcial | Depende de credenciais/homologação. |
| Reserva | Parcial | Sem modelo/estado próprio. |
| Webhook/confirmação assíncrona | Não implementada | Sem reconciliação. |
| Atualização de stock após pagamento | Não implementada | Quantidade não muda. |
| Rotas de categorias | Não implementada | Só modelo/seeding. |
| Perfil admin editável/logout | Parcial | Apenas informativo. |

## 13. Segurança

### Existente

- bcrypt com custo 10; JWT com segredo obrigatório/expiração.
- Bearer token e middleware de perfil.
- Bloqueio de auto-registo ADMIN.
- Verificação de propriedade de medicamento/pagamento.
- Validação de autenticação e uploads de 5 MB por MIME.
- Rejeição de campos de PIN M-Pesa.
- Erros 500 ocultados em produção; `.env` ignorado.

### Riscos confirmados

1. `/admin/users` retorna `User` sem sanitização e pode incluir hash/token de reset.
2. Endpoints de farmácias incluem `User` sem limitar atributos, inclusive em respostas públicas.
3. Token de reset é devolvido na resposta em vez de enviado por canal seguro.
4. CORS reflete qualquer origem (`origin: true`) com credenciais.
5. Não há rate limiting contra força bruta/abuso.
6. JWT no AsyncStorage requer atenção a XSS no web e armazenamento seguro móvel.
7. Até 10 uploads em memória podem pressionar o servidor sob concorrência.
8. Validação fora da autenticação é desigual.
9. Não há controle privado/assinado visível para documentos legais no Cloudinary.
10. Não foram encontrados Helmet/CSP.

## 14. Testes e verificação

```bash
cd farmabusca-backend
npm test
```

Existem 13 testes unitários:

- `authPolicy.test.js`: perfis, admin, email e sanitização.
- `paymentPolicy.test.js`: taxa, telefone, PIN e referências.
- `mpesaService.test.js`: mock, credenciais e payload C2B.

Na análise: **13 aprovados, 0 falhas**.

Não há testes de rotas/base/uploads, frontend, E2E, lint, cobertura, type-check ou CI. O Swagger cobre só parte das rotas e não detalha schemas/autenticação.

## 15. Problemas e limitações

- O README anterior descrevia um perfil do Ministério da Saúde não existente.
- Recuperação de senha e retornos de `User` têm riscos críticos já descritos.
- Não há paginação; a home recebe todos e limita no cliente.
- Pesquisa pública apenas pelo nome.
- Favoritos não verificam perfil nem publicidade/disponibilidade do medicamento.
- `favorites` não tem índice único composto; a prevenção de duplicados pode sofrer concorrência.
- Pagamento não reserva stock, não expira, não reduz quantidade e não usa polling apesar de existir função de consulta.
- Mock permanece `PENDING`; não há webhook/reconciliação.
- “Aberta/fechada” aceita um intervalo simples, sem dias/turnos noturnos.
- Troca automática de porta no backend pode dessincronizar o frontend.
- O servidor continua após falha inicial de base e falha depois nas rotas.
- `sequelize.sync({ alter: true })` substitui migrações em desenvolvimento.
- Cloudinary não limpa uploads antigos; certas falhas de imagem são ocultadas.
- Documentos são apenas acrescentados, sem remoção/versionamento.
- Assets `icon.png`, `splash.png` e `adaptive-icon.png` referidos no `app.json` não aparecem no inventário.
- Há entrada `App.js` na raiz do frontend e outra em `src` (encaminhamento intencional, mas duplicidade estrutural).
- Algumas telas estão em linhas muito longas, dificultando manutenção.
- Não há configuração frontend separada para dev/test/prod.
- Dependências desatualizadas não foram afirmadas: isso requer consulta ao registry.

## 16. Próximos passos

### Prioridade alta

1. Sanitizar todos os retornos/includes de `User`.
2. Enviar reset por canal seguro, guardar token derivado e nunca devolvê-lo.
3. Restringir CORS, adicionar rate limiting e validar payloads.
4. Definir reserva, expiração, stock, confirmação e concorrência.
5. Implementar webhook/reconciliação M-Pesa e testar no sandbox.
6. Proteger documentos legais e testar isolamento entre farmácias.

### Prioridade média

1. Adotar migrações/seeders versionados.
2. Paginar e melhorar pesquisa/filtros no servidor.
3. Índice único `(userId, medicineId)` em favoritos.
4. Tratar/limpar uploads e gerir documentos.
5. Adicionar logout/edição admin.
6. Implementar mapa real ou renomear a tela.
7. Configurar URL da API por ambiente e adicionar assets Expo ausentes.

### Prioridade baixa

1. Formatar telas e configurar lint/formatter.
2. Completar Swagger.
3. Adicionar testes de componentes/E2E.
4. Melhorar horários, cache, acessibilidade e consistência multiplataforma.

Nenhum passo requer inteligência artificial; esta análise não adicionou IA.

## 17. Informações pendentes do responsável

1. Quem são os autores e colaboradores?
2. Há instituição, disciplina, curso ou contexto académico?
3. Qual licença deve reger o código? Não existe `LICENSE`.
4. Qual é o endereço público do repositório?
5. Existem homologação/produção e URLs públicas?
6. Os 25 MT são apenas taxa de reserva ou integram o preço?
7. Qual duração e regra de cancelamento da reserva?
8. O admin representa o FarmaBusca, autoridade reguladora ou instituição específica?
9. Há logótipo, screenshots e identidade visual oficiais?
10. Quais funcionalidades futuras estão formalmente aprovadas?

## Informação confirmada e pendente

**Confirmado pelo código:** arquitetura, tecnologias, perfis, telas, rotas, modelos, relações, uploads, Cloudinary, JWT, M-Pesa, comandos, variáveis, testes e limitações acima.

**Pendente de confirmação humana:** autoria, instituição, licença, repositório remoto, ambientes publicados, regras completas da reserva/pagamento, papel do admin, recursos de marca e roadmap aprovado.
