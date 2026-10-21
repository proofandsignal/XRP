# RLUSD-003 — Реална промяна в signing authority на XRPL

Статус: **LIVE-HISTORICAL VERIFIED — READY FOR PUBLICATION REVIEW**

Предишните RLUSD cases доказаха две поведения:

1. стабилното validated evidence правилно дава **NO MATERIAL CHANGE**;
2. реална issuer-control промяна правилно дава **MATERIAL CHANGE**.

RLUSD-003 проверява по-институционален въпрос:

> Може ли системата да засече материална промяна в начина, по който акаунтът може да подписва транзакции, дори когато самият risk state не се променя?

Да.

## Stage A — появява се Signer List

Между validated ledgers **89 925 796** и **89 925 797** успешна `SignerListSet` транзакция създава multi-sign конфигурация за RLUSD issuer акаунта.

Transaction:

`38E3C789E229FF24778B9A5E6CCC6CABFA62DA98AC217C2A70D1A6A6E39468E`

След транзакцията наблюдаваме:

- signer lists: `0 → 1`
- quorum: `15`
- signer entries: `8`
- общ configured signer weight: `56`
- regular key: не е наблюдаван
- master key: все още е активен

Risk state остава:

`REVIEW → REVIEW`

Но Transition Engine класифицира:

> **MATERIAL_CHANGE**

Event:

`SIGNER_LIST_CHANGED`

Това е умишлено. Signing-authority промяна може да е оперативно важна, дори risk label да не се променя.

## Stage B — master key се изключва

Няколко ledgers по-късно, между **89 925 802** и **89 925 803**, issuer акаунтът изпраща успешна `AccountSet` транзакция с:

`SetFlag: 4`

XRPL определя това като `asfDisableMaster`.

Transaction:

`9A4212D87787986E262164A0A76558D76A6152835DBCC064EEF05A88CF2C92BA`

Наблюдаваме:

- master key disabled: `false → true`
- signer list count: `1 → 1`
- видим alternative signing path: `true → true`
- risk state: `REVIEW → REVIEW`

Transition Engine генерира:

- `ACCOUNT_FLAGS_CHANGED`
- `MASTER_KEY_STATUS_CHANGED`

Classification:

> **MATERIAL_CHANGE**

## Защо това е важно

За институционална инфраструктура моделът „risk score changed“ е твърде тесен.

Custodian, wallet, tokenization platform, exchange или compliance team може да има нужда да знае, че:

- е добавен или заменен signer list;
- quorum или signer weights са променени;
- regular key е променен;
- master key е изключен или включен отново.

Това са промени в authorization surface.

Ledger-ът може да докаже конфигурираните signing paths. Не може сам да докаже кой държи ключовете off-chain, дали signer е компрометиран или дали организационният governance process е добър.

## Вече имаме три verified поведения

`STABLE EVIDENCE → NO_MATERIAL_CHANGE`

`ISSUER CONTROL CHANGE → MATERIAL_CHANGE`

`SIGNING AUTHORITY CHANGE → MATERIAL_CHANGE`

Това е посоката на Proof & Signal XRPL Intelligence Screen: точен evidence-backed change intelligence, а не generic alert feed.

Материалът е технически и образователен, не инвестиционен съвет.
