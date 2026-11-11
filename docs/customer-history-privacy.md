# Customer history: data handling policy

This is the application's operational behavior for the single-shop MVP. It is not a legal assessment or a claim that a shop's processing complies with the LGPD.

## Data and retention

- A customer profile stores the current name and a Brazilian phone number normalized to digits without the `55` country prefix.
- Each appointment retains the name and phone supplied for that booking as a historical snapshot.
- There is no automatic expiry or purge in this version. The customer profile remains available for customer history and rebooking until an admin erases it.
- An admin can export a streamed CSV with Portuguese headers and customer contact, service, appointment date/time, status, and BRL amount. It omits internal IDs and the appointment contact snapshots. The response is marked `Cache-Control: no-store`; appointment rows are read in pages to limit memory use.
- Admin erasure deletes the customer profile and its reminder records, then removes the name and phone from retained appointment rows. Appointment date/time, service, stored price, and status remain for shop operations. This removes direct contact fields; it does not claim that the remaining records are legally anonymous.

The shop, as the controller, must decide whether it may retain appointment facts for its purposes and applicable obligations. The ANPD explains that data subject rights and deletion are subject to the legal retention cases in LGPD Article 16; this application does not determine those cases for a particular shop. See [ANPD: Data subject rights](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares) and [ANPD: Frequently asked questions](https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes/perguntas-frequentes).

## Current admin controls

- `GET /api/admin/customers/:id/export` streams the report fields listed above; it does not export internal IDs or appointment contact snapshots.
- `DELETE /api/admin/customers/:id` removes the customer profile, cancels future reminder capability by deleting reminder rows, and clears direct name/phone fields from historical appointments.
- Both endpoints require admin authentication. Erasure is irreversible from the application; export first when the shop has a valid reason to retain a copy.

The customer UI currently provides an admin workflow for these operations. It does not provide a public request form or automatic retention schedule.
