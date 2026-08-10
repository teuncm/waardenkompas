# Mijn Waardenkompas

[Open de website](https://teuncm.nl/waardenkompas/) · [Bekijk de broncode op GitHub](https://github.com/teuncm/waardenkompas)

Een interactieve, Nederlandstalige waardensorteer-oefening. De 125 kaarten worden bij een nieuwe start willekeurig geschud. De gebruiker sorteert ze, stelt een top 10 samen en kan daarna een persoonlijk actieplan als echte pdf downloaden.

## Functies

- willekeurig geschudde waardenkaarten;
- sorteren met knoppen of de toetsen 1, 2 en 3;
- eigen waarden toevoegen;
- top 10 kiezen en rangschikken;
- scores en concrete acties vastleggen;
- voortgang lokaal bewaren in de browser;
- het eindresultaat downloaden als pdf.

## Lokaal starten

Installeer Node.js 22 en voer daarna uit:

```bash
npm install
npm run dev
```

De productieversie maak je met:

```bash
npm run build
```

## Publiceren op GitHub Pages

1. Maak op GitHub een nieuwe repository.
2. Plaats alle bestanden uit deze map in de repository en push naar de branch `main`.
3. Open op GitHub **Settings → Pages**.
4. Kies bij **Source** voor **GitHub Actions**.
5. De meegeleverde workflow bouwt en publiceert de site automatisch.

Bij volgende wijzigingen hoef je alleen opnieuw naar `main` te pushen.

De gepubliceerde versie is beschikbaar op [teuncm.nl/waardenkompas](https://teuncm.nl/waardenkompas/).

## Inhoudelijke bron

Gebaseerd op de *Waarden Sorteertaak* van ACT in Actie (2015). De lijst met waarden en de instructiestappen zijn digitaal verwerkt in deze oefening.
