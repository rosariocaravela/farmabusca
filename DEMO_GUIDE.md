# Demonstração institucional do FarmaBusca

Esta configuração destina-se exclusivamente a uma demonstração de MVP com dados fictícios. Não representa integração, aprovação ou certificação da ANARME.

## Preparar o ambiente

Requisitos locais:

- Node.js 18 ou superior;
- npm;
- PostgreSQL em execução;
- navegador moderno e, para a versão móvel, Expo Go ou emulador;
- Cloudinary apenas se for necessário demonstrar uploads reais.

No backend, copie `.env.example` para `.env` e configure `JWT_SECRET`, `DB_*`, `CORS_ORIGINS` e as variáveis opcionais de upload. Use `PAYMENT_PROVIDER_MODE=mock` durante a demonstração.

```powershell
cd farmabusca-backend
npm install
npm run db:migrate
npm run demo:seed
npm start
```

O seeder cria sete contas de demonstração, cinco farmácias e catorze medicamentos. As palavras-passe são geradas aleatoriamente quando não forem fornecidas por variável de ambiente. As credenciais ficam em `farmabusca-backend/demo-credentials.local.txt`, que é ignorado pelo Git. Não partilhe nem versione esse ficheiro.

Cada conta fictícia do seed possui um retrato próprio e cada farmácia possui uma fotografia exterior distinta. As imagens também são fictícias, geradas para a demonstração, ficam em `farmabusca-backend/public/demo-assets` e são servidas localmente por `/demo-assets`, permitindo a apresentação sem depender de serviços externos de imagens.

No frontend:

```powershell
cd farmabusca-frontend
npm install
npm run web
```

Para Expo Go, defina `EXPO_PUBLIC_BACKEND_URL` com o IP LAN do computador e execute `npm start`. `localhost` no telemóvel aponta para o próprio dispositivo.

## Contas fictícias

O procedimento cria:

- paciente: `paciente.demo@example.test`;
- farmácia aprovada: `farmacia.demo@example.test`;
- farmácia pendente: `farmacia.pendente@example.test`;
- segunda farmácia aprovada: `farmacia.secundaria@example.test`;
- farmácia aprovada em KaMavota: `farmacia.costadosol@example.test`;
- farmácia aprovada na Matola: `farmacia.matola@example.test`;
- administrador: `admin.demo@example.test`, salvo configuração diferente no ambiente.

Consulte as palavras-passe apenas no ficheiro local gerado pelo seeder.

## Roteiro de 5 a 10 minutos

1. Entre como paciente e mostre a página inicial.
2. Pesquise `Paracetamol`, compare duas farmácias, preços, stock e data de actualização.
3. Guarde o medicamento nos favoritos, consulte o perfil e termine a sessão.
4. Entre como farmácia aprovada, abra o painel e o inventário.
5. Altere o preço ou disponibilidade de um medicamento e guarde.
6. Volte ao paciente e confirme que a alteração aparece na pesquisa.
7. Entre como administrador, mostre os totais de pacientes e farmácias.
8. Abra a farmácia pendente e aprove-a, confirmando primeiro a acção.
9. Demonstre a suspensão/reactivação de um utilizador e termine a sessão.

Antes da apresentação, valide a API automaticamente:

```powershell
$env:SMOKE_API_URL='http://127.0.0.1:5000/api'
npm run demo:smoke
```

## Operação com Internet instável

- Execute PostgreSQL, API e frontend na mesma rede local.
- Gere os dados antes do evento e confirme que a pesquisa funciona sem serviços externos.
- Não demonstre upload Cloudinary, WhatsApp, mapas ou M-Pesa real sem Internet estável.
- O assistente actual usa regras e dados locais, mas não diagnostica nem prescreve.

## Demonstração da pesquisa por proximidade

As coordenadas das farmácias do seed são fictícias e servem apenas para validar o MVP. Para uma demonstração previsível, use como posição do paciente `-25.9687, 32.5732` e pesquise `Paracetamol`:

- Farmácia Baixa Saúde: aproximadamente 61 m;
- Farmácia Alto Maé Central: aproximadamente 1,25 km;
- raio de 1 km: uma farmácia;
- raio de 3 km: duas farmácias.

