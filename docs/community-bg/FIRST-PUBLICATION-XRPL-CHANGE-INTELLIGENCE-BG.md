# Три реални XRPL промени — и защо един общ Risk Score не е достатъчен

Статус: **READY FOR PUBLICATION REVIEW**  
За: XRP Community България

Добрата monitoring система трябва да знае не само кога да даде alert.

Тя трябва да знае и кога **да не вдига шум**.

Тествахме и двете поведения върху реални validated XRPL данни за един и същ issuer — Ripple USD (RLUSD).

## 1. Когато няма материална промяна

Сравнихме два независимо заснети validated snapshots:

- ledger 107 761 255
- ledger 107 761 290

Risk state, findings, AccountRoot flags и наблюдаваният bounded trust-line window останаха стабилни.

Резултат:

**NO_MATERIAL_CHANGE**

Самото движение на ledger index не трябва да създава alert.

## 2. Когато issuer control реално се промени

На ledger 89 925 780 има успешна AccountSet транзакция с:

`SetFlag: 16`

В XRPL това е `asfAllowTrustLineClawback`.

Преди:

- risk state: PASS
- clawback capability: false
- findings: няма

След:

- risk state: REVIEW
- clawback capability: true
- добавен finding: CLAWBACK_CAPABILITY_ENABLED

Transition Engine вижда:

- RISK_STATE_CHANGED
- FINDING_ADDED
- ACCOUNT_FLAGS_CHANGED
- ISSUER_CLAWBACK_ENABLED_CHANGED

Резултат:

**MATERIAL_CHANGE**

Важно: това не означава „clawback = злоупотреба“.

Означава само, че проверимо issuer-control property се е променило.

## 3. Когато се промени signing authority

Между ledgers 89 925 796 и 89 925 797 успешна SignerListSet транзакция добавя multi-sign конфигурация.

След промяната:

- signer lists: 0 → 1
- quorum: 15
- signer entries: 8
- общ configured signer weight: 56
- master key: все още активен

Risk state остава:

`REVIEW → REVIEW`

Но engine-ът генерира:

`SIGNER_LIST_CHANGED`

и класифицира:

**MATERIAL_CHANGE**

След това между ledgers 89 925 802 и 89 925 803 има AccountSet с:

`SetFlag: 4`

Това е `asfDisableMaster`.

Наблюдаваме:

- master key disabled: false → true
- signer list остава наличен
- alternative signing path остава видим
- risk state остава REVIEW

Events:

- ACCOUNT_FLAGS_CHANGED
- MASTER_KEY_STATUS_CHANGED

Отново:

**MATERIAL_CHANGE**

## Защо това е полезно

Един общ score не може добре да различи:

1. нищо важно не се е променило;
2. token-control capability е променено;
3. начинът за authorization на акаунта е променен.

За custodian, wallet, tokenization platform, treasury или compliance team третият тип може да е много важен, дори risk label да не се движи.

## Какво XRPL доказва и какво не

Ledger-ът може да докаже конфигурацията на акаунта в конкретен validated ledger.

Не може сам да докаже:

- кой физически държи private key;
- дали signer е компрометиран;
- дали internal governance process е спазен;
- solvency;
- достатъчност на reserves;
- инвестиционна безопасност.

Това изисква отделно evidence.

## Моделът

`XRPL FACTS → DETERMINISTIC CHANGE RULES → EVIDENCE → HUMAN REVIEW`

а не:

`OPAQUE SCORE → CONCLUSION`

Вече имаме три verified поведения:

`STABLE EVIDENCE → NO_MATERIAL_CHANGE`

`ISSUER CONTROL CHANGE → MATERIAL_CHANGE`

`SIGNING AUTHORITY CHANGE → MATERIAL_CHANGE`

Това е посоката на Proof & Signal XRPL Intelligence Screen.

Материалът е образователен и технически, не инвестиционен съвет.
