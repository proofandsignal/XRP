# RLUSD в XRPL: какво доказва ledger-ът и какво изисква външно evidence

Статус: **LIVE-VERIFIED CASE — чернова за редакционен преглед**

Ripple официално посочва следния XRPL Mainnet issuer за Ripple USD (RLUSD):

`rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De`

Използвахме този адрес като първи реален Mainnet case за Proof & Signal XRPL Intelligence Screen.

## Какво показа XRPL

Анализът е закотвен към validated ledger **107 761 290** с hash:

`137E4B85103AA3E67224EDAB8933DB1E8F2A038B769E505FCC198CBABBADABF7`

Deterministic risk state е **REVIEW**, с **0 BLOCK findings**.

REVIEW finding-ът е **Clawback capability enabled**. Това означава, че issuer акаунтът има XRPL възможност за trust-line clawback. Това е контролна възможност на issuer-а — **не е доказателство за злоупотреба**.

Други наблюдавани AccountRoot факти: Global Freeze изключен, DepositAuth включен, Default Ripple включен, Disable Master включен, Disallow XRP включен, Require Auth изключен и Require Destination Tag включен.

## Има и втори важен резултат: completeness на evidence-а

Live scan-ът достигна предварително зададената граница след **20 000 trust lines**. В този ограничен набор видяхме един issued asset — RLUSD — и **15 513 issuer-holder lines**.

Затова evidence status е **PARTIAL**.

> **Risk state: REVIEW**  
> **Evidence status: PARTIAL**

Не превръщаме непълните данни в изкуствен BLOCK risk и не представяме bounded counts или obligation sums като пълни totals.

## Какво XRPL не доказва сам

Ledger-ът може да докаже account configuration, control flags, trust-line state и конкретен validated ledger anchor.

Но сам по себе си не доказва достатъчност на резервите, enforceability на redemption, юридическа идентичност или регулаторно съответствие.

Ripple публикува отделна transparency/reserve информация за RLUSD. В Risk Passport модела тя остава в **external-evidence namespace**, а не се превръща автоматично в XRPL факт.

## Защо това е важно

Една институционална evidence система трябва да различава **VERIFIED ON XRPL**, **VERIFIED EXTERNALLY**, **UNKNOWN** и **INTERPRETATION**.

Точно около това разделение изграждаме XRPL Intelligence Screen и machine-readable Risk Passport.

Live case-ът създаде и unsigned Risk Passport, закотвен към validated ledger. Hash-овете доказват deterministic integrity на artifact-а, но не са publisher digital signature.

Материалът е технически и образователен, не инвестиционен съвет.