No telemóvel, toque em **Usar minha localização** e aceite a permissão. Se negar a permissão ou o GPS estiver indisponível, a pesquisa por nome, preço, stock e localização textual continua operacional; pode tentar autorizar novamente sem reiniciar a aplicação. A coordenada do paciente permanece apenas em memória durante a utilização e não é gravada na base de dados nem nos logs de auditoria.

O botão **Como chegar** abre uma aplicação/site externo de mapas com a coordenada pública da farmácia. Este passo requer Internet; o cálculo Haversine, a ordenação e os filtros de raio são executados no backend e não dependem de Google Maps nem de chave externa.

## Assistente Farmabusca com Gemini

Configure apenas no `.env` do backend:

```env
GEMINI_ENABLED=true
GEMINI_API_KEY=chave-configurada-localmente
GEMINI_MODEL=gemini-3.5-flash
GEMINI_TIMEOUT_MS=30000
ASSISTANT_RATE_LIMIT=10
```

Não coloque estas variáveis no frontend. Reinicie o backend depois de alterar o `.env`.

Roteiro sugerido:

1. Entre como paciente e abra **Assistente Farmabusca**.
2. Escreva `Procuro Amoxicilina 500 mg perto de mim.`
3. Toque em **Permitir localização**. Com a posição fictícia `-25.9687, 32.5732`, o seed devolve a Farmácia Baixa Saúde a aproximadamente 61 m e a Farmácia Alto Maé Central a aproximadamente 1,25 km.
4. Escreva `Mostre a mais barata.`; a opção da Farmácia Alto Maé Central custa 310 MT e a da Baixa Saúde custa 335 MT.
5. Abra **Como chegar**, os detalhes e guarde uma farmácia nos favoritos.
6. Inicie outra pesquisa, escolha **Indicar bairro** e escreva `Procure Amoxicilina no bairro Alto Maé.`
7. Pesquise um nome fictício inexistente para mostrar o estado sem resultados.
8. Escreva `Qual medicamento devo tomar e qual dose?` para demonstrar o bloqueio clínico.
9. Desactive temporariamente `GEMINI_ENABLED` e reinicie a API para mostrar que a pesquisa normal permanece disponível.

O frontend envia `POST /api/assistant` autenticado com uma mensagem de até 500 caracteres, contexto estruturado opcional e coordenadas apenas quando o paciente autoriza. O backend sanitiza a mensagem, não envia ao Gemini nome, email, telefone, token, palavra-passe nem coordenadas exactas, valida a intenção e só então consulta a base. As conversas não são persistidas nem registadas nos logs.

O uso de modalidades gratuitas do Gemini pode estar sujeito às condições de tratamento de dados da Google. Durante a demonstração, utilize somente mensagens, contas e localizações fictícias. Para produção, será necessário escolher uma modalidade contratual adequada, concluir avaliação de impacto de privacidade e permitir a substituição do fornecedor.

## Requisitos para hospedagem futura

- PostgreSQL gerido com backups e testes de restauração;
- runtime Node.js, armazenamento privado de segredos e migrations no deploy;
- domínio, DNS e HTTPS válido;
- armazenamento privado e controlado dos documentos das farmácias;
- email ou SMS transaccional para recuperação de palavra-passe;
- logs centralizados, monitorização, alertas, rate limiting partilhado e auditoria;
- políticas de retenção, privacidade, termos e resposta a incidentes;
- ambientes separados de desenvolvimento, homologação e produção.

## O que ainda impede produção

- validação jurídica, regulatória e institucional;
- processo oficial de verificação de farmácias e medicamentos;
- recuperação segura por email/SMS;
- protecção e retenção dos documentos legais;
- testes E2E em Android, iOS e navegadores suportados;
- webhook/reconciliação M-Pesa, reservas e concorrência de stock;
- revisão das vulnerabilidades de dependências;
- backups, monitorização, alta disponibilidade e recuperação de falhas;
- política de privacidade, termos, consentimento e procedimentos sobre dados pessoais.
