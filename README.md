# Aromas e Sabores - API

API desenvolvida para gestão de estoque de uma loja de grãos. O sistema garante o controle de inventário, auditoria de transações e processamento financeiro.

## 🚀 Tecnologias Utilizadas

* **[NestJS](https://nestjs.com/):** Framework Node.js para construção do back-end.
* **[GraphQL](https://graphql.org/):** Linguagem de consulta para APIs, utilizando a abordagem Code-First.
* **[TypeORM](https://typeorm.io/):** ORM para mapeamento das entidades e execução de migrations no banco de dados.
* **[Jest](https://jestjs.io/):** Framework de testes unitários.
* **ESLint & Prettier:** Padronização de código.

## 📦 Módulos Principais

### 1. Products
Gestão do catálogo de produtos comercializados pela loja.
* Cadastro de produtos com preços armazenados em centavos para evitar erros de precisão de ponto flutuante.
* Controle de saldo em tempo real.

### 2. Stock Transactions
Motor de rastreabilidade de inventário.
* Garante que o estoque seja um histórico em que cada entrada (`IN`) e saída (`OUT`) de produtos é devidamente registrada.

### 3. Sales
Coração financeiro da loja.
* Processamento de vendas (a API busca e calcula preços internamente).
* Validação automática de saldo disponível antes de finalizar a compra.
* Integração direta com o motor de estoque para baixa automática de produtos vendidos.
* Emissão de histórico completo de fechamento de caixa.

## 🛠️ Como Executar o Projeto

### Pré-requisitos
* Node.js (v18+)
* SQLite

### Instalação

```bash
# Instale as dependências
$ npm install
```

### Rodando a Aplicação

```bash
# Modo de desenvolvimento
$ npm run start

# Modo de observação (watch)
$ npm run start:dev

# Modo de produção
$ npm run start:prod
```

A interface do Apollo GraphQL Playground estará disponível por padrão em `http://localhost:3000/graphql`.

## 🧪 Testes

```bash
# Executar testes unitários
$ npm run test

# Executar testes com cobertura
$ npm run test:cov
```

## 🧹 Qualidade de Código

```bash
# Rodar o linter e aplicar correções automáticas (Prettier)
$ npm run lint
```