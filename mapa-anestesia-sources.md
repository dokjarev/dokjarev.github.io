# Colombia anesthesia outreach map — sources and methodology

**Snapshot retrieved:** 18 October 2026  
**Page:** https://jarev.nl/mapa-anestesia.html  
**Purpose:** Identify institutions for exploratory outreach. This is not a national census, assessment of service quality, access analysis, or patient referral directory.

## Included sources
1. Capresoca EPS contracted network, dataset ik3u-sdxz: https://www.datos.gov.co/d/ik3u-sdxz
   - Publisher: E.P.S. Capresoca, Casanare.
   - Data modification timestamp: 13 October 2026.
   - Download: https://www.datos.gov.co/resource/ik3u-sdxz.json?$limit=50000
   - 61 source rows; 7 rows explicitly list code 301 (ANESTESIA).
   - Inclusion uses the exact numeric code 301 followed by a hyphen in servicios_contratados, not inference from surgery.
   - These are contract evidence records. Contract operation, current availability and completeness were not independently confirmed.

2. Cundinamarca historical REPS services, dataset j93s-yemu: https://www.datos.gov.co/d/j93s-yemu
   - Publisher: Ministerio de Salud y Protección Social.
   - Row-level cutoff: 29 June 2022.
   - Download: https://www.datos.gov.co/resource/j93s-yemu.json?$where=serv_codigo%3D%27301%27&$limit=50000
   - 46 code-301 records. Classified as Consulta Externa; not proof of operating-room capacity.
   - Old habilitado=SI values are not presented as current verification.

3. Boyacá public-network historical REPS services, dataset p9n2-9qsb: https://www.datos.gov.co/d/p9n2-9qsb
   - Publisher: Gobernación de Boyacá.
   - Data modified: 28 June 2023.
   - Download: https://www.datos.gov.co/resource/p9n2-9qsb.json?$where=codigo_servicio%3D%27301%27&$limit=50000
   - 11 code-301 records, Consulta Externa.
   - Date discrepancy: description says updated September 2022, but one included opening date is March 2023. A coherent cutoff is not established; the map explicitly labels this uncertainty.
   - Some records have generic site names and no contact information.

4. DANE DIVIPOLA municipal reference points, dataset gdxc-w37w: https://www.datos.gov.co/d/gdxc-w37w
   - Reference date in description: 30 December 2024.
   - Download: https://www.datos.gov.co/resource/gdxc-w37w.json?$limit=5000
   - 1,122 municipal/administrative reference rows.
   - Municipality codes match the first five digits of the REPS provider code. Capresoca municipality names were matched exactly after accent/case normalisation; BOGOTA resolves to BOGOTÁ, D.C.
   - Decimal commas are converted to decimal points.
   - All pins are MUNICIPAL REFERENCE POINTS. No pin represents a geocoded hospital address. No coordinates were invented for facilities.

5. Country outline: https://github.com/datasets/geo-countries (Natural Earth). Filtered to the Colombia feature. Schematic geographic context only.

## Record grain, joins and checks
- Historical identifier = provider code + two-digit site number.
- Capresoca identifiers are source-row references, not REPS facility identifiers.
- 64 unique evidence-record identifiers; 7 contract records, 57 historical records; 37 municipalities across all layers.
- Do not interpret records as a deduplicated national facility count. Contract records are not linked to REPS site identifiers.
- Validated presence of names/municipality codes, unique record IDs, successful municipal matches and coordinate bounds.
- HTML parses; inline executable JavaScript passes Node syntax check.
- Historical records are hidden by default.
- All source content is inserted into the DOM as text, not HTML.
- No individuals were contacted and no names or private outreach notes were collected.
- Source dates indicate publication/data modification or row cutoff, not a date of verified clinical operation.

## Reproduce
Retrieve the three service datasets and DIVIPOLA at the URLs above. Apply the filters, preserve code fields as text, retain each source's date and evidence type, and join only to municipal reference points as described. The complete transformed records and source metadata can be downloaded from the page. Snapshot data are embedded in the page's application/json script for inspection; no API keys or client-side data fetches are required.

## Next acquisition work
- Obtain a current nationwide REPS services-by-site export and a matching site directory.
- Preserve site codes, service codes/groups, modality, complexity, service status and cutoff.
- Include surgical/obstetric contexts and other anesthesia settings without treating code 301 as an exhaustive definition.
- Confirm actual delivery and team contacts with facilities; distinguish permanent from visiting teams.
- Validate site coordinates before switching from municipality markers to address markers.
- Add official urban/rural classification and population/access denominators before making equity or coverage claims.

## Attribution and license
The four Colombian datasets are published as Creative Commons Attribution–ShareAlike 4.0. This adapted data compilation is shared under CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/ . Attribution is to the publishers above. Consult upstream licensing and metadata for future revisions.
