Farmabusca — Resumo do Projeto

Descrição

- Farmabusca é um sistema de busca e gestão de farmácias e medicamentos composto por um backend (Node.js + Express + Sequelize/Postgres) e um frontend móvel (React Native + Expo).
- Objetivo: permitir que pacientes encontrem medicamentos e farmácias, e que farmácias gerenciem seu catálogo e enviem documentos para aprovação.

Arquitetura e stack

- Backend: Node.js, Express, Sequelize (Postgres), Cloudinary (upload de imagens/documentos), JWT para autenticação.
- Frontend: React Native (Expo), react-navigation, axios para API, AsyncStorage para sessão, react-hook-form para formulários.

Pontos principais implementados

- Registro com seleção de tipo de conta (Paciente / Farmácia / Administrador).
- Fluxo de cadastro para `PHARMACY` em dois passos: perfil básico (Nível 1) e upload de documentos (Nível 2).
- Upload multipart (documentos + imagem) armazenados no Cloudinary; metadados guardados no campo `documents` da farmácia.
- Workflow de aprovação por administradores; criação automática de administrador via variáveis de ambiente no momento do sync do banco.
- Painel da farmácia para listar/gerir medicamentos, com regras de permissão para que farmácias só alterem seus próprios itens.
- Esboço de perfil adicional para o Ministério da Saúde com acesso a dados agregados, como número de farmácias por província, medicamentos essenciais em falta e mapas de disponibilidade.

Perfil do Ministério da Saúde

- Acesso apenas a informações agregadas e relatórios, sem dados sensíveis de pacientes ou farmácias individuais.
- Funcionalidades esperadas:
  - Aprovação de farmácias.
  - Número de farmácias por província.
  - Medicamentos essenciais em falta.
  - Mapa de distribuição das farmácias.
  - Estatísticas de disponibilidade de medicamentos.
  - Relatórios mensais de atividade.
  - Tendências de procura por medicamentos.

Instruções de setup (rápido)

1) Backend

- Instalar dependências e configurar `.env` (exemplo já presente em `farmabusca-backend/.env`):
  - `PORT`, `JWT_SECRET`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - ADMIN_* (opcional) para criar conta admin na primeira execução: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ADMIN_PHONE`.
  - Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

- Comandos:

```bash
cd farmabusca-backend
npm install
npm run dev    # ou npm start conforme script
```

2) Frontend (Expo)

- Ajuste `BACKEND_URL` em `app.json`/`Constants.extra` ou atualize `defaultBackend` em `src/services/api.js` para apontar para seu servidor local.

- Instalar dependências e iniciar Expo:

```bash
cd farmabusca-frontend
npm install
npx expo start -c
```

Notas e troubleshooting

- Uploads multipart: o cliente envia `FormData`; o backend usa `multer` e envia para Cloudinary. Se o upload falhar, reinicie o Expo com cache limpo (`npx expo start -c`) e verifique os logs do backend.
- Tokens/sessões: o frontend salva sessão em AsyncStorage (`farmabusca-auth`); faça `logout` e limpe storage se trocar de conta durante testes.
- Quando as farmácias aparecem com medicamentos de outra conta: revisar no backend as queries que filtram por `pharmacyId` e verificar `req.user.id` nas rotas protegidas. Para depuração, adicionar logs em `medicineController` nas rotas que criam/retornam medicamentos.

Arquivos relevantes

- Backend: `farmabusca-backend/src/controllers/*`, `farmabusca-backend/src/routes/*`, `farmabusca-backend/src/models/*`.
- Frontend: `farmabusca-frontend/src/navigation/*`, `farmabusca-frontend/src/screens/*`, `farmabusca-frontend/src/services/api.js`, `farmabusca-frontend/src/context/AuthContext.js`.

Próximos passos sugeridos

- Testes end-to-end do fluxo de registro PHARMACY -> Nível1 -> Nível2 -> envio de documentos -> aprovação pelo admin.
- Harden validations (tamanho/tipo de documentos), exibir status de upload e progresso.
- Adicionar testes automatizados básicos para as APIs críticas.

Se quiser, eu atualizo o README adicionando comandos específicos do seu ambiente Windows (ex.: criar DB local) ou insiro um trecho com exemplos de requests cURL para testes rápidos.
