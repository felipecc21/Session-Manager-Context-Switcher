# 🛠️ Extensão Genérica de Troca de Contexto

Uma Extensão Chrome "White Label" projetada para desenvolvedores que precisam alternar contextos de usuário (ex: personificação/impersonation, troca de organizações) em Single Page Applications (SPAs), injetando um painel de ferramentas diretamente na página.

## 🚀 Funcionalidades

* **Interceptador de Autenticação:** Captura automaticamente tokens JWT Bearer de requisições de rede (XHR/Fetch) através de *monkey-patching* na API do navegador.
* **Interface Injetada:** Adiciona um Botão de Ação Flutuante (FAB) e uma Barra de Navegação na sua aplicação alvo.
* **Autocomplete:** Busque e selecione contextos (Cliente/Provedor) instantaneamente.
* **Armazenamento Isolado:** Mantém os dados da sessão seguros no Chrome Storage.

## ⚙️ Configuração (Como Usar)

1.  **Clone o Repositório**
2.  **Edite o `manifest.json`**:
    * Altere `host_permissions` para os seus domínios alvo.
    * Altere `content_scripts.matches` para onde o script deve ser executado.
3.  **Edite o `content.js`**:
    * Localize o objeto `CONFIG` no topo do arquivo.
    * Atualize a `apiBaseUrl` e os endpoints para corresponder ao seu backend.
    * Defina as `routes` (onde o interceptador roda vs onde a UI aparece).
4.  **Carregue no Chrome**:
    * Acesse `chrome://extensions`.
    * Ative o **"Modo do desenvolvedor"**.
    * Clique em **"Carregar sem compactação"** (Load Unpacked) e selecione a pasta do projeto.

## 📂 Estrutura do Projeto

* `background.js`: Gerencia o controle de abas e ciclo de vida do Service Worker.
* `content.js`: Lógica principal. Gerencia a injeção da UI e a comunicação com a API.
* `interceptor.js`: O script injetado no contexto da página para "escutar" os Headers de requisição.
* `popup.html/js`: A pequena janela popup da extensão para configurações iniciais.

## ⚠️ Aviso Legal

Esta ferramenta é destinada para fins de desenvolvimento e produtividade. Certifique-se de cumprir as políticas de segurança da sua organização em relação ao manuseio de tokens de autenticação.
