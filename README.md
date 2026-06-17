# Aromas e Sabores - API

API desenvolvida para gestão de estoque de uma loja de grãos. O sistema garante o controle de inventário, auditoria de transações e processamento financeiro.

## 🚀 Tecnologias Utilizadas

* **[NestJS](https://nestjs.com/):** Framework Node.js para construção do back-end.
* **[GraphQL](https://graphql.org/):** Linguagem de consulta para APIs, utilizando a abordagem Code-First.
* **[TypeORM](https://typeorm.io/):** ORM para mapeamento das entidades e execução de migrations no banco de dados.
* **[Jest](https://jestjs.io/):** Framework de testes unitários.
* **ESLint & Prettier:** Padronização de código.

## 🏗️ Arquitetura do Sistema

### Visão Geral
O sistema segue uma arquitetura em camadas baseada no **NestJS** com **GraphQL**, organizada em módulos independentes que se comunicam através de services. O padrão de design segue os princípios **SOLID**, com foco em separação de responsabilidades e injeção de dependências.

### Estrutura de Módulos
```
src/
├── modules/
│   ├── product/              # Catálogo de produtos
│   ├── sale/                 # Processamento de vendas
│   └── stock-transaction/    # Motor de rastreabilidade
├── database/
│   ├── migrations/           # Versionamento do schema
│   └── data-source.ts        # Configuração TypeORM
└── schema.gql                # Schema GraphQL auto-gerado
```

### Fluxo de Dados (Request → Database)
1. **GraphQL Resolver** recebe a requisição e valida os inputs via DTOs
2. **Service Layer** aplica regras de negócio e cálculos
3. **TypeORM Repository** gerencia operações com transações ACID
4. **Database** (SQLite) persiste os dados com integridade referencial

## 🗄️ Modelo de Dados

### Entidades e Relacionamentos

#### Product (produtos)
- **PK**: `id` (UUID)
- **Campos**: `name`, `barcode` (unique), `unit_type` (KG/UN), `price` (INT - centavos), `current_stock` (DECIMAL 10,3)
- **Relacionamentos**: 1:N com StockTransaction
- **Regra de Negócio**: Preços armazenados em centavos para evitar floating-point errors

#### Sale (sale)
- **PK**: `id` (UUID)
- **Campos**: `total_amount` (INT - centavos), `payment_method` (enum), `status` (OPEN/COMPLETED/CANCELED)
- **Relacionamentos**: 1:N com SaleItem
- **Ciclo de Vida**: OPEN → COMPLETED ou OPEN → CANCELED

#### SaleItem (sale_item)
- **PK**: `id` (UUID)
- **FKs**: `sale_id` → Sale, `product_id` → Product
- **Campos**: `quantity` (DECIMAL 10,3), `unit_price` (INT), `sub_total` (INT)
- **Regra de Negócio**: Quantidades com 3 casas decimais para suportar produtos pesados (KG)

#### StockTransaction (stock_transaction)
- **PK**: `id` (UUID)
- **FKs**: `product_id` → Product
- **Campos**: `type` (IN/OUT/LOSS), `quantity` (INT), `description` (TEXT)
- **Regra de Negócio**: Histórico imutável de movimentações

## 📦 Módulos Principais

### 1. Products
Gestão do catálogo de produtos comercializados pela loja.
* Cadastro de produtos com preços armazenados em centavos para evitar erros de precisão de ponto flutuante.
* Controle de saldo em tempo real.
* Tipos de unidade: KG (produtos pesados) e UN (produtos unitários).

### 2. Stock Transactions
Motor de rastreabilidade de inventário.
* Garante que o estoque seja um histórico em que cada entrada (`IN`) e saída (`OUT`) de produtos é devidamente registrada.
* **Transações**: Service aceita `EntityManager` opcional para integrar com transações externas (ex: vendas).
* Validação de saldo: Bloqueia saídas (`OUT`) que excedam o estoque atual.
* **Soft delete**: Transações nunca são excluídas fisicamente para manter auditoria.

### 3. Sales
Coração financeiro da loja.
* **Leitura inteligente de código de barras**: Método `addItemByBarcode` com parsing automático para produtos pesados (KG) da balança e fallback para unitários (UN).
* **Precisão monetária**: Todos os valores armazenados e calculados em **centavos inteiros** para evitar floating-point errors.
* **Baixa de estoque atômica**: Integração ACID via transações TypeORM `manager`, garantindo que venda e saída do estoque ocorram como uma única operação indivisível.
* **Ciclo de vida de vendas**: OPEN → COMPLETED (pagamento) ou OPEN → CANCELED (reversão de estoque).
* **Auditoria completa**: Histórico de itens, total calculado e método de pagamento.

## 📜 Regras de Negócio

### 3.1 Interpretação de Código de Barras (addItemByBarcode)

O sistema implementa um algoritmo inteligente de parsing de códigos de barras:

**Produtos da Balança (KG):**
- Formato: `2PPPPPVVVVVVX` (13 dígitos)
  - `2`: Prefixo padrão para balança
  - `PPPPP`: Código do produto (5 dígitos)
  - `VVVVVV`: Valor total em centavos (6 dígitos)
  - `X`: Dígito verificador
- Exemplo: `2000450015509` → Produto 00045, Valor R$ 15,50
- Cálculo: `quantidade = subTotal / preçoUnitário` (com 3 casas decimais)

**Produtos de Prateleira (UN):**
- Código de barras padrão (EAN-13 ou interno)
- Quantidade fixa: 1 unidade
- Subtotal: preço unitário do banco de dados

**Fallback Automático:**
1. Tenta parsear como balança (prefixo 2 + 13 dígitos)
2. Fatia e busca produto pelo código de 5 dígitos
3. Se não encontrar, busca pelo código completo (fallback para UN)
4. Valida consistência: etiqueta KG ≠ produto cadastrado como UN

### 3.2 Fechamento de Caixa (completeSale)

- **Consistência Financeira**: Todos os cálculos utilizam **centavos inteiros** (tipo `INT`)
- **Cálculo**: `totalAmount = (subTotal dos itens)`
- **Validações**:
  - Venda deve estar em status OPEN
  - Deve possuir pelo menos 1 item
  - Método de pagamento obrigatório (PIX/CREDIT_CARD/MONEY)

### 3.3 Baixa de Estoque Transacional (ACID)

O princípio **ACID** é aplicado através de transações TypeORM:

```typescript
// sale.service.ts:138-163
await this.repository.manager.transaction(async (transactionEntityManager) => {
  // 1. Registra saída do estoque (OUT)
  await this.stockTransactionService.create(
    { productId, quantity, type: TransactionType.OUT },
    transactionEntityManager, // ← Mesmo contexto transacional
  );

  // 2. Cria o item da venda
  const saleItem = transactionalSaleItemRepo.create({...});
  return await transactionalSaleItemRepo.save(saleItem);
});
```

**Garantias:**
- **Atomicidade**: Venda e baixa ocorrem juntas ou falham juntas
- **Consistência**: Estoque sempre reflete o estado real
- **Isolamento**: Transações concorrentes não interferem
- **Durabilidade**: Dados persistidos após commit

### 3.4 Cancelamento de Venda

- Reverte **todos** os itens para o estoque via transações `IN`
- Muda status para CANCELED (imutável após cancelamento)
- Mantém histórico auditável no banco de dados

## 🎯 Decisões de Arquitetura

### 4.1 Preços em Centavos (Integer Currency Pattern)
**Problema**: Floating-point arithmetic causa erros de precisão (ex: 0.1 + 0.2 ≠ 0.3)
**Solução**: Armazenar valores monetários como inteiros (centavos)
**Impacto**: 
- `price: number` no TypeORM representa centavos
- GraphQL converte automaticamente para Float na resposta
- Cálculos exatos sem necessidade de bibliotecas de decimal

### 4.2 Transações Distribuídas via EntityManager
**Problema**: Múltiplos services precisam compartilhar o mesmo contexto transacional
**Solução**: Passar `EntityManager` como parâmetro opcional nos services
**Implementação**:
- `StockTransactionService.create(data, manager?)` aceita manager opcional
- Se receber manager, usa transação externa
- Se não receber, cria transação isolada própria
**Benefício**: Permite transações sem acoplamento forte

### 4.3 Soft Delete para Auditoria
**Problema**: Exclusões físicas impedem rastreabilidade histórica
**Solução**: TypeORM `@DeleteDateColumn` em todas as entidades
**Impacto**: 
- `deletedAt` popula data da "exclusão"
- Registros "excluídos" permanecem no banco
- Queries automáticas filtram `deletedAt IS NULL`

### 4.4 DTOs Separados das Entities
**Problema**: Exposição direta de entidades GraphQL pode vazar dados internos
**Solução**: DTOs específicos para GraphQL (`SaleDTO`, `ProductDTO`, etc.)
**Benefício**: Controle fino sobre o schema exposto na API

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

### Arquitetura de Testes Unitárias

A suíte de testes utiliza **Jest** com mocks dinâmicos e isolados:

#### Mocks de Repositório TypeORM
```typescript
// Mock de EntityManager para transações
mockEntityManager = {
  getRepository: jest.fn().mockReturnValue(mockTransactionalSaleItemRepo),
};

// Simula transação TypeORM
manager: {
  transaction: jest.fn().mockImplementation(async (callback) => {
    return await callback(mockEntityManager);
  }),
}
```

#### Estratégia de Mock por Camada
- **Repository Layer**: Mocks do TypeORM `getRepository`, `create`, `save`
- **Service Layer**: Mocks de services dependentes (ProductService, StockTransactionService)
- **Transaction Context**: Mock de `EntityManager` para testar fluxos ACID

#### Casos de Teste Críticos
1. **addItemByBarcode**: 
   - Produto KG da balança (código fatiado)
   - Produto UN de prateleira
   - Fallback para código completo
   - Conflito KG/UN (BadRequestException)

2. **completeSale**:
   - Cálculo exato de centavos
   - Validação de venda vazia
   - Transição de status OPEN → COMPLETED

3. **cancel**:
   - Reversão de estoque (transações IN)
   - Validação de venda já cancelada

### Execução
```bash
# Executar testes unitários
$ npm run test

# Executar testes com cobertura
$ npm run test:cov
```

## 🔄 Migrations

### Configuração
- **Banco**: SQLite (`database.sqlite`)
- **ORM**: TypeORM com sincronização desligada (`synchronize: false`)
- **Local**: `src/database/migrations/`

### Comandos
```bash
# Gerar nova migration baseada nas changes das entities
$ npm run migration:generate -- src/database/migrations/NomeDaMigration

# Executar migrations pendentes
$ npm run migration:run
```

### Histórico de Migrations
| Timestamp | Migration | Descrição |
|-----------|-----------|-----------|
| 1778110351302 | CreateProductsTable | Cria tabela de produtos |
| 1778166408060 | CreateStockTransactionTable | Cria histórico de estoque |
| 1779208565895 | CreateSaleAndSaleItenTables | Cria vendas e itens |
| 1781650731051 | FixProductAndSaleStructure | Refatora estrutura para centavos |
| 1781651501160 | RenameColumnsToSnakeCase | Padroniza naming convention |

## 🧹 Qualidade de Código

```bash
# Rodar o linter e aplicar correções automáticas (Prettier)
$ npm run lint
```