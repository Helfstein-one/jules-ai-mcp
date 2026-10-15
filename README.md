<p align="center">
  <img src="assets/jules-antigravity.jpg" alt="Antigravity Jules Logo" width="480"/>
</p>

<h1 align="center">Jules AI MCP Server & Antigravity Orchestration</h1>

<p align="center">
  <b>Integração completa do Google Jules AI com o Gemini Antigravity via Model Context Protocol (MCP).</b><br>
  Delegue tarefas assíncronas, aprove planos de execução, monitore sessões e automatize Pull Requests diretamente do Antigravity.
</p>

<p align="center">
  <a href="./README_EN.md">🇺🇸 English Documentation</a> •
  <a href="#-visão-geral">Visão Geral</a> •
  <a href="#-passo-a-passo-de-configuração">Configuração</a> •
  <a href="#-integração-com-o-gemini-antigravity">Antigravity</a> •
  <a href="#-estratégias-e-melhores-práticas">Estratégias</a> •
  <a href="#-referência-das-tools-mcp">Tools MCP</a>
</p>

---

## 🧭 Visão Geral

O **Google Jules** é o agente autônomo de desenvolvimento de software do Google, projetado para rodar em nuvem, clonar repositórios, investigar problemas, formular planos em múltiplas etapas e abrir Pull Requests com testes validados.

O **Gemini Antigravity** é o ambiente avançado de pair programming da Google DeepMind focado em controle cirúrgico, raciocínio de alta ordem e orquestração.

Este projeto conecta ambos através do **Model Context Protocol (MCP)**:
* O Antigravity atua como o **Arquiteto Líder**, planejando a solução e supervisionando a execução.
* O Jules AI atua como o **Operário de Nuvem Assíncrono**, executando tarefas longas de refatoração, migração de código e testes em segundo plano.

```
┌─────────────────────────────────┐
│        Gemini Antigravity       │ ◄─── Pair Programming, Estratégia,
│    (Orquestrador / Arquiteto)   │      Inspeção de Planos e Diffs
└────────────────┬────────────────┘
                 │ MCP (Model Context Protocol via Stdio)
┌────────────────▼────────────────┐
│        jules-ai-mcp Server      │ ◄─── Ferramentas, Types & Validação
└────────────────┬────────────────┘
                 │ Google Jules API / v1alpha
┌────────────────▼────────────────┐
│         Google Jules AI         │ ◄─── Nuvem, Branching, Execução de Testes,
│   (Agente Assíncrono de Código) │      Criação de Pull Request
└─────────────────────────────────┘
```

---

## 🚀 Passo a Passo de Configuração

