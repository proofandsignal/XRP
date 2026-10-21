# RLUSD-002 — Как изглежда реална промяна в issuer control в XRPL

Статус: **LIVE-HISTORICAL VERIFIED — READY FOR PUBLICATION REVIEW**

Първият RLUSD transition case показа, че Transition Engine може правилно да не генерира alert, когато сравненото evidence е стабилно.

Вторият case проверява обратното:

> Може ли същият engine да засече реална историческа issuer-control промяна без да измисля причина и без opaque score?

## Реалната транзакция

На XRPL Mainnet ledger **89 925 780** RLUSD issuer акаунтът има успешна `AccountSet` транзакция:

`9B1042DD30188C9BAE7F81C5B3DB91F9C121669A359F4124FBB88531F8BAADA2`

Транзакцията използва:

`SetFlag: 16`

XRPL определя това като `asfAllowTrustLineClawback` — включване на възможността issuer-ът да извършва clawback върху издадени trust-line tokens.

Това е контролна възможност. Наличието ѝ **не е доказателство за злоупотреба**.

## Преди

Validated ledger **89 925 779**

- risk state: `PASS`
- evidence status: `COMPLETE`
- clawback capability: `false`
- deterministic findings: няма

## След

Validated ledger **89 925 780**

- risk state: `REVIEW`
- evidence status: `COMPLETE`
- clawback capability: `true`
- добавен finding: `CLAWBACK_CAPABILITY_ENABLED`

## Transition result

Transition Engine класифицира двойката като:

> **MATERIAL_CHANGE**

Генерирани са четири deterministic events:

- `RISK_STATE_CHANGED`
- `FINDING_ADDED`
- `ACCOUNT_FLAGS_CHANGED`
- `ISSUER_CLAWBACK_ENABLED_CHANGED`

Това е целта на evidence-first monitoring: не подаваме alert само защото ledger index се е променил; подаваме alert, защото конкретно, проверимо control property се е променило.

## Защо това е полезно

За wallet, custodian, tokenization platform или risk team често е по-важно да получи точен факт:

> „На ledger X issuer-ът няма capability Y. На ledger X+1 вече я има.“

След това организацията сама може да приложи policy, human review или counterparty workflow.

Системата не твърди, че включването на clawback е злонамерено или неправилно. Тя доказва промяната и показва защо нашата deterministic policy преминава от PASS към REVIEW.

Материалът е технически и образователен, не инвестиционен съвет.
