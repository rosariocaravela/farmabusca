FarmaBusca Mobile - Frontend

Visão geral
-----------
Este projeto frontend é o app Expo para FarmaBusca. Ele contém a interface para pacientes e farmácias, com navegação, autenticação e telas de detalhe.

Navegação principal
-------------------
- `AppNavigator.js` decide se deve exibir:
  - `AuthNavigator` para usuários não logados
  - `PatientNavigator` para pacientes
  - `PharmacyNavigator` para farmácias

Autenticação / onboarding
-------------------------
- `SplashScreen.js`
- `OnboardingScreen.js`
- `auth/LoginScreen.js` - login por email e senha
- `auth/RegisterScreen.js` - cadastro com papel de usuário:
  - Paciente
  - Farmácia
- `auth/ForgotPasswordScreen.js` - solicitar recuperação de senha
- `auth/ResetPasswordScreen.js` - redefinir senha com token

Funcionalidades do paciente
---------------------------
Abas definidas em `PatientNavigator.js`:
- Home
- Pesquisar
- Favoritos
- Perfil

Telas do paciente:
- `HomeScreen.js`
  - Mostra saudação ao usuário
  - Busca medicamentos e farmácias
  - Exibe cards de navegação rápida e itens mais procurados
  - Abre detalhes de medicamento e farmácia
- `SearchMedicineScreen.js`
  - Pesquisa de medicamentos com debounce
  - Exibe resultados em cards clicáveis
- `FavoritesScreen.js`
  - Exibe favoritos de medicamento e farmácia
- `ProfileScreen.js`
  - Exibe dados do usuário e botão de logout
- `MedicineDetailsScreen.js`
  - Exibe detalhes de medicamento
  - Mostra outras farmácias que vendem o mesmo remédio
  - Botões de contato e ver farmácia
- `PharmacyDetailsScreen.js`
  - Exibe detalhes da farmácia
  - Botões de ligar, WhatsApp e mapa

Funcionalidades da farmácia
---------------------------
Abas definidas em `PharmacyNavigator.js`:
- Dashboard
- Medicamentos
- Adicionar
- Perfil
- Tela extra: Editar medicamento

Telas da farmácia:
- `PharmacyDashboardScreen.js`
  - Mostra estatísticas de medicamentos
  - Quantidade total, disponíveis, esgotados e categorias
- `MedicinesScreen.js`
  - Lista de medicamentos cadastrados
  - Permite acessar edição de medicamento
- `AddMedicineScreen.js`
  - Formulário para cadastrar novo medicamento
  - Inclui seleção de imagem da galeria
- `EditMedicineScreen.js`
  - Tela de edição de medicamento (layout presente, lógica de envio não implementada)

Serviços e API
--------------
- `src/services/api.js` contém a configuração do Axios e o `baseURL` para o backend
- `src/context/AuthContext.js` gerencia a autenticação e armazenamento de sessão

Componentes principais
----------------------
- `components/CustomInput.js`
- `components/CustomButton.js`
- `components/SearchBar.js`
- `components/MedicineCard.js`
- `components/PharmacyCard.js`
- `components/CategoryCard.js`
- `components/Header.js`
- `components/PharmacyHeader.js`
- `components/DashboardCard.js`
- `components/StatisticsCard.js`

Observações
-----------
- O frontend está pronto para rodar no Expo, mas depende do backend disponível em uma URL acessível.
- Para usar com Expo Go no celular, configure `src/services/api.js` para usar o IP local do computador (por exemplo `http://172.16.15.57:5000`).