### 1. Pré-requisitos
* **Node.js**: Versão 18 ou superior (`node -v`).
* **NPM**: Versão 9 ou superior (`npm -v`).
* **Conta Google Jules**: Acesso ao portal [jules.google](https://jules.google).
* **Chave de API do Jules**: Obtenha em *Settings > API Keys* no console do Jules.

### 2. Clonar e Instalar Dependências
```bash
git clone https://github.com/Helfstein-one/jules-ai-mcp.git
cd jules-ai-mcp
npm install
npm run build
```

### 3. Configurar Variáveis de Ambiente
Crie seu arquivo `.env` a partir do modelo `.env.example`:
```bash
cp .env.example .env
```
Edite o `.env` com a sua chave:
```env
JULES_API_KEY=sua_chave_jules_aqui
JULES_API_BASE_URL=https://jules.googleapis.com/v1alpha
JULES_MOCK_MODE=false
```

> [!TIP]
> Caso queira rodar o servidor em modo de testes / demonstração local sem consumir créditos da API, basta manter `JULES_MOCK_MODE=true`.

---

## 🪐 Integração com o Gemini Antigravity

### 1. Registrar o MCP Server no Antigravity
Você pode habilitar o Jules MCP de forma global em sua máquina ou dentro do seu projeto:

#### Configuração Global (`~/.gemini/config/mcp_config.json`)
Abra ou crie o arquivo `~/.gemini/config/mcp_config.json` e adicione o servidor:

```json
{
  "mcpServers": {
    "jules-ai": {
      "command": "node",
      "args": ["/caminho/absoluto/para/jules-ai-mcp/dist/index.js"],
      "env": {
        "JULES_API_KEY": "sua_chave_jules_aqui",
        "JULES_MOCK_MODE": "false"
      }
    }
  }
}
```

### 2. Habilitar a Skill `jules-orchestrator`
O repositório já inclui uma Skill pronta em [.agents/skills/jules-orchestrator/SKILL.md](file:///.agents/skills/jules-orchestrator/SKILL.md).
Copie a pasta `.agents/` para o repositório do seu projeto ou para `~/.gemini/config/skills/`.

A Skill ensina o Antigravity a:
1. Reconhecer quando uma tarefa deve ser delegada ao Jules.
2. Formular prompts cirúrgicos para o Jules.
3. Exigir aprovação manual do plano de execução antes de autorizar qualquer commit.
4. Coletar o diff e o Pull Request gerados pelo Jules e apresentar ao desenvolvedor.

---

## 🛠️ Referência das Tools MCP

| Tool MCP | Parâmetros Principais | Descrição |
| :--- | :--- | :--- |
| `jules_create_task` | `repo`, `prompt`, `baseBranch`, `autoApprovePlan` | Inicia uma nova tarefa autônoma no repositório GitHub. |
| `jules_list_tasks` | `repo` (opcional), `limit` | Lista tarefas ativas e recentes. |
| `jules_get_task_status`| `taskId` | Retorna o status detalhado, logs e etapas do plano. |
| `jules_approve_plan` | `taskId`, `approved` (boolean), `feedback` | Aprova ou rejeita o plano elaborado pelo Jules. |
| `jules_send_feedback` | `taskId`, `message` | Envia instruções de redirecionamento durante a execução. |
| `jules_get_diff` | `taskId` | Obtém o git diff unificado e o link do Pull Request gerado. |
| `jules_cancel_task` | `taskId`, `reason` | Cancela uma tarefa em andamento. |

---

## 🧠 Estratégias e Melhores Práticas Operacionais

### 1. Separação de Papéis: Antigravity vs Jules
* **Fique no Antigravity**: Refatorações rápidas, alterações locais que afetam 1 a 3 arquivos, análise de arquitetura, depuração de erros em tempo real.
* **Delegue ao Jules**: Criação de baterias de testes unitários em dezenas de arquivos, atualizações de dependências (ex: upgrade de versão do framework), migrações de esquemas de banco com scripts de retrocompatibilidade.

### 2. Gate Obrigatório de Aprovação de Plano (`autoApprovePlan: false`)
Sempre deixe `autoApprovePlan: false` em bases de produção:
1. O Jules irá clonar o projeto e criar a árvore AST dos arquivos afetados.
2. Ele formulará um plano em etapas (`plan.steps`).
3. O Antigravity lê o plano e apresenta para você:
   * *Quais arquivos serão tocados?*
   * *Há risco de quebrar contratos de API pública?*
4. Se necessário, envie ajustes com `jules_approve_plan(approved=false, feedback="Não altere o arquivo X...")`.

### 3. Elimine o Polling Abusivo
Nunca mantenha loops de verificação contínua (`while status != completed sleep 5`). O Antigravity utiliza o comando `/schedule` ou notificações de background. Lance a tarefa e prossiga com seu trabalho local; quando o Jules estiver com o plano pronto, você será notificado.

### 4. Jules como MCP Client (Dois Sentidos)
Lembre-se que o Jules também suporta conexões MCP externas dentro das sessões dele (no portal [jules.google](https://jules.google) em *Settings > Service Connections*):
* **Linear / Jira MCP**: Permite ao Jules ler os critérios de aceitação diretamente das issues.
* **Supabase / Neon MCP**: Permite ao Jules inspecionar migrações e esquemas de dados em ambientes sandbox.

---

## 💬 Exemplo de Conversação com o Antigravity

**Você no chat do Antigravity:**
> *"Antigravity, delegue para o Jules AI a tarefa de migrar nossos testes de autenticação de Jest para Vitest no repositório `minha-empresa/api-core`. Não aprove o plano automaticamente."*

**Antigravity com a Skill Jules:**
1. Invoca `jules_create_task` com as diretrizes e regras do projeto.
2. Recebe o `taskId` e aguarda a geração do plano.
3. Notifica você com o resumo das 4 etapas propostas pelo Jules.
4. Você responde: *"Aprove, mas garanta que o mock do Redis seja preservado."*
5. Antigravity invoca `jules_approve_plan(approved=true, feedback="Preserve o mock do Redis...")`.
6. Jules executa, roda os testes e abre o Pull Request no GitHub!

---

## 📄 Licença
Distribuído sob a licença [MIT](LICENSE).
Criado e mantido por [@Helfstein-one](https://github.com/Helfstein-one).
