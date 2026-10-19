# RLUSD в XRPL: какво доказва ledger-ът и за какво е нужно външно evidence

Статус: ЧЕРНОВА — НЕ СЕ ПУБЛИКУВА ПРЕДИ LIVE CASE RESULT

Ripple официално посочва следния Mainnet issuer на Ripple USD (RLUSD) в XRPL:

`rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De`

Това е добър реален пример за въпроса:

> Какво можем да проверим директно от XRPL и какво изисква доказателства извън ledger-а?

## On-ledger

BUILD-008 е проектиран да използва един validated ledger и да проверява:

- issuer конфигурация,
- control flags,
- trust-line state,
- наблюдавани issuer obligations,
- completeness на данните,
- deterministic findings,
- provenance и machine-readable Risk Passport.

**LIVE RESULT PLACEHOLDER — не се публикува преди проверка.**

## External evidence

Резерви, redemption права, юридическа идентичност и регулаторен статус не се доказват само от присъствието на токена в XRPL.

Ripple публикува отделна информация и reserve reports за RLUSD. В нашия модел тези източници остават в отделен external-evidence namespace.

## Защо това е важно

Добра evidence система трябва ясно да различава:

- **VERIFIED ON XRPL**
- **VERIFIED EXTERNALLY**
- **UNKNOWN**
- **INTERPRETATION**

вместо да ги скрива в един непрозрачен risk score.

Материалът е технически и образователен, не инвестиционен съвет.
